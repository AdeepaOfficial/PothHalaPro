<?php
/**
 * PothHalaPro - Database Connection & Abstraction Layer
 *
 * Supports MySQL (standard for XAMPP / WAMP / phpMyAdmin)
 * with transparent offline fallback to SQLite for zero-configuration portability.
 */

require_once __DIR__ . '/config.php';

class DB {
    private static $instance = null;
    private $pdo = null;
    private $driver = 'none';
    private $error = null;

    private function __construct() {
        $this->connect();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Connect to MySQL, with graceful SQLite fallback.
     */
    private function connect() {
        // Attempt MySQL connection first
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 2, // Quick timeout if MySQL server not running
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            $this->driver = 'mysql';
            return;
        } catch (PDOException $e) {
            $this->error = 'MySQL connection failed: ' . $e->getMessage();
        }

        // If MySQL fails or database does not exist, fallback to portable SQLite
        try {
            $sqliteFile = DATA_DIR . '/pothhalapro_offline.sqlite';
            $isNew = !file_exists($sqliteFile);
            $this->pdo = new PDO('sqlite:' . $sqliteFile);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->driver = 'sqlite';

            if ($isNew) {
                $this->initSqliteTables();
            }
        } catch (Exception $e) {
            $this->driver = 'none';
            $this->error = 'SQLite fallback failed: ' . $e->getMessage();
        }
    }

    /**
     * Initialize SQLite schema if MySQL is unreachable.
     */
    private function initSqliteTables() {
        $schema = "
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            setting_group TEXT NOT NULL DEFAULT 'GENERAL',
            description TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_key TEXT NOT NULL UNIQUE,
            license_tier TEXT NOT NULL DEFAULT 'LIFETIME_PRO',
            shop_name TEXT NOT NULL,
            owner_name TEXT,
            phone_number TEXT,
            email TEXT,
            city TEXT,
            postal_code TEXT,
            max_devices INTEGER NOT NULL DEFAULT 2,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            price_paid REAL DEFAULT 0.0,
            currency TEXT DEFAULT 'LKR',
            issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            activated_at DATETIME,
            expires_at DATETIME,
            offline_token TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS device_fingerprints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_id INTEGER NOT NULL,
            fingerprint_hash TEXT NOT NULL,
            device_label TEXT NOT NULL DEFAULT 'Counter PC 1',
            ip_address TEXT,
            user_agent TEXT,
            os_platform TEXT,
            browser_name TEXT,
            screen_resolution TEXT,
            hardware_concurrency INTEGER,
            timezone TEXT DEFAULT 'Asia/Colombo',
            is_active INTEGER NOT NULL DEFAULT 1,
            registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(license_id, fingerprint_hash)
        );

        CREATE TABLE IF NOT EXISTS license_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_id INTEGER,
            action TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'SUCCESS',
            client_ip TEXT,
            fingerprint_hash TEXT,
            log_message TEXT NOT NULL,
            details_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS item_pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_code TEXT NOT NULL UNIQUE,
            item_name TEXT NOT NULL,
            sinhala_name TEXT,
            category TEXT NOT NULL,
            unit_price REAL NOT NULL,
            cost_price REAL DEFAULT 0.0,
            unit_measure TEXT DEFAULT 'page',
            is_pos_quick_item INTEGER DEFAULT 1,
            quick_item_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS counter_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_number TEXT NOT NULL UNIQUE,
            cashier_name TEXT NOT NULL DEFAULT 'Counter Cashier',
            terminal_label TEXT NOT NULL DEFAULT 'Terminal 1',
            subtotal REAL NOT NULL DEFAULT 0.0,
            discount_percent REAL DEFAULT 0.0,
            discount_amount REAL DEFAULT 0.0,
            grand_total REAL NOT NULL DEFAULT 0.0,
            cash_tendered REAL DEFAULT 0.0,
            change_due REAL DEFAULT 0.0,
            payment_method TEXT DEFAULT 'CASH',
            payment_reference TEXT,
            item_count INTEGER DEFAULT 1,
            notes TEXT,
            receipt_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS receipt_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER NOT NULL,
            item_pricing_id INTEGER,
            item_name TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            line_total REAL NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS print_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER,
            module_type TEXT NOT NULL,
            document_preset TEXT NOT NULL,
            copies INTEGER DEFAULT 1,
            scale_factor TEXT DEFAULT '100%_TRUE_SCALE',
            is_bw_enhanced INTEGER DEFAULT 0,
            paper_size TEXT DEFAULT 'A4',
            operator_name TEXT DEFAULT 'Counter Operator',
            printed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ";

