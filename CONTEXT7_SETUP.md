# Context7 MCP Setup Guide

## ✅ Configuration Complete

Your Context7 MCP server is now configured and ready to use!

## 📁 Files Created

1. **`.cursor/mcp.json`** - Cursor MCP configuration (local stdio connection)
2. **`.env.context7`** - Environment variables for Context7 API key
3. **`context7-mcp-reference.md`** - Full source code reference

## 🚀 How to Use Context7

### In Cursor

Context7 is now available as an MCP tool in Cursor. You can use it in two ways:

#### Method 1: Explicit Invocation
Add `use context7` to your prompts:

```
Create a Next.js middleware that checks for a valid JWT in cookies. use context7
```

```
How do I set up Supabase authentication in React? use context7
```

#### Method 2: Auto-Invoke with Rules
To avoid typing `use context7` every time, add this rule in Cursor:

**Cursor Settings → Rules** and add:
```
Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
```

### Available MCP Tools

Context7 provides two tools that Cursor can use:

1. **`resolve-library-id`**
   - Searches for libraries and returns Context7-compatible IDs
   - Parameters: `query`, `libraryName`
   - Example: Search for "Next.js" to get `/vercel/next.js`

2. **`query-docs`**
   - Retrieves up-to-date documentation for a specific library
   - Parameters: `libraryId`, `query`
   - Example: Get Next.js middleware docs with `/vercel/next.js`

### Using Library IDs Directly

If you know the exact library ID, you can specify it:

```
Implement basic authentication with Supabase. use library /supabase/supabase for API and docs.
```

### Specifying Versions

To get documentation for a specific version:

```
How do I set up Next.js 14 middleware? use context7
```

The format for versioned libraries is: `/org/project/version`
Example: `/vercel/next.js/v14.3.0-canary.87`

## 🔧 Alternative Setup Methods

### Global Cursor Configuration

To use Context7 across all projects, add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "ctx7sk-626b8aab-cced-484a-843e-02234eec4d8d"
      ]
    }
  }
}
```

### Remote HTTP Connection

For remote access (useful for team sharing):

```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "ctx7sk-626b8aab-cced-484a-843e-02234eec4d8d"
      }
    }
  }
}
```

### Claude Code Setup

If you're using Claude Code, run:

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key ctx7sk-626b8aab-cced-484a-843e-02234eec4d8d
```

### Opencode Setup

Add to your Opencode configuration:

```json
{
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp", "--api-key", "ctx7sk-626b8aab-cced-484a-843e-02234eec4d8d"],
      "enabled": true
    }
  }
}
```

## 🧪 Testing Context7

To verify Context7 is working, try these prompts in Cursor:

1. **Basic test:**
   ```
   use context7
   How do I create a basic Express.js server?
   ```

2. **Specific library:**
   ```
   use context7
   Show me how to use React hooks for state management
   ```

3. **With library ID:**
   ```
   use library /vercel/next.js
   How do I create dynamic routes in Next.js?
   ```

## 📊 API Key Information

- **Your API Key:** `ctx7sk-626b8aab-cced-484a-843e-02234eec4d8d`
- **Dashboard:** https://context7.com/dashboard
- **Rate Limits:** Check your plan at https://context7.com/plans
- **Upgrade:** If you hit rate limits, upgrade at https://context7.com/plans

## 🔒 Security Notes

1. **Keep your API key private** - Don't commit `.cursor/mcp.json` or `.env.context7` to public repositories
2. Add to `.gitignore`:
   ```
   .cursor/mcp.json
   .env.context7
   ```

## 📚 Resources

- **Documentation:** https://context7.com/docs
- **GitHub:** https://github.com/upstash/context7
- **NPM Package:** @upstash/context7-mcp
- **Discord Community:** https://upstash.com/discord
- **Cursor MCP Docs:** https://docs.cursor.com/context/model-context-protocol

## 🆘 Troubleshooting

### Context7 not showing up in Cursor?
1. Restart Cursor completely
2. Check that `.cursor/mcp.json` exists in your project root
3. Verify the JSON syntax is valid

### Rate limit errors?
- Create a free API key at https://context7.com/dashboard for higher limits
- Upgrade your plan at https://context7.com/plans

### "Invalid API key" error?
- Verify your API key starts with `ctx7sk-`
- Check for typos in the configuration file

### Library not found?
- Use `resolve-library-id` first to find the correct library ID
- Try different search terms (e.g., "nextjs" vs "next.js")

## 💡 Pro Tips

1. **Use specific queries** - Instead of "auth", use "How to implement JWT authentication in Express.js"
2. **Specify versions** - Mention the version in your query for version-specific docs
3. **Combine with library IDs** - If you know the library ID, include it to skip the search step
4. **Set up rules** - Auto-invoke Context7 for all documentation queries
5. **Limit calls** - Context7 tools are limited to 3 calls per question, so be specific

---

**Status:** ✅ Ready to use! Start asking questions with `use context7` in your Cursor prompts.
