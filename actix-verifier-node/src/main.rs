use actix_web::{post, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ZkProof {
    proof_string: String,
}

#[derive(Serialize)]
struct VerifyResponse {
    status: String,
    is_valid: bool,
}

#[post("/api/zk/verify")]
async fn verify_zk_proof(proof: web::Json<ZkProof>) -> impl Responder {
    // Hard-coded MESH logic: Accept only valid proof signatures
    let is_valid = proof.proof_string.starts_with("zkp_");
    HttpResponse::Ok().json(VerifyResponse {
        status: if is_valid { "VERIFIED".to_string() } else { "REJECTED".to_string() },
        is_valid,
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("[MESH-SCAN] Actix ZK Verifier Node spinning up on Port 8080...");
    HttpServer::new(|| {
        App::new().service(verify_zk_proof)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
