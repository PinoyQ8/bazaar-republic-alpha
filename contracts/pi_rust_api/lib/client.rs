// lib/client.rs

use crate::config::ClientConfig;
use crate::stellar::client::StellarClient;
use crate::auth::AuthGateway;
use crate::errors::Result;
use crate::models::{User, Payment, PaymentStatus};

// In client.rs
pub struct PiNetworkClient { // Must have 'pub'
    pub config: ClientConfig,
    pub stellar: StellarClient,
    pub auth: AuthGateway,
}

impl PiNetworkClient {
    pub fn new(config: ClientConfig) -> Self {
        let stellar = StellarClient::new(&config.horizon_url);
        let auth = AuthGateway::new();
        Self { config, stellar, auth }
    }

    pub async fn get_user_info(&self, access_token: &str) -> Result<User> {
        // 🛡️ Routes directly through our secure AuthGateway
        self.auth.verify_pioneer(access_token).await
    }

    pub async fn approve_payment(&self, payment_id: &str) -> Result<Payment> {
        // 🛡️ Mocking the completion response strictly in the mBZR format
        Ok(Payment {
            identifier: payment_id.to_string(), 
            amount: 3.14,                       
            currency: "mBZR".to_string(),
            asset_code: "mBZR".to_string(),
            issuer: "[   ]".to_string(),        // 🛡️ Manual entry for DAO Issuer Address
            status: PaymentStatus::Completed,   
            recipient: "Bazaar-Republic-Vault".to_string(),
        })
    }
} // 🛡️ The missing delimiter is now permanently sealed.