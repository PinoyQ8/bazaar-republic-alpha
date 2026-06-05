// lib/stellar/networks.rs

use crate::models::Network;

/// 🛡️ Returns the specific passphrase required by the Stellar/Pi Network logic
/// to validate transaction signatures for the selected environment.
pub fn get_network_passphrase(network: &Network) -> String {
    match network {
        // Hard-coded to the official Stellar Public/Mainnet logic
        Network::Mainnet => "Public Global Stellar Network ; September 2015".to_string(),
        
        // Hard-coded to the SDF Testnet (for Alpha forge and logic testing)
        Network::Testnet => "Test SDF Network ; September 2015".to_string(),
        
        // Allows for private Pi-Node or local logic forge environments
        Network::Private(passphrase) => passphrase.clone(),
    }
}

/// 🛡️ Utility to verify if the logic is currently targeting the Testnet sector
pub fn is_testnet(network: &Network) -> bool {
    matches!(network, Network::Testnet)
}