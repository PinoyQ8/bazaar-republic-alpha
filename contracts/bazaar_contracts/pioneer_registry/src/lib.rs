#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

// 🛡️ DATA STRUCTURES
#[derive(Clone)]
#[contracttype]
pub enum UserStatus { Null, BootstrapLocked, ValidatorActive }

#[derive(Clone)]
#[contracttype]
pub struct UserData {
    pub status: UserStatus,
    pub staked_amount: i128,
    pub unlock_time: u64,
    pub failure_count: u32,
    pub is_whitelisted: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey { UserStatus(Address), Admin }

// 🛡️ CONTRACT DEFINITION
#[contract]
pub struct AcademyContract;

#[contractimpl]
impl AcademyContract {
    pub fn init_admin(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) { panic!("Admin exists"); }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn initiate_bootstrap(env: Env, user: Address, amount: i128) {
        user.require_auth();
        if amount < 100 { panic!("Insufficient stake"); }
        
        let key = DataKey::UserStatus(user.clone());
        let data = UserData {
            status: UserStatus::BootstrapLocked,
            staked_amount: amount,
            unlock_time: env.ledger().timestamp() + 86400,
            failure_count: 0,
            is_whitelisted: false,
        };
        env.storage().persistent().set(&key, &data);
    }

    pub fn finalize_status(env: Env, user: Address, pass_kyc: bool) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::UserStatus(user.clone());
        let mut data: UserData = env.storage().persistent().get(&key).unwrap();

        if pass_kyc {
            data.status = UserStatus::ValidatorActive;
        } else if data.is_whitelisted {
            data.status = UserStatus::Null;
        } else {
            data.failure_count += 1;
            let penalty = (data.staked_amount * match data.failure_count { 1 => 20, 2 => 50, _ => 100 }) / 100;
            data.staked_amount -= penalty;
            data.status = UserStatus::Null;
        }
        env.storage().persistent().set(&key, &data);
    }
}