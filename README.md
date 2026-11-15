# PothHalaPro Print Studio (පොත්හල Pro)

> **All-in-One Bookshop, Communication & Education Print Studio**  
> High-speed, 100% offline-capable web application engineered specifically for Sri Lankan retail bookshops, photocopy centers, and print shops. Generates exact **1:1 physical millimeter scale (100% true-size)** A4 printouts in under 10 seconds with zero design experience required.

---

## 1. Executive Summary & Capabilities

Sri Lankan bookshops and communication centers frequently spend minutes manually resizing smartphone/WhatsApp photos of National Identity Cards (NICs), Driving Licenses, school book name stickers, and government documents using complex tools like Photoshop.

**PothHalaPro** eliminates this friction with pre-calibrated physical dimensions, instant auto-layout engines, and a **One-Time Lifetime License** model that completely avoids monthly or annual subscriptions.

### Core Modules Implemented

1. **Smart NIC & Driving License 1:1 Scale Cloner:**
   - **Pre-calibrated Presets:**
     - `ISO ID-1` (`85.6 × 54.0 mm`) Sri Lanka Smart NIC
     - `MTA Standard` (`85.6 × 54.0 mm`) Sri Lanka Driving License
     - `Classic Laminated NIC` (`100.0 × 65.0 mm`)
     - `Postal Department ID` (`95.0 × 60.0 mm`)
   - **4 Dedicated A4 Layout Modes:** Side-by-Side (horizontal), Stacked (vertical), Fold & Laminate (with cut & fold line for pouch lamination), and 4-Copy Eco (tiles 4 complete front-and-back sets onto a single A4 page).
   - **Real-Time Image Enhancers:** Brightness, Contrast, B&W Laser Copy toggle (removes grey shadows, saves printer toner), and dashed millimeter cutting guides with scissor trim marks.
   - **Live 1:1 Scale A4 Preview:** Interactive zoomable canvas preview with physical millimeter aspect ratio locked to A4 sheet dimensions.

2. **Smart School Name Sticker Studio (1-Click Multi-Subject Engine):**
   - **Standard Size:** Generates 8 stickers on A4 (`90 × 45 mm` each).
   - **Instant Bilingual Engine:** Seamless switching between Sinhala (`සිංහල`) and English (`ENG`).
   - **Grade 1 to 13 Curriculum Automation:** 1-click grade selector automatically loads official Sri Lankan school curriculum subjects for that level (Mother Tongue, Mathematics, Science, History, Buddhism, Tamil, Scholarship Papers, etc.).
   - **Class Section Selector:** Sections `A`–`H` and traditional Sinhala class names (*රෝස, නෙළුම්, සමන්, සූරිය, කුසුම්, හංස, කෝකිල*).
   - **Pack Modes:** Multi-Pack (8 distinct official subjects on 1 A4 sheet) and 8-Pack (8 identical stickers for a single subject).
   - **Cartoon & Avatar Studio:** Built-in vector cartoons (Superhero, Astronaut, Princess, Racing Car, Robot, Dinosaur, Scholar, Sri Lankan Lion Mascot) or custom student photo upload with circular badge frames and size sliders.
   - **Modern Themes (Standard & PRO):** Built-in *Cyber Neon Kids*, *Royal College Gold*, *Kawaii Pink*, *Turbo Orange*, and PRO themes (*Galactic Explorer*, *Vintage Parchment*, *Minimalist Slate*, *Sri Lanka Heritage*).

3. **Full Ecosystem Sidebar Suite:**
   - **Passport & Visa Photo Studio:** Sri Lanka standard (`35 × 45 mm`) and US Visa (`2 × 2 inches`) 8-photo grid generator with background tint changer.
   - **Bookshop Fast Billing & Counter POS:** Instant counter billing for photocopies, color prints, lamination, and spiral binding with LKR currency calculations, discounts, and customer receipt printing.
   - **Sri Lanka Government Applications:** Pre-formatted MTA-32 Driving License renewal, Passport Form K, Grama Niladhari form, and Sinhala rental agreements / affidavits.
   - **Student Assets & Education Library:** Sri Lanka Term Test papers, Grade 5 scholarship model questions, and Sinhala Hodiya handwriting practice worksheets.
   - **Global Quick Search (`Ctrl + K`):** Instant command palette to find any tool, preset, or form.

4. **One-Time Activation Code Licensing & Offline Architecture:**
   - **Free Demo Trial:** Runs with a visible 5-minute session countdown timer and locked PRO themes.
   - **Cryptographic Key Verification:** Offline checksum validator for keys formatted as `PHP-2027-XXXX-XXXX-XXXX`.
   - **Distributor Keygen Portal:** Built-in key generator for authorized POS hardware dealers and printer distributors across Sri Lanka.
   - **Device Fingerprinting:** Binds license to browser and hardware profile (supports up to 2 counter PCs per shop license).
   - **100% Offline PWA:** Caches all assets via Service Worker (`sw.js`) and IndexedDB for full offline operation during power or internet cuts.
   - **Client-Side Privacy Guarantee:** Customer documents are processed exclusively in browser Canvas memory and are never uploaded to any remote server.

---

## 2. Directory Structure

