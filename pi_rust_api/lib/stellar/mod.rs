// lib/stellar/mod.rs

// 🛡️ Declare submodules to make files visible to the crate
pub mod client;
pub mod networks;

// 🛡️ Ergonomic re-export: 
// This allows other sectors to use crate::stellar::StellarClient 
// instead of the longer crate::stellar::client::StellarClient.
pub use client::StellarClient;