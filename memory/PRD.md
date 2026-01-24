# DomusVita - Product Requirements Document

## Original Problem Statement
Build "DomusVita" - a premium property management app for German care homes with:
- ALL 6 modules: Dashboard, Immobilien, Kontakte, Verträge, Instandhaltung, Dokumente
- **Handwerker Mobile Portal** (PWA) for craftsmen
- Azure deployment ready
- Real DomusVita property data integration

## What's Been Implemented ✅

### January 24, 2025 - v2.1 Real Data Integration

**REAL DATA INTEGRATION COMPLETE:**
- Integrated 13 real DomusVita properties from user-provided markdown file
- All properties are now real Berlin locations (Kreuzberg, Treptow-Köpenick, Steglitz-Zehlendorf)
- Properties include: Büro DV Gesundheit, Haus Hebron, WG Kupferkessel, WG Drachenwiese, WG Drachenblick, etc.

**ALL 6 CORE MODULES COMPLETE:**
1. Dashboard ✅ - Stats (13 Immobilien, 4 Leerstehende, 4 Offene, 3 Fristen), KI-Assistent, Einblicke
2. Immobilien ✅ - 13 real properties with CRUD, Filter, Detail pages
3. Kontakte ✅ - Role-based grouping (Mieter, Eigentümer, Handwerker, Versorger, Behörde)
4. Verträge ✅ - Timeline view, Expiry alerts, 4 contract types
5. Instandhaltung ✅ - 4 tickets linked to real properties (Haus Hebron, WG Drachenwiese, etc.)
6. Dokumente ✅ - Upload, Categories, Property grouping

**HANDWERKER MOBILE PORTAL (/handwerker) COMPLETE:**
- Login with Demo-Schnellanmeldung (Elektro Weber, Sanitär König)
- Ticket list with filters and stats
- Ticket detail with status updates
- Photo dialog with Abbrechen button (BUG FIXED)
- Work report creation
- PWA manifest and service worker

## Real Property Data (13 Immobilien)

| Name | Adresse | Typ | Status | Einheiten |
|------|---------|-----|--------|-----------|
| Büro DV Gesundheit Kreuzberg (Neu) | Waldemarstraße 5, 10999 Berlin | Büro | Eigentum | 1 |
| Haus Hebron | Hartriegelstraße 132, 12439 Berlin | Pflegewohngemeinschaft | Eigentum | 8 |
| Büro DV Gesundheit Treptow | Baumschulenstraße 24, 12437 Berlin | Büro | Eigentum | 1 |
| WG Kupferkessel & Mietwohnungen | Baumschulenstraße 64, 12437 Berlin | Pflegewohngemeinschaft | Eigentum | 6 |
| Eilertstraße 1 | Eilertstraße 1, 14165 Berlin | Wohnung | Eigentum | 1 |
| WG Drachenwiese | Rudower Straße 228, 12557 Berlin | Pflegewohngemeinschaft | Gemietet | 12 |
| WG Drachenblick | Rudower Straße 226, 12557 Berlin | Pflegewohngemeinschaft | Gemietet | 4 |
| WG Sterndamm | Sterndamm 10, 12109 Berlin | Pflegewohngemeinschaft | Gemietet | 8 |
| Michael-Brückner-Straße 4 | Michael-Brückner-Straße 4, 12439 Berlin | Wohnung | Gemietet | 1 |
| Michael-Brückner-Straße 5 | Michael-Brückner-Straße 5, 12439 Berlin | Wohnung | Gemietet | 1 |
| Siefos | Waldemarstraße 12, 10999 Berlin | Gewerbe | Gemietet | 1 |
| DV Gesundheit Kreuzberg (Alt) | Waldemarstraße 10a, 10999 Berlin | Büro | Gemietet | 1 |
| Herzogin Luise Haus | Waldemarstraße 10a, 10999 Berlin | Pflegewohngemeinschaft | Gemietet | 6 |

## API Endpoints (All Implemented)

### Core APIs
| Module | Endpoints |
|--------|-----------|
| Dashboard | GET /api/dashboard/stats, GET /api/dashboard/insights |
| Properties | CRUD /api/properties |
| Contacts | CRUD /api/contacts |
| Contracts | CRUD /api/contracts |
| Maintenance | CRUD /api/maintenance |
| Documents | CRUD /api/documents |
| AI | POST /api/ai/query |
| Seed | POST /api/seed, POST /api/seed-database-reset |

### Handwerker Portal APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/handwerker/login` | POST | Login with Handwerker-ID |
| `/api/handwerker/verify/{token}` | GET | Verify session token |
| `/api/handwerker/tickets/{id}` | GET | Get assigned tickets |
| `/api/handwerker/ticket/{id}` | GET | Get ticket detail |
| `/api/handwerker/ticket/{id}/photo` | POST | Upload photo |
| `/api/handwerker/photo/{id}` | DELETE | Delete photo |
| `/api/handwerker/ticket/{id}/status` | POST | Update status |
| `/api/handwerker/ticket/{id}/report` | POST/GET | Work report |
| `/api/handwerker/status-options` | GET | Get status options |

## Tech Stack
- **Backend**: FastAPI + MongoDB (Azure PostgreSQL ready)
- **Frontend**: React 18 + Tailwind CSS + Shadcn UI
- **Mobile Portal**: PWA mit Service Worker
- **AI**: Emergent LLM Integration

## Test Results (January 24, 2025)
- Backend: 100% (35/35 tests passed)
- Frontend: 100%
- All real data integration verified

## Prioritized Backlog

### P0 - Critical ✅ DONE
- [x] All 6 core modules
- [x] Handwerker Mobile Portal
- [x] Photo upload
- [x] Status updates
- [x] Work reports
- [x] Real DomusVita property data integration
- [x] Photo dialog Abbrechen button fix

### P1 - High Priority
- [ ] Azure Blob Storage for photos (currently base64 in MongoDB)
- [ ] Push notifications for status changes
- [ ] Email/SMS notifications to property managers
- [ ] QR-Code login for handwerker
- [ ] Complete PostgreSQL migration with SQLAlchemy ORM

### P2 - Medium Priority
- [ ] Digital signature from tenant
- [ ] GPS location tracking
- [ ] Offline data sync
- [ ] Material inventory management

### P3 - Nice to Have
- [ ] Native mobile app (React Native)
- [ ] Voice notes for reports
- [ ] AI photo analysis (damage assessment)
- [ ] Route optimization for multiple tickets

## Next Steps
1. ✅ Test all features with real data - DONE
2. Push to GitHub
3. Deploy to Azure
4. Configure Azure Blob Storage for production photos
5. Set up email notifications
