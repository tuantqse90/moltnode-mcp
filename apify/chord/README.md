# Chord: DEX Aggregator and On-Chain Market Data MCP Server

[Chord](https://getchord.xyz) is a DEX aggregator with its own on-chain data index. This MCP server gives an AI agent both: **best-route swaps** with unsigned transactions, and **market data built from every DEX trade** on the chains Chord covers.

- **Swap** on Ethereum, Base, Arbitrum, BNB Chain, Avalanche, Monad, Robinhood Chain (tokenized stocks such as NVDA and TSLA) and Arc: best route across the chain's DEXs, split when it pays, the **unsigned** transaction and a simulation from your wallet.
- **Data** on those 8 chains plus Solana: trending token boards, token pages, trades, candles, wallet PnL, smart-money wallets, holders and liquidity pools.
- **Non-custodial, no key needed.** The server never sees a private key; your agent signs with its own wallet.

## Tools

| Tool | What it does |
|---|---|
| `chord_chains` | Chains, ids and what each one supports |
| `chord_status` | Freshness of Chord's data per chain |
| `chord_overview` | Volume, trades and top tokens of a chain |
| `chord_tokens` | Token boards: trending, gainers, new, by volume |
| `chord_search` | Find a token by symbol, name or address |
| `chord_token` | Price, liquidity, volume and change for one token |
| `chord_trades` | Latest DEX trades of a token |
| `chord_candles` | OHLCV candles from 1 minute to 1 week |
| `chord_wallet` | A wallet's realized and unrealized PnL per token |
| `chord_wallet_trades` | A wallet's DEX trades |
| `chord_smart_money` | Wallets with the best realized PnL on a chain or token |
| `chord_holders` | Top holders of a token |
| `chord_lp_pools` | Liquidity pools with fees, volume and TVL |
| `chord_lp_positions` | LP positions and their PnL |
| `chord_quote` | Best swap route and expected output |
| `chord_swap_tx` | The unsigned swap transaction + approval + simulation |
| `chord_ask` | Chord's research assistant (needs a Chord API key) |

## Connect

The MCP endpoint is this Actor's Standby URL plus `/mcp`:

```
{{ACTOR_URL}}/mcp
```

Authenticate with your Apify API token (Console > Settings > API & Integrations).

**Claude Code**

```bash
claude mcp add --transport http chord {{ACTOR_URL}}/mcp --header "Authorization: Bearer $APIFY_TOKEN"
```

**Cursor / Windsurf / VS Code** (`mcp.json`)

```json
{
  "mcpServers": {
    "chord": {
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
    "chord": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "{{ACTOR_URL}}/mcp", "--header", "Authorization: Bearer <APIFY_TOKEN>"]
    }
  }
}
```

Apify's own MCP server (`mcp.apify.com`) can also call this Actor as a tool.

## Example prompts

- "What are the top gainers on Base in the last 24 hours, with volume above $100k?"
- "Show me 1-hour candles for NVDA on Robinhood Chain for the last two days."
- "Which wallets made the most realized profit trading AERO this week?"
- "What is my PnL per token on Arbitrum? Wallet 0x..."
- "Quote 1 ETH to USDC on Ethereum for wallet 0x... and give me the transaction to sign."

## Pricing and limits

The tools are free. You pay only Apify's platform usage for the Standby container while it serves your calls. Without a key Chord allows about 60 requests a minute; a free API key from [getchord.xyz/developer](https://getchord.xyz/developer), sent as the `X-API-Key` header, raises the limits and unlocks `chord_ask`.

## Links

- Website: [getchord.xyz](https://getchord.xyz)
- MCP docs: [getchord.xyz/docs/agents/mcp](https://getchord.xyz/docs/agents/mcp/)
- REST API reference: [getchord.xyz/docs](https://getchord.xyz/docs)
- Source of this Actor (MIT): [github.com/tuantqse90/moltnode-mcp](https://github.com/tuantqse90/moltnode-mcp/tree/main/apify/chord)

This Actor forwards MCP requests to Chord's hosted server at `https://api.getchord.xyz/v1/mcp`. Your Apify token is never forwarded.
