use thiserror::Error;

pub type Result<T> = std::result::Result<T, PiError>;

#[derive(Error, Debug)]
pub enum PiError {
    #[error("HTTP Request failed: {0}")]
    Http(#[from] reqwest::Error),
    #[error("JSON Processing failed: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Stellar Horizon Error: {0}")]
    Horizon(String),
    #[error("Configuration Missing: {0}")]
    Config(String),
    #[error("Unauthorized: {0}")]
    Auth(String),
}