// PROJECT BAZAAR DAO - PROTOCOL 26.1
// MODULE: MESH VAULT (MINTING & COLLATERAL PEG)

#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, symbol_short};

#[contract]
pub struct MeshVaultContract;

const MINT_RATIO: u64 = 1000;
const MAX_PI_CAP: u64 = 1000;
const MAX_SUPPLY: u64 = 1_000_000_000;

@contractimpl
impl MeshVaultContract {
    
    // 1. Initialize Zero-Premine Genesis State
    pub fn initialize_genesis(env: Env) {
        let total_supply: u64 = env.storage().instance().get(&symbol_short!("supply")).unwrap_or(0);
        assert!(total_supply == 0, "SYSTEM PANIC: Premine detected. Genesis aborted.");
        env.storage().instance().set(&symbol_short!("supply"), &0u64);
    }

    // 2. Lock Native Pi & Mint mBZR
    pub fn lock_and_mint(env: Env, pioneer: Address, pi_amount: u64) {
        pioneer.require_auth();

        // Anti-Whale Protocol Check
        let current_locked: u64 = env.storage().persistent().get(&pioneer).unwrap_or(0);
        let new_locked = current_locked + pi_amount;
        assert!(new_locked <= MAX_PI_CAP, "MESH REJECT: 1000 Pi Max Cap Exceeded.");

        // 1:1000 Peg Calculation
        let mbzr_to_mint = pi_amount * MINT_RATIO;
        let current_supply: u64 = env.storage().instance().get(&symbol_short!("supply")).unwrap();
        
        // Capacity Ceiling Check
        assert!(current_supply + mbzr_to_mint <= MAX_SUPPLY, "MESH REJECT: Total Supply Ceiling Hit.");

        // State Execution
        env.storage().persistent().set(&pioneer, &new_locked);
        env.storage().instance().set(&symbol_short!("supply"), &(current_supply + mbzr_to_mint));
    }
}