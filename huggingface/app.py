"""MoltNode by Chord on Hugging Face: read blockchains and get swap quotes or market data from any AI agent.

Every tool calls the hosted servers (https://moltnode.ag/mcp and https://api.getchord.xyz/v1/mcp), so answers are the
same as there. Read-only: nothing here signs or broadcasts; a swap quote returns an UNSIGNED transaction for the
user's own wallet. Launched with mcp_server=True, so this Space is also an MCP server at /gradio_api/mcp/.
"""

import json

import gradio as gr
import httpx

MOLTNODE = "https://moltnode.ag/mcp"
CHORD = "https://api.getchord.xyz/v1/mcp"
UA = "moltnode-hf-space/1.0 (+https://huggingface.co/spaces)"
WRITES = ("send", "sign", "personal_", "wallet_", "unsubscribe", "subscribe")

_client = httpx.Client(timeout=60, headers={"user-agent": UA, "accept": "application/json, text/event-stream"})


def _call(url, name, args):
    body = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": name, "arguments": args}}
    r = _client.post(url, json=body)
    text = r.text.strip()
    if not text.startswith("{"):
        text = next((l[5:].strip() for l in text.splitlines() if l.startswith("data:")), "{}")
    msg = json.loads(text)
    if "error" in msg:
        raise gr.Error(msg["error"].get("message", "upstream error"))
    out = "\n".join(c.get("text", "") for c in msg.get("result", {}).get("content", []))
    try:
        return json.loads(out)
    except ValueError:
        return {"result": out}


def _json(obj):
    return json.dumps(obj, indent=1, ensure_ascii=False)


def _chains(url, name, key):
    try:
        data = _call(url, name, {})
        rows = data.get("chains", data) if isinstance(data, dict) else data
        return [r[key] for r in rows if key in r]
    except Exception:
        return []


RPC_CHAINS = _chains(MOLTNODE, "list_chains", "slug")
EVM_CHAINS = [c for c in RPC_CHAINS if c not in ("solana", "sui")] or ["ethereum"]
DATA_CHAINS = _chains(CHORD, "chord_chains", "key") or ["ethereum", "base", "solana"]
TRADE_CHAINS = [c for c in DATA_CHAINS if c != "solana"]


def _chain(choices, value="ethereum", label="Chain"):
    return gr.Dropdown(choices=choices, value=value if value in choices else choices[0], label=label)


def list_chains() -> str:
    """List every chain MoltNode reads over JSON-RPC (slug, chain id, native coin, endpoint) and which ones Chord trades on.

    Returns:
        The chain list as JSON.
    """
    return _json(_call(MOLTNODE, "list_chains", {}))


def get_block_number(chain: str) -> str:
    """Latest block number of an EVM chain.

    Args:
        chain: EVM chain slug, e.g. 'ethereum', 'base', 'arbitrum', 'monad'.

    Returns:
        The block number.
    """
    return _json(_call(MOLTNODE, "get_block_number", {"chain": chain}))


def get_balance(chain: str, address: str) -> str:
    """Native-coin balance of an address on an EVM chain, in wei and in whole coins.

    Args:
        chain: EVM chain slug, e.g. 'ethereum'.
        address: The 0x account address.

    Returns:
        The balance.
    """
    return _json(_call(MOLTNODE, "get_balance", {"chain": chain, "address": address.strip()}))


def rpc_read(chain: str, method: str, params: str = "[]") -> str:
    """Call a read-only JSON-RPC method on any listed chain (eth_call, eth_getLogs, eth_getTransactionReceipt, getBalance on Solana, suix_* on Sui).

    Args:
        chain: Chain slug, e.g. 'ethereum', 'base', 'solana', 'sui'.
        method: JSON-RPC method name. Methods that send or sign are refused here.
        params: JSON array of params, e.g. '["latest", false]'.

    Returns:
        The JSON-RPC result.
    """
    m = method.strip()
    if any(w in m.lower() for w in WRITES):
        raise gr.Error("This Space is read-only: sending and signing methods are refused.")
    try:
        p = json.loads(params or "[]")
    except ValueError:
        raise gr.Error("params must be a JSON array")
    if not isinstance(p, list):
        raise gr.Error("params must be a JSON array")
    return _json(_call(MOLTNODE, "rpc_call", {"chain": chain, "method": m, "params": p}))


def find_token(chain: str, query: str) -> str:
    """Find a token by symbol, name or address on a chain Chord covers. Similar tickers are common: compare addresses.

    Args:
        chain: Chord chain key, e.g. 'ethereum', 'base', 'solana', 'robinhood'.
        query: Symbol, name or address.

    Returns:
        Candidate tokens with addresses, decimals and price data.
    """
    return _json(_call(CHORD, "chord_search", {"chain": chain, "query": query.strip()}))


