// Access the fused logic through the Alpha node's root namespace
use bazaar_republic_alpha::{PiNetworkClient, ClientConfig};
use wiremock::MockServer;

pub struct TestContext {
    pub mock_server: MockServer,
    pub client: PiNetworkClient,
}

// ... top of file (imports and struct definition) ...

impl TestContext {
    pub async fn new() -> Self {
        let mock_server = wiremock::MockServer::start().await;

        // 1. Forge the config first (its fields are public)
        let mut config = ClientConfig::new("test-api-key")
            .expect("MESH_ERR: Failed to create ClientConfig");

        // 2. Override the base_url to point to the mock wiremock server
        config.base_url = url::Url::parse(&mock_server.uri())
            .expect("MESH_ERR: Failed to parse mock server URL");

        // 3. Inject the forged config into the client
        let client = PiNetworkClient::with_config(config)
            .expect("MESH_ERR: Failed to initialize PiNetworkClient");

        // 4. Construct and return your TestContext
        Self {
            mock_server,
            client,
        }
    }
}