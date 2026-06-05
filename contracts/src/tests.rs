// bazaar-republic-alpha\src\tests.rs
#![allow(unused_imports)] // Add this line to silence the noise

use crate::models::payment::{PaymentDto, PaymentStatus, TransactionData};
use serde_json;

// 2. No 'mod tests' wrapper needed here
#[test]
fn test_payment_u128_serialization_integrity() {
    let payment = PaymentDto {
        identifier: "TX-999".to_string(),
        pioneer_uid: "USER_777".to_string(),
        amount: 500_000_000_000_000_000, 
        memo: "Verification Test".to_string(),
        metadata: serde_json::json!({}),
        to_address: "ADDR_MESH_001".to_string(),
        created_at: "2026-06-05T15:00:00Z".to_string(),
        status: PaymentStatus { 
            developer_approved: true, 
            transaction_verified: true, 
            developer_completed: false, 
            canceled: false, 
            pioneer_cancelled: false 
        },
        transaction: None,
    };

    let json = serde_json::to_string(&payment).expect("Serialization failed");
    let deserialized: PaymentDto = serde_json::from_str(&json).expect("Deserialization failed");

    assert_eq!(payment.amount, deserialized.amount, "Precision lost during serialization!");
}