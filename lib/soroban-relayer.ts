// Location: lib/soroban-relayer.ts
import { 
    Contract, 
    TransactionBuilder, 
    xdr,
    Keypair,
    rpc 
} from '@stellar/stellar-sdk';

const RPC_ENDPOINT = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

const rpcClient = new rpc.Server(RPC_ENDPOINT, {
    allowHttp: RPC_ENDPOINT.startsWith('http://'),
});

export async function submitContractCall(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    signer: Keypair
) {
    try {
        const contract = new Contract(contractId);
        const account = await rpcClient.getAccount(signer.publicKey());
        
        let tx = new TransactionBuilder(account, {
            fee: "1000", // Adequate fee buffer for testnet congestion
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call(method, ...args))
        .setTimeout(60)
        .build();

        const simulation = await rpcClient.simulateTransaction(tx);
        
        if (rpc.Api.isSimulationError(simulation)) {
            throw new Error(`SOROBAN_SIMULATION_ERROR: ${simulation.error}`);
        }

        tx = rpc.assembleTransaction(tx, simulation).build();
        tx.sign(signer);
        
        const sendResult = await rpcClient.sendTransaction(tx);
        
        if (sendResult.status === 'ERROR') {
            throw new Error(`TRANSACTION_REJECTED: ${JSON.stringify(sendResult.errorResult)}`);
        }

        const hash = sendResult.hash;
        console.log(`⏳ Waiting for ledger inclusion [Hash: ${hash.slice(0, 10)}...]`);

        // 🛡️ Resilient polling: 30 attempts * 4s = 120s timeout window
        let status = 'PENDING';
        let attempts = 0;
        const maxAttempts = 30;

        while ((status === 'PENDING' || status === 'NOT_FOUND') && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 4000));
            
            try {
                const txResponse = await rpcClient.getTransaction(hash);
                status = txResponse.status;
                
                if (status === 'SUCCESS') {
                    return { success: true, hash };
                }
                if (status === 'FAILED') {
                    throw new Error(`TRANSACTION_FAILED_ON_LEDGER: ${JSON.stringify(txResponse)}`);
                }
            } catch (pollError: any) {
                // Ignore transient lookup misses while transaction propagates across nodes
            }
            attempts++;
        }

        if (status !== 'SUCCESS') {
            throw new Error(`TRANSACTION_TIMEOUT: Transaction ${hash} did not settle within 120s.`);
        }

        return { success: true, hash };
    } catch (error: any) {
        console.error("MESH RELAYER ERROR:", error?.message || error);
        return { success: false, error: String(error?.message || error) };
    }
}