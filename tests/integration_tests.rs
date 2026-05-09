mod common;
use common::TestContext;
use wiremock::{Mock, ResponseTemplate};
use wiremock::matchers::{method, path, header};
use serde_json::json;

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
    let approved_payment_json = json!({
        "identifier": payment_id,
        "Pioneer_uid": "pioneer-123",
        "amount": 3.14,
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
    assert_eq!(user.username, "BazaarPioneer");

    // Step B: Approve the Transaction
    let payment = ctx.client.approve_payment(payment_id).await.unwrap();
    assert!(payment.status.developer_approved);
    assert_eq!(payment.amount, 3.14);

    println!("✅ MESH VALIDATED: Pioneer identity and payment logic are fused.");
}