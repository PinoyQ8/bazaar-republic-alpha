import { NextResponse } from "next/server";
import { Contract, rpc, scValToNative, xdr, TransactionBuilder } from "@stellar/stellar-sdk";

const CONTRACT_ID = "CC6QWTVPHQV76HRFPJSJTOYCU7RPCEITAQ3BSMYYZ3OP54FTCKQAGAHY";
const RPC_URL = "https://soroban-testnet.stellar.org:443";
const ADMIN_PUBLIC_KEY = "GDI6TKITSWM446F3ROV3KHL5HGKGSOTZLG72IZCE7FBPGDBZVUMZE4JD";

export async function POST(request: Request) {
  try {
    const { g1_points, g2_points } = await request.json();

    if (!g1_points || !g2_points) {
      return NextResponse.json(
        { error: "Missing proof vectors" },
        { status: 400 }
      );
    }

    // 1. Initialize Soroban RPC client
    const server = new rpc.Server(RPC_URL, { allowHttp: true });
    const contract = new Contract(CONTRACT_ID);

    // 2. Format byte vectors into Soroban ScVal bytes
    const g1Bytes = Buffer.from(g1_points, "hex");
    const g2Bytes = Buffer.from(g2_points, "hex");

    // 3. Build contract invocation call
    const operation = contract.call(
      "verify_provider",
      xdr.ScVal.scvBytes(g1Bytes),
      xdr.ScVal.scvBytes(g2Bytes)
    );

    // 4. Fetch admin account and simulate transaction against testnet
    const adminAccount = await server.getAccount(ADMIN_PUBLIC_KEY);
    const tx = await server.prepareTransaction(
      new TransactionBuilder(adminAccount, {
        fee: "100",
        networkPassphrase: "Test SDF Network ; September 2015",
      })
        .addOperation(operation)
        .setTimeout(30)
        .build()
    );

    const simResult = await server.simulateTransaction(tx);

    // 5. Strict Type Guard checking success state and result existence
    if (rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
      const retval = simResult.result.retval;
      const isValid = scValToNative(retval);

      return NextResponse.json({
        verified: Boolean(isValid),
        contractId: CONTRACT_ID,
      });
    }

    return NextResponse.json(
      { verified: false, error: "Simulation rejected proof" },
      { status: 422 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}