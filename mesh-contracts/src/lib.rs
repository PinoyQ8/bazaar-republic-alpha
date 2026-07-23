#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, symbol_short
};

// 🗄️ THE DATA MATRIX: Define how the DAO physically stores memory
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,                  // Stores the Founder's Address
    Token,                  // Stores the Test-Pi Token Contract Address
    StakeRequirement,       // Stores the dynamic Pi required (e.g., 10 Pi)
    StakedBalance(Address), // Maps individual Pioneers to their locked amount
}

// 🛡️ MESH STORAGE CONSTANTS (Rent Lifespan Settings)
const INSTANCE_BUMP_THRESHOLD: u32 = 172_800; // ~4 days in blocks
const INSTANCE_BUMP_LIFESPAN: u32 = 518_400;   // ~12 days in blocks
const PERSISTENT_BUMP_THRESHOLD: u32 = 172_800;
const PERSISTENT_BUMP_LIFESPAN: u32 = 518_400;

#[contract]
pub struct MeshConsensus;

#[contractimpl]
impl MeshConsensus {
    
    // 🛡️ GATE 1: THE GENESIS INITIALIZATION
    pub fn initialize(env: Env, admin: Address, token: Address, required_stake: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("MESH FRACTURE: Contract is already initialized.");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::StakeRequirement, &required_stake);

        // Extend instance TTL on birth
        env.storage().instance().extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_LIFESPAN);
    }

    // 🎛️ GATE 2: FOUNDER OVERRIDE (DYNAMIC STAKE)
    pub fn update_stake(env: Env, new_amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth(); 
        
        env.storage().instance().set(&DataKey::StakeRequirement, &new_amount);
        env.storage().instance().extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_LIFESPAN);
    }

    // 💸 GATE 3: PROOF-OF-HUMAN-STAKE (LOCK)
    pub fn stake(env: Env, pioneer: Address) {
        pioneer.require_auth(); 
        
        let required_amount: i128 = env.storage().instance().get(&DataKey::StakeRequirement).unwrap();
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        
        let balance_key = DataKey::StakedBalance(pioneer.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        
        // 🛡️ Safe Mathematics Guard
        let new_balance = current_balance.checked_add(required_amount)
            .expect("MESH FRACTURE: Balance calculation overflow.");

        // 1. Physically pull the Pi from Pioneer to the DAO Vault
        let client = token::Client::new(&env, &token_id);
        client.transfer(&pioneer, &env.current_contract_address(), &required_amount);

        // 2. Etch balance into persistent storage & apply rent extension
        env.storage().persistent().set(&balance_key, &new_balance);
        env.storage().persistent().extend_ttl(&balance_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LIFESPAN);
        env.storage().instance().extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_LIFESPAN);

        // 📡 Telemetry Event Emission for Next.js / Oracle synchronization
        env.events().publish(
            (symbol_short!("staked"), pioneer), 
            required_amount
        );
    }

    // 🚪 GATE 4: 2-WAY WITHDRAWAL (UNLOCK)
    pub fn withdraw(env: Env, pioneer: Address) {
        pioneer.require_auth(); 
        
        let balance_key = DataKey::StakedBalance(pioneer.clone());
        let current_balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        
        if current_balance <= 0 {
            panic!("MESH FRACTURE: Zero stake detected. Nothing to withdraw.");
        }

        // CHECKS-EFFECTS-INTERACTIONS SHIELD: Clear memory state BEFORE transfer
        env.storage().persistent().set(&balance_key, &0i128);
        env.storage().persistent().extend_ttl(&balance_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LIFESPAN);

        // Physically push the Pi back to the Pioneer
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_id);
        client.transfer(&env.current_contract_address(), &pioneer, &current_balance);
        
        env.storage().instance().extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_LIFESPAN);

        // 📡 Telemetry Event Emission
        env.events().publish(
            (symbol_short!("withdrawn"), pioneer), 
            current_balance
        );
    }

    // 📡 TELEMETRY PING (CONTINUITY)
    pub fn verify_node(_env: Env) -> Symbol {
        symbol_short!("SYNCED")
    }
    
    // 🔍 VIEWPORT BRIDGE
    pub fn get_stake(env: Env, pioneer: Address) -> i128 {
        let balance_key = DataKey::StakedBalance(pioneer);
        env.storage().persistent().get(&balance_key).unwrap_or(0)
    }
}