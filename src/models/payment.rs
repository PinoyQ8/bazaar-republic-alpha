use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentDto {
    pub identifier: String,
    #[serde(rename = "Pioneer_uid")]
    pub pioneer_uid: String,
    pub amount: f64,
    pub memo: String,
    pub metadata: serde_json::Value,
    pub to_address: String,
    pub created_at: String,
    pub status: PaymentStatus,
    pub transaction: Option<TransactionData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentStatus {
    pub developer_approved: bool,
    pub transaction_verified: bool,
    pub developer_completed: bool,
    pub canceled: bool,
    #[serde(rename = "Pioneer_cancelled")]
    pub pioneer_cancelled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionData {
    pub txid: String,
    pub verified: bool,
    #[serde(rename = "_link")]
    pub link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletePaymentRequest {
    pub txid: String,
}