#![no_std]

use soroban_sdk::{contract, contracttype, contractimpl, Address, Env, Symbol};

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
    pub consumer: Address,
    pub provider: Address,
    pub arbiter: Address, // 🛡️ MESH PATCH: Added Arbiter Identity
    pub amount: i128,
    pub status: EscrowStatus,
    pub protocol_version: u32,
    pub expires_at: u64,
}

#[contract]
pub struct BazaarEscrowVaultContract;

#[contractimpl]
impl BazaarEscrowVaultContract {
    pub fn lock_funds(
        env: Env, 
        escrow_id: Symbol, 
        consumer: Address, 
        provider: Address, 
        arbiter: Address, // 🛡️ MESH PATCH: Arbiter passed at instantiation
        amount: i128,
        duration_secs: u64
    ) -> VaultEscrowRecord {
        consumer.require_auth();
        
        if env.storage().persistent().has(&escrow_id) {
            panic!("ERR_ESCROW_EXISTS");
        }
        
        let current_time = env.ledger().timestamp();
        let expires_at = current_time + duration_secs;

        let record = VaultEscrowRecord {
            consumer,
            provider,
            arbiter,
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
        env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        })
    }

    pub fn release_funds(
        env: Env,
        escrow_id: Symbol,
        consumer: Address
    ) -> VaultEscrowRecord {
        consumer.require_auth();

        let mut record: VaultEscrowRecord = env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        });

        if record.consumer != consumer {
            panic!("ERR_UNAUTHORIZED");
        }
        if record.status != EscrowStatus::Locked {
            panic!("ERR_INVALID_STATE");
        }

        record.status = EscrowStatus::Released;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
        
        record
    }

    pub fn refund_funds(
        env: Env,
        escrow_id: Symbol,
        consumer: Address
    ) -> VaultEscrowRecord {
        consumer.require_auth();

        let mut record: VaultEscrowRecord = env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        });

        if record.consumer != consumer {
            panic!("ERR_UNAUTHORIZED");
        }
        if record.status != EscrowStatus::Locked {
            panic!("ERR_INVALID_STATE");
        }

        let current_time = env.ledger().timestamp();
        if current_time < record.expires_at {
            panic!("ERR_TIMELOCK_NOT_EXPIRED");
        }

        record.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
        
        record
    }

    // 🛡️ MESH PATCH: The Arbiter Protocol
    pub fn dispute_funds(
        env: Env,
        escrow_id: Symbol,
        caller: Address
    ) -> VaultEscrowRecord {
        caller.require_auth();

        let mut record: VaultEscrowRecord = env.storage().persistent().get(&escrow_id).unwrap_or_else(|| {
            panic!("ERR_NOT_FOUND")
        });

        // Any of the three involved parties can throw the emergency brake
        if caller != record.consumer && caller != record.provider && caller != record.arbiter {
            panic!("ERR_UNAUTHORIZED");
        }

        if record.status != EscrowStatus::Locked {
            panic!("ERR_INVALID_STATE");
        }

        record.status = EscrowStatus::Disputed;
        env.storage().persistent().set(&escrow_id, &record);
        env.storage().persistent().extend_ttl(&escrow_id, 100000, 100000);
        
        record
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address, Symbol};
    use soroban_sdk::testutils::{Address as _, Ledger}; 

    #[test]
    fn test_vault_escrow_lifecycle() {
        let env = Env::default();
        env.mock_all_auths(); 
        let contract_id = env.register(BazaarEscrowVaultContract, ()); 
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let arbiter = Address::generate(&env); // 🛡️ Updated
        let escrow_id = Symbol::new(&env, "escrow_tx_9000");

        let locked_record = client.lock_funds(
            &escrow_id, 
            &consumer, 
            &provider, 
            &arbiter, // 🛡️ Updated
            &10_000_000_i128, 
            &3600_u64
        );

        assert_eq!(locked_record.status, EscrowStatus::Locked);

        let released_record = client.release_funds(&escrow_id, &consumer);
        assert_eq!(released_record.status, EscrowStatus::Released);
    }

    #[test]
    fn test_vault_refund_success() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let arbiter = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "refund_tx_sync");

        let initial_time = 1_700_000_000; 
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: initial_time,
            ..env.ledger().get()
        });

        client.lock_funds(&escrow_id, &consumer, &provider, &arbiter, &5_000_000_i128, &3600_u64);

        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: initial_time + 3601,
            ..env.ledger().get()
        });

        let refunded_record = client.refund_funds(&escrow_id, &consumer);
        assert_eq!(refunded_record.status, EscrowStatus::Refunded);
    }

    #[test]
    #[should_panic(expected = "ERR_TIMELOCK_NOT_EXPIRED")]
    fn test_vault_refund_fails_early() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let arbiter = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "refund_tx_blocked");

        let initial_time = 1_700_000_000; 
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: initial_time,
            ..env.ledger().get()
        });

        client.lock_funds(&escrow_id, &consumer, &provider, &arbiter, &1_000_000_i128, &3600_u64);

        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: initial_time + 1800, 
            ..env.ledger().get()
        });

        client.refund_funds(&escrow_id, &consumer);
    }

    #[test]
    #[should_panic(expected = "ERR_ESCROW_EXISTS")]
    fn test_vault_lock_fails_on_overwrite() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let arbiter = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "duplicate_tx");

        client.lock_funds(&escrow_id, &consumer, &provider, &arbiter, &1_000_000_i128, &3600_u64);
        client.lock_funds(&escrow_id, &consumer, &provider, &arbiter, &5_000_000_i128, &3600_u64);
    }

    // 🛡️ MESH PATCH: Proves the Arbiter can halt the Escrow
    #[test]
    fn test_vault_dispute_success() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(BazaarEscrowVaultContract, ());
        let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let arbiter = Address::generate(&env);
        let escrow_id = Symbol::new(&env, "dispute_tx");

        client.lock_funds(&escrow_id, &consumer, &provider, &arbiter, &2_000_000_i128, &3600_u64);

        let disputed_record = client.dispute_funds(&escrow_id, &arbiter);
        assert_eq!(disputed_record.status, EscrowStatus::Disputed);
    }

    // 🛡️ MESH PATCH: Proves unauthorized wallets cannot hijack the release route
#[test]
#[should_panic(expected = "ERR_UNAUTHORIZED")]
fn test_vault_release_fails_unauthorized_caller() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(BazaarEscrowVaultContract, ());
    let client = BazaarEscrowVaultContractClient::new(&env, &contract_id);

    let consumer = Address::generate(&env);
    let provider = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let attacker = Address::generate(&env); // The malicious identity
    let escrow_id = Symbol::new(&env, "hijack_tx");

    // Lock funds safely
    client.lock_funds(&escrow_id, &consumer, &provider, &arbiter, &5_000_000_i128, &3600_u64);

    // 🛡️ Attacker attempts to release funds by passing their own address
    // The contract's strict equality check will intercept and panic
    client.release_funds(&escrow_id, &attacker);
}
}