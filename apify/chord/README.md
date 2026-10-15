# Chord: DEX Aggregator and On-Chain Market Data MCP Server

[Chord](https://getchord.xyz) is a DEX aggregator with its own on-chain data index. This MCP server gives an AI agent both: **best-route swaps** with unsigned transactions, and **market data built from every DEX trade** on the chains Chord covers.

- **Swap** on Ethereum, Base, Arbitrum, BNB Chain, Avalanche, Monad, Robinhood Chain (tokenized stocks such as NVDA and TSLA) and Arc: best route across the chain's DEXs, split when it pays, the **unsigned** transaction and a simulation from your wallet.
- **Data** on all 9 chains, Solana included: 24h token boards, token pages, trades, candles and wallet PnL. Smart-money wallets and LP pools on Monad, Robinhood Chain, Arc and Solana; holder ledgers on Robinhood Chain and Arc. `chord_chains` says what each chain has.
- **Non-custodial, no key needed.** The server never sees a private key; your agent signs with its own wallet.

## Tools

| Tool | What it does |
|---|---|
| `chord_chains` | Chains, ids and what each one supports |
| `chord_status` | Live health per chain: routing engine and how old the newest indexed trade is |
| `chord_overview` | A chain's last 24 hours: volume, swaps, venue share, hourly buckets |
| `chord_tokens` | The chain's 24h token board: price, volume, trades, change |
| `chord_search` | Find a token by symbol, name or address |
| `chord_token` | One token: price, 24h volume and trades, pools or venues |
| `chord_trades` | Newest swaps of a token: side, USD size, price, venue, wallet |
| `chord_candles` | OHLCV candles from Chord's own trade index |
| `chord_wallet` | A wallet's realised and open PnL per token |
| `chord_wallet_trades` | A wallet's recent swaps |
| `chord_smart_money` | Wallets ranked by profit on a chain, bots removed |
| `chord_holders` | Holder ledger of a token (balances by address) |
| `chord_lp_pools` | Pools ranked for a liquidity provider: volume, fees, TVL, fee/TVL |
| `chord_lp_positions` | A wallet's LP positions: range, value, fees, in or out of range |
| `chord_quote` | Best swap quote on an EVM chain, with a quoteId |
| `chord_swap_tx` | The unsigned swap transaction + approval + simulation |
| `chord_ask` | Chord's analyst for plain-language questions (needs a Chord API key) |

## Connect

The MCP endpoint is this Actor's Standby URL plus `/mcp`:

```
https://getchord--chord-mcp.apify.actor/mcp
```

Authenticate with your Apify API token (Console > Settings > API & Integrations).

**Claude Code**

```bash
claude mcp add --transport http chord https://getchord--chord-mcp.apify.actor/mcp --header "Authorization: Bearer $APIFY_TOKEN"
```

**Cursor / Windsurf / VS Code** (`mcp.json`)

```json
{
  "mcpServers": {
    "chord": {
      "url": "https://getchord--chord-mcp.apify.actor/mcp",
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
      "args": ["-y", "mcp-remote", "https://getchord--chord-mcp.apify.actor/mcp", "--header", "Authorization: Bearer <APIFY_TOKEN>"]
    }
  }
}
```

Apify's own MCP server (`mcp.apify.com`) can also call this Actor as a tool.

## Example prompts

- "What are the busiest tokens on Base in the last 24 hours?"
- "Show me 1-hour candles for NVDA on Robinhood Chain for the last two days."
- "Who are the most profitable wallets on Solana over the last 7 days, bots removed?"
- "What is my realised and open PnL per token on Base? Wallet 0x..."
- "Quote 1 ETH to USDC on Ethereum for wallet 0x... and give me the transaction to sign."

## Pricing and limits

The tools are free. You pay only Apify's platform usage for the Standby container while it serves your calls. Without a key Chord allows about 60 requests a minute; a free API key from [getchord.xyz/developer](https://getchord.xyz/developer), sent as the `X-API-Key` header, raises the limits and unlocks `chord_ask`.

## Links

- Website: [getchord.xyz](https://getchord.xyz)
- MCP docs: [getchord.xyz/docs/agents/mcp](https://getchord.xyz/docs/agents/mcp/)
- REST API reference: [getchord.xyz/docs](https://getchord.xyz/docs)
- Source of this Actor (MIT): [github.com/tuantqse90/moltnode-mcp](https://github.com/tuantqse90/moltnode-mcp/tree/main/apify/chord)

This Actor forwards MCP requests to Chord's hosted server at `https://api.getchord.xyz/v1/mcp`. Your Apify token is never forwarded.
