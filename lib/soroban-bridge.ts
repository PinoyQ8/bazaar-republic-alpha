// 🛡️ FIX: Capitalized 'Networks'
import { 
    Contract, 
    Address, 
    rpc, 
    scValToNative, 
    TransactionBuilder, 
    Account, 
    Networks 
} from '@stellar/stellar-sdk';

const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || '';
const RPC_URL = "https://api.testnet.minepi.com";

export class SorobanBridge {
    private server: rpc.Server;

    constructor() {
        this.server = new rpc.Server(RPC_URL);
    }

    async getPioneerRegistry(citizenUid: string) {
        try {
            const address = Address.fromString(citizenUid);
            const contract = new Contract(CONTRACT_ID);
            const operation = contract.call("get_registry", address.toScVal());

            // 🛡️ THE FIX: FORGING THE TRANSACTION VESSEL
            // Simulation requires a Transaction, even if it's never submitted.
            const dummySource = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "-1");
            const tx = new TransactionBuilder(dummySource, {
    fee: "100",
    // 🛡️ FIX: Use Networks.TESTNET (or Networks.PUBLIC for Mainnet)
    networkPassphrase: Networks.TESTNET, 
})
.addOperation(operation)
.setTimeout(0)
.build();

            // 🛡️ Now we pass the 'tx' (Transaction) instead of the 'operation'
            const response = await this.server.simulateTransaction(tx);
            
            if (rpc.Api.isSimulationSuccess(response) && response.result) {
                return scValToNative(response.result.retval);
            }
            
            return null;
        } catch (error) {
            console.error("[MESH-SCAN] Bridge Simulation Fracture:", error);
            return null;
        }
    }
}