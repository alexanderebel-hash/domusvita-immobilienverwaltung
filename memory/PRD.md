# DomusVita - Product Requirements Document

## Original Problem Statement
Build "DomusVita" - a premium property management app for a German care home and real estate company with:
- Apple-like dark mode design with glassmorphism effects
- German language UI throughout
- ALL 6 modules: Dashboard, Immobilien, Kontakte, Verträge, Instandhaltung, Dokumente
- Azure deployment ready with ARM/Bicep templates, Dockerfiles, GitHub Actions CI/CD

## User Preferences (Updated)
1. **LLM Key**: Emergent LLM Key (Universal Key) ✅
2. **Authentication**: Emergent-managed Google Login (infrastructure ready)
3. **Document Storage**: Azure Blob Storage (infrastructure ready)
4. **Notifications**: Email + SMS alerts (infrastructure ready)
5. **Deployment**: Azure App Service (templates provided)

## Architecture

### Tech Stack
- **Backend**: FastAPI + Python + MongoDB (Azure PostgreSQL ready)
- **Frontend**: React 18 + Tailwind CSS + Shadcn UI
- **AI**: Emergent LLM Integration (GPT-4o via Universal Key)
- **Infrastructure**: Azure App Service, Blob Storage, Container Registry

### Repository Structure
```
domusvita/
├── backend/
│   ├── server.py          # FastAPI with all API routes
│   ├── database.py        # SQLAlchemy models for PostgreSQL
│   ├── schemas.py         # Pydantic schemas
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Production container
├── frontend/
│   ├── src/pages/         # 6 module pages
│   ├── src/components/    # Shared components
│   ├── Dockerfile         # Production container
│   └── nginx.conf         # Production web server
├── infrastructure/
│   ├── main.bicep         # Azure Bicep template
│   ├── azure-deploy.json  # ARM template
│   └── parameters.template.json
└── .github/workflows/
    └── azure-deploy.yml   # CI/CD pipeline
```

## What's Been Implemented ✅

### January 24, 2025 - Full v2.0 Release

**ALL 6 MODULES COMPLETE:**

1. **Dashboard** ✅
   - Stats cards (Properties, Vacant Units, Tasks, Deadlines, Contacts, Contracts)
   - KI-Assistent with real-time responses
   - AI Insights section with alerts
   - Quick actions navigation

2. **Immobilien** ✅
   - Grid/List view toggle
   - Property cards with images
   - Filters (Type, City, Status)
   - Create/Edit/Delete properties
   - Property detail pages with units

3. **Kontakte** ✅
   - Role-based grouping (Mieter, Eigentümer, Handwerker, Versorger, Behörde)
   - Contact cards with details
   - Create/Edit/Delete contacts
   - Search and filter functionality
   - Handwerker ratings and specialties

4. **Verträge** ✅
   - Contract timeline with expiry alerts
   - Types: Mietvertrag, Hauptmietvertrag, Versicherung, Wartungsvertrag
   - Create/Edit/Delete contracts
   - Days until expiry calculation
   - Auto-renewal indicator

5. **Instandhaltung** ✅
   - Ticket system (Offen, In Bearbeitung, Erledigt)
   - Priority levels (Niedrig, Normal, Hoch, Dringend)
   - Status statistics dashboard
   - Handwerker assignment
   - Recurring maintenance support
   - Categories: Heizung, Sanitär, Elektrik, etc.

6. **Dokumente** ✅
   - Documents grouped by property
   - Upload functionality (Azure Blob ready)
   - Categories: Vertrag, Protokoll, Rechnung, Grundriss
   - File size and type display
   - Download and delete actions

**AZURE DEPLOYMENT READY:**
- Bicep template (infrastructure/main.bicep)
- ARM template (infrastructure/azure-deploy.json)
- Dockerfiles for backend and frontend
- GitHub Actions CI/CD pipeline
- nginx.conf for production frontend

**DESIGN:**
- Premium dark mode glassmorphism
- Manrope + Inter fonts
- German language throughout
- Responsive design
- Smooth animations

## API Endpoints (All Implemented)

| Module | Endpoints |
|--------|-----------|
| Dashboard | GET /api/dashboard/stats, GET /api/dashboard/insights |
| Properties | CRUD /api/properties, GET /api/properties/cities/list |
| Units | CRUD /api/units |
| Contacts | CRUD /api/contacts, GET /api/contacts/roles/list |
| Contracts | CRUD /api/contracts, GET /api/contracts/types/list |
| Maintenance | CRUD /api/maintenance, PUT /api/maintenance/{id}/status |
| Documents | CRUD /api/documents, POST /api/documents/upload |
| AI | POST /api/ai/query |

## Prioritized Backlog

### P0 - Critical ✅ DONE
- [x] Dashboard with stats
- [x] Properties CRUD
- [x] AI Assistant
- [x] All 6 modules complete

### P1 - High Priority (Infrastructure Ready)
- [ ] Google Authentication (Azure AD B2C integration)
- [ ] Real Azure Blob Storage integration
- [ ] Email notifications for contract expiry
- [ ] SMS alerts for urgent maintenance

### P2 - Medium Priority
- [ ] Property image upload
- [ ] Recurring maintenance automation
- [ ] Contract renewal reminders
- [ ] Analytics dashboard

### P3 - Nice to Have
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Tenant portal
- [ ] Export to Excel/PDF

## Next Steps for Azure Deployment
1. Create Azure Resource Group
2. Set up PostgreSQL server
3. Create Azure Container Registry
4. Configure GitHub Secrets
5. Run GitHub Actions pipeline
6. Configure custom domain
