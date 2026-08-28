#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    token, Address, Env, Symbol,
};

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    InvalidLockDuration = 4,
    VaultStillLocked = 5,
    InsufficientVaultBalance = 6,
    Unauthorized = 7,
    ZeroAddress = 8,
}

// -----------------------------------------------------------------------------
// Data Structures & Storage Keys
// -----------------------------------------------------------------------------
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultRecord {
    pub principal: i128,
    pub deposited_at: u64,
    pub unlock_timestamp: u64,
    pub lock_duration_sec: u64,
    pub claimed: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TokenAddress,
    TotalLocked,
    UserVault(Address),
}

const DAY_IN_LEDGERS: u32 = 17280; // ~5 seconds per ledger
const INSTANCE_BUMP_LEDGERS: u32 = 30 * DAY_IN_LEDGERS;
const PERSISTENT_BUMP_LEDGERS: u32 = 120 * DAY_IN_LEDGERS;

// -----------------------------------------------------------------------------
// Contract Implementation
// -----------------------------------------------------------------------------
#[contract]
pub struct MeshVaultsContract;

#[contractimpl]
impl MeshVaultsContract {
    /// Read-only connectivity check
    pub fn ping(_env: Env) -> Symbol {
    symbol_short!("PONG")
}

    /// Initialize the Vault contract with an admin and token asset address
    pub fn initialize(env: Env, admin: Address, token_address: Address) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VaultError::AlreadyInitialized);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);
        env.storage().instance().set(&DataKey::TotalLocked, &0i128);

        env.storage().instance().extend_ttl(INSTANCE_BUMP_LEDGERS, INSTANCE_BUMP_LEDGERS);

        Ok(())
    }

    /// Lock tokens into a user-isolated vault for a given duration (seconds)
    pub fn deposit(
        env: Env,
        from: Address,
        amount: i128,
        lock_duration_sec: u64,
    ) -> Result<VaultRecord, VaultError> {
        from.require_auth();

        if amount <= 0 {
            return Err(VaultError::InvalidAmount);
        }

        // Minimum 1 day (86,400s), Maximum 4 years (126,144,000s)
        if lock_duration_sec < 86_400 || lock_duration_sec > 126_144_000 {
            return Err(VaultError::InvalidLockDuration);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(VaultError::NotInitialized)?;

        let current_time = env.ledger().timestamp();
        let unlock_timestamp = current_time.checked_add(lock_duration_sec).unwrap();

        let user_key = DataKey::UserVault(from.clone());
        let user_vault = match env.storage().persistent().get::<DataKey, VaultRecord>(&user_key) {
            Some(mut existing) => {
                if existing.claimed {
                    VaultRecord {
                        principal: amount,
                        deposited_at: current_time,
                        unlock_timestamp,
                        lock_duration_sec,
                        claimed: false,
                    }
                } else {
                    existing.principal = existing.principal.checked_add(amount).unwrap();
                    if unlock_timestamp > existing.unlock_timestamp {
                        existing.unlock_timestamp = unlock_timestamp;
                        existing.lock_duration_sec = lock_duration_sec;
                    }
                    existing
                }
            }
            None => VaultRecord {
                principal: amount,
                deposited_at: current_time,
                unlock_timestamp,
                lock_duration_sec,
                claimed: false,
            },
        };

        // Transfer tokens from user to contract vault
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&from, &env.current_contract_address(), &amount);

        // Update Total Locked
        let mut total_locked: i128 = env.storage().instance().get(&DataKey::TotalLocked).unwrap_or(0);
        total_locked = total_locked.checked_add(amount).unwrap();
        env.storage().instance().set(&DataKey::TotalLocked, &total_locked);

        // Commit state and bump TTL
        env.storage().persistent().set(&user_key, &user_vault);
        env.storage().persistent().extend_ttl(&user_key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
        env.storage().instance().extend_ttl(INSTANCE_BUMP_LEDGERS, INSTANCE_BUMP_LEDGERS);

        Ok(user_vault)
    }

    /// Withdraw unlocked principal back to the user address
    pub fn withdraw(env: Env, to: Address) -> Result<i128, VaultError> {
        to.require_auth();

        let user_key = DataKey::UserVault(to.clone());
        let mut vault = env
            .storage()
            .persistent()
            .get::<DataKey, VaultRecord>(&user_key)
            .ok_or(VaultError::InsufficientVaultBalance)?;

        if vault.claimed || vault.principal <= 0 {
            return Err(VaultError::InsufficientVaultBalance);
        }

        let current_time = env.ledger().timestamp();
        if current_time < vault.unlock_timestamp {
            return Err(VaultError::VaultStillLocked);
        }

        let withdraw_amount = vault.principal;
        vault.principal = 0;
        vault.claimed = true;

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(VaultError::NotInitialized)?;

        // Transfer tokens back to user
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &to, &withdraw_amount);

        // Deduct from Total Locked
        let mut total_locked: i128 = env.storage().instance().get(&DataKey::TotalLocked).unwrap_or(0);
        total_locked = total_locked.checked_sub(withdraw_amount).unwrap();
        env.storage().instance().set(&DataKey::TotalLocked, &total_locked);

        // Update persistent state
        env.storage().persistent().set(&user_key, &vault);
        env.storage().persistent().extend_ttl(&user_key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
        env.storage().instance().extend_ttl(INSTANCE_BUMP_LEDGERS, INSTANCE_BUMP_LEDGERS);

        Ok(withdraw_amount)
    }

    /// Read-only: Get user vault record
    pub fn get_vault(env: Env, user: Address) -> Option<VaultRecord> {
        let user_key = DataKey::UserVault(user);
        env.storage().persistent().get(&user_key)
    }

    /// Read-only: Total locked in contract
    pub fn get_total_locked(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalLocked).unwrap_or(0)
    }

    /// Read-only: Token asset address
    pub fn get_token_address(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::TokenAddress)
    }
}