#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    token, Address, Env, Symbol, Vec,
};

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum UnbondingError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    InvalidCooldown = 4,
    NoMaturedRequests = 5,
    RequestNotFound = 6,
    Unauthorized = 7,
    ZeroAddress = 8,
}

// -----------------------------------------------------------------------------
// Data Structures & Storage Keys
// -----------------------------------------------------------------------------
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnbondingRequest {
    pub id: u64,
    pub amount: i128,
    pub requested_at: u64,
    pub unlock_timestamp: u64,
    pub claimed: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TokenAddress,
    VaultContract,
    NextRequestId,
    TotalUnbonding,
    UserQueue(Address),
}

const DAY_IN_LEDGERS: u32 = 17280; // ~5 seconds per ledger
const INSTANCE_BUMP_LEDGERS: u32 = 30 * DAY_IN_LEDGERS;
const PERSISTENT_BUMP_LEDGERS: u32 = 120 * DAY_IN_LEDGERS;

// Minimum 1 day (86,400s), Maximum 90 days (7,776,000s)
const MIN_COOLDOWN_SEC: u64 = 86_400;
const MAX_COOLDOWN_SEC: u64 = 7_776_000;

// -----------------------------------------------------------------------------
// Contract Implementation
// -----------------------------------------------------------------------------
#[contract]
pub struct MeshUnboundingContract;

#[contractimpl]
impl MeshUnboundingContract {
    /// Read-only connectivity check
    pub fn ping(_env: Env) -> Symbol {
        symbol_short!("PONG")
    }

    /// Initialize the unbonding manager with Admin, Token Asset, and Vault addresses
    pub fn initialize(
        env: Env,
        admin: Address,
        token_address: Address,
        vault_contract: Address,
    ) -> Result<(), UnbondingError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(UnbondingError::AlreadyInitialized);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);
        env.storage().instance().set(&DataKey::VaultContract, &vault_contract);
        env.storage().instance().set(&DataKey::NextRequestId, &1u64);
        env.storage().instance().set(&DataKey::TotalUnbonding, &0i128);

        env.storage().instance().extend_ttl(INSTANCE_BUMP_LEDGERS, INSTANCE_BUMP_LEDGERS);

        Ok(())
    }

    /// Queue tokens for unbonding with a designated cooldown period (seconds)
    pub fn start_unbonding(
        env: Env,
        from: Address,
        amount: i128,
        cooldown_sec: u64,
    ) -> Result<UnbondingRequest, UnbondingError> {
        from.require_auth();

        if amount <= 0 {
            return Err(UnbondingError::InvalidAmount);
        }

        if cooldown_sec < MIN_COOLDOWN_SEC || cooldown_sec > MAX_COOLDOWN_SEC {
            return Err(UnbondingError::InvalidCooldown);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(UnbondingError::NotInitialized)?;

        // Transfer tokens from user/vault into unbonding custody
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&from, &env.current_contract_address(), &amount);

        let current_time = env.ledger().timestamp();
        let unlock_timestamp = current_time.checked_add(cooldown_sec).unwrap();

        let mut req_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextRequestId)
            .unwrap_or(1);

        let new_request = UnbondingRequest {
            id: req_id,
            amount,
            requested_at: current_time,
            unlock_timestamp,
            claimed: false,
        };

        // Increment Request ID
        req_id = req_id.checked_add(1).unwrap();
        env.storage().instance().set(&DataKey::NextRequestId, &req_id);

        // Append to User Unbonding Queue
        let user_key = DataKey::UserQueue(from.clone());
        let mut queue: Vec<UnbondingRequest> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or_else(|| Vec::new(&env));

        queue.push_back(new_request.clone());

        // Update Total In Unbonding
        let mut total_unbonding: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalUnbonding)
            .unwrap_or(0);
        total_unbonding = total_unbonding.checked_add(amount).unwrap();
        env.storage().instance().set(&DataKey::TotalUnbonding, &total_unbonding);

        // Store state & extend TTL
        env.storage().persistent().set(&user_key, &queue);
        env.storage().persistent().extend_ttl(&user_key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
        env.storage().instance().extend_ttl(INSTANCE_BUMP_LEDGERS, INSTANCE_BUMP_LEDGERS);

        Ok(new_request)
    }

    /// Claim all matured/eligible requests in the user's queue in a single transaction
    pub fn claim_matured(env: Env, to: Address) -> Result<i128, UnbondingError> {
        to.require_auth();

        let user_key = DataKey::UserQueue(to.clone());
        let queue: Vec<UnbondingRequest> = env
            .storage()
            .persistent()
            .get(&user_key)
            .ok_or(UnbondingError::NoMaturedRequests)?;

        let current_time = env.ledger().timestamp();
        let mut total_claimable: i128 = 0;
        let mut updated_queue: Vec<UnbondingRequest> = Vec::new(&env);

        for item in queue.iter() {
            if !item.claimed && current_time >= item.unlock_timestamp {
                total_claimable = total_claimable.checked_add(item.amount).unwrap();
                let mut claimed_item = item.clone();
                claimed_item.claimed = true;
                updated_queue.push_back(claimed_item);
            } else {
                updated_queue.push_back(item);
            }
        }

        if total_claimable <= 0 {
            return Err(UnbondingError::NoMaturedRequests);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(UnbondingError::NotInitialized)?;

        // Transfer matured tokens back to user
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &to, &total_claimable);

        // Deduct from Total Unbonding
        let mut total_unbonding: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalUnbonding)
            .unwrap_or(0);
        total_unbonding = total_unbonding.checked_sub(total_claimable).unwrap();
        env.storage().instance().set(&DataKey::TotalUnbonding, &total_unbonding);

        // Update persistent queue
        env.storage().persistent().set(&user_key, &updated_queue);
        env.storage().persistent().extend_ttl(&user_key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
        env.storage().instance().extend_ttl(INSTANCE_BUMP_LEDGERS, INSTANCE_BUMP_LEDGERS);

        Ok(total_claimable)
    }

    /// Read-only: Get all requests for a user
    pub fn get_user_queue(env: Env, user: Address) -> Vec<UnbondingRequest> {
        let user_key = DataKey::UserQueue(user);
        env.storage()
            .persistent()
            .get(&user_key)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Read-only: Get sum of matured tokens ready to claim right now
    pub fn get_matured_amount(env: Env, user: Address) -> i128 {
        let user_key = DataKey::UserQueue(user);
        let queue: Vec<UnbondingRequest> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or_else(|| Vec::new(&env));

        let current_time = env.ledger().timestamp();
        let mut claimable: i128 = 0;

        for item in queue.iter() {
            if !item.claimed && current_time >= item.unlock_timestamp {
                claimable = claimable.checked_add(item.amount).unwrap();
            }
        }
        claimable
    }

    /// Read-only: Total tokens currently in unbonding state
    pub fn get_total_unbonding(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalUnbonding).unwrap_or(0)
    }
}