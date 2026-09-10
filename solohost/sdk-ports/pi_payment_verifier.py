"""
Project Bazaar: Pi Network Backend SDK Verification Utility (Python Edition)
File Location: /workspace/scratch/pi_payment_verifier.py
Version: 1.0.0
Description:
    A robust, type-safe Python implementation mapping the official Pi Network 
    Server-to-Server (S2S) REST API protocol. Designed to serve as the structural 
    blueprint for a community-maintained Python SDK.

    Supports:
      1. User Session Verification (https://api.minepi.com/v2/me)
      2. User-to-App (U2A) Payment Lifecycle (Get, Approve, Complete)
      3. Secure Authentication Contexts & Cryptographic Error Handlers

License: MIT / PiOS (Pi Open Source) Community Contribution
"""

import logging
import json
from typing import Dict, Any, Optional
import requests

# Configure robust structural logger
logger = logging.getLogger("PiNetworkVerifier")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class PiAPIError(Exception):
    """Custom exception class wrapping raw HTTP and schema validation faults from Pi API."""
    def __init__(self, status_code: int, error_message: str, response_body: Optional[str] = None):
        super().__init__(f"Pi API Error {status_code}: {error_message}")
        self.status_code = status_code
        self.error_message = error_message
        self.response_body = response_body


