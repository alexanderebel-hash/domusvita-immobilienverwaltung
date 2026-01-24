# DomusVita - Product Requirements Document

## Original Problem Statement
Build "DomusVita" - a premium property management app for a German care home and real estate company with:
- Apple-like dark mode design with glassmorphism effects
- German language UI throughout
- Core modules: Dashboard, Immobilien (Properties)
- AI Assistant for natural queries
- Cloud storage for documents, Email notifications, SMS alerts

## User Preferences
1. **LLM Key**: Emergent LLM Key (Universal Key)
2. **Authentication**: Emergent-managed Google Login (to be implemented)
3. **Document Storage**: Cloud storage (to be implemented)
4. **Notifications**: Email + SMS alerts (to be implemented)

## Architecture

### Tech Stack
- **Backend**: FastAPI + Python
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Database**: MongoDB
- **AI**: Emergent LLM Integration (GPT-4o via Universal Key)

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/` | GET | Health check |
| `/api/seed` | POST | Seed sample data |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/dashboard/insights` | GET | AI-generated insights |
| `/api/properties` | GET/POST | List/Create properties |
| `/api/properties/{id}` | GET/PUT/DELETE | Single property CRUD |
| `/api/units` | GET/POST | Property units |
| `/api/maintenance` | GET/POST | Maintenance tickets |
| `/api/ai/query` | POST | AI Assistant queries |

## What's Been Implemented ✅

### January 24, 2025 - MVP Release

**Backend:**
- FastAPI server with MongoDB integration
- Complete Properties CRUD API (Create, Read, Update, Delete)
- Units management API
- Maintenance tickets API
- Dashboard statistics endpoint
- AI insights endpoint
- AI Assistant integration with Emergent LLM Key

**Frontend:**
- Premium dark mode glassmorphism design
- Responsive sidebar navigation (German labels)
- Dashboard with:
  - Stats cards (Properties, Vacant Units, Tasks, Deadlines)
  - KI-Assistent (AI Assistant) with real-time responses
  - AI Insights section
  - Quick Actions
- Immobilien (Properties) page with:
  - Grid/List view toggle
  - Search functionality
  - Filters (Type, City, Status)
  - Property creation dialog
  - Property cards with images
- Property Detail page with:
  - Hero image section
  - Property stats
  - Units list
  - Description and details
  - Delete functionality

**Design:**
- Manrope + Inter fonts
- Glassmorphism card effects
- Smooth animations and transitions
- German language throughout
- Status badges (Eigentum, Gemietet, Untervermietet)
- Type badges (Wohnung, Gewerbe, Pflegewohngemeinschaft, Mehrfamilienhaus)

## Prioritized Backlog

### P0 - Critical (Blocking Core Functionality)
- ✅ Dashboard with stats
- ✅ Properties CRUD
- ✅ AI Assistant

### P1 - High Priority
- [ ] Google Authentication (Emergent-managed)
- [ ] Kontakte (Contacts) module
- [ ] Verträge (Contracts) module with expiry alerts

### P2 - Medium Priority
- [ ] Instandhaltung (Maintenance) module with ticket system
- [ ] Dokumente (Documents) module with cloud storage
- [ ] Email notifications for contract expiry
- [ ] SMS alerts for urgent maintenance

### P3 - Nice to Have
- [ ] Property image upload
- [ ] Recurring maintenance calendar
- [ ] Craftsmen directory with ratings
- [ ] Relationship mapping between entities
- [ ] Export functionality

## Next Tasks
1. Implement Google Authentication
2. Build Kontakte (Contacts) module
3. Build Verträge (Contracts) module with timeline view
4. Add document upload functionality with cloud storage
5. Implement email notification system
