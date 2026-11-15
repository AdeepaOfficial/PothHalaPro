# PothHalaPro Database Documentation (MySQL 8.0+)

This directory contains the complete relational database architecture and initialization scripts for **PothHalaPro - All-in-One Bookshop, Communication & Education Print Studio**.

---

## 1. Files in this Directory

- **`schema.sql`**: Full DDL script creating all core relational tables, foreign key constraints, indexes, views, and character set configurations (`utf8mb4_unicode_ci` for bilingual English and Sinhala text support).
- **`seed_data.sql`**: Comprehensive DML initialization script with realistic shop settings, distributor records, cryptographic lifetime licenses, device fingerprint hardware bindings, counter POS item pricing catalog, receipts, and print production logs.

---

## 2. Entity Relationship Overview

```
                      +-------------------+
                      |   distributors    |
                      +---------+---------+
                                | 1
                                |
                                | N
                      +---------v---------+          +-----------------------+
                      |     licenses      +---------->  license_audit_logs   |
                      +----+---------+----+ 1      N +-----------------------+
                           |         |
                         1 |       1 |
                           |         |
                         N |       N |
+----------------------+   |         +-----------------------+
|  sticker_templates   |   |         |  device_fingerprints  |
+----------------------+   |         +-----------------------+
                           |
+----------------------+   |
|   system_settings    |   |
+----------------------+   |
                           |
+----------------------+   |
|     item_pricing     |   |
+----------+-----------+   |
           | 1             |
           |               |
           | N             |
+----------v-----------+   |         +-----------------------+
|    receipt_items     <---+---------+   counter_receipts    |
+----------------------+ N         1 +-----------+-----------+
                                                 | 1
                                                 |
                                                 | N
                                     +-----------v-----------+
                                     |      print_jobs       |
                                     +-----------------------+
```

---

## 3. Core Tables Specification

### 1. `licenses`
Maintains cryptographic Lifetime Pro and Demo licenses:
- `license_key`: Format `PHP-YYYY-XXXX-XXXX-XXXX`
- `license_tier`: `DEMO_TRIAL`, `STANDARD`, `LIFETIME_PRO`, `ENTERPRISE_DISTRIBUTOR`
- `max_devices`: Default `2` (Sri Lankan shop standard: 2 counter PCs per license)
- `offline_token`: Encrypted / signed payload persisted in client-side IndexedDB

### 2. `device_fingerprints`
Enforces device-limit binding (up to 2 counter terminals per shop license):
- `fingerprint_hash`: Client canvas, hardware concurrency, screen resolution, and user agent composite hash
- `device_label`: Human-readable identifier (e.g., `Counter POS Main`, `Lamination & NIC Counter PC`)
- `is_active`: Terminal activation status

### 3. `item_pricing`
Unified rate card for counter POS, fast billing, and print services in Sri Lankan Rupees (LKR):
- Includes Photocopies (Single/Double A4 & A3), Color Printing (Plain/Photo Gloss), Lamination (NIC pouch, A4, A3), Spiral and Tape Binding, Smart NIC 1:1 true scale copies, Passport & Visa Photo sheets, School Name Stickers, and Legal / Govt forms.
- Full Sinhala typography support in `sinhala_name` column.

### 4. `counter_receipts` & `receipt_items`
Fast billing POS receipts:
- Tracks `subtotal`, `discount_percent`, `discount_amount`, `grand_total`, `cash_tendered`, and `change_due`.
- Payment methods: `CASH`, `LANKA_QR`, `CARD`, `CREDIT`.
- Auto-calculated line totals linked to `item_pricing`.

### 5. `sticker_templates`
Metadata for the Smart School Name Sticker Studio themes:
- Standard themes: `Cyber Neon Kids`, `Royal College Gold`, `Kawaii Pink & Lilac`, `Turbo Hero Orange`
- Locked PRO themes: `Galactic Explorer PRO`, `Sri Lankan Heritage PRO` (unlocked via Lifetime License)

### 6. `print_jobs`
Audit trail of exact 1:1 physical millimeter print sheets executed at the shop counter (NIC cloner, photo sheets, sticker sheets, legal agreements).

---

## 4. How to Import

### Using MySQL CLI:
```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pothhalapro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import Schema
mysql -u root -p pothhalapro < database/schema.sql

# 3. Import Seed Data
mysql -u root -p pothhalapro < database/seed_data.sql
```

### Using XAMPP / phpMyAdmin:
1. Open phpMyAdmin (`http://localhost/phpmyadmin`).
2. Create a database named `pothhalapro` with collation `utf8mb4_unicode_ci`.
3. Import `database/schema.sql`.
4. Import `database/seed_data.sql`.
