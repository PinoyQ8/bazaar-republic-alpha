#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, 
    symbol_short, Address, Env, Symbol, Map, contracttype
};

// 🛡️ STORAGE KEY CONSTANTS
const FOUNDER_KEY: Symbol = symbol_short!("FOUNDER");
const FREEZE_KEY: Symbol = symbol_short!("FREEZE");
const REGISTRY_KEY: Symbol = symbol_short!("REGISTRY");

#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultState {
    pub is_frozen: bool,
    pub freeze_expiry: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AuthError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ContractFrozen = 4,
    PioneerExists = 5,
    UnregisteredNode = 6,
    PersonalVaultFrozen = 7,
}

#[contract]
pub struct PioneerAuthContract;

#[contractimpl]
impl PioneerAuthContract {
    
    pub fn init_mesh(env: Env, founder: Address) -> Result<(), AuthError> {
        let storage = env.storage().persistent();
        if storage.has(&FOUNDER_KEY) { return Err(AuthError::AlreadyInitialized); }
        founder.require_auth();
        storage.set(&FOUNDER_KEY, &founder);
        storage.set(&FREEZE_KEY, &false);
        Ok(())
    }

    /// 🤝 GOVERNANCE: REGISTER PIONEER WITH INITIAL STATE
    pub fn register_pioneer(env: Env, pioneer: Address) -> Result<(), AuthError> {
        pioneer.require_auth();
        let mut registry: Map<Address, VaultState> = env.storage().persistent()
            .get(&REGISTRY_KEY).unwrap_or_else(|| Map::new(&env));

        if registry.contains_key(pioneer.clone()) { return Err(AuthError::PioneerExists); }

        registry.set(pioneer.clone(), VaultState { is_frozen: false, freeze_expiry: 0 });
        env.storage().persistent().set(&REGISTRY_KEY, &registry);
        Ok(())
    }

    /// 🔒 PERSONAL TEMPORAL LOCKDOWN
    pub fn freeze_personal_vault(env: Env, pioneer: Address, duration_ledgers: u32) -> Result<(), AuthError> {
        pioneer.require_auth();
        let mut registry: Map<Address, VaultState> = env.storage().persistent()
            .get(&REGISTRY_KEY).ok_or(AuthError::UnregisteredNode)?;

        let mut vault = registry.get(pioneer.clone()).ok_or(AuthError::UnregisteredNode)?;
        
        vault.is_frozen = true;
        vault.freeze_expiry = env.ledger().sequence() + duration_ledgers;
        
        registry.set(pioneer, vault);
        env.storage().persistent().set(&REGISTRY_KEY, &registry);
        Ok(())
    }

    /// 🚀 EXECUTE SYNC (Gated via Registry & Temporal Gate)
    pub fn execute_sync(env: Env, pioneer: Address) -> Result<(), AuthError> {
        // 1. Network Freeze Check
        if env.storage().persistent().get(&FREEZE_KEY).unwrap_or(false) { return Err(AuthError::ContractFrozen); }

        pioneer.require_auth();
        
        let registry: Map<Address, VaultState> = env.storage().persistent()
            .get(&REGISTRY_KEY).ok_or(AuthError::UnregisteredNode)?;
            
        let vault = registry.get(pioneer.clone()).ok_or(AuthError::UnregisteredNode)?;

        // 2. Personal Temporal Gate
        if vault.is_frozen {
            if env.ledger().sequence() < vault.freeze_expiry {
                return Err(AuthError::PersonalVaultFrozen);
            }
        }
        
        Ok(())
    }
}