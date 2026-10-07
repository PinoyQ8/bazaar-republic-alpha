#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, BytesN, Env, Address, Symbol};

#[contracttype]
pub enum DataKey {
    Admin,
    CurrentWasmHash,
}

const UPGRADED_TOPIC: Symbol = symbol_short!("UPGRADE");

#[contract]
pub struct BazaarBeacon;

#[contractimpl]
impl BazaarBeacon {
    pub fn initialize(env: Env, admin: Address, initial_hash: BytesN<32>) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::CurrentWasmHash, &initial_hash);
    }

    pub fn get_wasm_hash(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::CurrentWasmHash)
            .expect("Beacon uninitialized")
    }

    pub fn set_wasm_hash(env: Env, new_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Beacon uninitialized");
        admin.require_auth();

        env.storage().instance().set(&DataKey::CurrentWasmHash, &new_hash);
        env.events().publish((UPGRADED_TOPIC,), new_hash);
    }
}
