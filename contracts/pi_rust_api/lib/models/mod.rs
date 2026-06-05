// lib/models/mod.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub uid: String,
    pub username: String,
}

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

// Overwrite the Network enum at the bottom of lib/models/mod.rs

/// 🛡️ The E-Network routing designation
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Network {
    Mainnet,
    Testnet,
    Private(String), // 🛡️ Added to support custom network passphrases
}