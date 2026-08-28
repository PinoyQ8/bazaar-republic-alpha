import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  xdr,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID!;

export async function executeVaultMutation(
  method: "release" | "refund",
  escrowId: string,
  consumerPubKey: string
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  
  // 1. Fetch Consumer Account Sequence
  const account = await server.getAccount(consumerPubKey);

  // 2. Map payload parameters to ScVal
  const params = [
    xdr.ScVal.scvString(escrowId) 
  ];

  // 3. Build Raw Host Invocation
  const invokeOp = contract.call(method, ...params);

  let rawTx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(invokeOp)
    .setTimeout(30)
    .build();

  // 4. Resolve Footprint & Resource Fees via RPC Simulation
  const preparedTx = await server.prepareTransaction(rawTx);

  // 5. Hand off to Freighter Node Shield for User Signature
  // Fixed: signTransaction takes only the XDR string, and returns an object payload
  const signResult = await signTransaction(preparedTx.toXDR());
  
  if (signResult?.error || !signResult?.signedTxXdr) {
    throw new Error(signResult?.error || "Pioneer rejected the signature request.");
  }

  const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET);

  // 6. Broadcast to the MESH
  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === "ERROR") {
    const errorDetails = sendResponse.errorResult
      ? sendResponse.errorResult.toXDR("base64")
      : JSON.stringify(sendResponse);
    throw new Error(`Transaction rejected by ledger: ${errorDetails}`);
  }

  // 7. Await Ledger Confirmation
  const txResult = await pollTransactionStatus(server, sendResponse.hash);
  
  if (txResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed on-chain. Status: ${txResult.status}`);
  }

  return sendResponse.hash;
}

// Helper to poll the RPC until the ledger closes the transaction
async function pollTransactionStatus(server: rpc.Server, hash: string) {
  let statusResponse = await server.getTransaction(hash);
  while (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    statusResponse = await server.getTransaction(hash);
  }
  return statusResponse;
}