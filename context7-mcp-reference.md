# Context7 MCP Server - Source Code Reference

This document contains the core source code for the Context7 MCP (Model Context Protocol) server from the [upstash/context7](https://github.com/upstash/context7) repository.

## Overview

Context7 is an MCP server that provides up-to-date, version-specific documentation and code examples for programming libraries and frameworks. It pulls documentation directly from source repositories and integrates them into AI prompts to prevent outdated or hallucinated code generation.

## Architecture

The MCP server is located in `packages/mcp/` and consists of:

- **Entry Point**: `src/index.ts` - Main server initialization and transport handling
- **Core Logic**: `src/lib/` - API interactions, types, constants, and utilities
- **Transports**: Supports both `stdio` (for local CLI) and `http` (for remote connections)
- **Authentication**: Supports API keys and OAuth 2.0

## Key Features

- **Two MCP Tools**:
  1. `resolve-library-id` - Resolves library names to Context7-compatible IDs
  2. `query-docs` - Retrieves documentation for a specific library

- **Dual Transport Support**:
  - `stdio` - For local MCP connections (Cursor, Claude Code)
  - `http` - For remote HTTP connections with OAuth support

- **Authentication**:
  - API Key authentication (header-based)
  - OAuth 2.0 support (RFC 9728)
  - JWT validation

---

## Source Code Files

### 1. index.ts

**File Path**: `packages/mcp/src/index.ts`

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchLibraries, fetchLibraryContext } from "./lib/api.js";
import { ClientContext } from "./lib/encryption.js";
import { formatSearchResults, extractClientInfoFromUserAgent } from "./lib/utils.js";
import { isJWT, validateJWT } from "./lib/jwt.js";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Command } from "commander";
import { AsyncLocalStorage } from "async_hooks";
import { SERVER_VERSION, RESOURCE_URL, AUTH_SERVER_URL } from "./lib/constants.js";

/** Default HTTP server port */
const DEFAULT_PORT = 3000;

// Parse CLI arguments using commander
const program = new Command()
  .option("--transport <stdio|http>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP transport", DEFAULT_PORT.toString())
  .option("--api-key <key>", "API key for authentication (or set CONTEXT7_API_KEY env var)")
  .allowUnknownOption() // let MCP Inspector / other wrappers pass through extra flags
  .parse(process.argv);

const cliOptions = program.opts<{
  transport: string;
  port: string;
  apiKey?: string;
}>();

