use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq)]
pub enum Network {
    PiMainnet,
    PiTestnet,
    StellarTestnet,
}

#[derive(Debug, Clone)]
pub struct SendAssetsParams {
    pub network: Network,
    pub source_secret: String,
    pub destination: String,
    pub amount: f64,
    pub memo: Option<String>,
    pub fee: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionResponse {
    pub hash: String,
    pub ledger: u32,
    pub envelope_xdr: String,
    pub result_xdr: String,
    pub result_meta_xdr: String,
}