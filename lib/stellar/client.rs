use reqwest::Client;
use crate::errors::PiError;

pub struct StellarClient {
    pub http_client: Client,
    pub horizon_url: String,
}

impl StellarClient {
    pub fn new(horizon_url: &str) -> Self {
        Self {
            http_client: Client::new(),
            horizon_url: horizon_url.to_string(),
        }
    }

    pub async fn get_account_balance(&self, account_id: &str) -> crate::errors::Result<String> {
        let url = format!("{}/accounts/{}", self.horizon_url, account_id);

        // 🛡️ Explicit type annotation for the response clears E0282
        let response = self.http_client
            .get(&url)
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(PiError::Http)?;

        // 🛡️ Turbofish operator ::<serde_json::Value> anchors the JSON type
        let account_data = response
            .json::<serde_json::Value>()
            .await
            .map_err(PiError::Http)?;

        let balance = account_data["balances"][0]["balance"]
            .as_str()
            .unwrap_or("0.0")
            .to_string();

        Ok(balance)
    }
}