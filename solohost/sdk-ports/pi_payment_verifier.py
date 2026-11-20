"""
Project Bazaar: Pi Network Backend SDK Verification Utility (Python Edition)
File Location: /workspace/scratch/pi_payment_verifier.py
Version: 1.0.1
Description:
    A type-safe Python implementation mapping Pi Network Server-to-Server (S2S)
    REST API endpoints for user verification and U2A payment lifecycle management.

License: MIT / PiOS (Pi Open Source) Community Contribution
"""

import logging
from typing import Any, Dict, Optional
from urllib.parse import quote
import requests

logger = logging.getLogger("PiNetworkVerifier")


class PiAPIError(Exception):
    """Custom exception class wrapping HTTP and schema validation faults from Pi API."""

    def __init__(
        self,
        status_code: int,
        error_message: str,
        response_body: Optional[str] = None,
    ):
        super().__init__(f"Pi API Error {status_code}: {error_message}")
        self.status_code = status_code
        self.error_message = error_message
        self.response_body = response_body


class PiNetworkVerifier:
    """
    Python verification engine for Pi Network S2S and user-token endpoints.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.minepi.com",
        timeout: float = 10.0,
    ):
        if not api_key or not api_key.strip():
            raise ValueError(
                "Developer API Key is mandatory to initialize the Pi Backend Verifier."
            )

        self.api_key = api_key.strip()
        self.base_url = base_url.strip().rstrip("/")
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Key {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Pi-Python-Community-SDK-Blueprint/1.0.1",
            }
        )

    def _parse_response(self, response: requests.Response) -> Dict[str, Any]:
        """
        Interprets responses defensively and raises PiAPIError on non-JSON or error statuses.
        """
        content_type = response.headers.get("Content-Type", "")
        raw_text = response.text or ""

        if "application/json" not in content_type.lower():
            snippet = raw_text[:200].replace("\n", " ")
            logger.error(
                "Non-JSON response received. HTTP %s: %s",
                response.status_code,
                snippet,
            )
            raise PiAPIError(
                status_code=response.status_code,
                error_message=f"Expected JSON but received Content-Type '{content_type}'",
                response_body=raw_text,
            )

        try:
            data = response.json()
        except ValueError as json_err:
            logger.error("Failed to decode JSON from response: %s", raw_text[:500])
            raise PiAPIError(
                status_code=response.status_code,
                error_message=f"JSON decoding error: {json_err}",
                response_body=raw_text,
            )

        if not isinstance(data, dict):
            raise PiAPIError(
                status_code=response.status_code,
                error_message="Expected JSON object from Pi API",
                response_body=raw_text,
            )

        if not response.ok:
            error_msg = (
                data.get("error")
                or data.get("message")
                or "Unknown API error occurred"
            )
            logger.warning(
                "Pi API returned error status %s: %s",
                response.status_code,
                error_msg,
            )
            raise PiAPIError(
                status_code=response.status_code,
                error_message=str(error_msg),
                response_body=raw_text,
            )

        return data

    def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        """
        Authenticates a user's session token via GET /v2/me.
        """
        clean_token = access_token.strip() if isinstance(access_token, str) else ""
        if not clean_token:
            raise ValueError("Access token is required for user verification.")

        url = f"{self.base_url}/v2/me"
        headers = {"Authorization": f"Bearer {clean_token}"}

        logger.info("Executing user access token handshake (GET /v2/me)...")
        try:
            response = self.session.get(url, headers=headers, timeout=self.timeout)
            return self._parse_response(response)
        except PiAPIError:
            raise
        except requests.RequestException as req_err:
            logger.error("Network transport failure during token verification: %s", req_err)
            raise PiAPIError(
                status_code=502,
                error_message=f"Network transport failure: {req_err}",
            )

    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Retrieves payment details via GET /v2/payments/<payment_id>.
        """
        clean_id = payment_id.strip() if isinstance(payment_id, str) else ""
        if not clean_id:
            raise ValueError("Payment ID is required to fetch details.")

        encoded_id = quote(clean_id, safe="")
        url = f"{self.base_url}/v2/payments/{encoded_id}"

        logger.info("Fetching payment record metadata for: %s...", clean_id)
        try:
            response = self.session.get(url, timeout=self.timeout)
            return self._parse_response(response)
        except PiAPIError:
            raise
        except requests.RequestException as req_err:
            logger.error("Network transport failure during get_payment: %s", req_err)
            raise PiAPIError(
                status_code=502,
                error_message=f"Network transport failure: {req_err}",
            )

    def approve_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Approves a pending payment via POST /v2/payments/<payment_id>/approve.
        """
        clean_id = payment_id.strip() if isinstance(payment_id, str) else ""
        if not clean_id:
            raise ValueError("Payment ID is required for approval.")

        encoded_id = quote(clean_id, safe="")
        url = f"{self.base_url}/v2/payments/{encoded_id}/approve"

        logger.info("Submitting payment approval command for: %s...", clean_id)
        try:
            response = self.session.post(url, timeout=self.timeout)
            return self._parse_response(response)
        except PiAPIError:
            raise
        except requests.RequestException as req_err:
            logger.error("Network transport failure during approve_payment: %s", req_err)
            raise PiAPIError(
                status_code=502,
                error_message=f"Network transport failure: {req_err}",
            )

    def complete_payment(self, payment_id: str, txid: str) -> Dict[str, Any]:
        """
        Completes a settled payment via POST /v2/payments/<payment_id>/complete.
        """
        clean_id = payment_id.strip() if isinstance(payment_id, str) else ""
        clean_txid = txid.strip() if isinstance(txid, str) else ""
        if not clean_id or not clean_txid:
            raise ValueError(
                "Both Payment ID and settled On-Chain Transaction ID (txid) are required."
            )

        encoded_id = quote(clean_id, safe="")
        url = f"{self.base_url}/v2/payments/{encoded_id}/complete"
        payload = {"txid": clean_txid}

        logger.info(
            "Submitting payment finalization command for: %s (TXID: %s)...",
            clean_id,
            clean_txid,
        )
        try:
            response = self.session.post(url, json=payload, timeout=self.timeout)
            return self._parse_response(response)
        except PiAPIError:
            raise
        except requests.RequestException as req_err:
            logger.error("Network transport failure during complete_payment: %s", req_err)
            raise PiAPIError(
                status_code=502,
                error_message=f"Network transport failure: {req_err}",
            )


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    print("==========================================================")
    print("PI NETWORK PYTHON COMMUNITY VERIFIER: BOOTING SANDBOX")
    print("==========================================================")

    verifier = PiNetworkVerifier(api_key="mock_developer_api_key_for_sandbox_testing")
    print(f"--> Instantiated Verifier Target: {verifier.base_url}")
    print("--> Connection headers initialized securely.")
    print("==========================================================")