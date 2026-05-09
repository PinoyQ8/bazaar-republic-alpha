use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Network {
    Mainnet,
    Testnet,
    Private(String),
}

impl Default for Network {
    fn default() -> Self {
        Self::Testnet
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub uid: String,
    pub username: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentStatus {
    pub developer_approved: bool,
    pub transaction_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub payment_id: String,
    pub status: PaymentStatus,
    pub amount: f64,
}