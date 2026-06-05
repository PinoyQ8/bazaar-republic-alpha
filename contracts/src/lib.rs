// bazaar-republic-alpha\src\lib.rs

pub mod client;
pub mod config;
pub mod errors;
pub mod models;
pub mod tests; // Defined strictly once.

// Ergonomic re-exports for the Alpha node
pub use client::PiNetworkClient;
pub use config::ClientConfig;
pub use errors::{PiError, Result};