class PiNetworkVerifier:
    """
    Python verification engine modeling the official Pi Core Team Node.js SDK structure.
    Integrates safe HTTP parsing, header security, and type safety constraints.
    """
    def __init__(self, api_key: str, base_url: str = "https://api.minepi.com"):
        """
        Initializes the verifier with your Developer API Key.
        
        :param api_key: Raw API key obtained from the Pi Developer Portal (Authorization: Key <api_key>)
        :param base_url: The production or sandbox base routing endpoint.
        """
        if not api_key:
            raise ValueError("Developer API Key is mandatory to initialize the Pi Backend Verifier.")
        
        self.api_key = api_key.strip()
        self.base_url = base_url.strip().rstrip("/")
        
        # Configure persistent session headers for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Key {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Pi-Python-Community-SDK-Blueprint/1.0.0"
        })

    def _parse_response(self, response: requests.Response) -> Dict[str, Any]:
        """
        Interprets responses defensively. Handles non-JSON payloads gracefully 
        to prevent 'Unexpected Token' parser crashes on the backend gateway.
        """
        content_type = response.headers.get("Content-Type", "")
        
        # Check for HTML gateway errors (like 502/504 Bad Gateway responses)
        if "application/json" not in content_type:
            raw_text = response.text or ""
            snippet = raw_text[:200].replace("\n", " ")
            logger.error(f"Non-JSON response received. HTTP {response.status_code}: {snippet}")
            raise PiAPIError(
                status_code=response.status_code,
                error_message=f"Expected JSON but received Content-Type '{content_type}'",
                response_body=raw_text
            )
            
        try:
            data = response.json()
        except ValueError as json_err:
            logger.error(f"Failed to decode JSON from response: {response.text}")
            raise PiAPIError(
                status_code=response.status_code,
                error_message=f"JSON decoding error: {str(json_err)}",
                response_body=response.text
            )

        if not response.ok:
            error_msg = data.get("error", "Unknown API error occurred")
            logger.warning(f"Pi API returned error status {response.status_code}: {error_msg}")
            raise PiAPIError(
                status_code=response.status_code,
                error_message=error_msg,
                response_body=response.text
            )

        return data

    def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        """
        Authenticates a user's session token sent from the Pi Browser frontend.
        Resolves the user's secure UID, username, and active roles.
        
        Hits: GET /v2/me
        
        :param access_token: The client-side accessToken obtained via Pi.authenticate()
        :return: Dict containing validated Pioneer profile details (uid, username, etc.)
        """
        if not access_token:
            raise ValueError("Access token is required for user verification.")

        url = f"{self.base_url}/v2/me"
        # Override the Authorization header specifically for User-to-Server bearer checks
        headers = {"Authorization": f"Bearer {access_token}"}
        
        logger.info("Executing user access token handshake (GET /v2/me)...")
        try:
            response = self.session.get(url, headers=headers, timeout=10)
            return self._parse_response(response)
        except requests.RequestException as req_err:
            logger.error(f"Network transport failure during token verification: {req_err}")
            raise PiAPIError(status_code=500, error_message=f"Network transport failure: {str(req_err)}")

    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Retrieves the structural record of a specific payment from the Pi backend.
        Used to assert correct amounts, recipients, and custom memo metadata before approving.
        
        Hits: GET /v2/payments/<payment_id>
        
        :param payment_id: The unique identifier of the payment
        :return: Payment details data object
        """
        if not payment_id:
            raise ValueError("Payment ID is required to fetch details.")

        url = f"{self.base_url}/v2/payments/{payment_id}"
        logger.info(f"Fetching payment record metadata for: {payment_id}...")
        try:
            response = self.session.get(url, timeout=10)
            return self._parse_response(response)
        except requests.RequestException as req_err:
            logger.error(f"Network transport failure during get_payment: {req_err}")
            raise PiAPIError(status_code=500, error_message=f"Network transport failure: {str(req_err)}")

    def approve_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Approves a pending payment, authorizing the Pi Network block validators
        to queue and execute the on-chain ledger settlement.
        
        Hits: POST /v2/payments/<payment_id>/approve
        
        :param payment_id: The unique identifier of the payment
        :return: Updated payment object confirming approval status
        """
        if not payment_id:
            raise ValueError("Payment ID is required for approval.")

        url = f"{self.base_url}/v2/payments/{payment_id}/approve"
        logger.info(f"Submitting payment approval command for: {payment_id}...")
        try:
            response = self.session.post(url, timeout=10)
            return self._parse_response(response)
        except requests.RequestException as req_err:
            logger.error(f"Network transport failure during approve_payment: {req_err}")
            raise PiAPIError(status_code=500, error_message=f"Network transport failure: {str(req_err)}")

    def complete_payment(self, payment_id: str, txid: str) -> Dict[str, Any]:
        """
        Formally completes and closes a settled payment after verifying that the
        corresponding Transaction ID has successfully landed on the Pi Blockchain.
        
        Hits: POST /v2/payments/<payment_id>/complete
        
        :param payment_id: The unique identifier of the payment
        :param txid: The raw on-chain transaction hash/ID settled on the Pi Ledger
        :return: Updated payment object confirming absolute finality
        """
        if not payment_id or not txid:
            raise ValueError("Both Payment ID and settled On-Chain Transaction ID (txid) are required.")

        url = f"{self.base_url}/v2/payments/{payment_id}/complete"
        payload = {"txid": txid.strip()}
        
        logger.info(f"Submitting payment finalization command for: {payment_id} (TXID: {txid})...")
        try:
            response = self.session.post(url, json=payload, timeout=10)
            return self._parse_response(response)
        except requests.RequestException as req_err:
            logger.error(f"Network transport failure during complete_payment: {req_err}")
            raise PiAPIError(status_code=500, error_message=f"Network transport failure: {str(req_err)}")


# =====================================================================
# 🧪 MOCK TEST RUNTIME EXAMPLE
# =====================================================================
if __name__ == "__main__":
    print("==========================================================")
    print("🚀 PI NETWORK PYTHON COMMUNITY VERIFIER: BOOTING SANDBOX 🚀")
    print("==========================================================")
    
    # Instantiate with a dummy API key to demonstrate defensive structural verification
    verifier = PiNetworkVerifier(api_key="mock_developer_api_key_for_sandbox_testing")
    print(f"--> Instantiated Verifier Target: {verifier.base_url}")
    print("--> Connection headers initialized securely.")
    print("==========================================================")
