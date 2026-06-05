use serde::{Deserialize, Serialize};
 // Recommended for time-series integrity

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentDto {
    pub identifier: String,
    
    #[serde(rename = "Pioneer_uid")]
    pub pioneer_uid: String,
    
    // SECURITY PATCH: Converted f64 to u128 (Atomic Units)
    // Always scale by DECIMALS constant (10^18) before transmission
    pub amount: u128,
    
    pub memo: String,
    
    #[serde(default)] // Ensure metadata handles nulls gracefully
    pub metadata: serde_json::Value,
    
    pub to_address: String,
    
    // Use ISO-8601 string for external DTOs, but process as DateTime internally
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

#[cfg(test)]
mod tests {
    use super::*; // Imports PaymentDto, PaymentStatus, TransactionData

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

        // Serialize
        let json = serde_json::to_string(&payment).expect("Serialization failed");
        
        // Deserialize
        let deserialized: PaymentDto = serde_json::from_str(&json).expect("Deserialization failed");

        // Verify Integrity
        assert_eq!(payment.amount, deserialized.amount, "Precision lost during serialization!");
    }
}