<?php
namespace PiNetwork;

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

class PiPaymentVerifier {
    private string $apiKey;
    private string $baseUrl;
    private int $timeoutSeconds;

    public function __construct(
        string $apiKey,
        string $baseUrl = "https://api.minepi.com",
        int $timeoutSeconds = 10
    ) {
        $trimmedKey = trim($apiKey);
        if ($trimmedKey === '') {
            throw new \InvalidArgumentException("Developer API Key is required.");
        }

        $this->apiKey = $trimmedKey;
        $this->baseUrl = rtrim(trim($baseUrl), '/');
        $this->timeoutSeconds = max(1, $timeoutSeconds);
    }

    public function getUserProfile(string $accessToken): array {
        $cleanToken = trim($accessToken);
        if ($cleanToken === '') {
            throw new \InvalidArgumentException("Access token is required.");
        }

        return $this->executeRequest(
            "{$this->baseUrl}/v2/me",
            'GET',
            null,
            ["Authorization: Bearer {$cleanToken}"],
            false
        );
    }

    public function getPayment(string $paymentId): array {
        $encodedId = $this->encodePaymentId($paymentId);
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$encodedId}");
    }

    public function approvePayment(string $paymentId): array {
        $encodedId = $this->encodePaymentId($paymentId);
        return $this->executeRequest(
            "{$this->baseUrl}/v2/payments/{$encodedId}/approve",
            'POST',
            []
        );
    }

    public function completePayment(string $paymentId, string $txid): array {
        $encodedId = $this->encodePaymentId($paymentId);
        $cleanTxid = trim($txid);
        if ($cleanTxid === '') {
            throw new \InvalidArgumentException("Transaction ID (txid) is required.");
        }

        return $this->executeRequest(
            "{$this->baseUrl}/v2/payments/{$encodedId}/complete",
            'POST',
            ['txid' => $cleanTxid]
        );
    }

    private function encodePaymentId(string $paymentId): string {
        $cleanId = trim($paymentId);
        if ($cleanId === '') {
            throw new \InvalidArgumentException("Payment ID is required.");
        }
        return rawurlencode($cleanId);
    }

    private function executeRequest(
        string $url,
        string $method = 'GET',
        ?array $payload = null,
        array $additionalHeaders = [],
        bool $includeServerKey = true
    ): array {
        $ch = curl_init();
        if ($ch === false) {
            throw new PiAPIException(500, "Failed to initialize cURL handle.");
        }

        $baseHeaders = [
            "Content-Type: application/json",
            "Accept: application/json",
            "User-Agent: Pi-PHP-Community-SDK/1.0.1",
        ];

        if ($includeServerKey) {
            array_unshift($baseHeaders, "Authorization: Key {$this->apiKey}");
        }

        $headers = array_merge($baseHeaders, $additionalHeaders);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeoutSeconds);

        $upperMethod = strtoupper($method);
        if ($upperMethod === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            $encodedPayload = $payload !== null ? json_encode($payload) : '{}';
            curl_setopt($ch, CURLOPT_POSTFIELDS, $encodedPayload);
        }

        $response = curl_exec($ch);
        $curlErrno = curl_errno($ch);
        $curlError = curl_error($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $curlErrno !== 0) {
            throw new PiAPIException(
                502,
                "cURL transport error ({$curlErrno}): {$curlError}",
                null
            );
        }

        $responseBody = (string) $response;
        $data = json_decode($responseBody, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            throw new PiAPIException(
                $statusCode > 0 ? $statusCode : 502,
                "Invalid or non-JSON response from Pi API: " . json_last_error_msg(),
                $responseBody
            );
        }

        if ($statusCode >= 400) {
            $message = (string) ($data['error'] ?? $data['message'] ?? $data['detail'] ?? 'API error');
            throw new PiAPIException($statusCode, $message, $responseBody);
        }

        return $data;
    }
}