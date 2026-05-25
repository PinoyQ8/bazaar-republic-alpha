//! PROJECT BAZAAR: UTILITY SECTOR
//! Purpose: Optimized serialization and string building for the E-Network.

use std::io::Read;

/// Fast JSON serialization with a pre-allocated buffer.
/// Minimizes memory reallocations during high-velocity DAO operations.
pub fn serialize_json_fast<T: serde::Serialize>(value: &T) -> Result<Vec<u8>, serde_json::Error> {
    let mut buf = Vec::with_capacity(1024); 
    serde_json::to_writer(&mut buf, value)?;
    Ok(buf)
}

/// Streaming JSON deserialization for large API responses.
/// Prevents memory spikes when fetching large Pioneer registry lists.
pub fn deserialize_json_stream<T: serde::de::DeserializeOwned>(
    reader: impl Read,
) -> Result<T, serde_json::Error> {
    serde_json::from_reader(reader)
}

/// Memory-efficient string building for API routing.
/// Prevents path fractures in the communication bridge.
pub fn build_url_path(base: &str, segments: &[&str]) -> String {
    let total_len = base.len() + segments.iter().map(|s| s.len() + 1).sum::<usize>();
    let mut url = String::with_capacity(total_len);
    url.push_str(base);

    for segment in segments {
        if !url.ends_with('/') && !segment.starts_with('/') {
            url.push('/');
        }
        url.push_str(segment);
    }

    url
}