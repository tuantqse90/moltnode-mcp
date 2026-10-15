// Apify Actor (Standby mode): a pass-through to a hosted MCP server, so Apify users can add it by the Actor's Standby URL
// + /mcp. No dependencies. Only MCP headers and the caller's own optional key header go upstream; the Apify token never does.
// A normal (non-Standby) run checks the upstream once, prints how to connect and exits.

import http from "node:http";
import { readFileSync } from "node:fs";

const CFG = JSON.parse(readFileSync(new URL("./upstream.json", import.meta.url), "utf8"));
const UPSTREAM = process.env.UPSTREAM_MCP_URL || CFG.url;
const PORT = Number(process.env.ACTOR_WEB_SERVER_PORT || process.env.ACTOR_STANDBY_PORT || process.env.APIFY_CONTAINER_PORT || 4321);
const SERVER_KEY = process.env[CFG.keyEnv] || ""; // optional secret set in the Actor's environment
const FORWARD_IN = ["content-type", "accept", "mcp-session-id", "mcp-protocol-version", "last-event-id"];
const FORWARD_OUT = ["content-type", "mcp-session-id", "cache-control", "x-moltnode-plan", "retry-after"];
const UA = `${CFG.ua} (apify ${process.env.ACTOR_ID || "local"})`;

async function proxy(req, res) {
  const headers = { "user-agent": UA };
  for (const h of FORWARD_IN) if (req.headers[h]) headers[h] = req.headers[h];
  const userKey = req.headers[CFG.keyHeader];
  if (userKey) headers[CFG.keyHeader] = userKey;
  else if (SERVER_KEY) headers[CFG.keyHeader] = SERVER_KEY;
  const body = req.method === "POST" ? await new Promise((ok, no) => {
    const parts = [];
    let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 2_000_000) { no(new Error("body too large")); req.destroy(); } else parts.push(c); });
    req.on("end", () => ok(Buffer.concat(parts)));
    req.on("error", no);
  }) : undefined;
  const up = await fetch(UPSTREAM, { method: req.method, headers, body, signal: AbortSignal.timeout(120_000) });
  const out = {};
  for (const h of FORWARD_OUT) { const v = up.headers.get(h); if (v) out[h] = v; }
  res.writeHead(up.status, out);
  if (!up.body) return res.end();
  for await (const chunk of up.body) res.write(chunk);
  res.end();
}

async function selfTest() {
  const r = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "user-agent": UA },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await r.text();
  const json = JSON.parse(text.startsWith("{") ? text : text.split("\n").find((l) => l.startsWith("data:")).slice(5));
  return json.result.tools.map((t) => t.name);
}

if (process.env.APIFY_META_ORIGIN && process.env.APIFY_META_ORIGIN !== "STANDBY") {
  try {
    const tools = await selfTest();
    console.log(`${CFG.title}: upstream ${UPSTREAM} answers with ${tools.length} tools: ${tools.join(", ")}`);
  } catch (e) {
    console.log(`${CFG.title}: upstream check failed: ${e.message}`);
    process.exitCode = 1;
  }
  console.log("This Actor is an MCP server. Connect your MCP client to the Actor's Standby URL + /mcp with your Apify token (Authorization: Bearer <token>). See the README.");
} else {
  http.createServer(async (req, res) => {
    try {
      if (req.headers["x-apify-container-server-readiness-probe"]) return res.writeHead(200).end("ok");
      const path = new URL(req.url, "http://x").pathname;
      if (path === "/mcp" && ["POST", "GET", "DELETE"].includes(req.method)) return await proxy(req, res);
      if (path === "/" && req.method === "GET") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ name: CFG.title, mcp: "/mcp", upstream: UPSTREAM, docs: CFG.docs }));
      }
      res.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ error: "not found", mcp: "/mcp" }));
    } catch (e) {
      if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: `upstream unreachable: ${e.message}` }, id: null }));
    }
  }).listen(PORT, () => console.log(`${CFG.title}: MCP on :${PORT}/mcp -> ${UPSTREAM}`));
}
