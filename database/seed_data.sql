-- ============================================================================
-- PothHalaPro - All-in-One Bookshop, Communication & Education Print Studio
-- Seed Data & Initialization Script (MySQL 8.0+)
--
-- Includes:
--   - System and Shop Profile Defaults (LKR Currency, Demo Settings, Print Setup)
--   - Sri Lankan Authorized POS Hardware & Key Distributors
--   - Lifetime Pro & Demo Activation Licenses with Cryptographic Formats
--   - Registered Device Fingerprints (Binding Counter Terminals)
--   - Complete Bookshop Item Pricing Catalog (Photocopies, Lamination, Stickers, Photos)
--   - Sample Counter Sales Receipts and Line Items (Cash & LankaQR)
--   - Sticker Studio Themes (Standard & PRO)
--   - Exact 1:1 Scale Print Production Audit Records
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SYSTEM SETTINGS & SHOP PROFILE
-- ----------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES
('shop_brand_name', 'PothHalaPro Print & Digital Studio', 'SHOP_PROFILE', 'Trade name displayed on UI header and thermal receipts'),
('shop_phone', '+94 11 282 5599', 'SHOP_PROFILE', 'Contact hotline printed on receipts'),
('shop_address', 'No. 142, High Level Road, Nugegoda, Sri Lanka', 'SHOP_PROFILE', 'Physical store location'),
('shop_lanka_qr_id', 'LANKAQR-POTHHALA-7788', 'PAYMENT', 'Merchant ID for dynamic LankaQR counter payments'),
('base_currency', 'LKR', 'FINANCIAL', 'Currency code for all transaction totals'),
('currency_symbol', 'රු. ', 'FINANCIAL', 'Sinhala Rupee prefix for screen rendering'),
('offline_crypto_salt', 'POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET', 'SECURITY', 'Secret salt used for client-side checksum generation'),
('demo_session_seconds', '300', 'LICENSING', 'Unactivated demo session length before timer expires (5 minutes)'),
('max_devices_per_license', '2', 'LICENSING', 'Maximum permitted counter PCs bound to one shop lifetime key'),
('thermal_printer_width', '80mm', 'HARDWARE', 'Default width for counter POS thermal receipt prints'),
('default_paper_scale', '100%_EXACT_MM', 'PRINTER', 'Default calibrated printing scale for 1:1 cards and stickers');

-- ----------------------------------------------------------------------------
-- 2. WHOLESALE DISTRIBUTORS
-- ----------------------------------------------------------------------------
INSERT INTO distributors (distributor_code, name, company_name, contact_phone, contact_email, region, commission_rate, allocated_key_count) VALUES
('DIST-WP-COLOMBO', 'Sanjaya Perera', 'Colombo POS & Office Automation Ltd', '+94 77 123 4567', 'sales@colombopos.lk', 'Western Province (Colombo/Gampaha)', 20.00, 150),
('DIST-CP-KANDY', 'Nimal Jayawardena', 'Central Printers & Stationers Supply', '+94 71 889 2233', 'kandy@centralprinters.lk', 'Central Province (Kandy/Matale)', 20.00, 80),
('DIST-SP-GALLE', 'Kasun Liyanage', 'Southern Tech & Digital Retailers', '+94 76 445 6789', 'contact@southerntech.lk', 'Southern Province (Galle/Matara)', 20.00, 60),
('DIST-NWP-KURUNEGALA', 'Dhammika Bandara', 'Wayamba Office Systems', '+94 70 334 5566', 'wayamba.pos@gmail.com', 'North Western Province (Kurunegala)', 20.00, 50);

