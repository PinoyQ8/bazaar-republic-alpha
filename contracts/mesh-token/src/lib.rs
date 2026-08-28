#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

#[contract]
pub struct MeshTokenContract;

#[contractimpl]
impl MeshTokenContract {
    pub fn ping(_env: Env) -> Symbol {
        symbol_short!("PONG")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_ping() {
        let env = Env::default();
        let contract_id = env.register(MeshTokenContract, ());
        let client = MeshTokenContractClient::new(&env, &contract_id);
        assert_eq!(client.ping(), symbol_short!("PONG"));
    }
}
