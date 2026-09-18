// Location: lib/soroban-relayer.ts
import { 
    Contract, 
    TransactionBuilder, 
    xdr,
    Keypair,
    rpc 
} from '@stellar/stellar-sdk';

const RPC_ENDPOINT = process.env.SOROBAN_RPC_URL || 'https://rpc.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || 'Pi Testnet';

async function rpcRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 3000): Promise<T> {
    for (let i = 1; i <= retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            if (i === retries) throw err;
            console.log(`⚠️ RPC fetch dropped (${err?.message || 'fetch failed'}). Retrying ${i + 1}/${retries} in ${delayMs / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    throw new Error('RPC request timed out after max retries');
}

export async function submitContractCall(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    signer: Keypair
) {
    try {
        const rpcClient = new rpc.Server(RPC_ENDPOINT, {
            allowHttp: RPC_ENDPOINT.startsWith('http://'),
        });

        const contract = new Contract(contractId);
        
        // 🛡️ Retry-wrapped account sequence lookup
        const account = await rpcRetry(() => rpcClient.getAccount(signer.publicKey()));
        
        let tx = new TransactionBuilder(account, {
            fee: "100000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call(method, ...args))
        .setTimeout(60)
        .build();

        // 🛡️ Retry-wrapped transaction simulation
        const simulation = await rpcRetry(() => rpcClient.simulateTransaction(tx));
        
        if (rpc.Api.isSimulationError(simulation)) {
            throw new Error(`SOROBAN_SIMULATION_ERROR: ${simulation.error}`);
        }

        tx = rpc.assembleTransaction(tx, simulation).build();
        tx.sign(signer);
        
        const sendResult = await rpcRetry(() => rpcClient.sendTransaction(tx));
        
        if (sendResult.status === 'ERROR') {
            throw new Error(`TRANSACTION_REJECTED: ${JSON.stringify(sendResult.errorResult)}`);
        }

        const hash = sendResult.hash;
        console.log(`⏳ Waiting for ledger inclusion [Hash: ${hash.slice(0, 10)}...]`);

        let status = 'PENDING';
        let attempts = 0;
        const maxAttempts = 30;

        while ((status === 'PENDING' || status === 'NOT_FOUND') && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 4000));
            try {
                const txResponse = await rpcClient.getTransaction(hash);
                status = txResponse.status;
                if (status === 'SUCCESS') return { success: true, hash };
                if (status === 'FAILED') throw new Error(`TRANSACTION_FAILED_ON_LEDGER: ${JSON.stringify(txResponse)}`);
            } catch {
                // Ignore transient lookup delays while transaction propagates
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