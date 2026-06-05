use serde::{Deserialize, Serialize};
use crate::models::PaymentDto;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PiNetworkError {
    pub error: String,
    pub error_message: String,
    pub payment: Option<PaymentDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionId {
    #[serde(rename = "txid")]
    pub tx_id: String,
}