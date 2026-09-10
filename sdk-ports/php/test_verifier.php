<?php
/**
 * Project Bazaar: Pi Network Backend SDK Unit Test Runner (PHP Edition)
 * File Location: /sdk-ports/php/test_verifier.php
 * Version: 2.0.0
 * Description:
 *     A comprehensive, zero-dependency, namespace-mocked unit test suite
 *     for PiPaymentVerifier.php. Intercepts native PHP cURL requests to
 *     verify correct header structures, error handling, and payload schemas.
 *     Updated to fix strict type comparison float-to-int JSON decoding warnings.
 */

// 1. Declare namespace mock functions BEFORE importing the target class.
namespace PiNetwork {
    class MockCurl {
        public static bool $shouldFail = false;
        public static string $errorMsg = "";
        public static string $responseBody = "";
        public static int $httpCode = 200;
        public static string $contentType = "application/json";

        // Intercept logs
        public static array $calledOptions = [];
        public static ?string $calledUrl = null;

        public static function reset(): void {
            self::$shouldFail = false;
            self::$errorMsg = "";
            self::$responseBody = "";
            self::$httpCode = 200;
            self::$contentType = "application/json";
            self::$calledOptions = [];
            self::$calledUrl = null;
        }
    }

    // Override global curl_* functions within the PiNetwork namespace
    function curl_init(?string $url = null) {
        MockCurl::$calledUrl = $url;
        return "mock-curl-resource-handle";
    }

    function curl_setopt($ch, int $option, $value): bool {
        MockCurl::$calledOptions[$option] = $value;
        return true;
    }

    function curl_exec($ch) {
        if (MockCurl::$shouldFail) {
            return false;
        }
        return MockCurl::$responseBody;
    }

    function curl_getinfo($ch, int $option = 0) {
        if ($option === CURLINFO_HTTP_CODE) {
            return MockCurl::$httpCode;
        }
        if ($option === CURLINFO_CONTENT_TYPE) {
            return MockCurl::$contentType;
        }
        return null;
    }

    function curl_error($ch): string {
        return MockCurl::$errorMsg;
    }

    function curl_close($ch): void {}
}

// 2. Define test assertions and execute tests in global/runner scope
namespace {
    use PiNetwork\PiPaymentVerifier;
    use PiNetwork\PiAPIException;
    use PiNetwork\MockCurl;

    // Load the target verifier class
    require_once __DIR__ . '/PiPaymentVerifier.php';

    // ANSI escape color helpers
    define('COLOR_GREEN', "\033[32m");
    define('COLOR_RED', "\033[31m");
    define('COLOR_CYAN', "\033[36m");
    define('COLOR_RESET', "\033[0m");

    $passed = 0;
    $failed = 0;

    function assert_equals($expected, $actual, string $testName): void {
        global $passed, $failed;
        if ($expected === $actual) {
            echo COLOR_GREEN . "  ✓ " . $testName . " PASSED" . COLOR_RESET . "\n";
            $passed++;
        } else {
            echo COLOR_RED . "  ✗ " . $testName . " FAILED" . COLOR_RESET . "\n";
            echo "    Expected: " . print_r($expected, true) . " (" . gettype($expected) . ")\n";
            echo "    Actual:   " . print_r($actual, true) . " (" . gettype($actual) . ")\n";
            $failed++;
        }
    }

    function assert_throws(callable $block, string $exceptionClass, string $testName): void {
        global $passed, $failed;
        try {
            $block();
            echo COLOR_RED . "  ✗ " . $testName . " FAILED (No exception thrown)" . COLOR_RESET . "\n";
            $failed++;
        } catch (\Throwable $e) {
            if ($e instanceof $exceptionClass) {
                echo COLOR_GREEN . "  ✓ " . $testName . " PASSED" . COLOR_RESET . "\n";
                $passed++;
            } else {
                echo COLOR_RED . "  ✗ " . $testName . " FAILED (Wrong exception type: " . get_class($e) . ")" . COLOR_RESET . "\n";
                $failed++;
            }
        }
    }

    echo "==========================================================\n";
    echo COLOR_CYAN . "🐘 PI NETWORK PHP COMMUNITY VERIFIER: RUNNING TESTS 🐘" . COLOR_RESET . "\n";
    echo "==========================================================\n\n";

    // Initialize client instance
    $verifier = new PiNetwork\PiPaymentVerifier("mock_api_key");

    // -------------------------------------------------------------
    // TEST 1: verifyAccessToken with valid token
    // -------------------------------------------------------------
    MockCurl::reset();
    MockCurl::$responseBody = json_encode([
        "uid" => "pioneer-user-123",
        "username" => "Sovereign_Founder",
        "roles" => ["pioneer", "moderator"]
    ]);

    $profile = $verifier->verifyAccessToken("valid_access_token_abc");
    assert_equals("pioneer-user-123", $profile['uid'], "verifyAccessToken -> Valid UID");
    assert_equals("Sovereign_Founder", $profile['username'], "verifyAccessToken -> Valid Username");

