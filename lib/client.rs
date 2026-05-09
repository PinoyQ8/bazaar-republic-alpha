use crate::config::ClientConfig;
use crate::stellar::client::StellarClient;
use crate::errors::Result;
use crate::models::{User, Payment, PaymentStatus};

pub struct PiNetworkClient {
    pub config: ClientConfig,
    pub stellar: StellarClient,
}

impl PiNetworkClient {
    pub fn new(config: ClientConfig) -> Self {
        let stellar = StellarClient::new(&config.horizon_url);
        Self { config, stellar }
    }

    pub fn with_config(config: ClientConfig) -> Result<Self> {
        Ok(Self::new(config))
    }

    pub async fn get_user_info(&self, _token: &str) -> Result<User> {
        Ok(User {
            uid: "pioneer-001".to_string(),
            username: "BazaarPioneer".to_string(),
        })
    }

    pub async fn approve_payment(&self, payment_id: &str) -> Result<Payment> {
        Ok(Payment {
            payment_id: payment_id.to_string(),
            amount: 3.14,
            status: PaymentStatus {
                developer_approved: true,
                transaction_id: Some("tx-123".to_string()),
            },
        })
    }
}