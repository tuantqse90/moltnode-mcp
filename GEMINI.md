# MoltNode by Chord

Two hosted MCP servers are connected, no API key:

- `moltnode` (https://moltnode.ag/mcp): `list_chains`, `rpc_call`, `get_block_number`, `get_balance` read 31 blockchains over JSON-RPC; `chord_find_token`, `chord_swap_quote`, `send_raw_transaction` run a swap through Chord.
- `chord` (https://api.getchord.xyz/v1/mcp): Chord's market data and swap tools on Base, Monad, BNB Chain, Avalanche, Arbitrum, Robinhood Chain and Arc (token boards, prices, candles, trades, wallet PnL, smart money, holders, LP pools; Solana data read-only).

Swap flow: find both tokens, quote with the user's wallet as `taker` (amounts in the token's smallest unit, the zero address is the native coin), show the user the quote and get an explicit yes, sign `approval.tx` first if present, then `tx`, then `send_raw_transaction`.

Rules: never ask for, store, print or send a private key or seed phrase; signing happens in the user's wallet. Never sign or broadcast without the user's confirmation of the exact quote. The tools only return unsigned transactions.
