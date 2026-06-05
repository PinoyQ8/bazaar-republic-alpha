// lib/auth.rs

use crate::models::User;
use crate::errors::Result; // 🛡️ Fixes E0282: Imports our custom 1-parameter Result
use reqwest::{Client, header};

/// 🛡️ The AuthGateway handles secure token verification with the Pi Network Mainnet.
#[derive(Debug, Clone)]
pub struct AuthGateway {
    http_client: Client,
    pi_api_url: String,
}

impl Default for AuthGateway {
    fn default() -> Self {
        Self::new()
    }
}

impl AuthGateway {
    /// Initializes the identity gateway with the official Pi Network endpoint
    pub fn new() -> Self {
        Self {
            http_client: Client::new(),
            pi_api_url: "https://api.minepi.com/v2/me".to_string(),
        }
    }

    /// 🛡️ Validates the Pioneer's JWT against the official Pi API.
    pub async fn verify_pioneer(&self, access_token: &str) -> Result<User> {
        let res = self.http_client
            .get(&self.pi_api_url)
            .header(header::AUTHORIZATION, format!("Bearer {}", access_token))
            .send()
            .await?; // 🛡️ Fixes E0599: The '?' automatically maps to PiError::NetworkError

        if res.status().is_success() {
            let json: serde_json::Value = res.json().await?; // 🛡️ '?' automatically maps to PiError::ParseError
            
            // Extract the exact fields from Pi's /v2/me endpoint
            let uid = json["uid"].as_str().unwrap_or_default().to_string();
            let username = json["username"].as_str().unwrap_or_default().to_string();

            // Security Adjudicator Check: Ensure UID is not blank (Token Tampering)
            if uid.is_empty() {
                return Err(crate::errors::PiError::AuthError(
                    "CRITICAL: Pi API returned empty UID. Possible token tampering.".to_string()
                ));
            }

            Ok(User { uid, username })
        } else {
            Err(crate::errors::PiError::AuthError(
                format!("Pi API rejected the token. Network Status: {}", res.status())
            ))
        }
    }
}