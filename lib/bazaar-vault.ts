import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// 🛡️ MESH WRITE OPERATION: Locks funds in the Escrow Vault
export async function lockBazaarFunds(
    consumerPubKey: string,
    providerPubKey: string,
    arbiterPubKey: string,
    escrowId: string,
    amount: bigint,
    durationSecs: bigint
) {
    // 1. Initialize the MESH Network Bridges
    const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!;
    const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;
    const contractId = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID!;
    
    const server = new StellarSdk.rpc.Server(rpcUrl);
    const contract = new StellarSdk.Contract(contractId);

    // 2. Fetch the Consumer's sequence number from the ledger
    const account = await server.getAccount(consumerPubKey);

    // 3. Map the TypeScript parameters to Soroban SCVals (Rust Types)
    const args = [
        StellarSdk.nativeToScVal(escrowId, { type: "symbol" }),
        new StellarSdk.Address(consumerPubKey).toScVal(),
        new StellarSdk.Address(providerPubKey).toScVal(),
        new StellarSdk.Address(arbiterPubKey).toScVal(),
        StellarSdk.nativeToScVal(amount, { type: "i128" }),
        StellarSdk.nativeToScVal(durationSecs, { type: "u64" })
    ];

    // 4. Build the raw Transaction Envelope
    const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "100", // Base fee, will be updated during simulation
        networkPassphrase,
    })
    .addOperation(contract.call("lock_funds", ...args))
    .setTimeout(30)
    .build();

    // 5. Simulate the transaction to calculate resource footprints
    const preparedTx = await server.prepareTransaction(tx);

    // 6. Request the user's cryptographic signature via Freighter
    const signedXdr = await signTransaction(preparedTx.toXDR(), { networkPassphrase });
    
    if (typeof signedXdr === 'object' && signedXdr !== null && 'error' in signedXdr) {
        throw new Error((signedXdr as any).error);
    }

    const finalXdr = typeof signedXdr === 'string' ? signedXdr : (signedXdr as any).signedTxXdr;
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(finalXdr, networkPassphrase);

    // 7. Broadcast the forged transaction to the network
    const txResponse = await server.sendTransaction(signedTx as StellarSdk.Transaction);
    
    return txResponse.hash; 
}

// 🛡️ MESH READ OPERATION: Fetches live vault state without spending gas
export async function getBazaarVaultState(escrowId: string, callerPubKey: string) {
    const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!;
    const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;
    const contractId = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID!;
    
    const server = new StellarSdk.rpc.Server(rpcUrl);
    const contract = new StellarSdk.Contract(contractId);

    // 1. Fetch the caller's account sequence (required to build the simulation envelope)
    const account = await server.getAccount(callerPubKey);

    // 2. Map the ID to a Soroban Symbol
    const args = [
        StellarSdk.nativeToScVal(escrowId, { type: "symbol" })
    ];

    // 3. Construct the read-only envelope
    const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "100", 
        networkPassphrase,
    })
    .addOperation(contract.call("get_vault", ...args))
    .setTimeout(30)
    .build();

    // 4. Ping the RPC simulation endpoint to extract the ledger data
    const simulation = await server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
        throw new Error(`MESH_SCAN_FAILED: ${simulation.error}`);
    }

    if (!simulation.result || !simulation.result.retval) {
        throw new Error("ERR_VAULT_NOT_FOUND_ON_LEDGER");
    }

    // 5. Translate the Rust SCVal struct into a TypeScript JSON object
    const vaultData = StellarSdk.scValToNative(simulation.result.retval);
    
    return vaultData;
}