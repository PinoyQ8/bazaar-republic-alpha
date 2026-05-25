/**
 * PROJECT BAZAAR: SOROBAN BRIDGE (REFINED)
 * Sector: lib/soroban-bridge.ts
 * Status: HARD-CODED FOR PI TESTNET
 */

import { 
    Contract, 
    Address, 
    rpc, 
    scValToNative, 
    TransactionBuilder, 
    Account, 
} from '@stellar/stellar-sdk';

const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || '';
// 🛡️ REFINED: Ensure the path targets the Soroban RPC sector
const RPC_URL = "https://api.testnet.minepi.com/soroban/rpc"; 
// 🛡️ CRITICAL: Pi Testnet Passphrase
const PI_TESTNET_PASSPHRASE = "Pi Testnet"; 

export class SorobanBridge {
    private server: rpc.Server;

    constructor() {
        this.server = new rpc.Server(RPC_URL);
    }

    /**
     * Retrieves Pioneer Registry data from the Soroban Smart Contract.
     * @param citizenAddress - Must be a valid Stellar/Pi Public Key (G...)
     */
    async getPioneerRegistry(citizenAddress: string) {
        try {
            if (!CONTRACT_ID) {
                throw new Error("SOROBAN_CONTRACT_ID is missing from environment.");
            }

            const address = Address.fromString(citizenAddress);
            const contract = new Contract(CONTRACT_ID);
            const operation = contract.call("get_registry", address.toScVal());

            // 🛡️ VESSEL CONSTRUCTION: Dummy account for simulation
            // Simulation doesn't check sequence numbers, but needs a valid structure.
            const dummySource = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
            
            const tx = new TransactionBuilder(dummySource, {
                fee: "100",
                networkPassphrase: PI_TESTNET_PASSPHRASE, 
            })
            .addOperation(operation)
            .setTimeout(0) // Simulation ignores timeout
            .build();

            // 🛡️ EXECUTE SIMULATION
            const response = await this.server.simulateTransaction(tx);
            
            // 🛡️ DATA EXTRACTION
            if (rpc.Api.isSimulationSuccess(response) && response.result) {
                // Convert the Soroban SCVal back to standard TypeScript objects/types
                return scValToNative(response.result.retval);
            }
            
            console.warn("[MESH-SCAN] Simulation failed or returned no data.");
            return null;

        } catch (error) {
            console.error("[MESH-SCAN] Bridge Simulation Fracture:", error);
            return null;
        }
    }
}