// Validate transport option
const allowedTransports = ["stdio", "http"];
if (!allowedTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http.`
  );
  process.exit(1);
}

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as "stdio" | "http";

// Disallow incompatible flags based on transport
const passedPortFlag = process.argv.includes("--port");
const passedApiKeyFlag = process.argv.includes("--api-key");

if (TRANSPORT_TYPE === "http" && passedApiKeyFlag) {
  console.error(
    "The --api-key flag is not allowed when using --transport http. Use header-based auth at the HTTP layer instead."
  );
  process.exit(1);
}

if (TRANSPORT_TYPE === "stdio" && passedPortFlag) {
  console.error("The --port flag is not allowed when using --transport stdio.");
  process.exit(1);
}

// HTTP port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

const requestContext = new AsyncLocalStorage<ClientContext>();

// Global state for stdio mode only
let stdioApiKey: string | undefined;
let stdioClientInfo: { ide?: string; version?: string } | undefined;

/**
 * Get the effective client context
 */
function getClientContext(): ClientContext {
  const ctx = requestContext.getStore();

  // HTTP mode: context is fully populated from request
  if (ctx) {
    return ctx;
  }

  // stdio mode: use globals
  return {
    apiKey: stdioApiKey,
    clientInfo: stdioClientInfo,
    transport: "stdio",
  };
}

/**
 * Extract client IP address from request headers.
 * Handles X-Forwarded-For header for proxied requests.
 */
function getClientIp(req: express.Request): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];

  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ipList = ips.split(",").map((ip) => ip.trim());

    for (const ip of ipList) {
      const plainIp = ip.replace(/^::ffff:/, "");
      if (
        !plainIp.startsWith("10.") &&
        !plainIp.startsWith("192.168.") &&
        !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(plainIp)
      ) {
        return plainIp;
      }
    }
    return ipList[0].replace(/^::ffff:/, "");
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress.replace(/^::ffff:/, "");
  }
  return undefined;
}

function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "Context7",
      version: SERVER_VERSION,
    },
    {
      instructions:
        "Use this server to retrieve up-to-date documentation and code examples for any library.",
    }
  );

  server.registerTool(
    "resolve-library-id",
    {
      title: "Resolve Context7 Library ID",
      description: `Resolves a package/product name to a Context7-compatible library ID and returns matching libraries.

You MUST call this function before 'query-docs' to obtain a valid Context7-compatible library ID UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.

Selection Process:
1. Analyze the query to understand what library/package the user is looking for
2. Return the most relevant match based on:
- Name similarity to the query (exact matches prioritized)
- Description relevance to the query's intent
- Documentation coverage (prioritize libraries with higher Code Snippet counts)
- Source reputation (consider libraries with High or Medium reputation more authoritative)
- Benchmark Score: Quality indicator (100 is the highest score)

Response Format:
- Return the selected library ID in a clearly marked section
- Provide a brief explanation for why this library was chosen
- If multiple good matches exist, acknowledge this but proceed with the most relevant one
- If no good matches exist, clearly state this and suggest query refinements

For ambiguous queries, request clarification before proceeding with a best-guess match.

IMPORTANT: Do not call this tool more than 3 times per question. If you cannot find what you need after 3 calls, use the best result you have.`,
      inputSchema: {
        query: z
          .string()
          .describe(
            "The user's original question or task. This is used to rank library results by relevance to what the user is trying to accomplish. IMPORTANT: Do not include any sensitive or confidential information such as API keys, passwords, credentials, or personal data in your query."
          ),
        libraryName: z
          .string()
          .describe("Library name to search for and retrieve a Context7-compatible library ID."),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ query, libraryName }) => {
      const searchResponse = await searchLibraries(query, libraryName, getClientContext());

      if (!searchResponse.results || searchResponse.results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: searchResponse.error
                ? searchResponse.error
                : "No libraries found matching the provided name.",
            },
          ],
        };
      }

      const resultsText = formatSearchResults(searchResponse);

      const responseText = `Available Libraries:

Each result includes:
- Library ID: Context7-compatible identifier (format: /org/project)
- Name: Library or package name
- Description: Short summary
- Code Snippets: Number of available code examples
- Source Reputation: Authority indicator (High, Medium, Low, or Unknown)
- Benchmark Score: Quality indicator (100 is the highest score)
- Versions: List of versions if available. Use one of those versions if the user provides a version in their query. The format of the version is /org/project/version.

For best results, select libraries based on name match, source reputation, snippet coverage, benchmark score, and relevance to your use case.

----------

${resultsText}`;

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    }
  );

  server.registerTool(
    "query-docs",
    {
      title: "Query Documentation",
      description: `Retrieves and queries up-to-date documentation and code examples from Context7 for any programming library or framework.

You must call 'resolve-library-id' first to obtain the exact Context7-compatible library ID required to use this tool, UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.

IMPORTANT: Do not call this tool more than 3 times per question. If you cannot find what you need after 3 calls, use the best information you have.`,
      inputSchema: {
        libraryId: z
          .string()
          .describe(
            "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js', '/supabase/supabase', '/vercel/next.js/v14.3.0-canary.87') retrieved from 'resolve-library-id' or directly from user query in the format '/org/project' or '/org/project/version'."
          ),
        query: z
          .string()
          .describe(
            "The question or task you need help with. Be specific and include relevant details. Good: 'How to set up authentication with JWT in Express.js' or 'React useEffect cleanup function examples'. Bad: 'auth' or 'hooks'. IMPORTANT: Do not include any sensitive or confidential information such as API keys, passwords, credentials, or personal data in your query."
          ),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ query, libraryId }) => {
      const response = await fetchLibraryContext({ query, libraryId }, getClientContext());

      return {
        content: [
          {
            type: "text",
            text: response.data,
          },
        ],
      };
    }
  );

  return server;
}

async function main() {
  const transportType = TRANSPORT_TYPE;

  if (transportType === "http") {
    const initialPort = CLI_PORT ?? DEFAULT_PORT;

    const app = express();
    app.use(express.json());

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-Context7-API-Key, Context7-API-Key, X-API-Key, Authorization"
      );
      res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id");

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });

    const extractHeaderValue = (value: string | string[] | undefined): string | undefined => {
      if (!value) return undefined;
      return typeof value === "string" ? value : value[0];
    };

    const extractBearerToken = (authHeader: string | string[] | undefined): string | undefined => {
      const header = extractHeaderValue(authHeader);
      if (!header) return undefined;

      if (header.startsWith("Bearer ")) {
        return header.substring(7).trim();
      }

      return header;
    };

    const extractApiKey = (req: express.Request): string | undefined => {
      return (
        extractBearerToken(req.headers.authorization) ||
        extractHeaderValue(req.headers["context7-api-key"]) ||
        extractHeaderValue(req.headers["x-api-key"]) ||
        extractHeaderValue(req.headers["context7_api_key"]) ||
        extractHeaderValue(req.headers["x_api_key"])
      );
    };

    const handleMcpRequest = async (
      req: express.Request,
      res: express.Response,
      requireAuth: boolean
    ) => {
      try {
        const apiKey = extractApiKey(req);
        const resourceUrl = RESOURCE_URL;
        const baseUrl = new URL(resourceUrl).origin;

        // OAuth discovery info header, used by MCP clients to discover the authorization server
        res.set(
          "WWW-Authenticate",
          `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`
        );

        if (requireAuth) {
          if (!apiKey) {
            return res.status(401).json({
              jsonrpc: "2.0",
              error: {
                code: -32001,
                message: "Authentication required. Please authenticate to use this MCP server.",
              },
              id: null,
            });
          }

          if (isJWT(apiKey)) {
            const validationResult = await validateJWT(apiKey);
            if (!validationResult.valid) {
              return res.status(401).json({
                jsonrpc: "2.0",
                error: {
                  code: -32001,
                  message: validationResult.error || "Invalid token. Please re-authenticate.",
                },
                id: null,
              });
            }
          }
        }

        const context: ClientContext = {
          clientIp: getClientIp(req),
          apiKey: apiKey,
          clientInfo: extractClientInfoFromUserAgent(req.headers["user-agent"]),
          transport: "http",
        };

        const server = createServer();

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        res.on("close", async () => {
          await transport.close();
          await server.close();
        });

        await requestContext.run(context, async () => {
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
        });
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    };

    // Anonymous access endpoint - no authentication required
    app.all("/mcp", async (req, res) => {
      await handleMcpRequest(req, res, false);
    });

    // OAuth-protected endpoint - requires authentication
    app.all("/mcp/oauth", async (req, res) => {
      await handleMcpRequest(req, res, true);
    });

    app.get("/ping", (_req: express.Request, res: express.Response) => {
      res.json({ status: "ok", message: "pong" });
    });

    // OAuth 2.0 Protected Resource Metadata (RFC 9728)
    // Used by MCP clients to discover the authorization server
    app.get(
      "/.well-known/oauth-protected-resource",
      (_req: express.Request, res: express.Response) => {
        res.json({
          resource: RESOURCE_URL,
          authorization_servers: [AUTH_SERVER_URL],
          scopes_supported: ["profile", "email"],
          bearer_methods_supported: ["header"],
        });
      }
    );

    app.get(
      "/.well-known/oauth-authorization-server",
      async (_req: express.Request, res: express.Response) => {
        const authServerUrl = AUTH_SERVER_URL;

        try {
          const response = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`);
          if (!response.ok) {
            console.error("[OAuth] Upstream error:", response.status);
            return res.status(response.status).json({
              error: "upstream_error",
              message: "Failed to fetch authorization server metadata",
            });
          }
          const metadata = await response.json();
          res.json(metadata);
        } catch (error) {
          console.error("[OAuth] Error fetching OAuth metadata:", error);
          res.status(502).json({
            error: "proxy_error",
            message: "Failed to proxy authorization server metadata",
          });
        }
      }
    );

    // Catch-all 404 handler - must be after all other routes
    app.use((_req: express.Request, res: express.Response) => {
      res.status(404).json({
        error: "not_found",
        message: "Endpoint not found. Use /mcp for MCP protocol communication.",
      });
    });

    const startServer = (port: number, maxAttempts = 10) => {
      const httpServer = app.listen(port);

      httpServer.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < initialPort + maxAttempts) {
          console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
          startServer(port + 1, maxAttempts);
        } else {
          console.error(`Failed to start server: ${err.message}`);
          process.exit(1);
        }
      });

      httpServer.once("listening", () => {
        console.error(
          `Context7 Documentation MCP Server v${SERVER_VERSION} running on HTTP at http://localhost:${port}/mcp`
        );
      });
    };

    startServer(initialPort);
  } else {
    stdioApiKey = cliOptions.apiKey || process.env.CONTEXT7_API_KEY;
    const server = createServer();

    server.server.oninitialized = () => {
      const clientVersion = server.server.getClientVersion();
      if (clientVersion) {
        stdioClientInfo = {
          ide: clientVersion.name,
          version: clientVersion.version,
        };
      }
    };

    const transport = new StdioServerTransport();

    await server.connect(transport);

    console.error(`Context7 Documentation MCP Server v${SERVER_VERSION} running on stdio`);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

---

### 2. lib/api.ts

**File Path**: `packages/mcp/src/lib/api.ts`

```typescript
import { SearchResponse, ContextRequest, ContextResponse } from "./types.js";
import { ClientContext, generateHeaders } from "./encryption.js";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { CONTEXT7_API_BASE_URL } from "./constants.js";

/**
 * Parses error response from the Context7 API
 * Extracts the server's error message, falling back to status-based messages if parsing fails
 * @param response The fetch Response object
 * @param apiKey Optional API key (used for fallback messages)
 * @returns Error message string
 */
async function parseErrorResponse(response: Response, apiKey?: string): Promise<string> {
  try {
    const json = (await response.json()) as { message?: string };
    if (json.message) {
      return json.message;
    }
  } catch {
    // JSON parsing failed, fall through to default
  }

  const status = response.status;
  if (status === 429) {
    return apiKey
      ? "Rate limited or quota exceeded. Upgrade your plan at https://context7.com/plans for higher limits."
      : "Rate limited or quota exceeded. Create a free API key at https://context7.com/dashboard for higher limits.";
  }
  if (status === 404) {
    return "The library you are trying to access does not exist. Please try with a different library ID.";
  }
  if (status === 401) {
    return "Invalid API key. Please check your API key. API keys should start with 'ctx7sk' prefix.";
  }
  return `Request failed with status ${status}. Please try again later.`;
}

const PROXY_URL: string | null =
  process.env.HTTPS_PROXY ??
  process.env.https_proxy ??
  process.env.HTTP_PROXY ??
  process.env.http_proxy ??
  null;

if (PROXY_URL && !PROXY_URL.startsWith("$") && /^(http|https):\/\//i.test(PROXY_URL)) {
  try {
    setGlobalDispatcher(new ProxyAgent(PROXY_URL));
  } catch (error) {
    console.error(
      `[Context7] Failed to configure proxy agent for provided proxy URL: ${PROXY_URL}:`,
      error
    );
  }
}

/**
 * Searches for libraries matching the given query
 * @param query The user's question or task (used for LLM relevance ranking)
 * @param libraryName The library name to search for in the database
 * @param context Client context including IP, API key, and client info
 * @returns Search results or error
 */
export async function searchLibraries(
  query: string,
  libraryName: string,
  context: ClientContext = {}
): Promise<SearchResponse> {
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v2/libs/search`);
    url.searchParams.set("query", query);
    url.searchParams.set("libraryName", libraryName);

    const headers = generateHeaders(context);

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response, context.apiKey);
      console.error(errorMessage);
      return { results: [], error: errorMessage };
    }
    const searchData = await response.json();
    return searchData as SearchResponse;
  } catch (error) {
    const errorMessage = `Error searching libraries: ${error}`;
    console.error(errorMessage);
    return { results: [], error: errorMessage };
  }
}

