use actix_web::{App, HttpServer, web};
use std::sync::Mutex;
use std::collections::HashSet;

mod mesh;
use crate::mesh::treasury::{TreasuryVault, VaultLockState, AppState, trigger_latency_lock, trigger_instant_lock, submit_consensus};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let mut initial_nodes = HashSet::new();
    initial_nodes.insert("node_alpha_x570".to_string());
    initial_nodes.insert("node_beta_nitro".to_string());
    initial_nodes.insert("node_gamma_s23".to_string());
    initial_nodes.insert("node_delta_mesh".to_string());
    initial_nodes.insert("node_omega_vault".to_string());

    let vault_state = web::Data::new(AppState {
        treasury_vault: Mutex::new(TreasuryVault {
            vault_id: "Bazaar_Treasury_01".to_string(),
            state: VaultLockState::Active,
            lock_timestamp: None,
            master_nodes: initial_nodes,
            unlock_signatures: HashSet::new(),
        }),
    });

    println!("--- MESH SECURITY ADJUDICATOR: Actix Server Online ---");
    println!("--- Treasury Fortress Guard Active on Port 8080 ---");

    HttpServer::new(move || {
        App::new()
            .app_data(vault_state.clone())
            .service(trigger_latency_lock)
            .service(trigger_instant_lock)
            .service(submit_consensus)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}