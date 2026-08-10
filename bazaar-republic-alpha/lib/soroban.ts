// PROJECT BAZAAR DAO - PROTOCOL 26.1
// MODULE: SOROBAN RPC TRANSACTION RELAYER

import { 
    Contract, 
    TransactionBuilder, 
    xdr,
    Keypair,
    rpc 
} from '@stellar/stellar-sdk';

// Solohost Local Configuration
const RPC_ENDPOINT = 'http://localhost:31401';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'; // Testnet2 Passphrase

const rpcClient = new rpc.Server(RPC_ENDPOINT);

export async function submitContractCall(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    signer: Keypair
) {
    try {
        // 1. Initialize Contract
        const contract = new Contract(contractId);
        
        // 2. Fetch latest ledger info for sequence numbers
        const account = await rpcClient.getAccount(signer.publicKey());
        
        // 3. Prepare Transaction
        const tx = new TransactionBuilder(account, {
            fee: "100",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

        // 4. Simulate for Authorization
        const simulated = await rpcClient.simulateTransaction(tx);
        
        // 5. Sign and Send
        tx.sign(signer);
        const result = await rpcClient.sendTransaction(tx);
        
        return { success: true, hash: result.hash };
    } catch (error) {
        console.error("MESH RELAYER ERROR:", error);
        return { success: false, error: String(error) };
    }
}