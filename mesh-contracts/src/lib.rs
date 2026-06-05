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

#[contract]
pub struct MeshConsensus;

#[contractimpl]
impl MeshConsensus {
    
    // 🛡️ GATE 1: THE GENESIS INITIALIZATION
    // Run exactly once to lock the Founder identity and parameters into the vault.
    pub fn initialize(env: Env, admin: Address, token: Address, required_stake: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("MESH FRACTURE: Contract is already initialized.");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::StakeRequirement, &required_stake);
    }

    // 🎛️ GATE 2: FOUNDER OVERRIDE (DYNAMIC STAKE)
    // Allows you to change the 10 Pi requirement without rewriting the contract.
    pub fn update_stake(env: Env, new_amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth(); // Absolute law: Only the Founder can execute this.
        env.storage().instance().set(&DataKey::StakeRequirement, &new_amount);
    }

    // 💸 GATE 3: PROOF-OF-HUMAN-STAKE (LOCK)
    // The physical mechanism to pull Pi into the DAO vault.
    pub fn stake(env: Env, pioneer: Address) {
        pioneer.require_auth(); // Cryptographic signature required.
        
        let required_amount: i128 = env.storage().instance().get(&DataKey::StakeRequirement).unwrap();
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let mut current_balance: i128 = env.storage().persistent().get(&DataKey::StakedBalance(pioneer.clone())).unwrap_or(0);
        
        // 1. Physically pull the Pi from Pioneer to the DAO Vault
        let client = token::Client::new(&env, &token_id);
        client.transfer(&pioneer, &env.current_contract_address(), &required_amount);

        // 2. Etch the updated balance into the MESH persistent storage
        current_balance += required_amount;
        env.storage().persistent().set(&DataKey::StakedBalance(pioneer.clone()), &current_balance);
    }

    // 🚪 GATE 4: 2-WAY WITHDRAWAL (UNLOCK)
    // Allows Pioneers to reclaim their exact stake and disconnect.
    pub fn withdraw(env: Env, pioneer: Address) {
        pioneer.require_auth(); // Cryptographic signature required.
        
        let current_balance: i128 = env.storage().persistent().get(&DataKey::StakedBalance(pioneer.clone())).unwrap_or(0);
        if current_balance <= 0 {
            panic!("MESH FRACTURE: Zero stake detected. Nothing to withdraw.");
        }

        // CHECKS-EFFECTS-INTERACTIONS SHIELD:
        // Wipe the ledger memory to zero BEFORE sending the funds to kill re-entrancy attacks.
        env.storage().persistent().set(&DataKey::StakedBalance(pioneer.clone()), &0i128);

        // Physically push the Pi back to the Pioneer
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_id);
        client.transfer(&env.current_contract_address(), &pioneer, &current_balance);
    }

    // 📡 TELEMETRY PING (CONTINUITY)
    pub fn verify_node(_env: Env) -> Symbol {
        symbol_short!("SYNCED")
    }
    
    // 🔍 VIEWPORT BRIDGE: Allows the Next.js UI to read a Pioneer's exact locked balance
    pub fn get_stake(env: Env, pioneer: Address) -> i128 {
        env.storage().persistent().get(&DataKey::StakedBalance(pioneer)).unwrap_or(0)
    }
}