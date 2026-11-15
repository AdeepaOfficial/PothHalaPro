<?php
/**
 * PothHalaPro - License & Device Fingerprint REST API
 *
 * Provides cryptographic offline license key validation, key generation,
 * multi-terminal hardware binding (up to 2 counter PCs), and audit tracking.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function handleLicenseRequest() {
    handleCors();
    $db = DB::getInstance();
    $params = getRequestBody();

    $action = isset($params['action']) ? trim($params['action']) : '';
    if (empty($action) && isset($_GET['code'])) {
        $action = 'verify';
    }

    switch ($action) {
        case 'verify':
            $code = isset($params['code']) ? trim($params['code']) : '';
            $check = verifyLicenseKeyFormat($code);
            if (!$check['valid']) {
                jsonResponse([
                    'valid' => false,
                    'code' => $code,
                    'reason' => $check['reason']
                ], 200);
            }

            // Check against database if connected
            $shopData = null;
            $boundCount = 0;
            if ($db->isConnected()) {
                try {
                    $license = $db->fetchOne(
                        "SELECT * FROM licenses WHERE license_key = ?",
                        [$check['code']]
                    );
                    if ($license) {
                        $devices = $db->fetchAll(
                            "SELECT * FROM device_fingerprints WHERE license_id = ? AND is_active = 1",
                            [$license['id']]
                        );
                        $boundCount = count($devices);
                        $shopData = [
                            'id' => (int)$license['id'],
                            'shop_name' => $license['shop_name'],
                            'owner_name' => $license['owner_name'],
                            'status' => $license['status'],
                            'max_devices' => (int)$license['max_devices'],
                            'bound_devices' => $boundCount,
                            'remaining_devices' => max(0, (int)$license['max_devices'] - $boundCount),
                            'activated_at' => $license['activated_at'],
                            'expires_at' => $license['expires_at']
                        ];

                        // Log validation attempt
                        $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
                        $fp = isset($params['fingerprint']) ? $params['fingerprint'] : null;
                        $db->insert('license_audit_logs', [
                            'license_id' => $license['id'],
                            'action' => 'VALIDATION_ATTEMPT',
                            'status' => 'SUCCESS',
                            'client_ip' => $clientIp,
                            'fingerprint_hash' => $fp,
                            'log_message' => 'License verified successfully via PHP REST API',
                            'details_json' => json_encode(['tier' => $license['license_tier']])
                        ]);
                    }
                } catch (Exception $e) {
                    // Fall back to offline validation
                }
            }

            $response = [
                'valid' => true,
                'code' => $check['code'],
                'tier' => 'LIFETIME_PRO',
                'year' => $check['year'],
                'offline_checksum_verified' => true,
                'status' => $shopData ? $shopData['status'] : 'ACTIVE_UNREGISTERED',
                'database_verified' => ($shopData !== null),
                'details' => $shopData ?: [
                    'shop_name' => 'PothHalaPro Bookshop & Print Studio',
                    'max_devices' => 2,
                    'bound_devices' => 0,
                    'remaining_devices' => 2
                ]
            ];
            jsonResponse($response, 200);
            break;

        case 'generate':
            $year = isset($params['year']) ? preg_replace('/[^0-9]/', '', $params['year']) : '2027';
            if (empty($year)) $year = '2027';
            $newKey = generateLicenseKey($year);

            $shopName = isset($params['shop_name']) ? trim($params['shop_name']) : null;
            $ownerName = isset($params['owner_name']) ? trim($params['owner_name']) : null;
            $phone = isset($params['phone']) ? trim($params['phone']) : null;
            $tier = isset($params['tier']) ? trim($params['tier']) : 'LIFETIME_PRO';

            $insertedId = null;
            if ($shopName && $db->isConnected()) {
                try {
                    $insertedId = $db->insert('licenses', [
                        'license_key' => $newKey,
                        'license_tier' => $tier,
                        'shop_name' => $shopName,
                        'owner_name' => $ownerName,
                        'phone_number' => $phone,
                        'max_devices' => 2,
                        'status' => 'ACTIVE',
                        'price_paid' => 12500.00,
                        'currency' => 'LKR',
                        'notes' => 'Generated via PHP REST API'
                    ]);

                    $db->insert('license_audit_logs', [
                        'license_id' => $insertedId,
                        'action' => 'GENERATED',
                        'status' => 'SUCCESS',
                        'client_ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                        'log_message' => "Key generated for {$shopName}",
                        'details_json' => json_encode(['tier' => $tier, 'key' => $newKey])
                    ]);
                } catch (Exception $e) {
                    // Ignored if DB write fails
                }
            }

            jsonResponse([
                'generated' => true,
                'code' => $newKey,
                'tier' => $tier,
                'year' => $year,
                'shop_name' => $shopName,
                'id' => $insertedId,
                'created_at' => date('Y-m-d H:i:s')
            ], 200);
            break;

        case 'register_device':
        case 'activate':
            $code = isset($params['code']) ? trim($params['code']) : (isset($params['license_key']) ? trim($params['license_key']) : '');
            $fingerprint = isset($params['fingerprint']) ? trim($params['fingerprint']) : (isset($params['fingerprint_hash']) ? trim($params['fingerprint_hash']) : '');
            $deviceLabel = isset($params['device_label']) ? trim($params['device_label']) : 'Counter Terminal';

            if (empty($code) || empty($fingerprint)) {
                jsonError('Both license key (code) and device fingerprint are required.', 400);
            }

            $check = verifyLicenseKeyFormat($code);
            if (!$check['valid']) {
                jsonError('Invalid license key: ' . $check['reason'], 400);
            }

            if (!$db->isConnected()) {
                // Return offline success if no database is available
                jsonResponse([
                    'success' => true,
                    'offline_mode' => true,
                    'message' => 'License verified cryptographically in offline mode.',
                    'code' => $check['code'],
                    'fingerprint' => $fingerprint
                ], 200);
            }

            // Find or register license in DB
            $license = $db->fetchOne("SELECT * FROM licenses WHERE license_key = ?", [$check['code']]);
            if (!$license) {
                $shopName = isset($params['shop_name']) ? trim($params['shop_name']) : 'Registered Bookshop';
                $licId = $db->insert('licenses', [
                    'license_key' => $check['code'],
                    'license_tier' => 'LIFETIME_PRO',
                    'shop_name' => $shopName,
                    'max_devices' => 2,
                    'status' => 'ACTIVE',
                    'activated_at' => date('Y-m-d H:i:s')
                ]);
                $license = $db->fetchOne("SELECT * FROM licenses WHERE id = ?", [$licId]);
            }

            // Check existing registered devices
            $existing = $db->fetchAll(
                "SELECT * FROM device_fingerprints WHERE license_id = ? AND is_active = 1",
                [$license['id']]
            );

            // Check if this fingerprint is already registered
            $alreadyBound = false;
            foreach ($existing as $dev) {
                if ($dev['fingerprint_hash'] === $fingerprint) {
                    $alreadyBound = true;
                    // Update last verified timestamp
                    $db->query(
                        "UPDATE device_fingerprints SET last_verified_at = CURRENT_TIMESTAMP WHERE id = ?",
                        [$dev['id']]
                    );
                    break;
                }
            }

            if (!$alreadyBound) {
                $maxDevices = (int)$license['max_devices'];
                if (count($existing) >= $maxDevices) {
                    jsonError(
                        "Maximum device limit ({$maxDevices} counter PCs) reached for this lifetime license. Contact distributor for additional terminal licenses.",
                        403,
                        ['bound_count' => count($existing), 'max_devices' => $maxDevices]
                    );
                }

                $db->insert('device_fingerprints', [
                    'license_id' => $license['id'],
                    'fingerprint_hash' => $fingerprint,
                    'device_label' => $deviceLabel,
                    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Desktop App',
                    'os_platform' => isset($params['os_platform']) ? $params['os_platform'] : 'Windows',
                    'browser_name' => isset($params['browser_name']) ? $params['browser_name'] : 'Browser',
                    'screen_resolution' => isset($params['screen_resolution']) ? $params['screen_resolution'] : '1920x1080',
                    'hardware_concurrency' => isset($params['hardware_concurrency']) ? (int)$params['hardware_concurrency'] : 4,
                    'is_active' => 1
                ]);

                $db->insert('license_audit_logs', [
                    'license_id' => $license['id'],
                    'action' => 'DEVICE_BOUND',
                    'status' => 'SUCCESS',
                    'client_ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                    'fingerprint_hash' => $fingerprint,
                    'log_message' => "Bound terminal '{$deviceLabel}' to license",
                    'details_json' => json_encode(['slot' => count($existing) + 1, 'max' => $maxDevices])
                ]);
            }

            jsonResponse([
                'success' => true,
                'status' => 'ACTIVE',
                'code' => $license['license_key'],
                'shop_name' => $license['shop_name'],
                'device_label' => $deviceLabel,
                'bound_devices' => count($existing) + ($alreadyBound ? 0 : 1),
                'max_devices' => (int)$license['max_devices'],
                'message' => 'Device bound successfully. 1:1 scale prints and PRO features unlocked.'
            ], 200);
            break;

        case 'devices':
            $code = isset($params['code']) ? trim($params['code']) : '';
            if (empty($code)) {
                jsonError('License key (code) required.', 400);
            }
            if (!$db->isConnected()) {
                jsonResponse(['devices' => []], 200);
            }
            $license = $db->fetchOne("SELECT * FROM licenses WHERE license_key = ?", [$code]);
            if (!$license) {
                jsonError('License not found.', 404);
            }
            $devices = $db->fetchAll(
                "SELECT id, device_label, os_platform, browser_name, registered_at, last_verified_at, is_active FROM device_fingerprints WHERE license_id = ?",
                [$license['id']]
            );
            jsonResponse([
                'license_key' => $license['license_key'],
                'shop_name' => $license['shop_name'],
                'max_devices' => (int)$license['max_devices'],
                'bound_count' => count($devices),
                'devices' => $devices
            ], 200);
            break;

        default:
            jsonResponse([
                'module' => 'PothHalaPro License API',
                'actions' => [
                    'GET/POST ?action=verify&code=PHP-YYYY-XXXX-XXXX-XXXX' => 'Verify license key and checksum',
                    'GET/POST ?action=generate&year=2027' => 'Generate cryptographically valid lifetime license key',
                    'POST ?action=register_device' => 'Bind counter PC hardware fingerprint to license',
                    'GET ?action=devices&code=...' => 'List bound counter terminals for license'
                ]
            ], 200);
            break;
    }
}

// Execute when invoked directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    handleLicenseRequest();
}
