// lib\config.rs

#[derive(Debug, Clone)] // 🛡️ Ensure 'Clone' is included here
pub struct ClientConfig {
    pub api_key: String,
    pub horizon_url: String,
    pub network_passphrase: String,
}

impl ClientConfig {
    // 🛡️ Added for Test Alignment: Replaces the missing 'builder'
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            horizon_url: "https://horizon-testnet.stellar.org".to_string(),
            network_passphrase: "Test SDF Network ; September 2015".to_string(),
        }
    }

    pub fn from_env() -> crate::errors::Result<Self> {
        Ok(Self::new(std::env::var("PI_API_KEY").unwrap_or_default()))
    }
}