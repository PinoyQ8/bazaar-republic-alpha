use pi_rust::{PiNetworkClient, ClientConfig};
use wiremock::MockServer;

pub struct TestContext {
    pub mock_server: MockServer,
    pub client: PiNetworkClient,
}

impl TestContext {
    pub async fn new() -> Self {
        // Start a fresh mock server for every test
        let mock_server = MockServer::start().await;
        
        // Point the SDK to our mock server instead of the real Pi API
        // tests\common\mod.rs

// 🛡️ 1. Create the config directly
// tests\common\mod.rs

// 🛡️ 1. Create the config
let mut config = ClientConfig::new("test-api-key".to_string());

// 🛡️ 2. Align with the mock server
config.horizon_url = mock_server.uri();

// 🛡️ 3. Initialize the client ONCE
// Use 'with_config' if the test expects a Result, or 'new' for direct access.
// Since the test uses .unwrap() later, let's use the stable bridge:
let client = PiNetworkClient::new(config);
        Self {
            mock_server,
            client,
        }
    }
}