-- ----------------------------------------------------------------------------
-- 3. LICENSES
-- ----------------------------------------------------------------------------
INSERT INTO licenses (license_key, license_tier, shop_name, owner_name, phone_number, email, city, postal_code, distributor_id, max_devices, status, price_paid, currency, activated_at, expires_at, notes) VALUES
('PHP-2027-BK79-V4D2-8J2N', 'LIFETIME_PRO', 'Sarasavi Communication & Bookshop', 'Bandara Senaratne', '+94 77 234 5678', 'sarasavi.nugegoda@gmail.com', 'Nugegoda', '10250', 1, 2, 'ACTIVE', 12500.00, 'LKR', '2026-01-15 09:30:00', NULL, 'Lifetime PRO activated - Counter PC 1 and PC 2 active'),
('PHP-2027-MN82-Q9L1-4K7X', 'LIFETIME_PRO', 'Vidyalankara Digital Print Center', 'Sunil Wickramasinghe', '+94 81 223 4455', 'vidyalankara.kandy@gmail.com', 'Kandy', '20000', 2, 2, 'ACTIVE', 12500.00, 'LKR', '2026-02-01 10:15:00', NULL, 'Lifetime PRO activated - Kandy main branch'),
('PHP-2027-CR35-T8H4-6P9W', 'LIFETIME_PRO', 'Ruhunu Express Photocopy & Photo Lab', 'Chaminda Silva', '+94 91 224 8899', 'ruhunu.print@gmail.com', 'Galle', '80000', 3, 2, 'ACTIVE', 12500.00, 'LKR', '2026-02-18 14:00:00', NULL, 'Lifetime PRO activated - Galle bus stand complex'),
('PHP-2027-FD61-W2Y7-3L8Z', 'LIFETIME_PRO', 'Sanduni Graphic & School Supplies', 'Chandana Rajapaksha', '+94 37 222 1144', 'sanduni.kurunegala@sltnet.lk', 'Kurunegala', '60000', 4, 2, 'ACTIVE', 10000.00, 'LKR', '2026-03-05 11:20:00', NULL, 'Wholesale dealer promo bundle'),
('PHP-2027-DEMO-0001-TEST', 'DEMO_TRIAL', 'Nethmi Stationery & Communication', 'Anura Kumara', '+94 75 998 8776', 'nethmi.demo@gmail.com', 'Horana', '12400', NULL, 1, 'PENDING', 0.00, 'LKR', NULL, '2026-12-31 23:59:59', 'Evaluation demo install - 5 minute session countdown active');

