#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Heir {
    pub address: Address,
    pub percent: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Registry(Address), // Linked to the Pioneer's Wallet
}

#[contract]
pub struct BazaarRegistry;

#[contractimpl]
impl BazaarRegistry {
    /// 🛡️ SEALS THE REGISTRY: Only the Pioneer (citizen) can sign this.
    pub fn seal_registry(env: Env, citizen: Address, heirs: Vec<Heir>) {
        citizen.require_auth(); // 🛡️ Cryptographic Handshake

        let mut total_allocation: u32 = 0;

        for heir in heirs.iter() {
            total_allocation += heir.percent;
        }

        // 🛡️ MATHEMATICAL LOCK: Prevent logic fractures in distribution
        if total_allocation != 100 {
            panic!("LOGIC FRACTURE: Total allocation must equal 100%");
        }

        // 🛡️ PERMANENCE: Store the registry in the contract's persistent storage
        env.storage().persistent().set(&DataKey::Registry(citizen), &heirs);
    }

    /// 🛡️ FETCH REGISTRY: Allows the Alpha Interface to read the sealed data
    pub fn get_registry(env: Env, citizen: Address) -> Vec<Heir> {
        env.storage()
            .persistent()
            .get(&DataKey::Registry(citizen))
            .unwrap_or_else(|| Vec::new(&env)) // Return empty if not yet sealed
    }
}