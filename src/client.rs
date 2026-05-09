use reqwest::{Client, RequestBuilder, Response};
use std::time::Duration;
use url::Url;
use crate::{config::ClientConfig, errors::PiError, Result};

#[derive(Debug, Clone)]
pub struct PiNetworkClient {
    pub(crate) http_client: Client,
    pub(crate) config: ClientConfig,
}

impl PiNetworkClient {
    /// Initialize a new client with an API key
    pub fn new(api_key: String) -> Result<Self> {
        let config = ClientConfig::new(api_key)?;
        Self::with_config(config)
    }

    /// Initialize with a custom configuration
    pub fn with_config(config: ClientConfig) -> Result<Self> {
        let http_client = Client::builder()
            .timeout(config.timeout)
            .user_agent(&config.user_agent)
            .build()
            .map_err(PiError::Http)?;

        Ok(Self {
            http_client,
            config,
        })
    }

    // --- Internal Helpers ---

    pub(crate) fn get(&self, path: &str) -> RequestBuilder {
        let url = self.config.base_url.join(path).unwrap();
        self.http_client.get(url).header("Accept", "application/json")
    }

    pub(crate) fn post(&self, path: &str) -> RequestBuilder {
        let url = self.config.base_url.join(path).unwrap();
        self.http_client.post(url)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
    }

    pub(crate) fn with_api_key_auth(&self, request: RequestBuilder) -> RequestBuilder {
        request.header("Authorization", format!("Key {}", self.config.api_key))
    }

    pub(crate) fn with_bearer_auth(&self, request: RequestBuilder, token: &str) -> RequestBuilder {
        request.header("Authorization", format!("Bearer {}", token))
    }

    pub(crate) async fn execute_request<T>(&self, request: RequestBuilder) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        let response = self.execute_with_retry(request).await?;
        self.handle_response(response).await
    }

    async fn execute_with_retry(&self, mut request: RequestBuilder) -> Result<Response> {
        let mut attempts = 0;
        let max_attempts = self.config.retry_config.max_retries + 1;

        loop {
            let req = request.try_clone()
                .ok_or_else(|| PiError::Configuration("Request cannot be cloned".into()))?;

            match req.send().await {
                Ok(response) => return Ok(response),
                Err(e) if attempts < max_attempts - 1 && e.is_timeout() => {
                    attempts += 1;
                    tokio::time::sleep(Duration::from_millis(200)).await;
                    continue;
                }
                Err(e) => return Err(PiError::Http(e)),
            }
        }
    }

    async fn handle_response<T>(&self, response: Response) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        if response.status().is_success() {
            response.json().await.map_err(PiError::Json)
        } else {
            let text = response.text().await.map_err(PiError::Http)?;
            // Attempt to parse Pi-specific error JSON
            if let Ok(pi_err) = serde_json::from_str::<crate::models::PiNetworkError>(&text) {
                Err(PiError::PiNetwork {
                    error_name: pi_err.error,
                    error_message: pi_err.error_message,
                    payment: pi_err.payment,
                })
            } else {
                Err(PiError::Authentication(format!("API Error: {}", text)))
            }
        }
    }
} // <--- This was the missing R_CURLY closing the impl block