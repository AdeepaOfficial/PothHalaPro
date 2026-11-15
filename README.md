# PothHalaPro 🇱🇰

> All-in-One Bookshop, Communication & Education Print Studio.  
> High-speed, offline-capable print production web application engineered for Sri Lankan communication centers and bookshops.

---

## 📌 Project Overview
PothHalaPro enables counter operators to produce exact 1:1 physical millimeter scale (`100%` true-size) A4 print layouts in under 10 seconds. Built around a single lifetime activation code model with offline PWA capability.

### Core Modules
1. **Smart NIC & Driving License 1:1 Scale Cloner**
   - ISO ID-1 (`85.6 × 54 mm`) Smart NICs & Driving Licenses
   - Classic (`100 × 65 mm`) & Postal IDs (`95 × 60 mm`)
   - 4 A4 layout modes: Side-by-Side, Stacked, Fold & Laminate, 4-Copy Eco
   - Image enhancement & cutting guides
2. **Smart School Name Sticker Studio**
   - Bilingual (Sinhala & English) 8-sticker A4 sheet generator (`90 × 45 mm` per sticker)
   - Grade 1 to 13 school curriculum subject automation
   - Cartoon & avatar customizer (Superheroes, Astronauts, Princesses, Racing Cars, Robots, Dinosaurs, Mascots)
   - Multi-Pack & 8-Pack printing

---

## 🌿 Git Branching Strategy

This repository follows a structured GitFlow branching model to support collaborative multi-agent and multi-developer engineering.

### Branch Structure

| Branch | Description | Access / Policy |
| :--- | :--- | :--- |
| `main` | Production-ready, stable releases. | Protected. Direct commits prohibited. |
| `develop` | Integration branch where verified features converge. | Protected. All code must compile and pass tests. |
| `developer/frontend` | Frontend Web Developer (HTML5/CSS3/Vanilla JS) | Topic & UI implementations |
| `developer/frontend-senior` | Senior Frontend Developer | Architecture, component optimization & PWA/ServiceWorker |
| `developer/backend-php` | Backend Web Developer (PHP API & services) | PHP endpoints, activation & file handling |
| `developer/backend-java` | Java Web & Systems Developer | Core system algorithms, image processing, licensing engine |
| `developer/database` | Database Engineer (MySQL) | Schema migrations, relational persistence, offline storage sync |
| `developer/qa` | QA & Debugging Specialist | End-to-end tests, unit validation, millimeter precision calibration |
| `developer/ui-ux` | UX/UI Designer & Design Systems | Vector assets, print CSS geometries, color tokens, templates |
| `developer/devops` | DevOps & Git Specialist | CI/CD, release automation, packaging, Git branching |

### Developer Workflow
1. **Pull Latest Changes**: Ensure your branch is updated with `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout developer/<your-role>
   git merge develop
   ```
2. **Commit Changes**: Use semantic commit messages and include co-authorship trailer:
   ```bash
   git commit -m "feat(scope): concise description of changes"
   ```
3. **Pull Request (PR)**: Submit PR from `developer/<role>` to `develop` for review.
4. **Release**: Merged from `develop` into `main` upon QA verification.

---

## 📂 Project Directory Structure

```
PothHalaPro/
├── public/
│   ├── assets/
│   │   ├── cartoons/         # Vector cartoon stickers
│   │   ├── icons/            # App icons
│   │   └── samples/          # Sample document vectors
│   ├── css/
│   │   ├── print.css         # Physical millimeter print styles
│   │   └── style.css         # UI styles & themes
│   ├── js/
│   │   └── license.js        # License & verification logic
│   ├── manifest.json         # PWA Manifest
│   └── sw.js                 # Service worker for offline caching
├── src/
│   └── server/               # Backend services & APIs
├── bin/                      # Build outputs
├── .gitignore
└── README.md
```

---
*Maintained by DevOps & Engineering Team.*