def swap_quote(chain: str, token_in: str, token_out: str, amount: str, taker: str | None = None, slippage_bps: int | None = 50) -> str:
    """Best swap route from Chord across the chain's DEXs. With a taker wallet the answer carries the UNSIGNED transaction, the approval it needs and a simulation from that wallet. Nothing is signed or sent.

    Args:
        chain: Chord trade chain, e.g. 'ethereum', 'base', 'arbitrum', 'monad'.
        token_in: Address of the token sold (zero address = native coin).
        token_out: Address of the token bought (zero address = native coin).
        amount: Amount of token_in in its smallest unit, e.g. '10000000' = 10 USDC.
        taker: Optional wallet address that will sign.
        slippage_bps: Slippage in basis points (default 50).

    Returns:
        Route, expected output, minimum output and, with a taker, the unsigned transaction.
    """
    args = {"chain": chain, "tokenIn": token_in.strip(), "tokenOut": token_out.strip(), "amount": str(amount).strip(), "slippageBps": int(slippage_bps or 50)}
    if taker and taker.strip():
        args["taker"] = taker.strip()
    return _json(_call(MOLTNODE, "chord_swap_quote", args))


def token_board(chain: str, limit: int = 20) -> str:
    """A chain's 24h token board from Chord's own DEX trade index: price, volume, trades, change.

    Args:
        chain: Chord chain key, e.g. 'base', 'ethereum', 'solana'.
        limit: Number of tokens (1 to 100).

    Returns:
        The token board.
    """
    return _json(_call(CHORD, "chord_tokens", {"chain": chain, "limit": int(limit)}))


def candles(chain: str, address: str, tf: str = "1h", limit: int = 48) -> str:
    """OHLCV candles of a token from Chord's own trade index. Get the address with find_token first.

    Args:
        chain: Chord chain key.
        address: Token address (base58 mint on Solana, case-sensitive).
        tf: Timeframe: 1m, 5m, 15m, 1h, 4h, 1d or 1w.
        limit: Number of candles (up to 1000).

    Returns:
        The candles.
    """
    return _json(_call(CHORD, "chord_candles", {"chain": chain, "address": address.strip(), "tf": tf, "limit": int(limit)}))


def wallet_pnl(chain: str, wallet: str) -> str:
    """A wallet's trading result on one chain: realised and open PnL per token.

    Args:
        chain: Chord chain key.
        wallet: Wallet address.

    Returns:
        PnL per token and totals.
    """
    return _json(_call(CHORD, "chord_wallet", {"chain": chain, "wallet": wallet.strip()}))


TABS = [
    (list_chains, [], "Chains"),
    (get_block_number, [_chain(EVM_CHAINS)], "Block"),
    (get_balance, [_chain(EVM_CHAINS), gr.Textbox(label="Address", value="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")], "Balance"),
    (rpc_read, [_chain(RPC_CHAINS or EVM_CHAINS), gr.Textbox(label="Method", value="eth_getBlockByNumber"), gr.Textbox(label="Params (JSON array)", value='["latest", false]')], "JSON-RPC"),
    (find_token, [_chain(DATA_CHAINS, "base"), gr.Textbox(label="Symbol, name or address", value="AERO")], "Find token"),
    (swap_quote, [_chain(TRADE_CHAINS, "base"), gr.Textbox(label="Token in", value="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"), gr.Textbox(label="Token out", value="0x0000000000000000000000000000000000000000"), gr.Textbox(label="Amount (smallest unit)", value="100000000"), gr.Textbox(label="Taker wallet (optional)"), gr.Number(label="Slippage (bps)", value=50, precision=0)], "Swap quote"),
    (token_board, [_chain(DATA_CHAINS, "base"), gr.Slider(1, 100, value=20, step=1, label="Tokens")], "Token board"),
    (candles, [_chain(DATA_CHAINS, "base"), gr.Textbox(label="Token address", value="0x940181a94A35A4569E4529A3CDfB74e38FD98631"), gr.Dropdown(["1m", "5m", "15m", "1h", "4h", "1d", "1w"], value="1h", label="Timeframe"), gr.Slider(1, 1000, value=48, step=1, label="Candles")], "Candles"),
    (wallet_pnl, [_chain(DATA_CHAINS, "base"), gr.Textbox(label="Wallet")], "Wallet PnL"),
]

DESCRIPTION = """Read 31 blockchains and get best-route swap quotes and on-chain market data from [Chord](https://getchord.xyz).
Read-only: a swap quote returns an **unsigned** transaction for your own wallet; nothing is signed or sent here.
This Space is an MCP server (see "Use via API or MCP" below). The full server with broadcast is at `https://moltnode.ag/mcp`."""

tabs = gr.TabbedInterface(
    [gr.Interface(fn, inputs, gr.Code(language="json", label="Answer"), title=None, api_name=fn.__name__, flagging_mode="never", submit_btn="Run") for fn, inputs, _ in TABS],
    [label for _, _, label in TABS],
)

with gr.Blocks(title="MoltNode by Chord") as demo:
    gr.Markdown("# MoltNode by Chord\n\n" + DESCRIPTION)
    tabs.render()

if __name__ == "__main__":
    demo.launch(mcp_server=True)
