#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

#[contract]
pub struct BazaarVendingMachine;

#[contracttype]
pub enum DataKey {
    Admin,
    PiToken,
    MbzrToken,
}

// ⚙️ HARCODED MACRO-CONSTANTS
const MBZR_MULTIPLIER: i128 = 1000;
// Assuming 7 decimal places for Mainnet (1 Pi = 10,000,000 stroops)
const FLAT_FEE_PI_STROOPS: i128 = 100_000; // 0.01 Pi

#[contractimpl]
impl BazaarVendingMachine {
    
    /// Initializes the DAO Vending Machine with core asset addresses
    pub fn init(env: Env, admin: Address, pi_token: Address, mbzr_token: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PiToken, &pi_token);
        env.storage().instance().set(&DataKey::MbzrToken, &mbzr_token);
    }

    /// [FORWARD BRIDGE] Swap Pi for mBZR
    pub fn mint_mbzr(env: Env, user: Address, pi_amount_stroops: i128) {
        user.require_auth();
        
        let pi_token: Address = env.storage().instance().get(&DataKey::PiToken).unwrap();
        let mbzr_token: Address = env.storage().instance().get(&DataKey::MbzrToken).unwrap();
        
        let pi_client = token::Client::new(&env, &pi_token);
        let mbzr_client = token::Client::new(&env, &mbzr_token);
        
        let total_pi_required = pi_amount_stroops + FLAT_FEE_PI_STROOPS;
        let mbzr_output = pi_amount_stroops * MBZR_MULTIPLIER;
        
        // 1. Pull Pi (Principal + Fee)
        pi_client.transfer(&user, &env.current_contract_address(), &total_pi_required);
        // 2. Push high-velocity mBZR
        mbzr_client.transfer(&env.current_contract_address(), &user, &mbzr_output);
    }

    /// [REVERSE BRIDGE] Burn mBZR to Reclaim Pi
    pub fn burn_mbzr(env: Env, user: Address, mbzr_amount_stroops: i128) {
        user.require_auth();
        
        let pi_token: Address = env.storage().instance().get(&DataKey::PiToken).unwrap();
        let mbzr_token: Address = env.storage().instance().get(&DataKey::MbzrToken).unwrap();
        
        let pi_client = token::Client::new(&env, &pi_token);
        let mbzr_client = token::Client::new(&env, &mbzr_token);
        
        let base_pi_output = mbzr_amount_stroops / MBZR_MULTIPLIER;
        
        if base_pi_output <= FLAT_FEE_PI_STROOPS {
            panic!("[MESH-SCAN] Amount too low to cover the 0.01 Pi network fee.");
        }
        
        let net_pi_returned = base_pi_output - FLAT_FEE_PI_STROOPS;
        
        // 1. Pull mBZR into Burn Sink
        mbzr_client.transfer(&user, &env.current_contract_address(), &mbzr_amount_stroops);
        // 2. Release net Pi
        pi_client.transfer(&env.current_contract_address(), &user, &net_pi_returned);
    }
}