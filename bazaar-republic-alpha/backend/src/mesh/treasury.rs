use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use actix_web::{web, HttpResponse, Responder, post};

// 1. Isolated State Definition
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum VaultLockState {
    Active,          // MESH flowing normally
    PendingLock,     // 60-Second Latency Buffer Initiated
    Locked,          // Instant Zero-Latency Override Triggered
}

// 2. The Fortress Struct
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TreasuryVault {
    pub vault_id: String,
    pub state: VaultLockState,
    pub lock_timestamp: Option<u64>,
    pub master_nodes: HashSet<String>,
    pub unlock_signatures: HashSet<String>,
}

// 3. Application State Wrapper for Actix
pub struct AppState {
    pub treasury_vault: Mutex<TreasuryVault>,
}

impl TreasuryVault {
    pub fn initiate_latency_lock(&mut self) {
        if self.state == VaultLockState::Active {
            self.state = VaultLockState::PendingLock;
            self.lock_timestamp = Some(current_timestamp());
            self.unlock_signatures.clear();
        }
    }

    pub fn trigger_instant_lock(&mut self) {
        self.state = VaultLockState::Locked;
        self.lock_timestamp = Some(current_timestamp());
        self.unlock_signatures.clear(); 
    }

    pub fn submit_consensus(&mut self, node_id: String) -> Result<String, &'static str> {
        if !self.master_nodes.contains(&node_id) {
            return Err("Node unauthorized. MESH rejected signature.");
        }

        self.unlock_signatures.insert(node_id);

        if self.unlock_signatures.len() >= 3 {
            self.state = VaultLockState::Active;
            self.lock_timestamp = None;
            self.unlock_signatures.clear();
            return Ok("3/5 Consensus Reached. Treasury Vault Unlocked.".to_string());
        }

        Ok("Signature accepted. Awaiting further consensus.".to_string())
    }
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs()
}

// 4. Actix Web Payloads & Endpoints
#[derive(Deserialize)]
pub struct LockRequest {
    #[allow(dead_code)]
    pub initiator_node: String,
}

#[derive(Deserialize)]
pub struct ConsensusRequest {
    pub node_id: String,
}

#[post("/api/treasury/latency-lock")]
pub async fn trigger_latency_lock(
    data: web::Data<AppState>,
    payload: web::Json<LockRequest>
) -> impl Responder {
    let mut vault = data.treasury_vault.lock().unwrap();
    vault.initiate_latency_lock();
    
    println!("--- MESH AUDIT: Latency lock triggered by node: {} ---", payload.initiator_node);

    HttpResponse::Ok().json(serde_json::json!({
        "status": "success",
        "message": "60-Second Latency Lock Initiated.",
        "lock_timestamp": vault.lock_timestamp,
        "current_state": format!("{:?}", vault.state)
    }))
}

#[post("/api/treasury/instant-lock")]
pub async fn trigger_instant_lock(
    data: web::Data<AppState>,
    payload: web::Json<LockRequest>
) -> impl Responder {
    let mut vault = data.treasury_vault.lock().unwrap();
    vault.trigger_instant_lock();

    println!("--- MESH AUDIT: Instant lock triggered by node: {} ---", payload.initiator_node);
    
    HttpResponse::Ok().json(serde_json::json!({
        "status": "critical",
        "message": "Instant Lock Executed. Treasury Vault Frozen.",
        "lock_timestamp": vault.lock_timestamp,
        "current_state": format!("{:?}", vault.state)
    }))
}

#[post("/api/treasury/consensus")]
pub async fn submit_consensus(
    data: web::Data<AppState>,
    payload: web::Json<ConsensusRequest>
) -> impl Responder {
    let mut vault = data.treasury_vault.lock().unwrap();
    
    match vault.submit_consensus(payload.node_id.clone()) {
        Ok(msg) => HttpResponse::Ok().json(serde_json::json!({
            "status": "verified",
            "message": msg,
            "current_state": format!("{:?}", vault.state),
            "signatures_collected": vault.unlock_signatures.len()
        })),
        Err(e) => HttpResponse::Forbidden().json(serde_json::json!({
            "status": "rejected",
            "error": e
        }))
    }
}