/**
 * Fetches intelligent, reranked context for a natural language query
 * @param request The context request parameters (query, libraryId)
 * @param context Client context including IP, API key, and client info
 * @returns Context response with data
 */
export async function fetchLibraryContext(
  request: ContextRequest,
  context: ClientContext = {}
): Promise<ContextResponse> {
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v2/context`);
    url.searchParams.set("query", request.query);
    url.searchParams.set("libraryId", request.libraryId);

    const headers = generateHeaders(context);

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response, context.apiKey);
      console.error(errorMessage);
      return { data: errorMessage };
    }

    const text = await response.text();
    if (!text) {
      return {
        data: "Documentation not found or not finalized for this library. This might have happened because you used an invalid Context7-compatible library ID. To get a valid Context7-compatible library ID, use the 'resolve-library-id' with the package name you wish to retrieve documentation for.",
      };
    }
    return { data: text };
  } catch (error) {
    const errorMessage = `Error fetching library context. Please try again later. ${error}`;
    console.error(errorMessage);
    return { data: errorMessage };
  }
}
```

---

### 3. lib/types.ts

**File Path**: `packages/mcp/src/lib/types.ts`

```typescript
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  branch: string;
  lastUpdateDate: string;
  state: DocumentState;
  totalTokens: number;
  totalSnippets: number;
  stars?: number;
  trustScore?: number;
  benchmarkScore?: number;
  versions?: string[];
}

export interface SearchResponse {
  error?: string;
  results: SearchResult[];
}

// Version state is still needed for validating search results
export type DocumentState = "initial" | "finalized" | "error" | "delete";

export type ContextRequest = {
  query: string;
  libraryId: string;
};

export type ContextResponse = {
  data: string;
};
```

---

### 4. lib/constants.ts

**File Path**: `packages/mcp/src/lib/constants.ts`

```typescript
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

export const SERVER_VERSION: string = pkg.version;

const CONTEXT7_BASE_URL = "https://context7.com";
const MCP_RESOURCE_URL = "https://mcp.context7.com";

export const CLERK_DOMAIN = "clerk.context7.com";
export const CONTEXT7_API_BASE_URL = process.env.CONTEXT7_API_URL || `${CONTEXT7_BASE_URL}/api`;
export const RESOURCE_URL = process.env.RESOURCE_URL || MCP_RESOURCE_URL;
export const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || CONTEXT7_BASE_URL;
```

---

## Additional Files (Not Retrieved)

The following files are also part of the MCP server but were not retrieved in this reference:

- `lib/encryption.ts` - Handles client context and header generation
- `lib/jwt.ts` - JWT validation logic
- `lib/utils.ts` - Utility functions (formatSearchResults, extractClientInfoFromUserAgent)
- `schema/context7.json` - MCP configuration schema
- `package.json` - Package dependencies and metadata
- `Dockerfile` - Container deployment configuration

---

## API Endpoints

The Context7 API (https://context7.com/api) provides:

1. **`GET /v2/libs/search`**
   - Parameters: `query`, `libraryName`
   - Returns: List of matching libraries with metadata

2. **`GET /v2/context`**
   - Parameters: `query`, `libraryId`
   - Returns: Relevant documentation and code examples

---

## Installation & Usage

### Local (stdio)
```bash
npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

### Remote (HTTP)
```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### OAuth (HTTP)
```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp/oauth"
    }
  }
}
```

---

## Resources

- **GitHub Repository**: https://github.com/upstash/context7
- **NPM Package**: @upstash/context7-mcp
- **Documentation**: https://context7.com/docs
- **API Dashboard**: https://context7.com/dashboard
- **Discord Community**: https://upstash.com/discord

---

*This reference was generated on 2026-01-21 from the master branch of the upstash/context7 repository.*
