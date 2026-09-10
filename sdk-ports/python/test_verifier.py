import unittest
from unittest.mock import Mock, patch
import requests
import json

# Import the class and error from our verifier file
# In scratch we can import directly by adding to path or copying it,
# but since they are in the same directory we can mock the import or structure it simply.
import sys
import os
sys.path.append(os.path.dirname(__file__))

from pi_payment_verifier import PiNetworkVerifier, PiAPIError

class TestPiNetworkVerifier(unittest.TestCase):
    def setUp(self):
        self.api_key = "test_secret_api_key"
        self.verifier = PiNetworkVerifier(api_key=self.api_key)
        self.mock_user_data = {
            "uid": "usr_test_pioneer_99",
            "username": "TestPioneer",
            "roles": ["user"],
            "credentials": {
                "scopes": ["username", "payments"]
            }
        }
        self.mock_payment_data = {
            "id": "pay_98237418247",
            "amount": 3.1415926,
            "uid": "usr_test_pioneer_99",
            "recipient": "G_TREASURY_REPUBLIC_POOL",
            "status": {
                "developer_approved": False,
                "transaction_verified": False,
                "developer_completed": False,
                "cancelled": False
            }
        }

    @patch('requests.Session.get')
    def test_verify_access_token_success(self, mock_get):
        # Configure mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = self.mock_user_data
        mock_response.ok = True
        mock_get.return_value = mock_response

        # Execute test
        result = self.verifier.verify_access_token("valid_token_abc123")

        # Assertions
        self.assertEqual(result["uid"], "usr_test_pioneer_99")
        self.assertEqual(result["username"], "TestPioneer")
        mock_get.assert_called_once_with(
            "https://api.minepi.com/v2/me",
            headers={"Authorization": "Bearer valid_token_abc123"},
            timeout=10
        )

    @patch('requests.Session.get')
    def test_verify_access_token_invalid_input(self, mock_get):
        with self.assertRaises(ValueError):
            self.verifier.verify_access_token("")

    @patch('requests.Session.get')
    def test_verify_access_token_non_json_error(self, mock_get):
        # Emulate a localtunnel 502 Bad Gateway HTML crash
        mock_response = Mock()
        mock_response.status_code = 502
        mock_response.headers = {"Content-Type": "text/html; charset=UTF-8"}
        mock_response.text = "<html><body><h1>502 Bad Gateway</h1></body></html>"
        mock_response.ok = False
        mock_get.return_value = mock_response

        with self.assertRaises(PiAPIError) as context:
            self.verifier.verify_access_token("some_token")
        
        self.assertEqual(context.exception.status_code, 502)
        self.assertIn("Expected JSON but received Content-Type", context.exception.error_message)

    @patch('requests.Session.get')
    def test_get_payment_success(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = self.mock_payment_data
        mock_response.ok = True
        mock_get.return_value = mock_response

        result = self.verifier.get_payment("pay_98237418247")
        self.assertEqual(result["id"], "pay_98237418247")
        self.assertEqual(result["amount"], 3.1415926)

    @patch('requests.Session.post')
    def test_approve_payment_success(self, mock_post):
        approved_payment = self.mock_payment_data.copy()
        approved_payment["status"] = self.mock_payment_data["status"].copy()
        approved_payment["status"]["developer_approved"] = True

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = approved_payment
        mock_response.ok = True
        mock_post.return_value = mock_response

        result = self.verifier.approve_payment("pay_98237418247")
        self.assertTrue(result["status"]["developer_approved"])

    @patch('requests.Session.post')
    def test_complete_payment_success(self, mock_post):
        completed_payment = self.mock_payment_data.copy()
        completed_payment["status"] = self.mock_payment_data["status"].copy()
        completed_payment["status"]["developer_completed"] = True
        completed_payment["status"]["transaction_verified"] = True

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {"Content-Type": "application/json"}
        mock_response.json.return_value = completed_payment
        mock_response.ok = True
        mock_post.return_value = mock_response

        result = self.verifier.complete_payment("pay_98237418247", "stellar_tx_hash_12345")
        self.assertTrue(result["status"]["developer_completed"])

if __name__ == "__main__":
    unittest.main()
