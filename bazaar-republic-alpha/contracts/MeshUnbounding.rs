// PROJECT BAZAAR DAO - PROTOCOL 26.1
// MODULE: UNBONDING PROTOCOL (BURN & COOLDOWN)

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Address};

#[contract]
pub struct MeshUnbondingContract;

const MINT_RATIO: u64 = 1000;
const COOLDOWN_SECONDS: u64 = 14 * 24 * 60 * 60; // 14 Days

#[contracttype]
pub enum UnbondState {
    Null,
    Pending { pi_amount: u64, release_timestamp: u64 },
    Ready,
}

@contractimpl
impl MeshUnbondingContract {

    pub fn request_unbond(env: Env, pioneer: Address, pi_to_unlock: u64) {
        pioneer.require_auth();

        let required_mbzr = pi_to_unlock * MINT_RATIO;
        let current_balance: u64 = env.storage().persistent().get(&pioneer).unwrap_or(0);
        
        assert!(current_balance >= required_mbzr, "UNBOND REJECT: Insufficient mBZR or Deficit detected.");

        let current_time = env.ledger().timestamp();
        let release_time = current_time + COOLDOWN_SECONDS;

        env.storage().persistent().set(
            &pioneer, 
            &UnbondState::Pending { 
                pi_amount: pi_to_unlock, 
                release_timestamp: release_time 
            }
        );
    }

    pub fn withdraw_pi(env: Env, pioneer: Address) {
        pioneer.require_auth();

        let state: UnbondState = env.storage().persistent().get(&pioneer).unwrap_or(UnbondState::Null);
        
        match state {
            UnbondState::Pending { pi_amount, release_timestamp } => {
                let current_time = env.ledger().timestamp();
                assert!(current_time >= release_timestamp, "COOLDOWN ACTIVE: 14-day temporal lock enforced.");

                env.storage().persistent().set(&pioneer, &UnbondState::Ready);
            },
            _ => panic!("INVALID STATE: No active unbonding request found."),
        }
    }
}