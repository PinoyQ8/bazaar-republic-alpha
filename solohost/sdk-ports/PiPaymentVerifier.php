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
    public function getStatusCode(): int { return $this->statusCode; }
    public function getResponseBody(): ?string { return $this->responseBody; }
}

class PiPaymentVerifier {
    private string $apiKey;
    private string $baseUrl;

    public function __construct(string $apiKey, string $baseUrl = "https://api.minepi.com") {
        if (empty(trim($apiKey))) {
            throw new \InvalidArgumentException("Developer API Key is required.");
        }
        $this->apiKey = trim($apiKey);
        $this->baseUrl = rtrim(trim($baseUrl), '/');
    }

    public function getUserProfile(string $accessToken): array {
        return $this->executeRequest("{$this->baseUrl}/v2/me", 'GET', null, ["Authorization: Bearer {$accessToken}"]);
    }

    public function getPayment(string $paymentId): array {
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$paymentId}");
    }

    public function approvePayment(string $paymentId): array {
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$paymentId}/approve", 'POST', []);
    }

    public function completePayment(string $paymentId, string $txid): array {
        return $this->executeRequest("{$this->baseUrl}/v2/payments/{$paymentId}/complete", 'POST', ['txid' => $txid]);
    }

    private function executeRequest(string $url, string $method = 'GET', ?array $payload = null, array $additionalHeaders = []): array {
        $ch = curl_init();
        $headers = array_merge([
            "Authorization: Key " . $this->apiKey,
            "Content-Type: application/json",
            "User-Agent: Pi-PHP-Community-SDK/1.0.0"
        ], $additionalHeaders);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($payload !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            }
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);
        if ($statusCode >= 400 || !$data) {
            throw new PiAPIException($statusCode, $data['error'] ?? 'API error', $response);
        }
        return $data;
    }
}