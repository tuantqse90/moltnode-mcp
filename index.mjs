#!/usr/bin/env node
// MoltNode by Chord, stdio edition. A thin bridge for MCP clients that only start local commands: it forwards
// tools/list and tools/call to the hosted server (https://moltnode.ag/mcp), so the tools are always the hosted ones.
//
//   npx -y moltnode-mcp
//
// MOLTNODE_MCP_URL overrides the server (default https://moltnode.ag/mcp).
// When the hosted server cannot be reached (a sandboxed inspector such as a directory's build check, or no network),
// tools/list answers from tools.json, a snapshot of the hosted list (scripts/refresh-tools.mjs), and tool calls say the
// server is unreachable.

import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const URL_ = process.env.MOLTNODE_MCP_URL || "https://moltnode.ag/mcp";
const TIMEOUT_MS = 10_000;
const BUNDLED = JSON.parse(readFileSync(new URL("./tools.json", import.meta.url), "utf8"));

function within(p, ms) {
  let t;
  return Promise.race([p, new Promise((_, no) => (t = setTimeout(() => no(new Error(`no answer in ${ms / 1000} s`)), ms)))]).finally(() => clearTimeout(t));
}

let remote = null;
async function upstream() {
  if (remote) return remote;
  const c = new Client({ name: "moltnode-mcp-stdio", version: "1.1.5" });
  await within(c.connect(new StreamableHTTPClientTransport(new URL(URL_))), TIMEOUT_MS);
  remote = c;
  return c;
}

const first = await upstream().catch((e) => {
  console.error(`moltnode-mcp: cannot reach ${URL_}: ${e.message}`);
  return null;
});

const server = new Server(
  { name: "moltnode", title: "MoltNode by Chord", version: "1.1.5" },
  { capabilities: { tools: {} }, instructions: first?.getInstructions() ?? BUNDLED.instructions ?? undefined },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    return await within((await upstream()).listTools(), TIMEOUT_MS);
  } catch (e) {
    remote = null; // reconnect on the next call
    console.error(`moltnode-mcp: ${URL_} unreachable (${e.message}), listing the bundled tools`);
    return { tools: BUNDLED.tools };
  }
});
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
