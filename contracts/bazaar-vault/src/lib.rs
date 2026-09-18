#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error,
    symbol_short, token, Address, Env, Symbol,
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
    AlreadyExists = 7,
}

#[derive(Clone, PartialEq, Eq, Debug)]
#[contracttype]
pub enum EscrowStatus {
    Locked,
    Released,
    Disputed,
    Refunded,
}

#[derive(Clone, Debug)]
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
            panic_with_error!(&env, VaultError::AlreadyExists);
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

        if env.storage().persistent().has(&escrow_id) {
            panic_with_error!(&env, VaultError::AlreadyExists);
        }

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

        let token_client = token::Client::new(&env, &record.token_contract);
        token_client.transfer(&env.current_contract_address(), &record.provider, &record.amount);

        record.status = EscrowStatus::Released;
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

    pub fn get_vault(env: Env, escrow_id: Symbol) -> VaultEscrowRecord {
        env.storage()
            .persistent()
            .get(&escrow_id)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::NotFound))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

    // Lightweight mock SEP-41 token to guarantee zero SDK trait drift
    #[contract]
    pub struct MockTokenContract;

    #[contractimpl]
    impl MockTokenContract {
        pub fn mint(env: Env, to: Address, amount: i128) {
            let balance = Self::balance(env.clone(), to.clone());
            env.storage().persistent().set(&to, &(balance + amount));
        }

        pub fn balance(env: Env, id: Address) -> i128 {
            env.storage().persistent().get(&id).unwrap_or(0)
        }

        pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
            from.require_auth();
            let from_bal = Self::balance(env.clone(), from.clone());
            assert!(from_bal >= amount, "insufficient funds");
            env.storage().persistent().set(&from, &(from_bal - amount));
            let to_bal = Self::balance(env.clone(), to.clone());
            env.storage().persistent().set(&to, &(to_bal + amount));
        }
    }

    #[test]
    fn test_full_lifecycle_release() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let token_id = env.register(MockTokenContract, ());
        let token_client = MockTokenContractClient::new(&env, &token_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "ESC_TEST_1");

        token_client.mint(&consumer, &100_000_000);

        // 1. Lock funds
        let record = client.lock_funds(
            &escrow_id,
            &token_id,
            &consumer,
            &provider,
            &50_000_000,
            &3600,
        );
        assert_eq!(record.status, EscrowStatus::Locked);
        assert_eq!(token_client.balance(&contract_id), 50_000_000);

        // 2. Release funds
        let released = client.release_funds(&escrow_id, &consumer);
        assert_eq!(released.status, EscrowStatus::Released);
        assert_eq!(token_client.balance(&provider), 50_000_000);
        assert_eq!(token_client.balance(&contract_id), 0);
    }

    #[test]
    fn test_dispute_and_admin_resolution() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init_admin(&admin);

        let token_id = env.register(MockTokenContract, ());
        let token_client = MockTokenContractClient::new(&env, &token_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "ESC_DISP_1");

        token_client.mint(&consumer, &100_000_000);

        client.lock_funds(&escrow_id, &token_id, &consumer, &provider, &40_000_000, &7200);

        // Escalate to dispute
        let disputed = client.dispute_escrow(&escrow_id, &consumer);
        assert_eq!(disputed.status, EscrowStatus::Disputed);

        // Resolve dispute in favor of consumer (refund)
        let resolved = client.resolve_dispute(&escrow_id, &admin, &consumer);
        assert_eq!(resolved.status, EscrowStatus::Refunded);
        assert_eq!(token_client.balance(&consumer), 100_000_000);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #4)")]
    fn test_refund_fails_before_timelock_expires() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let token_id = env.register(MockTokenContract, ());
        let token_client = MockTokenContractClient::new(&env, &token_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "ESC_REF_1");

        token_client.mint(&consumer, &50_000_000);
        client.lock_funds(&escrow_id, &token_id, &consumer, &provider, &20_000_000, &1000);

        // Attempt refund before duration passes (panics with TimelockActive #4)
        client.refund_funds(&escrow_id, &consumer);
    }
}
