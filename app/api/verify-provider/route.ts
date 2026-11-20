import { NextResponse } from "next/server";
import {
  Contract,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

export const dynamic = "force-dynamic";

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_VERIFIER_CONTRACT_ID ||
  "CC6QWTVPHQV76HRFPJSJTOYCU7RPCEITAQ3BSMYYZ3OP54FTCKQAGAHY";
const RPC_URL = (
  process.env.SOROBAN_RPC_URL ||
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org:443"
).trim();
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  Networks.TESTNET;
const ADMIN_PUBLIC_KEY =
  process.env.VERIFIER_ADMIN_PUBLIC_KEY ||
  "GDI6TKITSWM446F3ROV3KHL5HGKGSOTZLG72IZCE7FBPGDBZVUMZE4JD";

function parseHexBytes(value: unknown): Buffer | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/^0x/i, "");
  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) {
    return null;
  }
  return Buffer.from(clean, "hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid or malformed JSON payload" },
        { status: 400 }
      );
    }

    const g1Bytes = parseHexBytes((body as Record<string, unknown>).g1_points);
    const g2Bytes = parseHexBytes((body as Record<string, unknown>).g2_points);

    if (!g1Bytes || !g2Bytes) {
      return NextResponse.json(
        { error: "Missing or invalid hex proof vectors (g1_points, g2_points)" },
        { status: 400 }
      );
    }

    const server = new rpc.Server(RPC_URL, {
      allowHttp: RPC_URL.startsWith("http://"),
    });
    const contract = new Contract(CONTRACT_ID);

    const operation = contract.call(
      "verify_provider",
      xdr.ScVal.scvBytes(g1Bytes),
      xdr.ScVal.scvBytes(g2Bytes)
    );

    const adminAccount = await server.getAccount(ADMIN_PUBLIC_KEY);
    const tx = await server.prepareTransaction(
      new TransactionBuilder(adminAccount, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build()
    );

    const simResult = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
      const retval = simResult.result.retval;
      const isValid = scValToNative(retval);

      return NextResponse.json(
        {
          verified: Boolean(isValid),
          contractId: CONTRACT_ID,
        },
        { status: 200 }
      );
    }

    const simError = rpc.Api.isSimulationError(simResult)
      ? simResult.error
      : "Simulation rejected proof";

    return NextResponse.json(
      { verified: false, error: simError || "Simulation rejected proof" },
      { status: 422 }
    );
  } catch (error: any) {
    console.error("[VERIFY_PROVIDER_ERROR]:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}