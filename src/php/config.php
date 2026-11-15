<?php
/**
 * PothHalaPro - PHP REST API Configuration
 *
 * Lightweight, zero-dependency configuration for bookshops running
 * XAMPP, WAMP, or standard Apache/PHP environments.
 */

// Suppress display of PHP errors directly to HTTP output to prevent corrupted JSON
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Timezone for Sri Lanka
date_default_timezone_set('Asia/Colombo');

// Database Configuration Defaults (Standard XAMPP / WAMP defaults)
defined('DB_HOST') or define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
defined('DB_PORT') or define('DB_PORT', getenv('DB_PORT') ?: '3306');
defined('DB_NAME') or define('DB_NAME', getenv('DB_NAME') ?: 'pothhalapro');
defined('DB_USER') or define('DB_USER', getenv('DB_USER') ?: 'root');
defined('DB_PASS') or define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
defined('DB_CHARSET') or define('DB_CHARSET', 'utf8mb4');

// Cryptographic Salt for Offline License Key Verification (Matches Java & JS engine)
defined('KEY_SALT') or define('KEY_SALT', 'POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET');

// Local Data Directory for SQLite & file backups
defined('DATA_DIR') or define('DATA_DIR', __DIR__ . '/data');
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}

/**
 * Handle Cross-Origin Resource Sharing (CORS) headers.
 */
function handleCors() {
    if (headers_sent()) {
        return;
    }
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Send a standardized JSON response and exit.
 *
 * @param mixed $data
 * @param int $statusCode
 */
function jsonResponse($data, $statusCode = 200) {
    handleCors();
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send a standardized JSON error response.
 *
 * @param string $message
 * @param int $statusCode
 * @param array $extra
 */
function jsonError($message, $statusCode = 400, $extra = []) {
    $payload = array_merge([
        'error' => true,
        'message' => $message,
        'status_code' => $statusCode,
        'timestamp' => date('c')
    ], $extra);
    jsonResponse($payload, $statusCode);
}

/**
 * Read and decode incoming JSON request body or POST payload.
 *
 * @return array
 */
function getRequestBody() {
    $raw = file_get_contents('php://input');
    $data = [];
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $data = $decoded;
        }
    }
    // Merge URL query params and form-urlencoded POST fields
    return array_merge($_GET, $_POST, $data);
}

/**
 * Compute cryptographic 32-bit checksum matching PothHalaServer.java and license.js
 *
 * @param string $str
 * @return string 4-character base-36 uppercase hash
 */
function computeLicenseHash($str) {
    $hash = 0;
    $len = strlen($str);
    for ($i = 0; $i < $len; $i++) {
        $c = ord($str[$i]);
        // 32-bit signed integer arithmetic ((hash << 5) - hash) + c
        $hash = (($hash << 5) - $hash + $c) & 0xFFFFFFFF;
        if ($hash & 0x80000000) {
            $hash = $hash - 0x100000000;
        }
    }
    $abs = abs($hash);
    $b36 = strtoupper(base_convert((string)$abs, 10, 36));
    if (strlen($b36) < 4) {
        $b36 = str_pad($b36, 4, '0', STR_PAD_RIGHT);
    }
    return substr($b36, 0, 4);
}

/**
 * Validate format and cryptographic signature of an offline license key.
 *
 * @param string $code
 * @return array ['valid' => bool, 'reason' => string, 'details' => array]
 */
function verifyLicenseKeyFormat($code) {
    if (empty($code) || !is_string($code)) {
        return ['valid' => false, 'reason' => 'Empty or invalid license key parameter.'];
    }

    $clean = strtoupper(trim($code));
    $parts = explode('-', $clean);

    if (count($parts) !== 5 || $parts[0] !== 'PHP') {
        return [
            'valid' => false,
            'reason' => 'Invalid key format. Expected format: PHP-YYYY-XXXX-XXXX-XXXX'
        ];
    }

    list($prefix, $year, $p1, $p2, $p3) = $parts;
    $checkRaw = $year . '-' . $p1 . '-' . $p2 . '-' . KEY_SALT;
    $expected = computeLicenseHash($checkRaw);

    $matches = ($p3 === $expected) || (substr($p3, 0, strlen($expected)) === $expected) || (substr($expected, 0, strlen($p3)) === $p3);

    if (!$matches) {
        return [
            'valid' => false,
            'reason' => 'Cryptographic checksum mismatch. Key is invalid or tampered with.',
            'code' => $clean
        ];
    }

    return [
        'valid' => true,
        'year' => $year,
        'code' => $clean,
        'tier' => 'LIFETIME_PRO',
        'p1' => $p1,
        'p2' => $p2,
        'checksum' => $p3
    ];
}

/**
 * Generate a cryptographically valid activation key.
 *
 * @param string $year
 * @return string
 */
function generateLicenseKey($year = '2027') {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $charsLen = strlen($chars);
    $p1 = '';
    $p2 = '';

    for ($i = 0; $i < 4; $i++) {
        $p1 .= $chars[random_int(0, $charsLen - 1)];
        $p2 .= $chars[random_int(0, $charsLen - 1)];
    }

    $checkRaw = $year . '-' . $p1 . '-' . $p2 . '-' . KEY_SALT;
    $p3 = computeLicenseHash($checkRaw);

    return 'PHP-' . $year . '-' . $p1 . '-' . $p2 . '-' . $p3;
}
