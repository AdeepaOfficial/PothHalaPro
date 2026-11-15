-- ============================================================================
-- PothHalaPro - All-in-One Bookshop, Communication & Education Print Studio
-- Relational Database Schema (MySQL 8.0+)
--
-- Modules Covered:
--   1. License Management & Offline Activation (Lifetime License, Cryptographic Keys)
--   2. Device Fingerprints & Multi-Terminal Hardware Binding (Up to 2 Counter PCs)
--   3. Item Pricing Catalog (Photocopies, Lamination, Stickers, Print Services)
--   4. Counter Sales & Fast Billing POS (Receipts, Line Items, LankaQR/Cash)
--   5. Sticker Studio & Document Print Job Audit Logs
--   6. Wholesale Distributors & License Audit Trail
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS print_jobs;
DROP TABLE IF EXISTS receipt_items;
DROP TABLE IF EXISTS counter_receipts;
DROP TABLE IF EXISTS item_pricing;
DROP TABLE IF EXISTS license_audit_logs;
DROP TABLE IF EXISTS device_fingerprints;
DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS distributors;
DROP TABLE IF EXISTS sticker_templates;
DROP TABLE IF EXISTS system_settings;
DROP VIEW IF EXISTS view_daily_sales_summary;
DROP VIEW IF EXISTS view_active_license_devices;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. SYSTEM CONFIGURATION & SHOP PROFILE
-- ----------------------------------------------------------------------------
CREATE TABLE system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(64) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Application and shop environment settings';

-- ----------------------------------------------------------------------------
-- 2. WHOLESALE DISTRIBUTORS
-- ----------------------------------------------------------------------------
CREATE TABLE distributors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    distributor_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(200) NULL,
    contact_phone VARCHAR(30) NOT NULL,
    contact_email VARCHAR(150) NULL,
    region VARCHAR(100) NOT NULL COMMENT 'Province/District in Sri Lanka',
    commission_rate DECIMAL(5,2) UNSIGNED NOT NULL DEFAULT 20.00 COMMENT 'Percentage commission on key packs',
    allocated_key_count INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_distributor_region (region),
    INDEX idx_distributor_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hardware dealers and POS distributors selling license keys';

