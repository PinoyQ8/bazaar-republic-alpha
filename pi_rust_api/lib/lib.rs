// lib/lib.rs

pub mod auth;
pub mod client;
pub mod config;
pub mod errors;
pub mod models;
pub mod payments;
pub mod stellar;
pub mod utils; // <--- Ensure this is active

// Ergonomic re-exports
pub use client::PiNetworkClient;
pub use errors::{PiError, Result};
pub use config::ClientConfig;