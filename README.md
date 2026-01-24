# DomusVita 🏠

Premium Property Management System for German Care Homes and Real Estate Companies.

![DomusVita Dashboard](docs/dashboard.png)

## Features

- **Dashboard** - Overview with statistics, AI insights, and quick actions
- **Immobilien** (Properties) - Manage buildings, units, and rooms
- **Kontakte** (Contacts) - Mieter, Eigentümer, Handwerker, Versorger, Behörden
- **Verträge** (Contracts) - Mietverträge, Versicherungen, Wartungsverträge with expiry alerts
- **Instandhaltung** (Maintenance) - Ticket system with craftsmen assignment
- **Dokumente** (Documents) - Upload to Azure Blob Storage, organized by property
- **KI-Assistent** - AI-powered assistant for natural language queries

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** / MongoDB - Database
- **Azure Blob Storage** - Document storage
- **Emergent LLM** - AI integration

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **React Router** - Navigation

### Infrastructure
- **Azure App Service** - Hosting
- **Azure Container Registry** - Docker images
- **Azure Blob Storage** - Documents
- **GitHub Actions** - CI/CD

## Project Structure

```
domusvita/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── database.py        # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend container
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── App.js         # Main app
│   ├── package.json       # Node dependencies
│   ├── Dockerfile         # Frontend container
│   └── nginx.conf         # Nginx config
├── infrastructure/
│   ├── main.bicep         # Azure Bicep template
│   ├── azure-deploy.json  # ARM template
│   └── parameters.template.json
└── .github/
    └── workflows/
        └── azure-deploy.yml  # CI/CD pipeline
```

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (for local development)
- Yarn package manager

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
uvicorn server:app --reload --port 8001
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Set environment variables
cp .env.example .env
# Edit .env with your backend URL

# Run development server
yarn start
```

## Azure Deployment

### Prerequisites
- Azure CLI installed and logged in
- Azure subscription
- Resource group created
- PostgreSQL server (existing or create new)

### Option 1: Using Bicep (Recommended)

```bash
# Navigate to infrastructure folder
cd infrastructure

# Copy and edit parameters
cp parameters.template.json parameters.json
# Edit parameters.json with your values

# Deploy
az deployment group create \
  --resource-group <your-resource-group> \
  --template-file main.bicep \
  --parameters @parameters.json
```

### Option 2: Using ARM Template

```bash
cd infrastructure

az deployment group create \
  --resource-group <your-resource-group> \
  --template-file azure-deploy.json \
  --parameters @parameters.json
```

### Option 3: GitHub Actions (CI/CD)

1. Fork this repository
2. Set up GitHub Secrets:
   - `AZURE_CREDENTIALS` - Azure service principal JSON
   - `ACR_USERNAME` - Azure Container Registry username
   - `ACR_PASSWORD` - Azure Container Registry password
   - `BACKEND_URL` - Backend API URL
3. Push to `main` branch to trigger deployment

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Service principal credentials (JSON) |
| `ACR_USERNAME` | Container registry username |
| `ACR_PASSWORD` | Container registry password |
| `BACKEND_URL` | Backend API URL (e.g., https://domusvita-api.azurewebsites.net) |

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@server:5432/domusvita
MONGO_URL=mongodb://localhost:27017  # Fallback for local dev
DB_NAME=domusvita

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER_NAME=documents

# Authentication
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Integration
EMERGENT_LLM_KEY=your-emergent-key

# CORS
CORS_ORIGINS=https://your-frontend-url.azurewebsites.net
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=https://your-backend-url.azurewebsites.net
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/properties` | GET/POST | Properties CRUD |
| `/api/contacts` | GET/POST | Contacts CRUD |
| `/api/contracts` | GET/POST | Contracts CRUD |
| `/api/maintenance` | GET/POST | Maintenance tickets |
| `/api/documents` | GET/POST | Documents CRUD |
| `/api/documents/upload` | POST | Upload document |
| `/api/ai/query` | POST | AI assistant |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For questions or support, contact: support@domusvita.de
