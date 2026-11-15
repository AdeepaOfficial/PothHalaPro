# PothHalaPro - Portable PHP Backend REST API

Lightweight, zero-dependency REST API for **PothHalaPro** (All-in-One Bookshop, Communication & Education Print Studio). Designed specifically for Sri Lankan retail bookshops, photocopy centers, and digital print studios running **XAMPP**, **WAMP**, or standard **Apache/PHP** web servers.

---

## 🚀 Key Features

1. **Zero External Dependencies**:
   - Runs out-of-the-box on PHP 7.4 through PHP 8.3+.
   - No Composer, Node.js, or external extensions required.
2. **Dual-Mode Persistence (MySQL + SQLite Fallback)**:
   - Primary: Connects via PDO to MySQL (`pothhalapro` database).
   - Offline / Failover: If MySQL is not started in XAMPP/WAMP, automatically falls back to embedded SQLite (`data/pothhalapro_offline.sqlite`) without crashing.
3. **100% Offline Cryptographic Licensing**:
   - Validates `PHP-YYYY-XXXX-XXXX-XXXX` lifetime activation codes.
   - Enforces counter terminal limit (up to 2 PCs per shop license).
   - Audits activation and hardware bindings.
4. **Fast Billing POS & Thermal Receipt Engine**:
   - Manages retail service catalog in Sri Lankan Rupees (LKR).
   - Creates sales receipts with cash, LankaQR, and card payments.
   - Generates ESC/POS 58mm / 80mm thermal receipt ASCII layouts.
   - Computes daily sales summaries and revenues.
5. **Exact 1:1 Scale Print Production Logs**:
   - Records true 1:1 scale millimeter print jobs for Smart NICs, Driving Licenses, Passport photo grids, and School Name Stickers.

---

## 📁 File Structure

```
src/php/
├── api.php           # Master front-controller, CORS handler & status probe
├── license.php       # Cryptographic key verification & terminal device binding
├── billing.php       # POS catalog, counter receipts & daily summaries
├── config.php        # Environment settings, constants & cryptographic helpers
├── db.php            # PDO MySQL connection manager & SQLite fallback
├── .htaccess         # Apache mod_rewrite clean URL configuration
├── README.md         # Architecture & setup documentation
└── data/             # Local database storage & cache (.htaccess protected)
```

---

## 🛠️ Installation & Setup

