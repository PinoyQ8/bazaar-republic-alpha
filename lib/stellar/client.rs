// lib/stellar/client.rs

use reqwest::Client;
use crate::errors::Result; // 🛡️ Import our custom Result

#[derive(Debug, Clone)]
pub struct StellarClient {
    pub horizon_url: String,
    http_client: Client,
}

impl StellarClient {
    pub fn new(horizon_url: &str) -> Self {
        Self {
            horizon_url: horizon_url.to_string(),
            http_client: Client::new(),
        }
    }

    /// 🛡️ Validates an account against the Stellar Horizon node
    pub async fn check_account(&self, account_id: &str) -> Result<serde_json::Value> {
        let url = format!("{}/accounts/{}", self.horizon_url, account_id);
        
        // 🛡️ Fix for E0599 (Line 26): Removed .map_err(PiError::Http). 
        // The '?' automatically maps reqwest::Error to PiError::NetworkError
        let response = self.http_client
            .get(&url)
            .send()
            .await?;

        // 🛡️ Fix for E0282 & E0599 (Line 29-32): Explicitly declare the type as serde_json::Value 
        // to help the compiler, and use '?' to auto-map the parsing error.
        let account_data: serde_json::Value = response
            .json()
            .await?;

        Ok(account_data)
    }
}