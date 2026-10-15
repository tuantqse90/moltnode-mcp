# Installing MoltNode by Chord (for AI assistants)

MoltNode is a hosted MCP server. Nothing to build and no API key.

1. If the client supports remote (Streamable HTTP) servers, add:

   ```json
   { "mcpServers": { "moltnode": { "type": "streamable-http", "url": "https://moltnode.ag/mcp" } } }
   ```

2. If the client only starts local commands, use the stdio bridge (Node 18+):

   ```json
   { "mcpServers": { "moltnode": { "command": "npx", "args": ["-y", "github:tuantqse90/moltnode-mcp"] } } }
   ```

3. Check it: call `list_chains`. It returns 31 chains and the six Chord trades on.

To swap: `chord_find_token` → `chord_swap_quote` with `taker` = the user's wallet → sign `approval.tx` if present → sign `tx` → `send_raw_transaction`. The user's own wallet signs; the server never holds keys or funds.
