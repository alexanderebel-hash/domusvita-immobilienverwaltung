# DomusVita - Product Requirements Document

## Original Problem Statement
Build "DomusVita" - a premium property management app for German care homes with:
- ALL 6 modules: Dashboard, Immobilien, Kontakte, Verträge, Instandhaltung, Dokumente
- **Handwerker Mobile Portal** (PWA) for craftsmen
- **Klientenmanagement** for ambulant care home communities
- Azure deployment ready
- Real DomusVita property data integration

## What's Been Implemented ✅

### January 24, 2025 - v2.3 Echte Bewohnerdaten + Klienten-Detailansicht

**ECHTE BEWOHNERDATEN INTEGRIERT:**
- ✅ 34 echte Bewohner aus Excel-Import
- ✅ 5 Pflege-WGs mit korrekten Kapazitäten
- ✅ 5 freie Zimmer insgesamt

**BELEGUNG (ECHTE DATEN):**
| WG | Belegt | Kapazität | Frei |
|----|--------|-----------|------|
| Sterndamm | 10 | 10 | 0 |
| Kupferkessel | 8 | 9 | 1 |
| Kupferkessel Klein | 3 | 4 | 1 |
| Drachenwiese | 11 | 12 | 1 |
| Drachenblick | 2 | 4 | 2 |

**KLIENTEN-DETAILANSICHT (Phase 2) COMPLETE:**
- ✅ Übersicht-Tab: Persönliche Daten, Kontaktperson, Anfrage-Details, Wohnsituation
- ✅ Kommunikation-Tab: Verlauf aller Interaktionen
- ✅ Dokumente-Tab: Verträge, Vollmachten etc.
- ✅ Verlauf-Tab: Aktivitätsprotokoll
- ✅ Quick Actions: Anrufen, E-Mail, Neuer Eintrag
- ✅ Status-Änderung per Klick auf Badge

### January 24, 2025 - v2.2 Klientenmanagement

**KLIENTENMANAGEMENT PHASE 1 COMPLETE:**
- ✅ Pflege-WGs Übersicht mit 5 ambulant betreuten Wohngemeinschaften
- ✅ Interaktive Grundrisse mit klickbaren Zimmern (echte Grundriss-Bilder)
- ✅ Klienten-Pipeline (Kanban-Board) mit Drag & Drop
- ✅ Dashboard-Statistiken für Pflege-WGs

### January 24, 2025 - v2.1 Real Data Integration

**REAL DATA INTEGRATION COMPLETE:**
- Integrated 13 real DomusVita properties from user-provided markdown file

**ALL 6 CORE MODULES COMPLETE:**
1. Dashboard ✅ - Stats, KI-Assistent, Einblicke
2. Immobilien ✅ - 13 real properties with CRUD
3. Kontakte ✅ - Role-based grouping
4. Verträge ✅ - Timeline view, Expiry alerts
5. Instandhaltung ✅ - Tickets linked to real properties
6. Dokumente ✅ - Upload, Categories

**HANDWERKER MOBILE PORTAL (/handwerker) COMPLETE:**
- Login with Demo-Schnellanmeldung
- Ticket list with filters and stats
- Ticket detail with status updates
- Photo dialog with Abbrechen button
- Work report creation
- PWA manifest and service worker

## API Endpoints

### Klientenmanagement APIs (NEW)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pflege-wgs` | GET | Liste aller Pflege-WGs |
| `/api/pflege-wgs/{wg_id}` | GET | WG-Details mit Zimmern |
| `/api/pflege-wgs/{wg_id}/zimmer` | POST | Zimmer anlegen |
| `/api/pflege-wgs/zimmer/{id}` | PUT | Zimmer aktualisieren |
| `/api/klienten/dashboard` | GET | Dashboard-Statistiken |
| `/api/klienten` | GET | Klientenliste |
| `/api/klienten/{id}` | GET/PUT/DELETE | Klient CRUD |
| `/api/klienten/{id}/status` | POST | Status-Update (Pipeline) |
| `/api/klienten/{id}/kommunikation` | GET/POST | Kommunikationsverlauf |
| `/api/klienten/{id}/zimmer/{id}` | POST | Zimmer zuweisen |
| `/api/seed-klienten` | POST | Seed-Daten anlegen |

## Test Results (January 24, 2025)
- Backend: 100% (19/19 Klientenmanagement tests passed)
- Frontend: 100%
- Bug fixed: MongoDB _id handling in Klienten-Endpoints

## Prioritized Backlog

### P0 - Critical ✅ DONE
- [x] All 6 core modules
- [x] Handwerker Mobile Portal
- [x] Real DomusVita property data integration
- [x] Klientenmanagement Phase 1 (WGs, Grundrisse, Pipeline)

### P1 - High Priority
- [ ] Klientenmanagement Phase 2: Klienten-Detailansicht mit Tabs
- [ ] Klientenmanagement Phase 3: E-Mail/WhatsApp Integration
- [ ] Office 365 E-Mail-Benachrichtigungen
- [ ] Azure Blob Storage for photos
- [ ] Push notifications for status changes
- [ ] Complete PostgreSQL migration with SQLAlchemy ORM

### P2 - Medium Priority
- [ ] Kommunikationsvorlagen (E-Mail, WhatsApp)
- [ ] Besichtigungskalender
- [ ] Digital signature from tenant
- [ ] GPS location tracking
- [ ] Offline data sync

### P3 - Nice to Have
- [ ] Microsoft Entra ID Authentication
- [ ] Make.com Automatisierung
- [ ] WhatsApp Business API
- [ ] AI-powered client matching

## Architecture

```
/app/
├── backend/
│   ├── server.py              # All API routes incl. Klientenmanagement
│   ├── schemas.py             # Pydantic models
│   └── tests/
│       └── test_klientenmanagement.py  # NEW
├── frontend/src/
│   ├── pages/
│   │   ├── PflegeWGs.jsx      # NEW - Übersicht
│   │   ├── PflegeWGDetail.jsx # NEW - Grundriss
│   │   ├── KlientenPipeline.jsx # NEW - Kanban
│   │   └── handwerker/
│   └── components/
│       └── Sidebar.jsx        # Updated with Klientenmanagement
└── database/
    ├── schema.sql
    ├── seed_data.sql
    ├── klientenmanagement_schema.sql  # NEW
    └── klientenmanagement_seed.sql    # NEW
```

## Next Steps
1. ✅ Klientenmanagement Phase 1 - DONE
2. Implement Klienten-Detailansicht with Tabs
3. Add Office 365 E-Mail notifications
4. Deploy to Azure