### Option 1: Running with XAMPP (Windows)
1. Download and install [XAMPP](https://www.apachefriends.org/) (PHP 8.0+ recommended).
2. Start **Apache** and **MySQL** from the XAMPP Control Panel.
3. Clone or copy the `PothHalaPro` directory into `C:\xampp\htdocs\PothHalaPro`.
4. Open your browser and visit:
   - **Status Check**: `http://localhost/PothHalaPro/src/php/api.php?route=status`
   - **Frontend App**: `http://localhost/PothHalaPro/public/index.html`

### Option 2: Running with WAMP (Windows)
1. Copy the project to `C:\wamp64\www\PothHalaPro`.
2. Start WampServer (green icon in taskbar).
3. Access `http://localhost/PothHalaPro/src/php/api.php`.

### Option 3: Built-in PHP CLI Server
If running standalone without Apache:
```bash
# Navigate to project root
cd C:\Users\Adeepa D. Marambage\OpenBot\Shared\PothHalaPro

# Start built-in PHP server on port 8080
php -S localhost:8080 -t public
```

---

## 🗄️ Database Setup (phpMyAdmin / MySQL)

1. Open phpMyAdmin at `http://localhost/phpmyadmin`.
2. Create a new database named `pothhalapro` with collation `utf8mb4_unicode_ci`.
3. Import the schema and seed data:
   - Click on `pothhalapro` database.
   - Go to **Import** tab.
   - Choose `database/schema.sql` and click **Go**.
   - Choose `database/seed_data.sql` and click **Go**.
4. The PHP backend connects automatically using `root` and empty password.

### Environment Overrides (Optional)
If your MySQL has a password or custom host, set environment variables:
- `DB_HOST`: Host address (default: `127.0.0.1`)
- `DB_PORT`: Port (default: `3306`)
- `DB_NAME`: Database name (default: `pothhalapro`)
- `DB_USER`: Username (default: `root`)
- `DB_PASS`: Password (default: `""`)

---

## 📡 REST API Endpoints Reference

### 1. System Health & Status
- **Method**: `GET`
- **URL**: `/src/php/api.php?route=status`
- **Response**:
```json
{
  "status": "running",
  "name": "PothHalaPro Print Studio PHP Backend",
  "version": "1.0.0",
  "php_version": "8.2.12",
  "database_driver": "mysql",
  "database_connected": true,
  "catalog": {
    "active_items_count": 21,
    "total_receipts_recorded": 5,
    "currency": "LKR"
  }
}
```

---

### 2. License Verification
- **Method**: `GET` or `POST`
- **URL**: `/src/php/license.php?action=verify&code=PHP-2027-BK79-V4D2-511W`
- **Response**:
```json
{
  "valid": true,
  "code": "PHP-2027-BK79-V4D2-511W",
  "tier": "LIFETIME_PRO",
  "offline_checksum_verified": true,
  "status": "ACTIVE",
  "details": {
    "shop_name": "Sarasavi Communication & Bookshop",
    "max_devices": 2,
    "bound_devices": 1,
    "remaining_devices": 1
  }
}
```

---

### 3. Generate Cryptographic Activation Key
- **Method**: `GET` or `POST`
- **URL**: `/src/php/license.php?action=generate&year=2027`
- **Optional Params**: `shop_name`, `owner_name`, `phone`
- **Response**:
```json
{
  "generated": true,
  "code": "PHP-2027-W7K2-P9M4-XXXX",
  "tier": "LIFETIME_PRO",
  "created_at": "2026-11-16 00:45:00"
}
```

---

### 4. Bind Counter Terminal (Device Fingerprint)
- **Method**: `POST`
- **URL**: `/src/php/license.php?action=register_device`
- **Request Body**:
```json
{
  "code": "PHP-2027-BK79-V4D2-511W",
  "fingerprint": "8b4c29ea-4f31c8ad-7e029ba3-colombo01",
  "device_label": "Counter POS PC 2",
  "os_platform": "Windows 11 Pro",
  "browser_name": "Chrome 128",
  "screen_resolution": "1920x1080"
}
```
- **Response**:
```json
{
  "success": true,
  "status": "ACTIVE",
  "code": "PHP-2027-BK79-V4D2-511W",
  "bound_devices": 2,
  "max_devices": 2,
  "message": "Device bound successfully. 1:1 scale prints and PRO features unlocked."
}
```

---

### 5. POS Item Pricing Catalog
- **Method**: `GET`
- **URL**: `/src/php/billing.php?action=items`
- **Optional Params**: `category=PHOTOCOPY`, `quick_only=1`
- **Response**:
```json
{
  "success": true,
  "count": 21,
  "currency": "LKR",
  "items": [
    {
      "item_code": "PHOTO-BW-A4-S",
      "item_name": "A4 B&W Photocopy (Single)",
      "sinhala_name": "A4 කළු-සුදු පිටපත (තනි පැත්ත)",
      "unit_price": 10.00,
      "is_pos_quick_item": 1
    }
  ]
}
```

---

### 6. Create Counter Sales Receipt
- **Method**: `POST`
- **URL**: `/src/php/billing.php?action=create_receipt`
- **Request Body**:
```json
{
  "cashier_name": "Kasun Bandara",
  "terminal_label": "Terminal 1",
  "items": [
    { "name": "A4 B&W Photocopy (Double)", "price": 15.00, "qty": 10 },
    { "name": "Color Print A4 (Photo Paper)", "price": 80.00, "qty": 2 },
    { "name": "Pouch Laminating A4", "price": 120.00, "qty": 1 }
  ],
  "discount_percent": 5.0,
  "cash_tendered": 500.00,
  "payment_method": "CASH"
}
```
- **Response**:
```json
{
  "success": true,
  "receipt_number": "RCP-202611-0006",
  "receipt_date": "2026-11-16 00:46:20",
  "totals": {
    "subtotal": 430.00,
    "discount_percent": 5.0,
    "discount_amount": 21.50,
    "grand_total": 408.50,
    "cash_tendered": 500.00,
    "change_due": 91.50,
    "currency": "LKR"
  },
  "thermal_receipt_text": "..."
}
```

---

### 7. Daily Sales Summary
- **Method**: `GET`
- **URL**: `/src/php/billing.php?action=daily_summary&date=2026-11-16`
- **Response**:
```json
{
  "sale_date": "2026-11-16",
  "total_receipts": 12,
  "total_items_sold": 48,
  "gross_sales_lkr": 7850.00,
  "total_discounts_lkr": 250.00,
  "net_revenue_lkr": 7600.00,
  "cash_revenue_lkr": 5400.00,
  "qr_revenue_lkr": 1200.00,
  "card_revenue_lkr": 1000.00,
  "currency": "LKR"
}
```

---

## 🔒 Security & Offline Resilience

- **No Remote Calls**: All license checks are computed locally via signed cryptographic hashes.
- **Data Protection**: `data/` folder is blocked by `.htaccess` to prevent database snooping.
- **SQL Injection Prevention**: All queries use PDO prepared statements with bound parameters.
- **Zero Lock-in**: Can switch between Apache, XAMPP, and WAMP without code modifications.
