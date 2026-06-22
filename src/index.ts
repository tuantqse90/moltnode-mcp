#!/usr/bin/env node
/**
 * moltnode-mcp — a Model Context Protocol server that gives any MCP client
 * (Claude Desktop, Cursor, Cline, Windsurf, …) zero-config, no-key access to
 * 31+ chains through the MoltNode RPC gateway (https://moltnode.ag).
 *
 * The chain catalog is loaded live from {GATEWAY}/api/chains at startup, so new
 * chains light up automatically with no code change. stdout is the MCP wire;
 * all logging goes to stderr.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const GATEWAY = (process.env.MOLTNODE_URL ?? "https://moltnode.ag").replace(/\/$/, "");

type Chain = {
  slug: string;
  name: string;
  chainId: number | null;
  family: "evm" | "svm" | "move" | string;
  nativeCurrency: string;
  endpoint: string;
  probeMethod: string;
  explorer: string | null;
  providers: number;
};

async function loadChains(): Promise<Chain[]> {
  const res = await fetch(`${GATEWAY}/api/chains`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`could not load chain catalog (${res.status}) from ${GATEWAY}/api/chains`);
  const data = (await res.json()) as { chains?: Chain[] };
  if (!data.chains?.length) throw new Error("chain catalog is empty");
  return data.chains;
}

// One JSON-RPC POST to a chain endpoint. The gateway handles upstream failover.
async function rpc(slug: string, method: string, params: unknown[] = []): Promise<unknown> {
  const res = await fetch(`${GATEWAY}/${slug}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await res.json().catch(() => null)) as { result?: unknown; error?: unknown } | null;
  if (body?.error) throw new Error(`RPC error: ${JSON.stringify(body.error)}`);
  return body?.result;
}

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
});
const fail = (e: unknown) => ({
  isError: true,
  content: [{ type: "text" as const, text: e instanceof Error ? e.message : String(e) }],
});

async function main() {
  const chains = await loadChains();
  const bySlug = new Map(chains.map((c) => [c.slug, c]));
  const chainEnum = z.enum(chains.map((c) => c.slug) as [string, ...string[]]);

  const server = new McpServer({ name: "moltnode", version: "0.1.0" });

  server.registerTool(
    "list_chains",
    {
      title: "List supported chains",
      description:
        "List every chain MoltNode can reach (slug, name, chainId, family, native currency). Use the `chain` slug from here as the argument for the other tools. No key required.",
      inputSchema: {},
    },
    async () =>
      ok(
        chains.map((c) => ({
          chain: c.slug,
          name: c.name,
          chainId: c.chainId,
          family: c.family,
          nativeCurrency: c.nativeCurrency,
        })),
      ),
  );

  server.registerTool(
    "rpc_call",
    {
      title: "Raw JSON-RPC call",
      description:
        "Make any JSON-RPC 2.0 call against a chain through MoltNode. Works for EVM (eth_*), Solana (getSlot, getAccountInfo, …) and Sui. The general-purpose tool — prefer it whenever no convenience tool fits. `params` is the JSON-RPC params array.",
      inputSchema: {
        chain: chainEnum.describe("Chain slug from list_chains, e.g. 'ethereum', 'base', 'monad', 'solana'."),
        method: z.string().describe("JSON-RPC method, e.g. 'eth_blockNumber', 'eth_getBalance', 'getSlot'."),
        params: z.array(z.any()).optional().describe("JSON-RPC params array. Defaults to []."),
      },
    },
    async ({ chain, method, params }) => {
      try {
        return ok(await rpc(chain, method, params ?? []));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_block_number",
    {
      title: "Current block height",
      description: "Latest block height / slot for an EVM, Solana, or Sui chain.",
      inputSchema: { chain: chainEnum.describe("Chain slug from list_chains.") },
    },
    async ({ chain }) => {
      try {
        const family = bySlug.get(chain)?.family;
        const method =
          family === "svm"
            ? "getBlockHeight"
            : family === "move"
              ? "sui_getLatestCheckpointSequenceNumber"
              : "eth_blockNumber";
        const result = await rpc(chain, method);
        const blockNumber = typeof result === "string" && result.startsWith("0x") ? parseInt(result, 16) : result;
        return ok({ chain, blockNumber, raw: result });
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_balance",
    {
      title: "Native balance (EVM)",
      description: "Native-token balance of an address on an EVM chain, returned in wei and as a decimal of the native currency.",
      inputSchema: {
        chain: chainEnum.describe("EVM chain slug from list_chains."),
        address: z.string().describe("0x-prefixed EVM address."),
      },
    },
    async ({ chain, address }) => {
      try {
        const wei = (await rpc(chain, "eth_getBalance", [address, "latest"])) as string;
        const symbol = bySlug.get(chain)?.nativeCurrency ?? "native";
        return ok({ chain, address, wei: BigInt(wei).toString(), [symbol]: Number(BigInt(wei)) / 1e18 });
      } catch (e) {
        return fail(e);
      }
    },
  );

  await server.connect(new StdioServerTransport());
  console.error(`moltnode-mcp ready — ${chains.length} chains via ${GATEWAY}`);
}

main().catch((e) => {
  console.error("moltnode-mcp failed to start:", e);
  process.exit(1);
});
