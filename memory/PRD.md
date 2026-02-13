# DomusVita - Product Requirements Document

## Original Problem Statement
Build "DomusVita" - a premium property management app for German care homes with:
- ALL 6 modules: Dashboard, Immobilien, Kontakte, Verträge, Instandhaltung, Dokumente
- **Handwerker Mobile Portal** (PWA) for craftsmen
- **Klientenmanagement** for ambulant care home communities
- Azure deployment ready
- Real DomusVita property data integration

## What's Been Implemented

### February 13, 2025 - v2.4 Klientenmanagement Phase 3

**DOCUMENT MANAGEMENT:**
- Document upload for Klienten (PDF, images, etc.)
- Document download and deletion
- Document categorization (Infomaterial, Mietvertrag, Vollmacht, Arztbrief, Pflegegutachten)
- Document status tracking (hochgeladen, gesendet)

**EMAIL SENDING (MOCKED):**
- E-Mail dialog with pre-filled recipient, subject, and body
- Document attachment selection (checkbox list)
- Communication entry automatically created
- Activity log entry automatically created
- Note: Actual email sending requires SMTP configuration

**AUTOMATIC COMMUNICATION LOGGING:**
- All status changes auto-logged in Aktivitätsverlauf
- Document uploads auto-logged
- Email sends auto-logged with attachment info
- Communication entries auto-created for emails

**KOSTENÜBERSICHT:**
- Per-WG cost breakdown (Miete, Nebenkosten, Betreuung, Verpflegung, Investition)
- Configurable cost parameters per WG
- Entgangene Einnahmen (lost revenue) calculation
- Gesamtkostenübersicht across all 5 WGs
- Auslastung (occupancy) percentage per WG

**ENHANCED UI:**
- KlientDetail: Full 4-tab layout (Übersicht, Kommunikation, Dokumente, Verlauf)
- PflegeWGDetail: 2-tab layout (Grundriss & Bewohner, Kostenübersicht)
- PflegeWGs: Financial overview section with progress bars
- Timeline-style activity log with connected dots

### January 24, 2025 - v2.3 Echte Bewohnerdaten + Klienten-Detailansicht

**ECHTE BEWOHNERDATEN INTEGRIERT:**
- 34 echte Bewohner aus Excel-Import
- 5 Pflege-WGs mit korrekten Kapazitäten

| WG | Belegt | Kapazität | Frei |
|----|--------|-----------|------|
| Sterndamm | 10 | 10 | 0 |
| Kupferkessel | 8 | 9 | 1 |
| Kupferkessel Klein | 3 | 4 | 1 |
| Drachenwiese | 11 | 12 | 1 |
| Drachenblick | 2 | 4 | 2 |

### January 24, 2025 - v2.2 Klientenmanagement Phase 1+2

- Pflege-WGs Übersicht mit Dashboard-Statistiken
- Interaktive Grundrisse mit klickbaren Zimmern
- Klienten-Pipeline (Kanban-Board) mit Drag & Drop
- Klienten-Detailansicht mit Tabs
- Neuer Klient Formular
- Besichtigungskalender (Platzhalter)

### v2.1 Real Data + Core Modules

**ALL 6 CORE MODULES COMPLETE:**
1. Dashboard - Stats, KI-Assistent, Einblicke
2. Immobilien - 13 real properties with CRUD
3. Kontakte - Role-based grouping
4. Verträge - Timeline view, Expiry alerts
5. Instandhaltung - Tickets linked to real properties
6. Dokumente - Upload, Categories

**HANDWERKER MOBILE PORTAL (/handwerker) COMPLETE:**
- Login with Demo-Schnellanmeldung
- Ticket management with status updates and photo upload
- Work report creation

## API Endpoints

### Klientenmanagement APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pflege-wgs` | GET | Liste aller Pflege-WGs |
| `/api/pflege-wgs/{wg_id}` | GET | WG-Details mit Zimmern |
| `/api/pflege-wgs/{wg_id}/kosten` | GET | Kostenübersicht pro WG |
| `/api/pflege-wgs/{wg_id}/kosten` | PUT | Kosten aktualisieren |
| `/api/pflege-wgs/kosten/gesamt` | GET | Gesamtkostenübersicht |
| `/api/klienten/dashboard` | GET | Dashboard-Statistiken |
| `/api/klienten` | GET | Klientenliste |
| `/api/klienten/{id}` | GET/PUT/DELETE | Klient CRUD |
| `/api/klienten/{id}/status` | POST | Status-Update (Pipeline) |
| `/api/klienten/{id}/kommunikation` | GET/POST | Kommunikationsverlauf |
| `/api/klienten/{id}/dokumente` | GET/POST | Dokument-Upload/Liste |
| `/api/klienten/{id}/dokumente/{id}/download` | GET | Dokument-Download |
| `/api/klienten/{id}/email-senden` | POST | E-Mail senden (MOCKED) |
| `/api/besichtigungen` | GET/POST | Besichtigungen |

## Test Results (February 13, 2025)
- Backend: 100% (14/14 V2 tests passed)
- Frontend: 100% (15/15 features verified)
- Test report: /app/test_reports/iteration_6.json

## Prioritized Backlog

### P0 - Complete
- [x] All 6 core modules
- [x] Handwerker Mobile Portal
- [x] Real DomusVita property data integration
- [x] Klientenmanagement (WGs, Grundrisse, Pipeline, Detail, Dokumente, Kosten)

### P1 - High Priority
- [ ] Real E-Mail-Versand (SMTP/SendGrid konfigurieren)
- [ ] PostgreSQL-Migration (Schema fertig in /app/database/)
- [ ] Azure Deployment & CI/CD
- [ ] PDF-Infomaterial vom Benutzer hochladen und versenden

### P2 - Medium Priority
- [ ] Besichtigungskalender vollständig implementieren
- [ ] Kommunikationsvorlagen (E-Mail-Templates)
- [ ] Push Notifications für Status-Änderungen
- [ ] Digitale Unterschrift für Arbeitsberichte
- [ ] PWA Offline-Fähigkeit

### P3 - Nice to Have
- [ ] WhatsApp Business API Integration
- [ ] AI-powered Client Matching
- [ ] Microsoft Entra ID Authentication
- [ ] Make.com Automatisierung

## Architecture

```
/app/
├── backend/
│   ├── server.py              # All API routes incl. Klientenmanagement
│   ├── schemas.py             # Pydantic models
│   └── tests/
│       ├── test_klientenmanagement.py
│       └── test_klientenmanagement_v2.py
├── frontend/src/
│   ├── pages/
│   │   ├── PflegeWGs.jsx      # WG overview + Gesamtkosten
│   │   ├── PflegeWGDetail.jsx  # Grundriss + Kostenübersicht tabs
│   │   ├── KlientenPipeline.jsx # Kanban board
│   │   ├── KlientDetail.jsx    # 4-tab detail (Übersicht, Kommunikation, Dokumente, Verlauf)
│   │   ├── NeuerKlient.jsx     # New client form
│   │   ├── Besichtigungen.jsx  # Viewing calendar
│   │   └── handwerker/
│   └── components/
│       └── Sidebar.jsx
└── database/
    ├── schema.sql
    ├── seed_data.sql
    ├── klientenmanagement_schema.sql
    └── klientenmanagement_seed.sql
```
