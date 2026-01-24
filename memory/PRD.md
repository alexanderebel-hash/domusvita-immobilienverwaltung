# DomusVita - Product Requirements Document

## Original Problem Statement
Build "DomusVita" - a premium property management app for German care homes with:
- ALL 6 modules: Dashboard, Immobilien, Kontakte, Verträge, Instandhaltung, Dokumente
- **NEW: Handwerker Mobile Portal** (PWA) for craftsmen
- Azure deployment ready

## What's Been Implemented ✅

### January 24, 2025 - Full v2.0 + Handwerker Portal

**ALL 6 CORE MODULES COMPLETE:**
1. Dashboard ✅ - Stats, KI-Assistent, Insights
2. Immobilien ✅ - CRUD, Filter, Detail pages
3. Kontakte ✅ - Role-based grouping (Mieter, Eigentümer, Handwerker, Versorger, Behörde)
4. Verträge ✅ - Timeline view, Expiry alerts, 4 contract types
5. Instandhaltung ✅ - Ticket system with status/priority
6. Dokumente ✅ - Upload, Categories, Property grouping

**🆕 HANDWERKER MOBILE PORTAL (/handwerker):**

1. **Login System** ✅
   - Login mit Handwerker-ID
   - Demo Quick-Login Buttons
   - Token-basierte Authentifizierung
   - Session Management

2. **Ticket-Übersicht** ✅
   - Liste aller zugewiesenen Aufträge
   - Filter: Alle, Offen, In Bearbeitung, Erledigt
   - Statistiken (Offen/In Arbeit/Erledigt)
   - Touch-optimiertes Design

3. **Ticket-Detail** ✅
   - Status-Banner mit aktuellem Status
   - Quick Actions (Navigation, Anrufen, Foto)
   - Adresse und Kontaktdaten des Mieters
   - Beschreibung der Aufgabe

4. **Foto-Upload** ✅
   - Kamera-Zugriff aus der App
   - Kategorien: Vorher, Während, Nachher
   - Beschreibung hinzufügen
   - Komprimierung für mobile Daten
   - Foto-Galerie mit Vollbildansicht

5. **Arbeitsberichte** ✅
   - Beschreibung der Arbeiten
   - Materialien/Ersatzteile dokumentieren
   - Arbeitszeit erfassen
   - Kosten (Material + Arbeit)
   - Notizen

6. **Status-Updates** ✅
   - Unterwegs, Vor Ort, In Arbeit, Erledigt, Material fehlt
   - Automatische Zeitstempel
   - Status-Verlauf
   - Notizen zu Status-Änderungen

**PWA Features** ✅
   - Service Worker für Offline-Fähigkeit
   - PWA Manifest für Installation
   - Mobile-optimiertes Design
   - Große Touch-Targets

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

### Handwerker Portal APIs (NEW)
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

## Test Results
- Backend: 100% (28/28 endpoints)
- Frontend: 95% (minor UI polish needed)

## Prioritized Backlog

### P0 - Critical ✅ DONE
- [x] All 6 core modules
- [x] Handwerker Mobile Portal
- [x] Photo upload
- [x] Status updates
- [x] Work reports

### P1 - High Priority
- [ ] Azure Blob Storage for photos (currently base64 in MongoDB)
- [ ] Push notifications for status changes
- [ ] Email/SMS notifications to property managers
- [ ] QR-Code login for handwerker

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
1. Test Handwerker Portal thoroughly
2. Push to GitHub
3. Deploy to Azure
4. Configure Azure Blob Storage for production photos
5. Set up email notifications
