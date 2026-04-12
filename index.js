#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_URL = (process.env.MEGALAUNCH_API_URL || "https://vernal.zylos.coco.xyz/megalaunch")
  .replace(/\/+$/, ""); // strip trailing slashes

const API_KEY = process.env.MEGALAUNCH_API_KEY || "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Make a request to the MegaLaunch REST API.
 */
async function apiRequest(method, path, body) {
  const url = `${API_URL}/api/v1${path}`;

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const opts = { method, headers };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(`MegaLaunch API error: ${msg}`);
  }

  return data;
}

/**
 * Format an API response as MCP tool result content.
 */
function jsonResult(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Format an error as MCP tool error result.
 */
function errorResult(err) {
  return {
    content: [
      {
        type: "text",
        text: err instanceof Error ? err.message : String(err),
      },
    ],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "megalaunch",
  version: "1.0.0",
  description:
    "MegaLaunch \u2014 AI-powered meme token launch service on Solana. Create tokens on pump.fun with AI-generated art, bundled buys, and Jito-powered speed.",
});

// ---------------------------------------------------------------------------
// Tool: megalaunch_status
// ---------------------------------------------------------------------------

server.registerTool("megalaunch_status", {
  description: "Check MegaLaunch service status and recent launch statistics",
}, async () => {
  try {
    const data = await apiRequest("GET", "/status");
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
});

// ---------------------------------------------------------------------------
// Tool: megalaunch_pricing
// ---------------------------------------------------------------------------

server.registerTool("megalaunch_pricing", {
  description: "Get current pricing for token launch packages (Basic and Premium)",
}, async () => {
  try {
    const data = await apiRequest("GET", "/pricing");
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
});

// ---------------------------------------------------------------------------
// Tool: megalaunch_create_order
// ---------------------------------------------------------------------------

server.registerTool("megalaunch_create_order", {
  description:
    "Create a new meme token launch order on Solana/pump.fun. Returns deposit address and amount to send.",
  inputSchema: {
    package: z.enum(["basic", "premium"]).describe('Launch package: "basic" or "premium"'),
    tokenName: z.string().optional().describe("Custom token name"),
    tokenSymbol: z
      .string()
      .min(1)
      .max(10)
      .optional()
      .describe("Custom token symbol (1-10 characters)"),
    tokenDescription: z.string().optional().describe("Token description"),
    aiPick: z
      .boolean()
      .optional()
      .describe("Let AI choose a trending name/symbol"),
    theme: z
      .enum(["war", "money", "hype", "animal", "fire", "ice"])
      .optional()
      .describe("Theme for AI-generated token identity"),
  },
}, async (args) => {
  try {
    const body = { package: args.package };
    if (args.tokenName !== undefined) body.tokenName = args.tokenName;
    if (args.tokenSymbol !== undefined) body.tokenSymbol = args.tokenSymbol;
    if (args.tokenDescription !== undefined) body.tokenDescription = args.tokenDescription;
    if (args.aiPick !== undefined) body.aiPick = args.aiPick;
    if (args.theme !== undefined) body.theme = args.theme;

    const data = await apiRequest("POST", "/orders", body);
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
});

// ---------------------------------------------------------------------------
// Tool: megalaunch_list_orders
// ---------------------------------------------------------------------------

server.registerTool("megalaunch_list_orders", {
  description: "List your token launch orders with optional status filter",
  inputSchema: {
    status: z.string().optional().describe("Filter by order status"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of results (1-100)"),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Pagination offset"),
  },
}, async (args) => {
  try {
    const params = new URLSearchParams();
    if (args.status) params.set("status", args.status);
    if (args.limit !== undefined) params.set("limit", String(args.limit));
    if (args.offset !== undefined) params.set("offset", String(args.offset));

    const qs = params.toString();
    const path = qs ? `/orders?${qs}` : "/orders";

    const data = await apiRequest("GET", path);
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
});

// ---------------------------------------------------------------------------
// Tool: megalaunch_get_order
// ---------------------------------------------------------------------------

server.registerTool("megalaunch_get_order", {
  description: "Get detailed status of a specific token launch order",
  inputSchema: {
    orderId: z.string().describe("The order ID to look up"),
  },
}, async ({ orderId }) => {
  try {
    const data = await apiRequest("GET", `/orders/${encodeURIComponent(orderId)}`);
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
});

// ---------------------------------------------------------------------------
// Tool: megalaunch_cancel_order
// ---------------------------------------------------------------------------

server.registerTool("megalaunch_cancel_order", {
  description: "Cancel a pending token launch order (only works for unpaid orders)",
  inputSchema: {
    orderId: z.string().describe("The order ID to cancel"),
  },
}, async ({ orderId }) => {
  try {
    const data = await apiRequest("POST", `/orders/${encodeURIComponent(orderId)}/cancel`);
    return jsonResult(data);
  } catch (err) {
    return errorResult(err);
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server fatal error:", err);
  process.exit(1);
});
