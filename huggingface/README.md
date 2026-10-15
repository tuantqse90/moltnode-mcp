---
title: MoltNode by Chord
emoji: ⛓️
colorFrom: gray
colorTo: green
sdk: gradio
sdk_version: 6.30.0
app_file: app.py
pinned: false
license: mit
short_description: Read 31 blockchains + swap quotes and DEX data via MCP
tags:
  - mcp-server
  - blockchain
  - crypto
  - defi
  - ethereum
  - solana
  - web3
  - agents
---

# MoltNode by Chord

Read 31 blockchains and get best-route swap quotes and on-chain market data from [Chord](https://getchord.xyz), from any AI agent. This Space is an **MCP server**.

| Tool | What it does |
|---|---|
| `list_chains` | Every chain MoltNode reads, and which ones Chord trades on |
| `get_block_number` | Latest block of an EVM chain |
| `get_balance` | Native balance of an address |
| `rpc_read` | Any read-only JSON-RPC method on any listed chain (EVM, Solana, Sui) |
| `find_token` | Find a token by symbol, name or address (compare addresses: similar tickers are common) |
| `swap_quote` | Best swap route on Ethereum, Base, Arbitrum, BNB Chain, Avalanche, Monad, Robinhood Chain or Arc; with a taker wallet, the **unsigned** transaction + approval + simulation |
| `token_board` | A chain's 24h token board from Chord's DEX trade index |
| `candles` | OHLCV candles of a token (1m to 1w) |
| `wallet_pnl` | A wallet's realised and open PnL per token |

Read-only: nothing here signs or broadcasts. A swap quote returns an unsigned transaction for the user's own wallet to sign.

## Use it from an MCP client

```json
{
  "mcpServers": {
    "moltnode": { "url": "https://<this-space>.hf.space/gradio_api/mcp/" }
  }
}
```

Or add it from your Hugging Face MCP settings (https://huggingface.co/settings/mcp).

The full hosted server, with `send_raw_transaction`, is at `https://moltnode.ag/mcp` (no key). Chord's own MCP server, with 17 tools including smart money, holders and LP pools, is at `https://api.getchord.xyz/v1/mcp`.

- MoltNode: https://moltnode.ag/agents
- Chord: https://getchord.xyz
- Source: https://github.com/tuantqse90/moltnode-mcp
