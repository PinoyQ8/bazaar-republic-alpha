#![no_std] // <--- THIS IS THE CRITICAL SHIELD
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
