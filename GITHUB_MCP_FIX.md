# Fixing GitHub MCP Docker Error

## Problem
The GitHub MCP server requires Docker, but Docker is not installed or not in your PATH.

Error: `exec: "docker": executable file not found in $PATH`

## Solutions

### Solution 1: Install Docker Desktop (Recommended)

1. **Download Docker Desktop for Mac:**
   - Visit: https://www.docker.com/products/docker-desktop
   - Or use Homebrew:
     ```bash
     brew install --cask docker
     ```

2. **Launch Docker Desktop:**
   - Open Docker Desktop from Applications
   - Wait for Docker to start (you'll see the whale icon in your menu bar)

3. **Verify Installation:**
   ```bash
   docker --version
   ```

4. **Restart Cursor** after Docker is running

### Solution 2: Use GitHub MCP Without Docker

If you don't want to install Docker, you can use the GitHub MCP server via npx instead:

**Update your `.cursor/mcp.json`:**

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
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Solution 3: Remove GitHub MCP (If Not Needed)

If you don't need GitHub MCP integration, simply remove it from your configuration.

## Current Status

- ✅ Context7 MCP: Working (uses npx, no Docker needed)
- ❌ GitHub MCP: Requires Docker or alternative setup
- ❌ Docker: Not installed

## Recommended Action

**For most users:** Install Docker Desktop using Homebrew:

```bash
# Install Docker Desktop
brew install --cask docker

# Launch Docker Desktop
open -a Docker

# Wait for Docker to start, then verify
docker --version
```

Then restart Cursor.

## Alternative: Check Your PATH

If Docker is installed but not found, add it to your PATH:

```bash
# Check if Docker is installed elsewhere
find /Applications -name "docker" -type f 2>/dev/null

# If found, add to PATH in ~/.zshrc:
echo 'export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Need Help?

- Docker Desktop: https://docs.docker.com/desktop/install/mac-install/
- GitHub MCP: https://github.com/modelcontextprotocol/servers/tree/main/src/github
- Cursor MCP Docs: https://docs.cursor.com/context/model-context-protocol
