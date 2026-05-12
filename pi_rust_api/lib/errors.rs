// lib/errors.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PiError {
    #[error("Authentication failed: {0}")]
    AuthError(String),

    #[error("Network connection error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Data parsing error: {0}")]
    ParseError(#[from] serde_json::Error),

    #[error("Stellar Blockchain error: {0}")]
    StellarError(String),

    #[error("Internal Logic Fracture: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, PiError>;