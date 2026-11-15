<?php
/**
 * PothHalaPro - Master REST API Router & Status Gateway
 *
 * Unified front-controller for bookshops running on XAMPP, WAMP, or Apache.
 * Routes license verification, POS billing receipts, item catalog, and status.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/license.php';
require_once __DIR__ . '/billing.php';

// Handle CORS for all API calls
handleCors();

// Extract route from query parameter, PATH_INFO, or REQUEST_URI
$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';

if (empty($route) && !empty($_SERVER['PATH_INFO'])) {
    $route = trim($_SERVER['PATH_INFO'], '/');
}

if (empty($route) && !empty($_SERVER['REQUEST_URI'])) {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if (strpos($path, $script) === 0) {
        $route = trim(substr($path, strlen($script)), '/');
    } elseif (strpos($path, '/api/') !== false) {
        $parts = explode('/api/', $path, 2);
        $route = trim($parts[1] ?? '', '/');
    }
}

// Check action parameter as fallback
$action = isset($_GET['action']) ? trim($_GET['action']) : (isset($_POST['action']) ? trim($_POST['action']) : '');

// Route Resolution
if (strpos($route, 'license') === 0 || in_array($action, ['verify', 'generate', 'register_device', 'devices'])) {
    // Determine sub-action from route if not set
    if (empty($action)) {
        $routeParts = explode('/', $route);
        if (isset($routeParts[1])) {
            $_GET['action'] = $routeParts[1];
        }
    }
    handleLicenseRequest();
} elseif (strpos($route, 'billing') === 0 || in_array($action, ['items', 'catalog', 'create_receipt', 'checkout', 'receipts', 'receipt', 'daily_summary', 'summary', 'log_print'])) {
    if (empty($action)) {
        $routeParts = explode('/', $route);
        if (isset($routeParts[1])) {
            $_GET['action'] = $routeParts[1];
        }
    }
    handleBillingRequest();
} elseif ($route === 'status' || $action === 'status' || empty($route)) {
    $db = DB::getInstance();
    $dbConnected = $db->isConnected();
    $driver = $db->getDriver();

    $itemCount = 0;
    $receiptCount = 0;
    if ($dbConnected) {
        try {
            $itemRow = $db->fetchOne("SELECT COUNT(*) as c FROM item_pricing WHERE is_active = 1");
            $itemCount = $itemRow ? (int)$itemRow['c'] : 0;
            $rcpRow = $db->fetchOne("SELECT COUNT(*) as c FROM counter_receipts");
            $receiptCount = $rcpRow ? (int)$rcpRow['c'] : 0;
        } catch (Exception $e) {
            // Non-critical
        }
    }

    jsonResponse([
        'status' => 'running',
        'name' => 'PothHalaPro Print Studio PHP Backend',
        'version' => '1.0.0',
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'PHP CLI / Standalone Server',
        'environment' => [
            'os' => PHP_OS,
            'timezone' => date_default_timezone_get(),
            'database_driver' => $driver,
            'database_connected' => $dbConnected,
            'database_error' => $db->getError()
        ],
        'catalog' => [
            'active_items_count' => $itemCount,
            'total_receipts_recorded' => $receiptCount,
            'currency' => 'LKR'
        ],
        'features' => [
            'offline_cryptographic_license' => true,
            'device_fingerprint_binding' => true,
            'max_counter_terminals' => 2,
            'fast_billing_pos' => true,
            'thermal_receipt_generator' => true,
            'lanka_qr_support' => true,
            'true_scale_1to1_print_logs' => true
        ],
        'endpoints' => [
            'status' => '?route=status',
            'license_verify' => '?route=license/verify&code=PHP-YYYY-XXXX-XXXX-XXXX',
            'license_generate' => '?route=license/generate&year=2027',
            'license_register_device' => '?route=license/register_device (POST)',
            'billing_items' => '?route=billing/items',
            'billing_receipt_create' => '?route=billing/create_receipt (POST)',
            'billing_receipts_list' => '?route=billing/receipts',
            'billing_receipt_get' => '?route=billing/receipt&id=1',
            'billing_daily_summary' => '?route=billing/daily_summary'
        ],
        'timestamp' => date('c')
    ], 200);
} else {
    jsonError("Unknown route: '{$route}'. Use /api.php?route=status to view available endpoints.", 404);
}
