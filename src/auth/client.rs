use crate::{
    client::PiNetworkClient,
    models::UserDto,
    errors::PiError,
    Result,
};

impl PiNetworkClient {
    /// Retrieve user information using an access token
    /// 
    /// This method targets the GET /me endpoint and requires the user's
    /// Bearer token provided by the Pi Network mobile authentication.
    pub async fn get_user_info(&self, access_token: &str) -> Result<UserDto> {
        if access_token.is_empty() {
            return Err(PiError::Authentication("Access token cannot be empty".to_string()));
        }

        // Build the request and attach Bearer Auth
        let request = self.get("/me");
        let request = self.with_bearer_auth(request, access_token);

        // Execute and handle Pi-specific authorization errors
        self.execute_request(request).await
            .map_err(|e| match e {
                PiError::PiNetwork { error_name, error_message, .. } 
                    if error_name == "UNAUTHORIZED" || error_name == "INVALID_TOKEN" => {
                    PiError::Authentication(format!("Invalid or expired access token: {}", error_message))
                }
                other => other,
            })
    }

    /// Validate if an access token is still valid
    /// Returns true if valid, false if unauthorized
    pub async fn validate_access_token(&self, access_token: &str) -> Result<bool> {
        match self.get_user_info(access_token).await {
            Ok(_) => Ok(true),
            Err(PiError::Authentication(_)) => Ok(false),
            Err(e) => Err(e),
        }
    }
}