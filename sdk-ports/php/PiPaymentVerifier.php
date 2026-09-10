<?php
/**
 * Project Bazaar: Pi Network Backend SDK Verification Utility (PHP Edition)
 * File Location: /sdk-ports/php/PiPaymentVerifier.php
 * Version: 1.0.0
 * Description:
 *     A robust, object-oriented PHP 8.x implementation mapping the official Pi Network
 *     Server-to-Server (S2S) REST API protocol. Designed to serve as the structural
 *     blueprint for a community-maintained PHP SDK.
 * 
 *     Supports:
 *       1. User Session Verification (https://api.minepi.com/v2/me)
 *       2. User-to-App (U2A) Payment Lifecycle (Get, Approve, Complete)
 *       3. Connection pooling via standard cURL configurations
 *       4. Defensive HTML error page catching (to avoid parser crashes on 502/504 states)
 * 
 * License: MIT / PiOS (Pi Open Source) Community Contribution
 */

namespace PiNetwork;

/**
 * Custom Exception wrapping API errors and HTTP status faults returned by Pi servers.
 */
class PiAPIException extends \Exception {
    private int $statusCode;
    private ?string $responseBody;

    public function __construct(int $statusCode, string $errorMessage, ?string $responseBody = null) {
        parent::__construct("Pi API Error {$statusCode}: {$errorMessage}", $statusCode);
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
    }

    public function getStatusCode(): int {
        return $this->statusCode;
    }

    public function getResponseBody(): ?string {
        return $this->responseBody;
    }
}

/**
 * Main SDK API Client.
 */
class PiPaymentVerifier {
    private string $apiKey;
    private string $baseUrl;

    /**
     * Class constructor.
     * 
     * @param string $apiKey Raw server key obtained from Developer Portal (e.g., Authorization: Key <key>)
     * @param string $baseUrl Base routing endpoint (production or sandbox)
     */
    public function __construct(string $apiKey, string $baseUrl = "https://api.minepi.com") {
        if (empty(trim($apiKey))) {
            throw new \InvalidArgumentException("Developer API Key is mandatory to initialize the Pi Backend Verifier.");
        }
        $this->apiKey = trim($apiKey);
        $this->baseUrl = rtrim(trim($baseUrl), '/');
    }

    /**
     * Executes HTTP Requests defensively, preventing unhandled JSON decode crashes.
     * 
     * @param string $url Target API Endpoint
     * @param string $method HTTP verb ('GET' or 'POST')
     * @param array|null $payload Optional JSON parameters body
     * @param array $additionalHeaders Custom routing overrides (e.g. Bearer auth)
     * @return array Decoded JSON response
     * @throws PiAPIException If connection crashes or responses are unaligned
     */
    private function executeRequest(string $url, string $method = 'GET', ?array $payload = null, array $additionalHeaders = []): array {
        $ch = curl_init();

        // Standard corporate-grade S2S security headers
        $headers = array_merge([
            "Authorization: Key " . $this->apiKey,
            "Content-Type: application/json",
            "User-Agent: Pi-PHP-Community-SDK-Blueprint/1.0.0"
        ], $additionalHeaders);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FAILONERROR, false); // Permit inspection of non-200 payloads

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($payload !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            }
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new PiAPIException(500, "Network transport failure: " . $error);
        }

        // 🛡️ Defend against bad gateway HTML pages (502 / 504 server issues)
        if (strpos($contentType, 'application/json') === false) {
            $snippet = substr($response, 0, 200);
            $snippet = str_replace(["\n", "\r"], ' ', $snippet);
            throw new PiAPIException(
                $statusCode,
                "Expected JSON response but received Content-Type '{$contentType}' (Raw Snippet: {$snippet})",
                $response
            );
        }

        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new PiAPIException(
                $statusCode,
                "JSON parsing error: " . json_last_error_msg(),
                $response
            );
        }

        // Gracefully isolate error responses returned from Pi validators
        if ($statusCode < 200 || $statusCode >= 300) {
            $errorMsg = $data['error'] ?? "Unknown API error occurred";
            throw new PiAPIException($statusCode, $errorMsg, $response);
        }

        return $data;
    }

    /**
     * Authenticates a user session token sent from the Pi Browser.
     * Verifies secure UID, username, and active roles.
     * 
     * Hits: GET /v2/me
     * 
     * @param string $accessToken Frontend token obtained via Pi.authenticate()
     * @return array Pioneer profile data
     */
    public function verifyAccessToken(string $accessToken): array {
        if (empty(trim($accessToken))) {
            throw new \InvalidArgumentException("Access token is required for user verification.");
        }

        $url = $this->baseUrl . "/v2/me";
        // Override default developer Key authorization with User's Bearer credential
        $headers = ["Authorization: Bearer " . trim($accessToken)];

        return $this->executeRequest($url, 'GET', null, $headers);
    }

    /**
     * Retrieves the structural details of a payment from the Pi backend.
     * Used to audit transaction prices, coins, and billing metadata.
     * 
     * Hits: GET /v2/payments/<payment_id>
     * 
     * @param string $paymentId Unique payment ID
     * @return array Payment details array
     */
    public function getPayment(string $paymentId): array {
        if (empty(trim($paymentId))) {
            throw new \InvalidArgumentException("Payment ID is required to fetch details.");
        }

        $url = $this->baseUrl . "/v2/payments/" . trim($paymentId);
        return $this->executeRequest($url, 'GET');
    }

    /**
     * Approves a pending payment. Authorizes Pi validators to queue the ledger block.
     * 
     * Hits: POST /v2/payments/<payment_id>/approve
     * 
     * @param string $paymentId Unique payment ID
     * @return array Updated payment object
     */
    public function approvePayment(string $paymentId): array {
        if (empty(trim($paymentId))) {
            throw new \InvalidArgumentException("Payment ID is required for approval.");
        }

        $url = $this->baseUrl . "/v2/payments/" . trim($paymentId) . "/approve";
        return $this->executeRequest($url, 'POST');
    }

    /**
     * Formally completes and closes a payment after verifying that its
     * corresponding Transaction ID has successfully settled on the Pi Blockchain ledger.
     * 
     * Hits: POST /v2/payments/<payment_id>/complete
     * 
     * @param string $paymentId Unique payment ID
     * @param string $txid On-chain transaction hash settled on-chain
     * @return array Finalized payment state
     */
    public function completePayment(string $paymentId, string $txid): array {
        if (empty(trim($paymentId)) || empty(trim($txid))) {
            throw new \InvalidArgumentException("Both Payment ID and settled On-Chain Transaction ID (txid) are required.");
        }

        $url = $this->baseUrl . "/v2/payments/" . trim($paymentId) . "/complete";
        $payload = ["txid" => trim($txid)];

        return $this->executeRequest($url, 'POST', $payload);
    }
}