    // Verify correct authorization headers were configured (Bearer authorization override)
    $sentHeaders = MockCurl::$calledOptions[CURLOPT_HTTPHEADER] ?? [];
    $hasBearerHeader = false;
    foreach ($sentHeaders as $header) {
        if (strpos($header, "Authorization: Bearer valid_access_token_abc") === 0) {
            $hasBearerHeader = true;
        }
    }
    assert_equals(true, $hasBearerHeader, "verifyAccessToken -> Authorization Bearer Override Header");

    // -------------------------------------------------------------
    // TEST 2: getPayment with valid ID
    // -------------------------------------------------------------
    MockCurl::reset();
    MockCurl::$responseBody = json_encode([
        "identifier" => "pay_7721832938472",
        "amount" => 10, // Encodes cleanly as integer 10
        "memo" => "Store Purchase",
        "status" => "pending"
    ]);

    $payment = $verifier->getPayment("pay_7721832938472");
    assert_equals("pay_7721832938472", $payment['identifier'], "getPayment -> Identifies payment ID");
    assert_equals(10, $payment['amount'], "getPayment -> Identifies correct value");

    // Verify key auth was restored
    $sentHeaders = MockCurl::$calledOptions[CURLOPT_HTTPHEADER] ?? [];
    $hasKeyHeader = false;
    foreach ($sentHeaders as $header) {
        if (strpos($header, "Authorization: Key mock_api_key") === 0) {
            $hasKeyHeader = true;
        }
    }
    assert_equals(true, $hasKeyHeader, "getPayment -> Default S2S API Key Header");

    // -------------------------------------------------------------
    // TEST 3: approvePayment with valid ID
    // -------------------------------------------------------------
    MockCurl::reset();
    MockCurl::$responseBody = json_encode([
        "identifier" => "pay_7721832938472",
        "status" => "approved"
    ]);

    $approved = $verifier->approvePayment("pay_7721832938472");
    assert_equals("approved", $approved['status'], "approvePayment -> Confirms approved status");
    assert_equals(true, MockCurl::$calledOptions[CURLOPT_POST] ?? false, "approvePayment -> Dispatches via POST verb");

    // -------------------------------------------------------------
    // TEST 4: completePayment with valid parameters
    // -------------------------------------------------------------
    MockCurl::reset();
    MockCurl::$responseBody = json_encode([
        "identifier" => "pay_7721832938472",
        "status" => "completed"
    ]);

    $completed = $verifier->completePayment("pay_7721832938472", "stellar_txid_99213847");
    assert_equals("completed", $completed['status'], "completePayment -> Confirms transaction finality");
    
    $payloadData = json_decode(MockCurl::$calledOptions[CURLOPT_POSTFIELDS] ?? "{}", true);
    assert_equals("stellar_txid_99213847", $payloadData['txid'] ?? "", "completePayment -> Injects transaction hash parameter");

    // -------------------------------------------------------------
    // TEST 5: Gateway Crash Exception Handling (502 HTML fallback)
    // -------------------------------------------------------------
    MockCurl::reset();
    MockCurl::$contentType = "text/html";
    MockCurl::$httpCode = 502;
    MockCurl::$responseBody = "<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1></body></html>";

    assert_throws(function() use ($verifier) {
        $verifier->getPayment("pay_gateway_crash");
    }, PiAPIException::class, "getPayment -> Defends against Gateway HTML response");

    // Let's verify that the exception message parses the HTML excerpt instead of throwing a JSON crash
    try {
        $verifier->getPayment("pay_gateway_crash");
    } catch (PiAPIException $e) {
        $msgHasGatewaySnippet = strpos($e->getMessage(), "502 Bad Gateway") !== false;
        assert_equals(true, $msgHasGatewaySnippet, "getPayment -> Exception message extracts HTML error cleanly");
        assert_equals(502, $e->getStatusCode(), "getPayment -> Retains underlying status code");
    }

    // -------------------------------------------------------------
    // TEST 6: Validation Guard Checks (Invalid empty arguments)
    // -------------------------------------------------------------
    assert_throws(function() use ($verifier) {
        $verifier->verifyAccessToken("   ");
    }, \InvalidArgumentException::class, "verifyAccessToken -> Throws on blank token validation");

    assert_throws(function() use ($verifier) {
        $verifier->completePayment("pay_123", "");
    }, \InvalidArgumentException::class, "completePayment -> Throws on empty TXID confirmation");


    echo "\n==========================================================\n";
    if ($failed === 0) {
        echo COLOR_GREEN . "🎉 SUCCESS: All " . $passed . " unit test assertions passed! " . COLOR_RESET . "\n";
    } else {
        echo COLOR_RED . "💥 FAILURE: " . $failed . " assertions failed. " . COLOR_RESET . "\n";
    }
    echo "==========================================================\n";

    // Exit with appropriate status code for CI runners
    exit($failed === 0 ? 0 : 1);
}
