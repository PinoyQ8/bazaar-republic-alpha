// lib/models/payment.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub identifier: String,     // Pi Network Payment ID
    pub amount: f64,            // The numeric value
    pub currency: String,       // Set to "mBZR"
    pub asset_code: String,     // "mBZR"
    pub issuer: String,         // The DAO's issuing Stellar address
    pub status: PaymentStatus,
    pub recipient: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Cancelled,
    Failed,
}