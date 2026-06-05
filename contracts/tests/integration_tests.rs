mod common;
use common::TestContext;
use wiremock::{Mock, ResponseTemplate};
use wiremock::matchers::{method, path, header};
use serde_json::json;
use bazaar_republic_alpha::models::constants::DECIMALS;

#[tokio::test]
async fn test_pioneer_authentication_and_payment_approval() {
    let ctx = TestContext::new().await;

    // 1. MOCK: Setup the /me endpoint
    let pioneer_json = json!({
        "uid": "pioneer-123",
        "username": "BazaarPioneer"
    });

    Mock::given(method("GET"))
        .and(path("/me"))
        .and(header("authorization", "Bearer valid-token"))
        .respond_with(ResponseTemplate::new(200).set_body_json(&pioneer_json))
        .mount(&ctx.mock_server)
        .await;

    // 2. MOCK: Setup the payment approval endpoint
    let payment_id = "pay-999";
    // Define the atomic amount (3.14 * 10^18)
    let atomic_amount: u128 = 3_140_000_000_000_000_000; 

    let approved_payment_json = json!({
        "identifier": payment_id,
        "Pioneer_uid": "pioneer-123",
        "amount": atomic_amount, // Must be passed as an integer (u128)
        "memo": "Bazaar Alpha Access",
        "metadata": {},
        "to_address": "G-BAZAAR-ROOT",
        "created_at": "2026-05-09T00:00:00Z",
        "status": {
            "developer_approved": true,
            "transaction_verified": false,
            "developer_completed": false,
            "canceled": false,
            "Pioneer_cancelled": false
        }
    });

    Mock::given(method("POST"))
        .and(path(format!("/payments/{}/approve", payment_id)))
        .respond_with(ResponseTemplate::new(200).set_body_json(&approved_payment_json))
        .mount(&ctx.mock_server)
        .await;

    // --- EXECUTION ---

    // Step A: Verify Identity
    let user = ctx.client.get_user_info("valid-token").await.unwrap();
   // Bracket notation securely targets the JSON key
assert_eq!(user["username"], "BazaarPioneer");

    // Step B: Approve the Transaction
    let payment = ctx.client.approve_payment(payment_id).await.unwrap();
    
    // Validate the status and the atomic amount
    assert!(payment.status.developer_approved);
    assert_eq!(payment.amount, atomic_amount, "Payment amount mismatch: Expected atomic unit integrity.");

    println!("✅ MESH VALIDATED: Pioneer identity and atomic payment logic are fused.");
}