```text
PothHalaPro/
├── bin/                          # Compiled Java binaries
├── public/                       # PWA web assets & offline client
│   ├── assets/
│   │   ├── cartoons/             # 8 Vector cartoon SVGs
│   │   ├── samples/              # Pre-calibrated NIC & License specimen SVGs
│   │   └── icons/                # PWA icons
│   ├── css/
│   │   ├── style.css             # Screen stylesheet & UI components
│   │   └── print.css             # Millimeter-accurate @media print engine
│   ├── js/
│   │   ├── app.js                # Router, Ctrl+K palette, toasts, zoom controls
│   │   ├── license.js            # Cryptographic validator, fingerprinting, timer
│   │   ├── nic-cloner.js         # Module 1: 1:1 scale cloner & canvas filters
│   │   ├── sticker-studio.js     # Module 2: Curriculum subject mapping & themes
│   │   ├── counter-tools.js      # Passport studio, Fast POS billing, labels
│   │   └── education-hub.js      # Gov forms, past papers, Sinhala worksheets
│   ├── manifest.json             # PWA Web App Manifest
│   ├── sw.js                     # Offline Service Worker cache
│   └── index.html                # Single Page Application shell
├── src/
│   ├── php/                      # Portable PHP REST API suite (XAMPP / WAMP / Apache)
│   │   ├── api.php               # Master API router, CORS & status probe
│   │   ├── license.php           # Cryptographic license validation & device binding
│   │   ├── billing.php           # Fast Billing POS, item catalog & receipts
│   │   ├── config.php            # Environment configuration & crypto helpers
│   │   ├── db.php                # PDO MySQL connection & SQLite offline fallback
│   │   ├── .htaccess             # Apache rewrite rules
│   │   └── README.md             # PHP API documentation & phpMyAdmin guide
│   └── server/
│       └── PothHalaServer.java   # Zero-dependency Java 21 HTTP & REST server
├── run.bat                       # 1-click Windows Java compilation & server launch
├── run_php.bat                   # 1-click Windows PHP launcher (XAMPP/WAMP/CLI)
├── start_offline.bat             # 1-click direct browser launch (no server needed)
└── README.md                     # Documentation
```

---

## 3. Quick Start & Launch

### Method A: Standalone Java Server (Recommended)
1. Double-click `run.bat` (or run `run.bat` in Command Prompt / PowerShell).
2. The Java server will compile and start on `http://localhost:8080`, automatically opening your default web browser.

### Method B: 100% Standalone Offline Launch (No Java required)
1. Double-click `start_offline.bat` (or open `public/index.html` in Chrome or Edge).
2. The entire application runs directly in the browser with full offline functionality.

### Method C: Portable PHP REST API (XAMPP / WAMP / Apache)
1. Copy `PothHalaPro` into your web root (e.g. `C:\xampp\htdocs\PothHalaPro` or `C:\wamp64\www\PothHalaPro`).
2. Start Apache and MySQL from XAMPP or WAMP Control Panel.
3. Import `database/schema.sql` and `database/seed_data.sql` in phpMyAdmin (`http://localhost/phpmyadmin`).
4. Access API status at `http://localhost/PothHalaPro/src/php/api.php?route=status` or run `run_php.bat`.

---

## 4. Printer Calibration Guide (True 1:1 Scale)

When printing via `Ctrl + P` or the **1-Click Print A4** button:

1. Select your physical printer (Canon, Epson, HP, etc.) or **Save as PDF**.
2. Click **More settings**:
   - **Margins:** Set to **None** (or `0`).
   - **Scale:** Set to **Default** or **100%** (Do **NOT** select "Fit to printable area" or "Fit to page").
   - **Options:** Check **Background graphics**.
3. Physical printed outputs will match exact physical millimeter rulers (`85.6 × 54.0 mm` for NIC, `90.0 × 45.0 mm` for stickers).

---

## 5. Licensing & Commercial Distribution

- **Retail Lifetime License:** `LKR 7,500 – LKR 12,500` one-time payment.
- **Distributor Portal:** Access the **Distributor Keygen Portal** in the sidebar to generate valid `PHP-2027-XXXX-XXXX-XXXX` activation keys for resale to bookshops and retail communication centers.

---

## ?? 6. Git Branching & Engineering Strategy

This repository follows a structured GitFlow branching model to support collaborative multi-agent and multi-developer engineering.

### Branch Structure

| Branch | Description | Access / Policy |
| :--- | :--- | :--- |
| main | Production-ready, stable releases. | Protected. Direct commits prohibited. |
| develop | Integration branch where verified features converge. | Protected. All code must compile and pass tests. |
| developer/frontend | Frontend Web Developer (HTML5/CSS3/Vanilla JS) | Topic & UI implementations |
| developer/frontend-senior | Senior Frontend Developer | Architecture, component optimization & PWA/ServiceWorker |
| developer/backend-php | Backend Web Developer (PHP API & services) | PHP endpoints, activation & file handling |
| developer/backend-java | Java Web & Systems Developer | Core system algorithms, image processing, licensing engine |
| developer/database | Database Engineer (MySQL) | Schema migrations, relational persistence, offline storage sync |
| developer/qa | QA & Debugging Specialist | End-to-end tests, unit validation, millimeter precision calibration |
| developer/ui-ux | UX/UI Designer & Design Systems | Vector assets, print CSS geometries, color tokens, templates |
| developer/ui-ux-design-systems | Product & Design Systems Specialist | Reusable design tokens, component UI styling |
| developer/devops | DevOps & Git Specialist | CI/CD, release automation, packaging, Git branching |

### Developer Workflow
1. **Pull Latest Changes**: Ensure your branch is updated with develop:
   `ash
   git checkout develop
   git pull origin develop
   git checkout developer/<your-role>
   git merge develop
   `
2. **Commit Changes**: Use semantic commit messages and include co-authorship trailer:
   `ash
   git commit -m "feat(scope): concise description of changes"
   `
3. **Pull Request (PR)**: Submit PR from developer/<role> to develop for review.
4. **Release**: Merged from develop into main upon QA verification.

---
*Maintained by DevOps & Engineering Team.*
