use std::fmt;

#[derive(Debug)]
pub enum PiError {
    Http(reqwest::Error),
    Json(reqwest::Error),
    Configuration(String),
    Authentication(String),
    // 🛡️ STRICT ALIGNMENT WITH CLIENT.RS EXPECTATIONS
    PiNetwork { 
        error_name: String, 
        error_message: String, 
        payment: Option<crate::models::payment::PaymentDto> 
    },
    UrlParse(url::ParseError),
}

// 📡 E-NETWORK DISPLAY FORMATTING
impl fmt::Display for PiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PiError::Http(e) => write!(f, "MESH HTTP Error: {}", e),
            PiError::Json(e) => write!(f, "MESH JSON Error: {}", e),
            PiError::Configuration(msg) => write!(f, "MESH Config Error: {}", msg),
            PiError::Authentication(msg) => write!(f, "MESH Auth Error: {}", msg),
            PiError::PiNetwork { error_name, error_message, .. } => 
                write!(f, "MESH API Error [{}]: {}", error_name, error_message),
            PiError::UrlParse(e) => write!(f, "MESH URL Parse Error: {}", e),
        }
    }
}

impl std::error::Error for PiError {}

// 🛡️ AUTOMATIC ERROR CONVERSION
impl From<reqwest::Error> for PiError {
    fn from(err: reqwest::Error) -> Self {
        PiError::Http(err)
    }
}

impl From<url::ParseError> for PiError {
    fn from(err: url::ParseError) -> Self {
        PiError::UrlParse(err)
    }
}

// 🚀 EXPORTED RESULT ALIAS
pub type Result<T> = std::result::Result<T, PiError>;