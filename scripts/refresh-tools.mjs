// Refreshes tools.json: the hosted server's tool list + instructions, bundled so `tools/list` still answers when the bridge
// cannot reach https://moltnode.ag/mcp (sandboxed inspectors such as Glama's build, offline installs). Run before a release:
//   node scripts/refresh-tools.mjs
import { writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.env.MOLTNODE_MCP_URL || "https://moltnode.ag/mcp";
const c = new Client({ name: "moltnode-mcp-refresh", version: "1.0.0" });
await c.connect(new StreamableHTTPClientTransport(new URL(url)));
const { tools } = await c.listTools();
const out = { source: url, fetchedAt: new Date().toISOString(), instructions: c.getInstructions() ?? null, tools };
writeFileSync(new URL("../tools.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`tools.json: ${tools.length} tools from ${url}`);
await c.close();
