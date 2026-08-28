#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotFound = 1,
    Unauthorized = 2,
    InvalidState = 3,
    TimelockActive = 4,
    InvalidAmount = 5,
    Expired = 6,
}

#[derive(Clone, PartialEq, Eq)]
#[contracttype]
pub enum EscrowStatus {
    Locked,
    Released,
    Disputed,
    Refunded,
}

#[derive(Clone)]
#[contracttype]
pub struct VaultEscrowRecord {
    pub token_contract: Address,
    pub consumer: Address,
    pub provider: Address,
    pub amount: i128,
    pub status: EscrowStatus,
    pub protocol_version: u32,
    pub expires_at: u64,
}

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");

#[contract]
pub struct BazaarEscrowVaultContract;

#[contractimpl]
impl BazaarEscrowVaultContract {
    pub fn init_admin(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic_with_error!(&env, VaultError::InvalidState);
        }
        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &admin);
    }

    pub fn lock_funds(
        env: Env,
        escrow_id: Symbol,
        token_contract: Address,
        consumer: Address,
        provider: Address,
        amount: i128,
        duration_secs: u64,
    ) -> VaultEscrowRecord {
        if amount <= 0 {
            panic_with_error!(&env, VaultError::InvalidAmount);
        }

        consumer.require_auth();

        let token_client = token::Client::new(&env, &token_contract);
        token_client.transfer(&consumer, &env.current_contract_address(), &amount);

        let current_time = env.ledger().timestamp();
        let expires_at = current_time + duration_secs;

        let record = VaultEscrowRecord {
            token_contract,
            consumer,
            provider,
            amount,
            status: EscrowStatus::Locked,
            protocol_version: 28,
            expires_at,
        };

        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);

        record
    }

    pub fn get_vault(env: Env, escrow_id: Symbol) -> VaultEscrowRecord {
        env.storage()
            .persistent()
            .get(&escrow_id)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::NotFound))
    }

    pub fn release_funds(env: Env, escrow_id: Symbol, consumer: Address) -> VaultEscrowRecord {
        consumer.require_auth();

        let mut record: VaultEscrowRecord = env
            .storage()
            .persistent()
            .get(&escrow_id)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::NotFound));

        if record.consumer != consumer {
            panic_with_error!(&env, VaultError::Unauthorized);
        }
        if record.status != EscrowStatus::Locked {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        let current_time = env.ledger().timestamp();
        if current_time > record.expires_at {
            panic_with_error!(&env, VaultError::Expired);
        }

        let token_client = token::Client::new(&env, &record.token_contract);
        token_client.transfer(&env.current_contract_address(), &record.provider, &record.amount);

        record.status = EscrowStatus::Released;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);

        record
    }

    pub fn dispute_escrow(env: Env, escrow_id: Symbol, caller: Address) -> VaultEscrowRecord {
        caller.require_auth();

        let mut record: VaultEscrowRecord = env
            .storage()
            .persistent()
            .get(&escrow_id)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::NotFound));

        if caller != record.consumer && caller != record.provider {
            panic_with_error!(&env, VaultError::Unauthorized);
        }
        if record.status != EscrowStatus::Locked {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        record.status = EscrowStatus::Disputed;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);

        record
    }

    pub fn refund_funds(env: Env, escrow_id: Symbol, initiator: Address) -> VaultEscrowRecord {
        initiator.require_auth();

        let mut record: VaultEscrowRecord = env
            .storage()
            .persistent()
            .get(&escrow_id)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::NotFound));

        if record.consumer != initiator {
            panic_with_error!(&env, VaultError::Unauthorized);
        }

        if record.status != EscrowStatus::Locked {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        let current_time = env.ledger().timestamp();
        if current_time < record.expires_at {
            panic_with_error!(&env, VaultError::TimelockActive);
        }

        let token_client = token::Client::new(&env, &record.token_contract);
        token_client.transfer(&env.current_contract_address(), &record.consumer, &record.amount);

        record.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);

        record
    }

    pub fn resolve_dispute(
        env: Env,
        escrow_id: Symbol,
        admin: Address,
        payout_to: Address,
    ) -> VaultEscrowRecord {
        admin.require_auth();

        let registered_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::Unauthorized));

        if admin != registered_admin {
            panic_with_error!(&env, VaultError::Unauthorized);
        }

        let mut record: VaultEscrowRecord = env
            .storage()
            .persistent()
            .get(&escrow_id)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::NotFound));

        if record.status != EscrowStatus::Disputed {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        if payout_to != record.consumer && payout_to != record.provider {
            panic_with_error!(&env, VaultError::Unauthorized);
        }

        let token_client = token::Client::new(&env, &record.token_contract);
        token_client.transfer(&env.current_contract_address(), &payout_to, &record.amount);

        record.status = if payout_to == record.provider {
            EscrowStatus::Released
        } else {
            EscrowStatus::Refunded
        };

        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);

        record
    }
}
