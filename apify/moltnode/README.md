# MoltNode by Chord: Blockchain RPC and Swap MCP Server

Give any AI agent read access to **31 blockchains** and **best-route token swaps**, through one MCP server.

- **Read** any chain over JSON-RPC: Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Solana, Avalanche, Monad, HyperEVM, Berachain, Sonic, Sui and 18 more. MoltNode fails over across several RPC providers per chain.
- **Trade** through [Chord](https://getchord.xyz), a DEX aggregator, on Ethereum, Base, Monad, BNB Chain, Avalanche, Arbitrum, Robinhood Chain and Arc: best route across the chain's DEXs, the **unsigned** transaction, the ERC-20 approval it needs and a simulation run from your wallet.
- **Non-custodial.** The server never sees a private key. Your agent signs with its own wallet; the router enforces `minAmountOut` on-chain.

## Tools

| Tool | What it does |
|---|---|
| `list_chains` | Every chain served: slug, chain id, native coin, endpoint, and whether Chord trades on it |
| `rpc_call` | Any JSON-RPC 2.0 method on any listed chain (`eth_call`, `eth_getLogs`, `getBalance`, `suix_*`, ...) |
| `get_block_number` | Latest block of an EVM chain |
| `get_balance` | Native balance of an address, in wei and whole coins |
| `chord_find_token` | Find a token by symbol, name or address: address, decimals, verified flag |
| `chord_swap_quote` | Best swap route + unsigned tx + approval + simulation from the taker wallet |
| `send_raw_transaction` | Broadcast a transaction your agent already signed |

## Connect

The MCP endpoint is this Actor's Standby URL plus `/mcp`:

```
{{ACTOR_URL}}/mcp
```

Authenticate with your Apify API token (Console > Settings > API & Integrations).

**Claude Code**

```bash
claude mcp add --transport http moltnode {{ACTOR_URL}}/mcp --header "Authorization: Bearer $APIFY_TOKEN"
```

**Cursor / Windsurf / VS Code** (`mcp.json`)

```json
{
  "mcpServers": {
    "moltnode": {
      "url": "{{ACTOR_URL}}/mcp",
      "headers": { "Authorization": "Bearer <APIFY_TOKEN>" }
    }
  }
}
```

**Claude Desktop** (through `mcp-remote`)

```json
{
  "mcpServers": {
    "moltnode": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "{{ACTOR_URL}}/mcp", "--header", "Authorization: Bearer <APIFY_TOKEN>"]
    }
  }
}
```

Apify's own MCP server (`mcp.apify.com`) can also call this Actor as a tool.

## Example prompts

- "What is the latest block on Base, and how much ETH does vitalik.eth hold on Ethereum?"
- "Read the `totalSupply()` of 0xA0b8...eB48 on Ethereum."
- "Quote 100 USDC to ETH on Arbitrum for my wallet 0x... and show me the transaction to sign."
- "List the chains you can trade on."

## How a swap works

1. `chord_find_token` for the token addresses and decimals (similar tickers are common, so compare addresses).
2. `chord_swap_quote` with your wallet as `taker`. Amounts are integers in the token's smallest unit; the zero address means the native coin.
3. If the answer has an `approval`, sign and send `approval.tx` first.
4. Sign `tx` with your own key, then `send_raw_transaction`.

Nothing is held for you at any step.

## Pricing and limits

The tools are free. You pay only Apify's platform usage for the Standby container while it serves your calls. MoltNode applies fair-use rate limits per client; a free Chord API key from [getchord.xyz/developer](https://getchord.xyz/developer), sent as the `X-Chord-Key` header, raises them five times.

## Links

- Website and docs: [moltnode.ag/agents](https://moltnode.ag/agents)
- Chord: [getchord.xyz](https://getchord.xyz)
- Source of this Actor (MIT): [github.com/tuantqse90/moltnode-mcp](https://github.com/tuantqse90/moltnode-mcp/tree/main/apify/moltnode)
- Privacy: [moltnode.ag/privacy](https://moltnode.ag/privacy)

This Actor forwards MCP requests to the hosted MoltNode server at `https://moltnode.ag/mcp`. Your Apify token is never forwarded.
