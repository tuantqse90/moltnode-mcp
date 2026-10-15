#!/usr/bin/env node
// MoltNode by Chord, stdio edition. A thin bridge for MCP clients that only start local commands: it forwards
// tools/list and tools/call to the hosted server (https://moltnode.ag/mcp), so the tools are always the hosted ones.
//
//   npx -y github:tuantqse90/moltnode-mcp
//
// MOLTNODE_MCP_URL overrides the server (default https://moltnode.ag/mcp).

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const URL_ = process.env.MOLTNODE_MCP_URL || "https://moltnode.ag/mcp";

let remote = null;
async function upstream() {
  if (remote) return remote;
  const c = new Client({ name: "moltnode-mcp-stdio", version: "1.1.0" });
  await c.connect(new StreamableHTTPClientTransport(new URL(URL_)));
  remote = c;
  return c;
}

const first = await upstream().catch((e) => {
  console.error(`moltnode-mcp: cannot reach ${URL_}: ${e.message}`);
  return null;
});

const server = new Server(
  { name: "moltnode", title: "MoltNode by Chord", version: "1.1.0" },
  { capabilities: { tools: {} }, instructions: first?.getInstructions() },
);

server.setRequestHandler(ListToolsRequestSchema, async () => (await upstream()).listTools());
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await (await upstream()).callTool(req.params);
  } catch (e) {
    remote = null; // reconnect on the next call
    return { content: [{ type: "text", text: `MoltNode is unreachable right now: ${e.message}` }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
console.error(`moltnode-mcp: stdio bridge to ${URL_}`);
