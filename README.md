# moltnode-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives any
MCP client — **Claude Desktop, Cursor, Cline, Windsurf, …** — zero-config,
no-key access to **31+ chains** through the [MoltNode](https://moltnode.ag) RPC
gateway. One URL per chain, for humans and agents.

The chain list is loaded live from `https://moltnode.ag/api/chains` at startup,
so new chains appear automatically — no upgrade needed.

## Tools

| Tool | What it does |
|------|--------------|
| `list_chains` | Every reachable chain (slug, name, chainId, family, native currency). |
| `rpc_call` | Any JSON-RPC 2.0 call — EVM (`eth_*`), Solana, Sui. The workhorse. |
| `get_block_number` | Latest block height / slot for a chain. |
| `get_balance` | Native balance of an EVM address (wei + decimal). |

No API keys. No signup. Upstream failover is handled by the gateway.

## Install

Published on npm — no clone needed:

```bash
npx -y moltnode-mcp
```

Or build from source to hack on it:

```bash
npm install && npm run build
```

## Use it in an MCP client

**Claude Desktop** — `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "moltnode": {
      "command": "npx",
      "args": ["-y", "moltnode-mcp"]
    }
  }
}
```

**Cursor / Cline / Windsurf** — same shape in their MCP settings. To run from a
local build instead of npx:

```json
{
  "mcpServers": {
    "moltnode": { "command": "node", "args": ["/absolute/path/to/moltnode-mcp/dist/index.js"] }
  }
}
```

Then ask your agent: *"What's the latest block on Base?"* or *"ETH balance of
0xd8dA…6045 on Ethereum?"* — it routes through MoltNode with no setup.

## Config

| Env var | Default | Purpose |
|---------|---------|---------|
| `MOLTNODE_URL` | `https://moltnode.ag` | Point at a self-hosted gateway. |

## License

MIT
