use std::time::Duration;
use url::{Url, ParseError};

#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_retries: u32,
}

#[derive(Debug, Clone)]
pub struct ClientConfig {
    pub base_url: Url,         // Upgraded to Url to support .join()
    pub api_key: String,       // Made mandatory/String to support Display formatting
    pub timeout: Duration,
    pub user_agent: String,    // Injected to satisfy client.rs:23
    pub retry_config: RetryConfig, // Injected to satisfy client.rs:65
}

impl ClientConfig {
    // Returns Result so the `?` operator works in client.rs:15
    pub fn new(api_key: &str) -> Result<Self, ParseError> {
        Ok(Self {
            base_url: Url::parse("https://api.minepi.com/v2/")?,
            api_key: api_key.to_string(),
            timeout: Duration::from_secs(30),
            user_agent: "Project-Bazaar-MESH/1.0".to_string(),
            retry_config: RetryConfig { max_retries: 3 },
        })
    }
}