-- ----------------------------------------------------------------------------
-- 4. DEVICE FINGERPRINTS
-- ----------------------------------------------------------------------------
INSERT INTO device_fingerprints (license_id, fingerprint_hash, device_label, ip_address, user_agent, os_platform, browser_name, screen_resolution, hardware_concurrency, timezone, is_active, registered_at) VALUES
(1, '8b4c29ea-4f31c8ad-7e029ba3-colombo01', 'Counter POS Main', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36', 'Windows 11 Pro', 'Chrome 128', '1920x1080x24', 8, 'Asia/Colombo', TRUE, '2026-01-15 09:35:12'),
(1, '7a1d30fe-9c88be24-5d114cf2-colombo02', 'Lamination & NIC Counter PC', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36', 'Windows 10 Pro', 'Chrome 128', '1366x768x24', 4, 'Asia/Colombo', TRUE, '2026-01-15 11:10:45'),
(2, 'e33d90aa-2b47f11c-6a782de9-kandy01', 'Front Desk Touch POS', '192.168.8.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/128.0.0.0 Safari/537.36', 'Windows 11', 'Microsoft Edge 128', '1920x1080x24', 8, 'Asia/Colombo', TRUE, '2026-02-01 10:18:22'),
(3, '5c889f02-1a4e8d32-9f330ba1-galle01', 'Billing PC 1', '192.168.0.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36', 'Windows 10', 'Chrome 127', '1920x1080x24', 6, 'Asia/Colombo', TRUE, '2026-02-18 14:05:00');

-- ----------------------------------------------------------------------------
-- 5. LICENSE AUDIT LOGS
-- ----------------------------------------------------------------------------
INSERT INTO license_audit_logs (license_id, action, status, client_ip, fingerprint_hash, log_message, details_json) VALUES
(1, 'GENERATED', 'SUCCESS', '127.0.0.1', NULL, 'Lifetime key generated by Colombo POS distributor', '{"distributor_code": "DIST-WP-COLOMBO", "tier": "LIFETIME_PRO"}'),
(1, 'ACTIVATED', 'SUCCESS', '175.157.88.12', '8b4c29ea-4f31c8ad-7e029ba3-colombo01', 'License successfully activated online and token cached in IndexedDB', '{"hardware": "Windows 11 Pro", "shop": "Sarasavi Communication & Bookshop"}'),
(1, 'DEVICE_BOUND', 'SUCCESS', '192.168.1.101', '8b4c29ea-4f31c8ad-7e029ba3-colombo01', 'Terminal 1 bound to license (1/2 used)', '{"label": "Counter POS Main"}'),
(1, 'DEVICE_BOUND', 'SUCCESS', '192.168.1.102', '7a1d30fe-9c88be24-5d114cf2-colombo02', 'Terminal 2 bound to license (2/2 used)', '{"label": "Lamination & NIC Counter PC"}'),
(2, 'ACTIVATED', 'SUCCESS', '112.134.140.45', 'e33d90aa-2b47f11c-6a782de9-kandy01', 'Kandy central terminal activated', '{"city": "Kandy"}');

-- ----------------------------------------------------------------------------
-- 6. ITEM PRICING CATALOG (BOOKSHOP COUNTER SERVICES)
-- ----------------------------------------------------------------------------
INSERT INTO item_pricing (item_code, item_name, sinhala_name, category, unit_price, cost_price, unit_measure, is_pos_quick_item, quick_item_order) VALUES
-- Photocopying
('PHOTO-BW-A4-S', 'A4 B&W Photocopy (Single)', 'A4 කළු-සුදු පිටපත (තනි පැත්ත)', 'PHOTOCOPY', 10.00, 2.50, 'page', TRUE, 1),
('PHOTO-BW-A4-D', 'A4 B&W Photocopy (Double)', 'A4 කළු-සුදු පිටපත (දෙපැත්ත)', 'PHOTOCOPY', 15.00, 4.00, 'page', TRUE, 2),
('PHOTO-BW-A3', 'A3 B&W Photocopy', 'A3 කළු-සුදු පිටපත', 'PHOTOCOPY', 30.00, 7.50, 'page', FALSE, 10),

-- Color Printing
('PRINT-CLR-A4-PLAIN', 'Color Print A4 (Plain Paper)', 'A4 වර්ණ මුද්‍රණය (සාමාන්‍ය)', 'PRINTING', 40.00, 10.00, 'page', TRUE, 3),
('PRINT-CLR-A4-GLOSS', 'Color Print A4 (Photo Paper)', 'A4 වර්ණ මුද්‍රණය (ෆොටෝ කොළ)', 'PRINTING', 80.00, 25.00, 'page', TRUE, 4),
('PRINT-CLR-A3', 'Color Print A3 (Plain Paper)', 'A3 වර්ණ මුද්‍රණය', 'PRINTING', 90.00, 22.00, 'page', FALSE, 11),

-- Lamination
('LAMIN-A4-POUCH', 'Pouch Laminating A4', 'A4 ලැමිනේටින්', 'LAMINATION', 120.00, 30.00, 'sheet', TRUE, 5),
('LAMIN-CARD-NIC', 'Pouch Laminating ID Card / NIC', 'හැඳුනුම්පත් ලැමිනේටින්', 'LAMINATION', 50.00, 12.00, 'card', TRUE, 6),
('LAMIN-A3-POUCH', 'Pouch Laminating A3', 'A3 ලැමිනේටින්', 'LAMINATION', 250.00, 65.00, 'sheet', FALSE, 12),

-- Binding
('BIND-SPIRAL-CR', 'Spiral Binding (CR Book / 100p)', 'සර්පිලාකාර බයින්ඩිං (පිටු 100)', 'BINDING', 200.00, 45.00, 'book', TRUE, 7),
('BIND-SPIRAL-LRG', 'Spiral Binding (Large / 200p+)', 'සර්පිලාකාර බයින්ඩිං (පිටු 200+)', 'BINDING', 350.00, 70.00, 'book', FALSE, 13),
('BIND-TAPE-A4', 'Hard Spine Tape Binding A4', 'ටේප් බයින්ඩිං A4', 'BINDING', 100.00, 20.00, 'book', FALSE, 14),

-- NIC & ID 1:1 Production
('NIC-CLONE-A4', 'Smart NIC / DL 1:1 Scale Print', 'හැඳුනුම්පත් 1:1 මුද්‍රණය', 'GOV_DOCUMENTS', 50.00, 10.00, 'sheet', TRUE, 8),
('NIC-CLONE-4ECO', 'Smart NIC 4-Copy Eco Print', '4-Copy Eco හැඳුනුම්පත් පිටපත', 'GOV_DOCUMENTS', 80.00, 15.00, 'sheet', FALSE, 15),

-- Passport & Visa Photos
('PHOTO-PASSPORT-8', 'Passport Photo 8-Grid (35x45mm)', 'පාස්පෝට් ඡායාරූප 8ක්', 'PASSPORT_PHOTO', 250.00, 35.00, 'sheet', TRUE, 9),
('PHOTO-VISA-6', 'US / Visa Photo 6-Grid (2x2")', 'වීසා ඡායාරූප 6ක් (2x2 අඟල්)', 'PASSPORT_PHOTO', 300.00, 40.00, 'sheet', FALSE, 16),

-- School Name Stickers
('STK-SCH-MULTI', 'School Name Stickers (Multi-Pack 8-up)', 'පාසල් පොත් ස්ටිකර් (විෂය 8ක්)', 'STICKERS', 200.00, 35.00, 'sheet', TRUE, 10),
('STK-SCH-SINGLE', 'School Name Stickers (8-Pack Identical)', 'පාසල් පොත් ස්ටිකර් (තනි විෂය)', 'STICKERS', 150.00, 30.00, 'sheet', FALSE, 17),

-- Government Applications & CV
('DOC-GOV-MTA', 'Sri Lanka Govt Form Print (MTA/Pass)', 'රජයේ අයදුම්පත් මුද්‍රණය', 'GOV_DOCUMENTS', 40.00, 8.00, 'form', FALSE, 18),
('DOC-LEGAL-AFF', 'Affidavit / Rental Agreement Form', 'දිවුරුම් ප්‍රකාශ / කුලී ගිවිසුම්', 'GOV_DOCUMENTS', 50.00, 10.00, 'document', FALSE, 19),
('DOC-CV-1PAGE', 'Fast 1-Page Professional CV Print', 'CV මුද්‍රණය (වෘත්තීය ආකෘතිය)', 'PRINTING', 100.00, 15.00, 'page', FALSE, 20);

-- ----------------------------------------------------------------------------
-- 7. COUNTER SALES RECEIPTS
-- ----------------------------------------------------------------------------
INSERT INTO counter_receipts (receipt_number, cashier_name, terminal_label, subtotal, discount_percent, discount_amount, grand_total, cash_tendered, change_due, payment_method, payment_reference, item_count, notes, receipt_date) VALUES
('RCP-202611-0001', 'Kasun Bandara', 'Terminal 1', 590.00, 0.00, 0.00, 590.00, 1000.00, 410.00, 'CASH', NULL, 4, 'Counter walk-in customer - photocopies & laminating', '2026-11-15 09:14:22'),
('RCP-202611-0002', 'Kasun Bandara', 'Terminal 1', 450.00, 0.00, 0.00, 450.00, 450.00, 0.00, 'LANKA_QR', 'LQR-98234710', 2, 'LankaQR instant payment confirmed via app', '2026-11-15 10:05:40'),
('RCP-202611-0003', 'Malkanthi Silva', 'Terminal 2', 750.00, 5.00, 37.50, 712.50, 1000.00, 287.50, 'CASH', NULL, 3, '5% Student discount applied on term test prints', '2026-11-15 11:22:15'),
('RCP-202611-0004', 'Kasun Bandara', 'Terminal 1', 250.00, 0.00, 0.00, 250.00, 500.00, 250.00, 'CASH', NULL, 1, 'Urgent Passport Photo 8-Grid', '2026-11-15 13:40:05'),
('RCP-202611-0005', 'Malkanthi Silva', 'Terminal 2', 1200.00, 10.00, 120.00, 1080.00, 1080.00, 0.00, 'CARD', 'VISA-AUTH-44129', 5, 'Spiral binding and bulk color print sheets', '2026-11-15 15:55:30');

-- ----------------------------------------------------------------------------
-- 8. RECEIPT LINE ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO receipt_items (receipt_id, item_pricing_id, item_name, unit_price, quantity, line_total, notes) VALUES
-- Receipt 1 items
(1, 2, 'A4 B&W Photocopy (Double)', 15.00, 10, 150.00, 'Past paper copy pack'),
(1, 5, 'Color Print A4 (Photo Paper)', 80.00, 2, 160.00, 'School project covers'),
(1, 7, 'Pouch Laminating A4', 120.00, 1, 120.00, 'Certificates'),
(1, 10, 'Spiral Binding (CR Book / 100p)', 200.00, 1, 200.00, 'Project book'),

-- Receipt 2 items
(2, 14, 'Passport Photo 8-Grid (35x45mm)', 250.00, 1, 250.00, 'White background standard'),
(2, 16, 'School Name Stickers (Multi-Pack 8-up)', 200.00, 1, 200.00, 'Grade 4 Royal Gold theme'),

-- Receipt 3 items
(3, 1, 'A4 B&W Photocopy (Single)', 10.00, 20, 200.00, 'Class revision tutorial'),
(3, 12, 'Smart NIC / DL 1:1 Scale Print', 50.00, 3, 150.00, 'Fold & Laminate layout'),
(3, 7, 'Pouch Laminating A4', 120.00, 3, 360.00, 'Document preservation'),

-- Receipt 4 items
(4, 14, 'Passport Photo 8-Grid (35x45mm)', 250.00, 1, 250.00, 'Express studio counter print'),

-- Receipt 5 items
(5, 10, 'Spiral Binding (CR Book / 100p)', 200.00, 3, 600.00, 'University reports'),
(5, 4, 'Color Print A4 (Plain Paper)', 40.00, 15, 600.00, 'Color diagram pages');

-- ----------------------------------------------------------------------------
-- 9. STICKER STUDIO TEMPLATES
-- ----------------------------------------------------------------------------
INSERT INTO sticker_templates (template_code, name, sinhala_name, theme_category, is_pro, accent_color, background_gradient, css_class) VALUES
('THEME-CYBER-NEON', 'Cyber Neon Kids', 'සයිබර් නියොන්', 'NEON_MODERN', FALSE, '#06B6D4', 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)', 'theme-cyber-neon'),
('THEME-ROYAL-GOLD', 'Royal College Gold', 'රෝයල් ගෝල්ඩ්', 'ROYAL_PREMIUM', FALSE, '#D97706', 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 'theme-royal-gold'),
('THEME-KAWAII-PINK', 'Kawaii Pink & Lilac', 'කවායි පින්ක්', 'KIDS_CARTOON', FALSE, '#EC4899', 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)', 'theme-kawaii-pink'),
('THEME-TURBO-HERO', 'Turbo Hero Orange', 'ටර්බෝ ඔරේන්ජ්', 'KIDS_CARTOON', FALSE, '#EA580C', 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)', 'theme-turbo-hero'),
('THEME-GALACTIC-PRO', 'Galactic Explorer PRO', 'ගැලැක්ටික් ප්‍රෝ', 'NEON_MODERN', TRUE, '#8B5CF6', 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 100%)', 'theme-galactic-pro'),
('THEME-HERITAGE-PRO', 'Sri Lankan Heritage PRO', 'හෙළ උරුමය ප්‍රෝ', 'ROYAL_PREMIUM', TRUE, '#991B1B', 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)', 'theme-heritage-pro');

-- ----------------------------------------------------------------------------
-- 10. PRINT PRODUCTION JOBS AUDIT LOG
-- ----------------------------------------------------------------------------
INSERT INTO print_jobs (receipt_id, module_type, document_preset, copies, scale_factor, is_bw_enhanced, paper_size, operator_name, printed_at) VALUES
(1, 'NIC_CLONER', 'ISO_ID1_SMART_NIC', 1, '100%_TRUE_SCALE', TRUE, 'A4', 'Kasun Bandara', '2026-11-15 09:12:00'),
(2, 'PASSPORT_STUDIO', 'SL_PASSPORT_35X45MM', 1, '100%_TRUE_SCALE', FALSE, 'A4', 'Kasun Bandara', '2026-11-15 10:02:10'),
(2, 'STICKER_STUDIO', 'A4_8UP_MULTI_PACK', 1, '100%_TRUE_SCALE', FALSE, 'A4', 'Kasun Bandara', '2026-11-15 10:04:45'),
(3, 'NIC_CLONER', 'MTA_DRIVING_LICENSE', 3, '100%_TRUE_SCALE', TRUE, 'A4', 'Malkanthi Silva', '2026-11-15 11:20:00'),
(4, 'PASSPORT_STUDIO', 'SL_PASSPORT_35X45MM', 1, '100%_TRUE_SCALE', FALSE, 'A4', 'Kasun Bandara', '2026-11-15 13:38:22');