        $this->pdo->exec($schema);
        $this->seedDefaultItems();
    }

    /**
     * Seed item catalog with standard Sri Lankan bookshop pricing in LKR.
     */
    public function seedDefaultItems() {
        $count = (int)$this->fetchOne("SELECT COUNT(*) as c FROM item_pricing")['c'];
        if ($count > 0) return;

        $items = [
            ['PHOTO-BW-A4-S', 'A4 B&W Photocopy (Single)', 'A4 කළු-සුදු පිටපත (තනි පැත්ත)', 'PHOTOCOPY', 10.00, 2.50, 'page', 1, 1],
            ['PHOTO-BW-A4-D', 'A4 B&W Photocopy (Double)', 'A4 කළු-සුදු පිටපත (දෙපැත්ත)', 'PHOTOCOPY', 15.00, 4.00, 'page', 1, 2],
            ['PHOTO-BW-A3', 'A3 B&W Photocopy', 'A3 කළු-සුදු පිටපත', 'PHOTOCOPY', 30.00, 7.50, 'page', 0, 10],
            ['PRINT-CLR-A4-PLAIN', 'Color Print A4 (Plain Paper)', 'A4 වර්ණ මුද්‍රණය (සාමාන්‍ය)', 'PRINTING', 40.00, 10.00, 'page', 1, 3],
            ['PRINT-CLR-A4-GLOSS', 'Color Print A4 (Photo Paper)', 'A4 වර්ණ මුද්‍රණය (ෆොටෝ කොළ)', 'PRINTING', 80.00, 25.00, 'page', 1, 4],
            ['PRINT-CLR-A3', 'Color Print A3 (Plain Paper)', 'A3 වර්ණ මුද්‍රණය', 'PRINTING', 90.00, 22.00, 'page', 0, 11],
            ['LAMIN-A4-POUCH', 'Pouch Laminating A4', 'A4 ලැමිනේටින්', 'LAMINATION', 120.00, 30.00, 'sheet', 1, 5],
            ['LAMIN-CARD-NIC', 'Pouch Laminating ID Card / NIC', 'හැඳුනුම්පත් ලැමිනේටින්', 'LAMINATION', 50.00, 12.00, 'card', 1, 6],
            ['LAMIN-A3-POUCH', 'Pouch Laminating A3', 'A3 ලැමිනේටින්', 'LAMINATION', 250.00, 65.00, 'sheet', 0, 12],
            ['BIND-SPIRAL-CR', 'Spiral Binding (CR Book / 100p)', 'සර්පිලාකාර බයින්ඩිං (පිටු 100)', 'BINDING', 200.00, 45.00, 'book', 1, 7],
            ['BIND-SPIRAL-LRG', 'Spiral Binding (Large / 200p+)', 'සර්පිලාකාර බයින්ඩිං (පිටු 200+)', 'BINDING', 350.00, 70.00, 'book', 0, 13],
            ['BIND-TAPE-A4', 'Hard Spine Tape Binding A4', 'ටේප් බයින්ඩිං A4', 'BINDING', 100.00, 20.00, 'book', 0, 14],
            ['NIC-CLONE-A4', 'Smart NIC / DL 1:1 Scale Print', 'හැඳුනුම්පත් 1:1 මුද්‍රණය', 'GOV_DOCUMENTS', 50.00, 10.00, 'sheet', 1, 8],
            ['NIC-CLONE-4ECO', 'Smart NIC 4-Copy Eco Print', '4-Copy Eco හැඳුනුම්පත් පිටපත', 'GOV_DOCUMENTS', 80.00, 15.00, 'sheet', 0, 15],
            ['PHOTO-PASSPORT-8', 'Passport Photo 8-Grid (35x45mm)', 'පාස්පෝට් ඡායාරූප 8ක්', 'PASSPORT_PHOTO', 250.00, 35.00, 'sheet', 1, 9],
            ['PHOTO-VISA-6', 'US / Visa Photo 6-Grid (2x2")', 'වීසා ඡායාරූප 6ක් (2x2 අඟල්)', 'PASSPORT_PHOTO', 300.00, 40.00, 'sheet', 0, 16],
            ['STK-SCH-MULTI', 'School Name Stickers (Multi-Pack 8-up)', 'පාසල් පොත් ස්ටිකර් (විෂය 8ක්)', 'STICKERS', 200.00, 35.00, 'sheet', 1, 10],
            ['STK-SCH-SINGLE', 'School Name Stickers (8-Pack Identical)', 'පාසල් පොත් ස්ටිකර් (තනි විෂය)', 'STICKERS', 150.00, 30.00, 'sheet', 0, 17],
            ['DOC-GOV-MTA', 'Sri Lanka Govt Form Print (MTA/Pass)', 'රජයේ අයදුම්පත් මුද්‍රණය', 'GOV_DOCUMENTS', 40.00, 8.00, 'form', 0, 18],
            ['DOC-LEGAL-AFF', 'Affidavit / Rental Agreement Form', 'දිවුරුම් ප්‍රකාශ / කුලී ගිවිසුම්', 'GOV_DOCUMENTS', 50.00, 10.00, 'document', 0, 19],
            ['DOC-CV-1PAGE', 'Fast 1-Page Professional CV Print', 'CV මුද්‍රණය (වෘත්තීය ආකෘතිය)', 'PRINTING', 100.00, 15.00, 'page', 0, 20]
        ];

        $stmt = $this->pdo->prepare("
            INSERT INTO item_pricing 
            (item_code, item_name, sinhala_name, category, unit_price, cost_price, unit_measure, is_pos_quick_item, quick_item_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($items as $item) {
            $stmt->execute($item);
        }
    }

    public function getDriver() {
        return $this->driver;
    }

    public function isConnected() {
        return $this->pdo !== null;
    }

    public function getError() {
        return $this->error;
    }

    public function getPdo() {
        return $this->pdo;
    }

    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $result = $stmt->fetch();
        return $result ? $result : null;
    }

    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function insert($table, array $data) {
        $keys = array_keys($data);
        $fields = implode(', ', $keys);
        $placeholders = implode(', ', array_fill(0, count($keys), '?'));
        $sql = "INSERT INTO {$table} ({$fields}) VALUES ({$placeholders})";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_values($data));
        return $this->pdo->lastInsertId();
    }

    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    public function commit() {
        return $this->pdo->commit();
    }

    public function rollBack() {
        if ($this->pdo->inTransaction()) {
            return $this->pdo->rollBack();
        }
        return false;
    }
}
