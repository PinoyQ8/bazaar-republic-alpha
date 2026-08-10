#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Tier(Address),
}

#[contract]
pub struct BazaarGenesisContract;

#[contractimpl]
impl BazaarGenesisContract {
    /// Initializes the contract with the deployer as the immutable Admin (Tier 5)
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("MESH LOCKDOWN: Already initialized.");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        
        // Automatically grant Tier 5 (Founder/Admin) to the deployer
        env.storage().persistent().set(&DataKey::Tier(admin.clone()), &5u32);
    }

    /// Assigns a governance tier (1 to 5) to a pioneer address (Admin only)
    pub fn set_tier(env: Env, pioneer: Address, tier_level: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if tier_level < 1 || tier_level > 5 {
            panic!("ERROR: Invalid tier level. Must be between 1 and 5.");
        }

        env.storage().persistent().set(&DataKey::Tier(pioneer), &tier_level);
    }

    /// Queries the governance tier of any given address
    pub fn get_tier(env: Env, pioneer: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Tier(pioneer))
            .unwrap_or(0u32) // Default to Tier 0 (Unregistered)
    }
}