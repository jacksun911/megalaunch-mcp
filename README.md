# MegaLaunch MCP Server

MCP (Model Context Protocol) server for **MegaLaunch** — an AI-powered meme token launch service on Solana. This server allows AI tools like Claude Desktop, Cursor, Windsurf, and others to discover and use MegaLaunch directly.

## Tools

| Tool | Description |
|------|-------------|
| `megalaunch_status` | Check service status and recent launch statistics |
| `megalaunch_pricing` | Get current pricing for Basic and Premium packages |
| `megalaunch_create_order` | Create a new meme token launch order on pump.fun |
| `megalaunch_list_orders` | List your token launch orders with optional filters |
| `megalaunch_get_order` | Get detailed status of a specific order |
| `megalaunch_cancel_order` | Cancel a pending (unpaid) order |

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "megalaunch": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"],
      "env": {
        "MEGALAUNCH_API_KEY": "ml_your_api_key_here"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "megalaunch": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"],
      "env": {
        "MEGALAUNCH_API_KEY": "ml_your_api_key_here"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "megalaunch": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"],
      "env": {
        "MEGALAUNCH_API_KEY": "ml_your_api_key_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add megalaunch -- node /path/to/mcp-server/index.js
```

Set the API key as an environment variable before launching Claude Code, or add it to your shell profile:

```bash
export MEGALAUNCH_API_KEY="ml_your_api_key_here"
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MEGALAUNCH_API_KEY` | Yes (for authenticated endpoints) | — | Your MegaLaunch API key |
| `MEGALAUNCH_API_URL` | No | `https://vernal.zylos.coco.xyz/megalaunch` | API base URL |

## Development

```bash
# Install dependencies
npm install

# Test server startup (sends an MCP initialize request)
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | MEGALAUNCH_API_KEY=test node index.js
```
