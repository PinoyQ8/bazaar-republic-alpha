#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contract]
pub struct BazaarGenesisLedger;

#[contracttype]
pub enum DataKey {
    Admin,
    Initialized,
}

#[contractimpl]
impl BazaarGenesisLedger {
    pub fn initialize(env: Env, admin: Address) {
        assert!(
            !env.storage().instance().has(&DataKey::Initialized),
            "MESH LOCKDOWN: The Genesis Ledger is already sealed."
        );
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }
}