-- ----------------------------------------------------------------------------
-- 3. LICENSES & ONE-TIME ACTIVATION TOKENS
-- ----------------------------------------------------------------------------
CREATE TABLE licenses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    license_key VARCHAR(64) NOT NULL UNIQUE COMMENT 'Format: PHP-YYYY-XXXX-XXXX-XXXX',
    license_tier ENUM('DEMO_TRIAL', 'STANDARD', 'LIFETIME_PRO', 'ENTERPRISE_DISTRIBUTOR') NOT NULL DEFAULT 'LIFETIME_PRO',
    shop_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(150) NULL,
    phone_number VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    city VARCHAR(100) NULL,
    postal_code VARCHAR(15) NULL,
    distributor_id BIGINT UNSIGNED NULL,
    max_devices TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT 'Allowed counter terminals per license (default 2)',
    status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    price_paid DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT 'LKR paid for license',
    currency CHAR(3) NOT NULL DEFAULT 'LKR',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP NULL DEFAULT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL COMMENT 'NULL for Lifetime Licenses',
    offline_token TEXT NULL COMMENT 'Digitally signed cryptographic token stored client-side in IndexedDB',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_licenses_distributor
        FOREIGN KEY (distributor_id) REFERENCES distributors(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_license_status (status),
    INDEX idx_license_tier (license_tier),
    INDEX idx_license_phone (phone_number),
    INDEX idx_license_shop (shop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cryptographic lifetime license master table';

-- ----------------------------------------------------------------------------
-- 4. DEVICE FINGERPRINTS & COUNTER PC BINDINGS
-- ----------------------------------------------------------------------------
CREATE TABLE device_fingerprints (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    license_id BIGINT UNSIGNED NOT NULL,
    fingerprint_hash VARCHAR(128) NOT NULL COMMENT 'Composite canvas, screen resolution, UA and hardware hash',
    device_label VARCHAR(100) NOT NULL DEFAULT 'Counter PC 1' COMMENT 'Human friendly terminal name',
    ip_address VARCHAR(45) NULL COMMENT 'IPv4 or IPv6 client address',
    user_agent TEXT NULL,
    os_platform VARCHAR(50) NULL COMMENT 'Windows 11, Windows 10, Ubuntu, etc.',
    browser_name VARCHAR(50) NULL COMMENT 'Chrome, Edge, Firefox, etc.',
    screen_resolution VARCHAR(30) NULL COMMENT 'e.g. 1920x1080x24',
    hardware_concurrency TINYINT UNSIGNED NULL COMMENT 'CPU cores reported by browser',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Colombo',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_license
        FOREIGN KEY (license_id) REFERENCES licenses(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_license_device_fingerprint (license_id, fingerprint_hash),
    INDEX idx_device_fingerprint_hash (fingerprint_hash),
    INDEX idx_device_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registered counter devices bound to a shop license';

-- ----------------------------------------------------------------------------
-- 5. LICENSE AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE license_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    license_id BIGINT UNSIGNED NULL,
    action ENUM('GENERATED', 'VALIDATION_ATTEMPT', 'ACTIVATED', 'DEVICE_BOUND', 'DEVICE_UNBOUND', 'SUSPENDED', 'OFFLINE_SYNC') NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'WARNING') NOT NULL DEFAULT 'SUCCESS',
    client_ip VARCHAR(45) NULL,
    fingerprint_hash VARCHAR(128) NULL,
    log_message VARCHAR(255) NOT NULL,
    details_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_license
        FOREIGN KEY (license_id) REFERENCES licenses(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for license activations and security checks';

-- ----------------------------------------------------------------------------
-- 6. ITEM PRICING CATALOG (BOOKSHOP COUNTER SERVICES)
-- ----------------------------------------------------------------------------
CREATE TABLE item_pricing (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(32) NOT NULL UNIQUE,
    item_name VARCHAR(150) NOT NULL,
    sinhala_name VARCHAR(200) NULL COMMENT 'Sinhala unicode name for bilingual receipts and POS UI',
    category ENUM('PHOTOCOPY', 'PRINTING', 'LAMINATION', 'BINDING', 'STICKERS', 'PASSPORT_PHOTO', 'GOV_DOCUMENTS', 'STATIONERY', 'OTHER') NOT NULL,
    unit_price DECIMAL(10,2) UNSIGNED NOT NULL COMMENT 'Retail price in Sri Lankan Rupees (LKR)',
    cost_price DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT 'Paper, toner and laminating pouch cost',
    unit_measure VARCHAR(20) NOT NULL DEFAULT 'page' COMMENT 'page, sheet, copy, book, pack, item',
    is_pos_quick_item BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether shown as 1-click tile on POS touch screen',
    quick_item_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_category (category),
    INDEX idx_item_quick (is_pos_quick_item, quick_item_order),
    INDEX idx_item_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Product and service rate card for counter POS';

-- ----------------------------------------------------------------------------
-- 7. COUNTER SALES RECEIPTS
-- ----------------------------------------------------------------------------
CREATE TABLE counter_receipts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(32) NOT NULL UNIQUE COMMENT 'Formatted receipt e.g. RCP-202611-0001',
    cashier_name VARCHAR(100) NOT NULL DEFAULT 'Counter Cashier',
    terminal_label VARCHAR(100) NOT NULL DEFAULT 'Terminal 1',
    subtotal DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5,2) UNSIGNED NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    cash_tendered DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    change_due DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
    payment_method ENUM('CASH', 'LANKA_QR', 'CARD', 'CREDIT') NOT NULL DEFAULT 'CASH',
    payment_reference VARCHAR(64) NULL COMMENT 'LankaQR / Card transaction trace number',
    item_count INT UNSIGNED NOT NULL DEFAULT 1,
    notes VARCHAR(255) NULL,
    receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receipt_date (receipt_date),
    INDEX idx_receipt_cashier (cashier_name),
    INDEX idx_receipt_payment (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Counter sales invoices and thermal bill receipts';

-- ----------------------------------------------------------------------------
-- 8. RECEIPT LINE ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE receipt_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT UNSIGNED NOT NULL,
    item_pricing_id BIGINT UNSIGNED NULL,
    item_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10,2) UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    line_total DECIMAL(10,2) UNSIGNED NOT NULL,
    notes VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_items_receipt
        FOREIGN KEY (receipt_id) REFERENCES counter_receipts(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_receipt_items_pricing
        FOREIGN KEY (item_pricing_id) REFERENCES item_pricing(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_receipt_item_pricing (item_pricing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Line items belonging to each sales receipt';

-- ----------------------------------------------------------------------------
-- 9. STICKER STUDIO TEMPLATES & PRO THEMES
-- ----------------------------------------------------------------------------
CREATE TABLE sticker_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    sinhala_name VARCHAR(150) NULL,
    theme_category ENUM('KIDS_CARTOON', 'ACADEMIC_CLASSIC', 'NEON_MODERN', 'ROYAL_PREMIUM') NOT NULL DEFAULT 'KIDS_CARTOON',
    is_pro BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Requires Lifetime Pro license activation',
    accent_color VARCHAR(16) NOT NULL DEFAULT '#2563EB',
    background_gradient VARCHAR(120) NULL,
    css_class VARCHAR(64) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sticker_pro (is_pro),
    INDEX idx_sticker_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Metadata for student book name sticker themes';

-- ----------------------------------------------------------------------------
-- 10. PRINT PRODUCTION JOBS AUDIT LOG
-- ----------------------------------------------------------------------------
CREATE TABLE print_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT UNSIGNED NULL,
    module_type ENUM('NIC_CLONER', 'STICKER_STUDIO', 'PASSPORT_STUDIO', 'GOV_FORM', 'FAST_POS') NOT NULL,
    document_preset VARCHAR(64) NOT NULL COMMENT 'ISO_ID1_NIC, MTA_DRIVING_LICENSE, A4_STICKER_8UP, etc.',
    copies TINYINT UNSIGNED NOT NULL DEFAULT 1,
    scale_factor VARCHAR(20) NOT NULL DEFAULT '100%_TRUE_SCALE',
    is_bw_enhanced BOOLEAN NOT NULL DEFAULT FALSE,
    paper_size VARCHAR(16) NOT NULL DEFAULT 'A4',
    operator_name VARCHAR(100) NOT NULL DEFAULT 'Counter Operator',
    printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_print_jobs_receipt
        FOREIGN KEY (receipt_id) REFERENCES counter_receipts(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_print_jobs_module (module_type),
    INDEX idx_print_jobs_printed_at (printed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log of exact 1:1 physical print jobs generated at counter';

-- ============================================================================
-- CONVENIENCE ANALYTICAL VIEWS
-- ============================================================================

-- Daily Sales and Revenue Summary View
CREATE OR REPLACE VIEW view_daily_sales_summary AS
SELECT 
    DATE(receipt_date) AS sale_date,
    COUNT(id) AS total_receipts,
    SUM(item_count) AS total_items_sold,
    SUM(subtotal) AS gross_sales_lkr,
    SUM(discount_amount) AS total_discounts_lkr,
    SUM(grand_total) AS net_revenue_lkr,
    SUM(CASE WHEN payment_method = 'CASH' THEN grand_total ELSE 0 END) AS cash_revenue_lkr,
    SUM(CASE WHEN payment_method = 'LANKA_QR' THEN grand_total ELSE 0 END) AS qr_revenue_lkr,
    SUM(CASE WHEN payment_method = 'CARD' THEN grand_total ELSE 0 END) AS card_revenue_lkr
FROM counter_receipts
GROUP BY DATE(receipt_date);

-- Active Licenses and Terminal Device Bindings View
CREATE OR REPLACE VIEW view_active_license_devices AS
SELECT 
    l.id AS license_id,
    l.license_key,
    l.license_tier,
    l.shop_name,
    l.phone_number,
    l.city,
    l.max_devices,
    COUNT(df.id) AS bound_devices_count,
    (l.max_devices - COUNT(df.id)) AS remaining_device_slots,
    l.status AS license_status,
    l.activated_at
FROM licenses l
LEFT JOIN device_fingerprints df ON l.id = df.license_id AND df.is_active = TRUE
GROUP BY l.id, l.license_key, l.license_tier, l.shop_name, l.phone_number, l.city, l.max_devices, l.status, l.activated_at;
