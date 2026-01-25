from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pathlib import Path
import os
import logging
import uuid
import base64
import io
from PIL import Image

from schemas import (
    PropertyCreate, PropertyUpdate, PropertyResponse,
    UnitCreate, UnitResponse,
    ContactCreate, ContactUpdate, ContactResponse,
    ContractCreate, ContractUpdate, ContractResponse,
    MaintenanceTicketCreate, MaintenanceTicketUpdate, MaintenanceTicketResponse,
    DocumentCreate, DocumentResponse,
    DashboardStats, AIInsight, AIQueryRequest, AIQueryResponse,
    UserCreate, UserResponse, Token,
    HandwerkerLoginRequest, HandwerkerLoginResponse,
    TicketPhotoCreate, TicketPhotoResponse,
    WorkReportCreate, WorkReportResponse,
    StatusUpdateCreate, StatusUpdateResponse,
    HandwerkerTicketResponse,
    # Klientenmanagement
    PflegeWGResponse, ZimmerCreate, ZimmerUpdate, ZimmerResponse,
    KlientCreate, KlientUpdate, KlientResponse,
    KommunikationCreate, KommunikationResponse,
    AktivitaetResponse, PipelineStats, KlientenDashboard
)

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (using MongoDB for now, can switch to PostgreSQL)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'domusvita')]

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Azure Blob Storage (optional)
AZURE_STORAGE_CONNECTION_STRING = os.environ.get('AZURE_STORAGE_CONNECTION_STRING', '')
AZURE_STORAGE_CONTAINER = os.environ.get('AZURE_STORAGE_CONTAINER_NAME', 'documents')

# App setup
app = FastAPI(
    title="DomusVita API",
    description="Premium Property Management System for German Care Homes",
    version="2.0.0"
)

api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== HELPER FUNCTIONS ====================

def generate_id() -> str:
    return str(uuid.uuid4())

def now() -> datetime:
    return datetime.now(timezone.utc)

def to_iso(dt: datetime) -> str:
    return dt.isoformat() if dt else None

def from_iso(s: str) -> datetime:
    return datetime.fromisoformat(s) if s else None

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "DomusVita API v2.0 - Ready for Azure", "status": "running"}

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    total_properties = await db.properties.count_documents({})
    total_units = await db.units.count_documents({})
    vacant_units = await db.units.count_documents({"is_vacant": True})
    pending_tasks = await db.maintenance_tickets.count_documents({"status": {"$ne": "Erledigt"}})
    total_contacts = await db.contacts.count_documents({})
    active_contracts = await db.contracts.count_documents({"is_active": True})
    
    # Count contracts expiring in next 30 days
    thirty_days = (now() + timedelta(days=30)).isoformat()
    upcoming_deadlines = await db.contracts.count_documents({
        "is_active": True,
        "end_date": {"$lte": thirty_days, "$gte": now().isoformat()}
    })
    
    return DashboardStats(
        total_properties=total_properties,
        vacant_units=vacant_units,
        pending_tasks=pending_tasks,
        upcoming_deadlines=upcoming_deadlines or 3,
        total_units=total_units,
        occupied_units=total_units - vacant_units,
        total_contacts=total_contacts,
        active_contracts=active_contracts
    )

@api_router.get("/dashboard/insights", response_model=List[AIInsight])
async def get_ai_insights():
    """Generate AI insights for dashboard"""
    insights = []
    
    vacant_count = await db.units.count_documents({"is_vacant": True})
    if vacant_count > 0:
        insights.append(AIInsight(message=f"{vacant_count} Einheiten stehen leer", type="warning"))
    
    pending = await db.maintenance_tickets.count_documents({"status": "Offen"})
    if pending > 0:
        insights.append(AIInsight(message=f"{pending} offene Wartungsaufgaben", type="info"))
    
    urgent = await db.maintenance_tickets.count_documents({"status": "Offen", "priority": "Dringend"})
    if urgent > 0:
        insights.append(AIInsight(message=f"{urgent} dringende Wartungsaufgaben!", type="warning"))
    
    # Check expiring contracts
    thirty_days = (now() + timedelta(days=30)).isoformat()
    expiring = await db.contracts.count_documents({
        "is_active": True,
        "end_date": {"$lte": thirty_days, "$gte": now().isoformat()}
    })
    if expiring > 0:
        insights.append(AIInsight(message=f"{expiring} Verträge laufen in 30 Tagen ab", type="warning"))
    
    total = await db.properties.count_documents({})
    if total > 0:
        insights.append(AIInsight(message=f"Sie verwalten {total} Immobilien", type="success"))
    
    if not insights:
        insights.append(AIInsight(message="Fügen Sie Ihre erste Immobilie hinzu", type="info"))
    
    return insights

# ==================== PROPERTIES ROUTES ====================

@api_router.post("/properties", response_model=PropertyResponse)
async def create_property(data: PropertyCreate):
    doc = {
        "id": generate_id(),
        **data.model_dump(),
        "created_at": to_iso(now()),
        "updated_at": to_iso(now())
    }
    await db.properties.insert_one(doc)
    doc["created_at"] = from_iso(doc["created_at"])
    doc["updated_at"] = from_iso(doc["updated_at"])
    return doc

@api_router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(property_type: Optional[str] = None, city: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if property_type: query["property_type"] = property_type
    if city: query["city"] = city
    if status: query["status"] = status
    
    docs = await db.properties.find(query, {"_id": 0}).to_list(1000)
    for d in docs:
        d["created_at"] = from_iso(d.get("created_at"))
        d["updated_at"] = from_iso(d.get("updated_at"))
    return docs

@api_router.get("/properties/cities/list")
async def get_cities():
    cities = await db.properties.distinct("city")
    return {"cities": cities}

@api_router.get("/properties/types/list")
async def get_property_types():
    return {"types": ["Wohnung", "Gewerbe", "Pflegewohngemeinschaft", "Mehrfamilienhaus"]}

@api_router.get("/properties/statuses/list")
async def get_statuses():
    return {"statuses": ["Eigentum", "Gemietet", "Untervermietet"]}

@api_router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str):
    doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Immobilie nicht gefunden")
    doc["created_at"] = from_iso(doc.get("created_at"))
    doc["updated_at"] = from_iso(doc.get("updated_at"))
    return doc

@api_router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: str, data: PropertyUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = to_iso(now())
    result = await db.properties.update_one({"id": property_id}, {"$set": update_data})
    if result.matched_count == 0: raise HTTPException(404, "Immobilie nicht gefunden")
    return await get_property(property_id)

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0: raise HTTPException(404, "Immobilie nicht gefunden")
    await db.units.delete_many({"property_id": property_id})
    await db.contracts.delete_many({"property_id": property_id})
    await db.maintenance_tickets.delete_many({"property_id": property_id})
    await db.documents.delete_many({"property_id": property_id})
    return {"message": "Immobilie gelöscht", "id": property_id}

# ==================== UNITS ROUTES ====================

@api_router.post("/units", response_model=UnitResponse)
async def create_unit(data: UnitCreate):
    prop = await db.properties.find_one({"id": data.property_id})
    if not prop: raise HTTPException(404, "Immobilie nicht gefunden")
    
    doc = {"id": generate_id(), **data.model_dump(), "created_at": to_iso(now())}
    await db.units.insert_one(doc)
    await db.properties.update_one({"id": data.property_id}, {"$inc": {"units_count": 1}})
    
    doc["created_at"] = from_iso(doc["created_at"])
    if doc.get("tenant_id"):
        tenant = await db.contacts.find_one({"id": doc["tenant_id"]})
        doc["tenant_name"] = tenant.get("name") if tenant else None
    return doc

@api_router.get("/units", response_model=List[UnitResponse])
async def get_units(property_id: Optional[str] = None):
    query = {"property_id": property_id} if property_id else {}
    docs = await db.units.find(query, {"_id": 0}).to_list(1000)
    for d in docs:
        d["created_at"] = from_iso(d.get("created_at"))
        if d.get("tenant_id"):
            tenant = await db.contacts.find_one({"id": d["tenant_id"]})
            d["tenant_name"] = tenant.get("name") if tenant else None
    return docs

@api_router.put("/units/{unit_id}")
async def update_unit(unit_id: str, is_vacant: bool, tenant_id: Optional[str] = None):
    update = {"is_vacant": is_vacant, "tenant_id": tenant_id}
    result = await db.units.update_one({"id": unit_id}, {"$set": update})
    if result.matched_count == 0: raise HTTPException(404, "Einheit nicht gefunden")
    return {"message": "Einheit aktualisiert"}

@api_router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str):
    unit = await db.units.find_one({"id": unit_id})
    if not unit: raise HTTPException(404, "Einheit nicht gefunden")
    await db.units.delete_one({"id": unit_id})
    await db.properties.update_one({"id": unit["property_id"]}, {"$inc": {"units_count": -1}})
    return {"message": "Einheit gelöscht"}

# ==================== CONTACTS ROUTES ====================

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(data: ContactCreate):
    doc = {"id": generate_id(), **data.model_dump(), "created_at": to_iso(now()), "updated_at": to_iso(now())}
    await db.contacts.insert_one(doc)
    doc["created_at"] = from_iso(doc["created_at"])
    doc["updated_at"] = from_iso(doc["updated_at"])
    return doc

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(role: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if role: query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}}
        ]
    
    docs = await db.contacts.find(query, {"_id": 0}).to_list(1000)
    for d in docs:
        d["created_at"] = from_iso(d.get("created_at"))
        d["updated_at"] = from_iso(d.get("updated_at"))
    return docs

@api_router.get("/contacts/roles/list")
async def get_contact_roles():
    return {"roles": ["Mieter", "Eigentümer", "Handwerker", "Versorger", "Behörde"]}

@api_router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: str):
    doc = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Kontakt nicht gefunden")
    doc["created_at"] = from_iso(doc.get("created_at"))
    doc["updated_at"] = from_iso(doc.get("updated_at"))
    return doc

@api_router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, data: ContactUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = to_iso(now())
    result = await db.contacts.update_one({"id": contact_id}, {"$set": update_data})
    if result.matched_count == 0: raise HTTPException(404, "Kontakt nicht gefunden")
    return await get_contact(contact_id)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0: raise HTTPException(404, "Kontakt nicht gefunden")
    return {"message": "Kontakt gelöscht", "id": contact_id}

# ==================== CONTRACTS ROUTES ====================

@api_router.post("/contracts", response_model=ContractResponse)
async def create_contract(data: ContractCreate):
    prop = await db.properties.find_one({"id": data.property_id})
    if not prop: raise HTTPException(404, "Immobilie nicht gefunden")
    
    doc = {
        "id": generate_id(),
        **data.model_dump(),
        "start_date": to_iso(data.start_date),
        "end_date": to_iso(data.end_date) if data.end_date else None,
        "created_at": to_iso(now()),
        "updated_at": to_iso(now())
    }
    await db.contracts.insert_one(doc)
    
    doc["start_date"] = from_iso(doc["start_date"])
    doc["end_date"] = from_iso(doc["end_date"])
    doc["created_at"] = from_iso(doc["created_at"])
    doc["updated_at"] = from_iso(doc["updated_at"])
    doc["property_name"] = prop.get("name")
    
    if doc.get("contact_id"):
        contact = await db.contacts.find_one({"id": doc["contact_id"]})
        doc["contact_name"] = contact.get("name") if contact else None
    
    if doc.get("end_date"):
        doc["days_until_expiry"] = (doc["end_date"] - now()).days
    
    return doc

@api_router.get("/contracts", response_model=List[ContractResponse])
async def get_contracts(
    property_id: Optional[str] = None,
    contract_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    expiring_soon: Optional[bool] = None
):
    query = {}
    if property_id: query["property_id"] = property_id
    if contract_type: query["contract_type"] = contract_type
    if is_active is not None: query["is_active"] = is_active
    if expiring_soon:
        thirty_days = to_iso(now() + timedelta(days=30))
        query["end_date"] = {"$lte": thirty_days, "$gte": to_iso(now())}
        query["is_active"] = True
    
    docs = await db.contracts.find(query, {"_id": 0}).to_list(1000)
    results = []
    for d in docs:
        d["start_date"] = from_iso(d.get("start_date"))
        d["end_date"] = from_iso(d.get("end_date"))
        d["created_at"] = from_iso(d.get("created_at"))
        d["updated_at"] = from_iso(d.get("updated_at"))
        
        prop = await db.properties.find_one({"id": d.get("property_id")})
        d["property_name"] = prop.get("name") if prop else None
        
        if d.get("contact_id"):
            contact = await db.contacts.find_one({"id": d["contact_id"]})
            d["contact_name"] = contact.get("name") if contact else None
        
        if d.get("end_date"):
            d["days_until_expiry"] = (d["end_date"] - now()).days
        
        results.append(d)
    
    return results

@api_router.get("/contracts/types/list")
async def get_contract_types():
    return {"types": ["Mietvertrag", "Hauptmietvertrag", "Versicherung", "Wartungsvertrag"]}

@api_router.get("/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str):
    doc = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Vertrag nicht gefunden")
    
    doc["start_date"] = from_iso(doc.get("start_date"))
    doc["end_date"] = from_iso(doc.get("end_date"))
    doc["created_at"] = from_iso(doc.get("created_at"))
    doc["updated_at"] = from_iso(doc.get("updated_at"))
    
    prop = await db.properties.find_one({"id": doc.get("property_id")})
    doc["property_name"] = prop.get("name") if prop else None
    
    if doc.get("contact_id"):
        contact = await db.contacts.find_one({"id": doc["contact_id"]})
        doc["contact_name"] = contact.get("name") if contact else None
    
    if doc.get("end_date"):
        doc["days_until_expiry"] = (doc["end_date"] - now()).days
    
    return doc

@api_router.put("/contracts/{contract_id}", response_model=ContractResponse)
async def update_contract(contract_id: str, data: ContractUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "start_date" in update_data: update_data["start_date"] = to_iso(update_data["start_date"])
    if "end_date" in update_data: update_data["end_date"] = to_iso(update_data["end_date"])
    update_data["updated_at"] = to_iso(now())
    
    result = await db.contracts.update_one({"id": contract_id}, {"$set": update_data})
    if result.matched_count == 0: raise HTTPException(404, "Vertrag nicht gefunden")
    return await get_contract(contract_id)

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str):
    result = await db.contracts.delete_one({"id": contract_id})
    if result.deleted_count == 0: raise HTTPException(404, "Vertrag nicht gefunden")
    return {"message": "Vertrag gelöscht", "id": contract_id}

# ==================== MAINTENANCE ROUTES ====================

@api_router.post("/maintenance", response_model=MaintenanceTicketResponse)
async def create_maintenance_ticket(data: MaintenanceTicketCreate):
    prop = await db.properties.find_one({"id": data.property_id})
    if not prop: raise HTTPException(404, "Immobilie nicht gefunden")
    
    doc = {
        "id": generate_id(),
        **data.model_dump(),
        "scheduled_date": to_iso(data.scheduled_date) if data.scheduled_date else None,
        "completed_date": None,
        "created_at": to_iso(now()),
        "updated_at": to_iso(now())
    }
    await db.maintenance_tickets.insert_one(doc)
    
    doc["scheduled_date"] = from_iso(doc["scheduled_date"])
    doc["created_at"] = from_iso(doc["created_at"])
    doc["updated_at"] = from_iso(doc["updated_at"])
    doc["property_name"] = prop.get("name")
    
    if doc.get("assigned_to_id"):
        assignee = await db.contacts.find_one({"id": doc["assigned_to_id"]})
        doc["assigned_to_name"] = assignee.get("name") if assignee else None
    
    return doc

@api_router.get("/maintenance", response_model=List[MaintenanceTicketResponse])
async def get_maintenance_tickets(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[str] = None
):
    query = {}
    if property_id: query["property_id"] = property_id
    if status: query["status"] = status
    if priority: query["priority"] = priority
    if assigned_to_id: query["assigned_to_id"] = assigned_to_id
    
    docs = await db.maintenance_tickets.find(query, {"_id": 0}).to_list(1000)
    results = []
    for d in docs:
        d["scheduled_date"] = from_iso(d.get("scheduled_date"))
        d["completed_date"] = from_iso(d.get("completed_date"))
        d["created_at"] = from_iso(d.get("created_at"))
        d["updated_at"] = from_iso(d.get("updated_at"))
        
        prop = await db.properties.find_one({"id": d.get("property_id")})
        d["property_name"] = prop.get("name") if prop else None
        
        if d.get("assigned_to_id"):
            assignee = await db.contacts.find_one({"id": d["assigned_to_id"]})
            d["assigned_to_name"] = assignee.get("name") if assignee else None
        
        results.append(d)
    
    return results

@api_router.get("/maintenance/categories/list")
async def get_maintenance_categories():
    return {"categories": ["Heizung", "Sanitär", "Elektrik", "Dach", "Fassade", "Garten", "Reinigung", "Sonstiges"]}

@api_router.get("/maintenance/statuses/list")
async def get_maintenance_statuses():
    return {"statuses": ["Offen", "In Bearbeitung", "Erledigt"]}

@api_router.get("/maintenance/priorities/list")
async def get_maintenance_priorities():
    return {"priorities": ["Niedrig", "Normal", "Hoch", "Dringend"]}

@api_router.get("/maintenance/{ticket_id}", response_model=MaintenanceTicketResponse)
async def get_maintenance_ticket(ticket_id: str):
    doc = await db.maintenance_tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Ticket nicht gefunden")
    
    doc["scheduled_date"] = from_iso(doc.get("scheduled_date"))
    doc["completed_date"] = from_iso(doc.get("completed_date"))
    doc["created_at"] = from_iso(doc.get("created_at"))
    doc["updated_at"] = from_iso(doc.get("updated_at"))
    
    prop = await db.properties.find_one({"id": doc.get("property_id")})
    doc["property_name"] = prop.get("name") if prop else None
    
    if doc.get("assigned_to_id"):
        assignee = await db.contacts.find_one({"id": doc["assigned_to_id"]})
        doc["assigned_to_name"] = assignee.get("name") if assignee else None
    
    return doc

@api_router.put("/maintenance/{ticket_id}", response_model=MaintenanceTicketResponse)
async def update_maintenance_ticket(ticket_id: str, data: MaintenanceTicketUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "scheduled_date" in update_data: update_data["scheduled_date"] = to_iso(update_data["scheduled_date"])
    if "completed_date" in update_data: update_data["completed_date"] = to_iso(update_data["completed_date"])
    update_data["updated_at"] = to_iso(now())
    
    result = await db.maintenance_tickets.update_one({"id": ticket_id}, {"$set": update_data})
    if result.matched_count == 0: raise HTTPException(404, "Ticket nicht gefunden")
    return await get_maintenance_ticket(ticket_id)

@api_router.put("/maintenance/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, status: str):
    update = {"status": status, "updated_at": to_iso(now())}
    if status == "Erledigt":
        update["completed_date"] = to_iso(now())
    result = await db.maintenance_tickets.update_one({"id": ticket_id}, {"$set": update})
    if result.matched_count == 0: raise HTTPException(404, "Ticket nicht gefunden")
    return {"message": "Status aktualisiert", "status": status}

@api_router.delete("/maintenance/{ticket_id}")
async def delete_maintenance_ticket(ticket_id: str):
    result = await db.maintenance_tickets.delete_one({"id": ticket_id})
    if result.deleted_count == 0: raise HTTPException(404, "Ticket nicht gefunden")
    return {"message": "Ticket gelöscht", "id": ticket_id}

# ==================== DOCUMENTS ROUTES ====================

@api_router.post("/documents", response_model=DocumentResponse)
async def create_document(data: DocumentCreate):
    prop = await db.properties.find_one({"id": data.property_id})
    if not prop: raise HTTPException(404, "Immobilie nicht gefunden")
    
    doc = {"id": generate_id(), **data.model_dump(), "created_at": to_iso(now())}
    await db.documents.insert_one(doc)
    
    doc["created_at"] = from_iso(doc["created_at"])
    doc["property_name"] = prop.get("name")
    return doc

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(property_id: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if property_id: query["property_id"] = property_id
    if category: query["category"] = category
    
    docs = await db.documents.find(query, {"_id": 0}).to_list(1000)
    results = []
    for d in docs:
        d["created_at"] = from_iso(d.get("created_at"))
        prop = await db.properties.find_one({"id": d.get("property_id")})
        d["property_name"] = prop.get("name") if prop else None
        results.append(d)
    return results

@api_router.get("/documents/categories/list")
async def get_document_categories():
    return {"categories": ["Vertrag", "Protokoll", "Rechnung", "Grundriss", "Sonstiges"]}

@api_router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc: raise HTTPException(404, "Dokument nicht gefunden")
    doc["created_at"] = from_iso(doc.get("created_at"))
    prop = await db.properties.find_one({"id": doc.get("property_id")})
    doc["property_name"] = prop.get("name") if prop else None
    return doc

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0: raise HTTPException(404, "Dokument nicht gefunden")
    return {"message": "Dokument gelöscht", "id": document_id}

# Azure Blob Storage Upload (if configured)
@api_router.post("/documents/upload")
async def upload_document(
    property_id: str,
    category: str,
    file: UploadFile = File(...)
):
    prop = await db.properties.find_one({"id": property_id})
    if not prop: raise HTTPException(404, "Immobilie nicht gefunden")
    
    # For now, return mock URL (Azure Blob would be integrated here)
    file_content = await file.read()
    file_size = len(file_content)
    
    # Mock URL - in production this would be Azure Blob Storage URL
    mock_url = f"https://domusvitastorage.blob.core.windows.net/{AZURE_STORAGE_CONTAINER}/{property_id}/{file.filename}"
    
    doc = {
        "id": generate_id(),
        "property_id": property_id,
        "name": file.filename,
        "category": category,
        "file_url": mock_url,
        "file_size": file_size,
        "file_type": file.content_type,
        "uploaded_by": "system",
        "created_at": to_iso(now())
    }
    await db.documents.insert_one(doc)
    
    doc["created_at"] = from_iso(doc["created_at"])
    doc["property_name"] = prop.get("name")
    return doc

# ==================== AI ASSISTANT ====================

@api_router.post("/ai/query", response_model=AIQueryResponse)
async def query_ai_assistant(request: AIQueryRequest):
    """AI Assistant for natural language queries"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        total_properties = await db.properties.count_documents({})
        vacant_units = await db.units.count_documents({"is_vacant": True})
        pending_tasks = await db.maintenance_tickets.count_documents({"status": {"$ne": "Erledigt"}})
        total_contacts = await db.contacts.count_documents({})
        active_contracts = await db.contracts.count_documents({"is_active": True})
        
        system_prompt = f"""Du bist der DomusVita KI-Assistent für Immobilienverwaltung.
        
Aktuelle Daten:
- Gesamtzahl Immobilien: {total_properties}
- Leerstehende Einheiten: {vacant_units}
- Offene Wartungsaufgaben: {pending_tasks}
- Kontakte: {total_contacts}
- Aktive Verträge: {active_contracts}

Antworte immer auf Deutsch, sei hilfreich und präzise."""

        if request.context:
            system_prompt += f"\n\nKontext: {request.context}"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=generate_id(),
            system_message=system_prompt
        )
        
        response = await chat.send_message(UserMessage(text=request.query))
        return AIQueryResponse(response=response, success=True)
    except Exception as e:
        logger.error(f"AI query error: {str(e)}")
        return AIQueryResponse(
            response="Es tut mir leid, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut.",
            success=False
        )

# ==================== HANDWERKER PORTAL ROUTES ====================

# Simple token storage for handwerker sessions (in production use proper JWT)
handwerker_sessions = {}

@api_router.post("/handwerker/login", response_model=HandwerkerLoginResponse)
async def handwerker_login(request: HandwerkerLoginRequest):
    """Login for craftsmen using their contact ID"""
    # Find handwerker by ID
    handwerker = await db.contacts.find_one({
        "id": request.handwerker_id,
        "role": "Handwerker"
    }, {"_id": 0})
    
    if not handwerker:
        raise HTTPException(401, "Ungültige Handwerker-ID")
    
    # Generate session token
    token = generate_id()
    handwerker_sessions[token] = {
        "handwerker_id": handwerker["id"],
        "name": handwerker.get("name"),
        "expires": (now() + timedelta(days=7)).isoformat()
    }
    
    return HandwerkerLoginResponse(
        success=True,
        token=token,
        handwerker_id=handwerker["id"],
        name=handwerker.get("name", ""),
        specialty=handwerker.get("specialty")
    )

@api_router.get("/handwerker/verify/{token}")
async def verify_handwerker_token(token: str):
    """Verify if a handwerker token is valid"""
    session = handwerker_sessions.get(token)
    if not session:
        raise HTTPException(401, "Ungültiger Token")
    
    if from_iso(session["expires"]) < now():
        del handwerker_sessions[token]
        raise HTTPException(401, "Token abgelaufen")
    
    return {"valid": True, "handwerker_id": session["handwerker_id"], "name": session["name"]}

@api_router.get("/handwerker/tickets/{handwerker_id}", response_model=List[HandwerkerTicketResponse])
async def get_handwerker_tickets(handwerker_id: str, status: Optional[str] = None):
    """Get all tickets assigned to a specific handwerker"""
    query = {"assigned_to_id": handwerker_id}
    if status:
        query["status"] = status
    
    tickets = await db.maintenance_tickets.find(query, {"_id": 0}).to_list(100)
    results = []
    
    for ticket in tickets:
        # Get property info
        prop = await db.properties.find_one({"id": ticket.get("property_id")}, {"_id": 0})
        
        # Get photos for this ticket
        photos = await db.ticket_photos.find({"ticket_id": ticket["id"]}, {"_id": 0}).to_list(100)
        for photo in photos:
            photo["uploaded_at"] = from_iso(photo.get("uploaded_at"))
        
        # Get status updates
        status_updates = await db.status_updates.find({"ticket_id": ticket["id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
        for update in status_updates:
            update["timestamp"] = from_iso(update.get("timestamp"))
        
        # Get work report
        work_report = await db.work_reports.find_one({"ticket_id": ticket["id"]}, {"_id": 0})
        if work_report:
            work_report["created_at"] = from_iso(work_report.get("created_at"))
            work_report["total_cost"] = (work_report.get("material_cost", 0) or 0) + (work_report.get("labor_cost", 0) or 0)
        
        # Get tenant info if available
        tenant_name = None
        tenant_phone = None
        if prop:
            # Find tenant for this property
            unit = await db.units.find_one({"property_id": prop["id"], "is_vacant": False})
            if unit and unit.get("tenant_id"):
                tenant = await db.contacts.find_one({"id": unit["tenant_id"]})
                if tenant:
                    tenant_name = tenant.get("name")
                    tenant_phone = tenant.get("phone")
        
        results.append({
            "id": ticket["id"],
            "property_id": ticket.get("property_id"),
            "property_name": prop.get("name") if prop else "Unbekannt",
            "property_address": f"{prop.get('address', '')}, {prop.get('postal_code', '')} {prop.get('city', '')}" if prop else "",
            "property_city": prop.get("city", "") if prop else "",
            "title": ticket.get("title"),
            "description": ticket.get("description"),
            "status": ticket.get("status", "Offen"),
            "priority": ticket.get("priority", "Normal"),
            "category": ticket.get("category"),
            "scheduled_date": from_iso(ticket.get("scheduled_date")),
            "tenant_name": tenant_name,
            "tenant_phone": tenant_phone,
            "photos": photos,
            "status_updates": status_updates,
            "work_report": work_report,
            "created_at": from_iso(ticket.get("created_at"))
        })
    
    return results

@api_router.get("/handwerker/ticket/{ticket_id}", response_model=HandwerkerTicketResponse)
async def get_handwerker_ticket_detail(ticket_id: str):
    """Get detailed ticket information for handwerker view"""
    ticket = await db.maintenance_tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(404, "Ticket nicht gefunden")
    
    # Get property info
    prop = await db.properties.find_one({"id": ticket.get("property_id")}, {"_id": 0})
    
    # Get photos
    photos = await db.ticket_photos.find({"ticket_id": ticket_id}, {"_id": 0}).to_list(100)
    for photo in photos:
        photo["uploaded_at"] = from_iso(photo.get("uploaded_at"))
    
    # Get status updates
    status_updates = await db.status_updates.find({"ticket_id": ticket_id}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    for update in status_updates:
        update["timestamp"] = from_iso(update.get("timestamp"))
    
    # Get work report
    work_report = await db.work_reports.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if work_report:
        work_report["created_at"] = from_iso(work_report.get("created_at"))
        work_report["total_cost"] = (work_report.get("material_cost", 0) or 0) + (work_report.get("labor_cost", 0) or 0)
    
    # Get tenant info
    tenant_name = None
    tenant_phone = None
    if prop:
        unit = await db.units.find_one({"property_id": prop["id"], "is_vacant": False})
        if unit and unit.get("tenant_id"):
            tenant = await db.contacts.find_one({"id": unit["tenant_id"]})
            if tenant:
                tenant_name = tenant.get("name")
                tenant_phone = tenant.get("phone")
    
    return {
        "id": ticket["id"],
        "property_id": ticket.get("property_id"),
        "property_name": prop.get("name") if prop else "Unbekannt",
        "property_address": f"{prop.get('address', '')}, {prop.get('postal_code', '')} {prop.get('city', '')}" if prop else "",
        "property_city": prop.get("city", "") if prop else "",
        "title": ticket.get("title"),
        "description": ticket.get("description"),
        "status": ticket.get("status", "Offen"),
        "priority": ticket.get("priority", "Normal"),
        "category": ticket.get("category"),
        "scheduled_date": from_iso(ticket.get("scheduled_date")),
        "tenant_name": tenant_name,
        "tenant_phone": tenant_phone,
        "photos": photos,
        "status_updates": status_updates,
        "work_report": work_report,
        "created_at": from_iso(ticket.get("created_at"))
    }

@api_router.post("/handwerker/ticket/{ticket_id}/photo", response_model=TicketPhotoResponse)
async def upload_ticket_photo(
    ticket_id: str,
    category: str = "Während",
    description: Optional[str] = None,
    handwerker_id: Optional[str] = None,
    file: UploadFile = File(...)
):
    """Upload a photo for a maintenance ticket"""
    # Verify ticket exists
    ticket = await db.maintenance_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(404, "Ticket nicht gefunden")
    
    # Read and compress image
    content = await file.read()
    
    try:
        # Compress image for mobile optimization
        img = Image.open(io.BytesIO(content))
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize if too large (max 1920px width)
        max_width = 1920
        if img.width > max_width:
            ratio = max_width / img.width
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Save compressed
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=80, optimize=True)
        compressed_content = output.getvalue()
        
        # Create thumbnail
        thumb_size = (200, 200)
        img.thumbnail(thumb_size, Image.Resampling.LANCZOS)
        thumb_output = io.BytesIO()
        img.save(thumb_output, format='JPEG', quality=70)
        thumb_content = thumb_output.getvalue()
        
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        compressed_content = content
        thumb_content = content
    
    # Generate unique filename
    photo_id = generate_id()
    filename = f"{ticket_id}/{photo_id}.jpg"
    thumb_filename = f"{ticket_id}/{photo_id}_thumb.jpg"
    
    # For now, store as base64 in MongoDB (in production use Azure Blob Storage)
    photo_url = f"data:image/jpeg;base64,{base64.b64encode(compressed_content).decode()}"
    thumbnail_url = f"data:image/jpeg;base64,{base64.b64encode(thumb_content).decode()}"
    
    # Save photo record
    photo_doc = {
        "id": photo_id,
        "ticket_id": ticket_id,
        "category": category,
        "photo_url": photo_url,
        "thumbnail_url": thumbnail_url,
        "description": description,
        "uploaded_by": handwerker_id or "system",
        "uploaded_at": to_iso(now())
    }
    await db.ticket_photos.insert_one(photo_doc)
    
    photo_doc["uploaded_at"] = from_iso(photo_doc["uploaded_at"])
    return photo_doc

@api_router.delete("/handwerker/photo/{photo_id}")
async def delete_ticket_photo(photo_id: str):
    """Delete a ticket photo"""
    result = await db.ticket_photos.delete_one({"id": photo_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Foto nicht gefunden")
    return {"message": "Foto gelöscht"}

@api_router.post("/handwerker/ticket/{ticket_id}/status", response_model=StatusUpdateResponse)
async def update_ticket_status_handwerker(
    ticket_id: str,
    data: StatusUpdateCreate
):
    """Update ticket status from handwerker app"""
    # Verify ticket exists
    ticket = await db.maintenance_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(404, "Ticket nicht gefunden")
    
    # Map handwerker status to main status
    main_status_map = {
        "Unterwegs": "In Bearbeitung",
        "Vor Ort": "In Bearbeitung",
        "In Arbeit": "In Bearbeitung",
        "Erledigt": "Erledigt",
        "Material fehlt": "In Bearbeitung"
    }
    
    main_status = main_status_map.get(data.status, data.status)
    
    # Update main ticket status
    update_data = {
        "status": main_status,
        "updated_at": to_iso(now())
    }
    if main_status == "Erledigt":
        update_data["completed_date"] = to_iso(now())
    
    await db.maintenance_tickets.update_one(
        {"id": ticket_id},
        {"$set": update_data}
    )
    
    # Create status update record
    status_update = {
        "id": generate_id(),
        "ticket_id": ticket_id,
        "status": data.status,
        "note": data.note,
        "location": data.location,
        "timestamp": to_iso(now()),
        "updated_by": ticket.get("assigned_to_id", "system")
    }
    await db.status_updates.insert_one(status_update)
    
    # TODO: Send notification to property manager/tenant
    # This would integrate with email/SMS service
    
    status_update["timestamp"] = from_iso(status_update["timestamp"])
    return status_update

@api_router.get("/handwerker/ticket/{ticket_id}/status-history", response_model=List[StatusUpdateResponse])
async def get_ticket_status_history(ticket_id: str):
    """Get status history for a ticket"""
    updates = await db.status_updates.find({"ticket_id": ticket_id}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    for update in updates:
        update["timestamp"] = from_iso(update.get("timestamp"))
    return updates

@api_router.post("/handwerker/ticket/{ticket_id}/report", response_model=WorkReportResponse)
async def create_work_report(ticket_id: str, data: WorkReportCreate):
    """Create or update work report for a ticket"""
    # Verify ticket exists
    ticket = await db.maintenance_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(404, "Ticket nicht gefunden")
    
    # Check if report exists
    existing = await db.work_reports.find_one({"ticket_id": ticket_id})
    
    total_cost = (data.material_cost or 0) + (data.labor_cost or 0)
    
    report_doc = {
        "id": existing["id"] if existing else generate_id(),
        "ticket_id": ticket_id,
        "description": data.description,
        "materials_used": data.materials_used,
        "work_hours": data.work_hours,
        "material_cost": data.material_cost,
        "labor_cost": data.labor_cost,
        "total_cost": total_cost,
        "tenant_signature": data.tenant_signature,
        "notes": data.notes,
        "created_by": ticket.get("assigned_to_id", "system"),
        "created_at": to_iso(now())
    }
    
    if existing:
        await db.work_reports.update_one({"id": existing["id"]}, {"$set": report_doc})
    else:
        await db.work_reports.insert_one(report_doc)
    
    # Update ticket cost
    await db.maintenance_tickets.update_one(
        {"id": ticket_id},
        {"$set": {"cost": total_cost, "updated_at": to_iso(now())}}
    )
    
    report_doc["created_at"] = from_iso(report_doc["created_at"])
    return report_doc

@api_router.get("/handwerker/ticket/{ticket_id}/report", response_model=WorkReportResponse)
async def get_work_report(ticket_id: str):
    """Get work report for a ticket"""
    report = await db.work_reports.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not report:
        raise HTTPException(404, "Arbeitsbericht nicht gefunden")
    
    report["created_at"] = from_iso(report.get("created_at"))
    report["total_cost"] = (report.get("material_cost", 0) or 0) + (report.get("labor_cost", 0) or 0)
    return report

@api_router.get("/handwerker/status-options")
async def get_handwerker_status_options():
    """Get available status options for handwerker"""
    return {
        "statuses": ["Unterwegs", "Vor Ort", "In Arbeit", "Erledigt", "Material fehlt"],
        "photo_categories": ["Vorher", "Während", "Nachher"]
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with comprehensive sample data"""
    existing = await db.properties.count_documents({})
    if existing > 0:
        return {"message": "Datenbank bereits befüllt", "properties_count": existing}
    
    # Sample Contacts
    contacts = [
        {"id": generate_id(), "name": "Hans Müller", "role": "Mieter", "email": "hans.mueller@email.de", "phone": "+49 30 12345678", "address": "Sterndamm 10, 12109 Berlin", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Maria Schmidt", "role": "Eigentümer", "email": "m.schmidt@email.de", "phone": "+49 89 98765432", "company": "Schmidt Immobilien GmbH", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Elektro Weber", "role": "Handwerker", "email": "info@elektro-weber.de", "phone": "+49 30 55544433", "company": "Weber Elektrotechnik", "specialty": "Elektrik", "rating": 5, "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Sanitär König", "role": "Handwerker", "email": "info@koenig-sanitaer.de", "phone": "+49 30 66677788", "company": "König Sanitär GmbH", "specialty": "Sanitär", "rating": 4, "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Stadtwerke Berlin", "role": "Versorger", "email": "service@stadtwerke-berlin.de", "phone": "+49 30 11122233", "company": "Stadtwerke Berlin AG", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Bezirksamt Treptow-Köpenick", "role": "Behörde", "email": "info@ba-tk.berlin.de", "phone": "+49 30 90297-0", "address": "Alt-Köpenick 21, 12555 Berlin", "created_at": to_iso(now()), "updated_at": to_iso(now())}
    ]
    await db.contacts.insert_many(contacts)
    
    # REAL Properties from DomusVita data
    properties = [
        {"id": generate_id(), "name": "Büro DV Gesundheit Kreuzberg (Neu)", "address": "Waldemarstraße 5", "city": "Berlin", "postal_code": "10999", "property_type": "Büro", "status": "Eigentum", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800", "description": "Bürostandort im Bezirk Friedrichshain-Kreuzberg.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Haus Hebron", "address": "Hartriegelstraße 132", "city": "Berlin", "postal_code": "12439", "property_type": "Pflegewohngemeinschaft", "status": "Eigentum", "units_count": 8, "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "description": "Pflegeeinrichtung und Wohngemeinschaft im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Büro DV Gesundheit Treptow", "address": "Baumschulenstraße 24", "city": "Berlin", "postal_code": "12437", "property_type": "Büro", "status": "Eigentum", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800", "description": "Bürostandort im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "WG Kupferkessel & Mietwohnungen", "address": "Baumschulenstraße 64", "city": "Berlin", "postal_code": "12437", "property_type": "Pflegewohngemeinschaft", "status": "Eigentum", "units_count": 6, "image_url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "description": "Kombination aus ambulant betreuter Wohngemeinschaft und sechs Mietwohnungen im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Eilertstraße 1", "address": "Eilertstraße 1", "city": "Berlin", "postal_code": "14165", "property_type": "Wohnung", "status": "Eigentum", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "description": "Immobilie im Bezirk Steglitz-Zehlendorf.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "WG Drachenwiese", "address": "Rudower Straße 228", "city": "Berlin", "postal_code": "12557", "property_type": "Pflegewohngemeinschaft", "status": "Gemietet", "units_count": 12, "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", "description": "Große ambulant betreute Wohngemeinschaft mit 12 Zimmern im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "WG Drachenblick", "address": "Rudower Straße 226", "city": "Berlin", "postal_code": "12557", "property_type": "Pflegewohngemeinschaft", "status": "Gemietet", "units_count": 4, "image_url": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", "description": "Kleinere ambulant betreute Wohngemeinschaft mit 4 Zimmern im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "WG Sterndamm", "address": "Sterndamm 10", "city": "Berlin", "postal_code": "12109", "property_type": "Pflegewohngemeinschaft", "status": "Gemietet", "units_count": 8, "image_url": "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800", "description": "Ambulant betreute Wohngemeinschaft im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Michael-Brückner-Straße 4", "address": "Michael-Brückner-Straße 4", "city": "Berlin", "postal_code": "12439", "property_type": "Wohnung", "status": "Gemietet", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", "description": "Immobilie im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Michael-Brückner-Straße 5", "address": "Michael-Brückner-Straße 5", "city": "Berlin", "postal_code": "12439", "property_type": "Wohnung", "status": "Gemietet", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", "description": "Immobilie im Bezirk Treptow-Köpenick.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Siefos", "address": "Waldemarstraße 12", "city": "Berlin", "postal_code": "10999", "property_type": "Gewerbe", "status": "Gemietet", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800", "description": "Immobilie im Bezirk Friedrichshain-Kreuzberg.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "DV Gesundheit Kreuzberg (Alt)", "address": "Waldemarstraße 10a", "city": "Berlin", "postal_code": "10999", "property_type": "Büro", "status": "Gemietet", "units_count": 1, "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800", "description": "Bürostandort im Bezirk Friedrichshain-Kreuzberg.", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "name": "Herzogin Luise Haus", "address": "Waldemarstraße 10a", "city": "Berlin", "postal_code": "10999", "property_type": "Pflegewohngemeinschaft", "status": "Gemietet", "units_count": 6, "image_url": "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", "description": "Möglicherweise im gleichen Gebäude wie DV Gesundheit Kreuzberg (Alt). Im Bezirk Friedrichshain-Kreuzberg.", "created_at": to_iso(now()), "updated_at": to_iso(now())}
    ]
    await db.properties.insert_many(properties)
    
    # Sample Units for key properties
    units = []
    # Units for Haus Hebron
    for j in range(8):
        units.append({
            "id": generate_id(),
            "property_id": properties[1]["id"],
            "unit_number": f"Zimmer {j+1}",
            "floor": j // 3,
            "rooms": 1,
            "area_sqm": 22 + (j * 2),
            "rent_amount": 1200,
            "is_vacant": j < 2,
            "tenant_id": contacts[0]["id"] if j >= 2 else None,
            "created_at": to_iso(now())
        })
    # Units for WG Kupferkessel
    for j in range(6):
        units.append({
            "id": generate_id(),
            "property_id": properties[3]["id"],
            "unit_number": f"Wohnung {j+1}",
            "floor": j // 2,
            "rooms": 2,
            "area_sqm": 45 + (j * 5),
            "rent_amount": 750 + (j * 50),
            "is_vacant": j == 0,
            "tenant_id": contacts[0]["id"] if j > 0 else None,
            "created_at": to_iso(now())
        })
    # Units for WG Drachenwiese
    for j in range(12):
        units.append({
            "id": generate_id(),
            "property_id": properties[5]["id"],
            "unit_number": f"Zimmer {j+1}",
            "floor": j // 4,
            "rooms": 1,
            "area_sqm": 18 + (j % 4) * 2,
            "rent_amount": 1100,
            "is_vacant": j < 1,
            "tenant_id": contacts[0]["id"] if j >= 1 else None,
            "created_at": to_iso(now())
        })
    await db.units.insert_many(units)
    
    # Sample Contracts
    contracts_data = [
        {"id": generate_id(), "property_id": properties[1]["id"], "contact_id": contacts[0]["id"], "contract_type": "Mietvertrag", "title": "Mietvertrag Haus Hebron", "start_date": to_iso(now() - timedelta(days=365)), "end_date": to_iso(now() + timedelta(days=365)), "monthly_amount": 9600, "is_active": True, "notice_period_days": 90, "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[5]["id"], "contact_id": contacts[1]["id"], "contract_type": "Hauptmietvertrag", "title": "Hauptmietvertrag WG Drachenwiese", "start_date": to_iso(now() - timedelta(days=730)), "end_date": to_iso(now() + timedelta(days=180)), "monthly_amount": 13200, "is_active": True, "auto_renew": True, "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[3]["id"], "contract_type": "Versicherung", "title": "Gebäudeversicherung WG Kupferkessel", "start_date": to_iso(now() - timedelta(days=180)), "end_date": to_iso(now() + timedelta(days=185)), "monthly_amount": 250, "is_active": True, "auto_renew": True, "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[1]["id"], "contact_id": contacts[2]["id"], "contract_type": "Wartungsvertrag", "title": "Elektrowartung Haus Hebron", "start_date": to_iso(now() - timedelta(days=90)), "end_date": to_iso(now() + timedelta(days=275)), "monthly_amount": 150, "is_active": True, "created_at": to_iso(now()), "updated_at": to_iso(now())}
    ]
    await db.contracts.insert_many(contracts_data)
    
    # Sample Maintenance Tickets
    tickets = [
        {"id": generate_id(), "property_id": properties[1]["id"], "assigned_to_id": contacts[2]["id"], "title": "Heizung prüfen", "description": "Jährliche Heizungswartung im Haus Hebron", "status": "Offen", "priority": "Normal", "category": "Heizung", "scheduled_date": to_iso(now() + timedelta(days=7)), "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[5]["id"], "assigned_to_id": contacts[3]["id"], "title": "Wasserschaden Badezimmer", "description": "Feuchtigkeit in Zimmer 5 der WG Drachenwiese festgestellt", "status": "In Bearbeitung", "priority": "Hoch", "category": "Sanitär", "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[3]["id"], "title": "Reinigung Treppenhaus", "description": "Wöchentliche Reinigung WG Kupferkessel", "status": "Offen", "priority": "Niedrig", "category": "Reinigung", "is_recurring": True, "recurrence_interval_days": 7, "created_at": to_iso(now()), "updated_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[6]["id"], "assigned_to_id": contacts[2]["id"], "title": "Elektrik Prüfung", "description": "E-Check fällig in WG Drachenblick", "status": "Offen", "priority": "Normal", "category": "Elektrik", "scheduled_date": to_iso(now() + timedelta(days=14)), "created_at": to_iso(now()), "updated_at": to_iso(now())}
    ]
    await db.maintenance_tickets.insert_many(tickets)
    
    # Sample Documents
    documents = [
        {"id": generate_id(), "property_id": properties[1]["id"], "name": "Mietvertrag_HausHebron.pdf", "category": "Vertrag", "file_url": "https://example.com/docs/mietvertrag_hebron.pdf", "file_size": 245000, "file_type": "application/pdf", "created_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[5]["id"], "name": "Grundriss_WG_Drachenwiese.pdf", "category": "Grundriss", "file_url": "https://example.com/docs/grundriss_drachenwiese.pdf", "file_size": 1200000, "file_type": "application/pdf", "created_at": to_iso(now())},
        {"id": generate_id(), "property_id": properties[3]["id"], "name": "Versicherungspolice_2024.pdf", "category": "Vertrag", "file_url": "https://example.com/docs/versicherung_kupferkessel.pdf", "file_size": 380000, "file_type": "application/pdf", "created_at": to_iso(now())}
    ]
    await db.documents.insert_many(documents)
    
    return {
        "message": "Datenbank erfolgreich befüllt mit echten DomusVita-Immobiliendaten",
        "properties_count": len(properties),
        "contacts_count": len(contacts),
        "contracts_count": len(contracts_data),
        "tickets_count": len(tickets),
        "documents_count": len(documents)
    }

@api_router.post("/seed-database-reset")
async def seed_database_reset():
    """Reset and re-seed database with real DomusVita data"""
    # Drop all collections
    await db.properties.delete_many({})
    await db.units.delete_many({})
    await db.contacts.delete_many({})
    await db.contracts.delete_many({})
    await db.maintenance_tickets.delete_many({})
    await db.documents.delete_many({})
    await db.ticket_photos.delete_many({})
    await db.status_updates.delete_many({})
    await db.work_reports.delete_many({})
    
    # Re-seed with real data
    return await seed_database()


# ==================== KLIENTENMANAGEMENT ENDPOINTS ====================

# Pflege-WG Liste mit Grundrissen
PFLEGE_WGS_DATA = [
    {
        "id": "wg-sterndamm",
        "kurzname": "Sterndamm",
        "property_name": "WG Sterndamm",
        "property_address": "Sterndamm 10, 12109 Berlin",
        "kapazitaet": 3,
        "grundriss_url": "https://customer-assets.emergentagent.com/job_domushome/artifacts/gv8gcuns_Grundriss%20Sterndamm.png",
        "beschreibung": "Ambulant betreute Wohngemeinschaft mit 3 Zimmern"
    },
    {
        "id": "wg-kupferkessel",
        "kurzname": "Kupferkessel",
        "property_name": "WG Kupferkessel & Mietwohnungen",
        "property_address": "Baumschulenstraße 64, 12437 Berlin",
        "kapazitaet": 6,
        "grundriss_url": None,
        "beschreibung": "Ambulant betreute Wohngemeinschaft mit 6 Zimmern"
    },
    {
        "id": "wg-kupferkessel-klein",
        "kurzname": "Kupferkessel Klein",
        "property_name": "WG Kupferkessel Klein",
        "property_address": "Baumschulenstraße 64, 12437 Berlin",
        "kapazitaet": 4,
        "grundriss_url": "https://customer-assets.emergentagent.com/job_domushome/artifacts/suv923c5_KUPFERKESSEL%20KLEIN%20GRUNDRISS.png",
        "beschreibung": "Kleinere Wohngemeinschaft mit 4 Zimmern"
    },
    {
        "id": "wg-drachenwiese",
        "kurzname": "Drachenwiese",
        "property_name": "WG Drachenwiese",
        "property_address": "Rudower Straße 228, 12557 Berlin",
        "kapazitaet": 12,
        "grundriss_url": "https://customer-assets.emergentagent.com/job_domushome/artifacts/afidfcuk_Grundriss%20WG%20Drachenwiese%20Gro%C3%9F.png",
        "beschreibung": "Große ambulant betreute Wohngemeinschaft mit 12 Zimmern"
    },
    {
        "id": "wg-drachenblick",
        "kurzname": "Drachenblick",
        "property_name": "WG Drachenblick",
        "property_address": "Rudower Straße 226, 12557 Berlin",
        "kapazitaet": 4,
        "grundriss_url": "https://customer-assets.emergentagent.com/job_domushome/artifacts/fti3j6nz_Grundriss%20Drachenblick.png",
        "beschreibung": "Ambulant betreute Wohngemeinschaft mit 4 Zimmern"
    }
]

@api_router.get("/pflege-wgs")
async def get_pflege_wgs():
    """Get all Pflege-Wohngemeinschaften with room statistics"""
    wgs = []
    for wg_data in PFLEGE_WGS_DATA:
        wg = wg_data.copy()
        # Get room stats from database
        zimmer = await db.wg_zimmer.find({"pflege_wg_id": wg["id"]}).to_list(100)
        wg["freie_zimmer"] = len([z for z in zimmer if z.get("status") == "frei"])
        wg["belegte_zimmer"] = len([z for z in zimmer if z.get("status") == "belegt"])
        wg["reservierte_zimmer"] = len([z for z in zimmer if z.get("status") == "reserviert"])
        wg["gesamt_zimmer"] = len(zimmer)
        wgs.append(wg)
    return wgs

@api_router.get("/pflege-wgs/{wg_id}")
async def get_pflege_wg(wg_id: str):
    """Get single Pflege-WG with rooms"""
    wg_data = next((w for w in PFLEGE_WGS_DATA if w["id"] == wg_id), None)
    if not wg_data:
        raise HTTPException(status_code=404, detail="WG nicht gefunden")
    
    wg = wg_data.copy()
    zimmer = await db.wg_zimmer.find({"pflege_wg_id": wg_id}).to_list(100)
    
    # Enhance rooms with resident info
    for z in zimmer:
        z["id"] = str(z.get("_id", z.get("id", "")))
        if "_id" in z:
            del z["_id"]
        if z.get("aktueller_bewohner_id"):
            bewohner = await db.klienten.find_one({"id": z["aktueller_bewohner_id"]})
            if bewohner:
                z["bewohner_name"] = f"{bewohner.get('vorname', '')} {bewohner.get('nachname', '')}"
                if bewohner.get("geburtsdatum"):
                    try:
                        geb = datetime.fromisoformat(str(bewohner["geburtsdatum"]).replace("Z", "+00:00"))
                        z["bewohner_alter"] = (now() - geb).days // 365
                    except:
                        z["bewohner_alter"] = None
                z["bewohner_pflegegrad"] = bewohner.get("pflegegrad")
    
    wg["zimmer"] = zimmer
    wg["freie_zimmer"] = len([z for z in zimmer if z.get("status") == "frei"])
    wg["belegte_zimmer"] = len([z for z in zimmer if z.get("status") == "belegt"])
    
    return wg

@api_router.post("/pflege-wgs/{wg_id}/zimmer")
async def create_zimmer(wg_id: str, zimmer: ZimmerCreate):
    """Create a new room in a Pflege-WG"""
    zimmer_dict = zimmer.model_dump()
    zimmer_dict["id"] = generate_id()
    zimmer_dict["pflege_wg_id"] = wg_id
    zimmer_dict["created_at"] = to_iso(now())
    zimmer_dict["updated_at"] = to_iso(now())
    
    await db.wg_zimmer.insert_one(zimmer_dict)
    return zimmer_dict

@api_router.put("/pflege-wgs/zimmer/{zimmer_id}")
async def update_zimmer(zimmer_id: str, zimmer: ZimmerUpdate):
    """Update a room"""
    update_data = {k: v for k, v in zimmer.model_dump().items() if v is not None}
    update_data["updated_at"] = to_iso(now())
    
    await db.wg_zimmer.update_one({"id": zimmer_id}, {"$set": update_data})
    updated = await db.wg_zimmer.find_one({"id": zimmer_id})
    if updated and "_id" in updated:
        del updated["_id"]
    return updated

# Klienten Pipeline Status Labels
PIPELINE_LABELS = {
    "neu": "Neu eingegangen",
    "erstgespraech": "Erstgespräch",
    "besichtigung_geplant": "Besichtigung geplant",
    "unterlagen_gesendet": "Unterlagen gesendet",
    "entscheidung_ausstehend": "Entscheidung ausstehend",
    "zusage": "Zusage",
    "einzug_geplant": "Einzug geplant",
    "bewohner": "Bewohner",
    "abgesagt": "Abgesagt"
}

@api_router.get("/klienten/dashboard")
async def get_klienten_dashboard():
    """Get Klientenmanagement dashboard statistics"""
    # Count all clients
    alle_klienten = await db.klienten.find({}).to_list(1000)
    
    # Count by status
    status_counts = {}
    dringend_counts = {}
    for k in alle_klienten:
        status = k.get("status", "neu")
        status_counts[status] = status_counts.get(status, 0) + 1
        if k.get("dringlichkeit") == "sofort":
            dringend_counts[status] = dringend_counts.get(status, 0) + 1
    
    # Build pipeline stats
    pipeline = []
    for status_key in ["neu", "erstgespraech", "besichtigung_geplant", "unterlagen_gesendet", "entscheidung_ausstehend", "zusage"]:
        pipeline.append({
            "status": status_key,
            "label": PIPELINE_LABELS.get(status_key, status_key),
            "anzahl": status_counts.get(status_key, 0),
            "dringend": dringend_counts.get(status_key, 0)
        })
    
    # Count free rooms
    alle_zimmer = await db.wg_zimmer.find({"status": "frei"}).to_list(100)
    
    # Handlungsbedarf (actions needed)
    handlungsbedarf = []
    
    # Unbearbeitete Anfragen
    neue_anfragen = [k for k in alle_klienten if k.get("status") == "neu"]
    if neue_anfragen:
        aelteste = min([k.get("anfrage_am", k.get("created_at")) for k in neue_anfragen])
        if isinstance(aelteste, str):
            aelteste = datetime.fromisoformat(aelteste.replace("Z", "+00:00"))
        tage = (now() - aelteste).days if aelteste else 0
        handlungsbedarf.append({
            "typ": "anfragen",
            "prioritaet": "hoch" if tage >= 2 else "mittel",
            "text": f"{len(neue_anfragen)} Anfragen unbearbeitet",
            "details": f"Älteste: {tage} Tage" if tage > 0 else "Heute eingegangen"
        })
    
    # Heutige Besichtigungen
    heute = now().date()
    besichtigungen_heute = await db.besichtigungen.find({
        "termin": {"$gte": to_iso(datetime.combine(heute, datetime.min.time())),
                   "$lt": to_iso(datetime.combine(heute, datetime.max.time()))}
    }).to_list(10)
    if besichtigungen_heute:
        handlungsbedarf.append({
            "typ": "besichtigung",
            "prioritaet": "hoch",
            "text": f"{len(besichtigungen_heute)} Besichtigung(en) heute",
            "details": "Siehe Kalender"
        })
    
    return {
        "gesamt_klienten": len(alle_klienten),
        "bewohner": status_counts.get("bewohner", 0),
        "interessenten": len(alle_klienten) - status_counts.get("bewohner", 0) - status_counts.get("ausgezogen", 0) - status_counts.get("verstorben", 0) - status_counts.get("abgesagt", 0),
        "freie_zimmer": len(alle_zimmer),
        "pipeline": pipeline,
        "handlungsbedarf": handlungsbedarf
    }

@api_router.get("/klienten")
async def get_klienten(status: Optional[str] = None, wg_id: Optional[str] = None):
    """Get all clients, optionally filtered by status or WG"""
    query = {}
    if status:
        query["status"] = status
    if wg_id:
        query["bevorzugte_wgs"] = wg_id
    
    klienten = await db.klienten.find(query).sort("anfrage_am", -1).to_list(1000)
    
    # Enhance with age and room info
    for k in klienten:
        # Keep original id field, just remove MongoDB _id
        if "_id" in k:
            del k["_id"]
        
        # Calculate age
        if k.get("geburtsdatum"):
            try:
                geb = datetime.fromisoformat(str(k["geburtsdatum"]).replace("Z", "+00:00"))
                k["alter"] = (now() - geb).days // 365
            except:
                k["alter"] = None
        
        # Get room info if bewohner
        if k.get("zimmer_id"):
            zimmer = await db.wg_zimmer.find_one({"id": k["zimmer_id"]})
            if zimmer:
                k["zimmer_nummer"] = zimmer.get("nummer")
                wg = next((w for w in PFLEGE_WGS_DATA if w["id"] == zimmer.get("pflege_wg_id")), None)
                if wg:
                    k["wg_name"] = wg.get("kurzname")
    
    return klienten

@api_router.get("/klienten/{klient_id}")
async def get_klient(klient_id: str):
    """Get single client with all details"""
    klient = await db.klienten.find_one({"id": klient_id})
    if not klient:
        raise HTTPException(status_code=404, detail="Klient nicht gefunden")
    
    klient["id"] = str(klient.get("_id", klient.get("id", "")))
    if "_id" in klient:
        del klient["_id"]
    
    # Get communications
    kommunikation = await db.klient_kommunikation.find({"klient_id": klient_id}).sort("erstellt_am", -1).to_list(100)
    for k in kommunikation:
        k["id"] = str(k.get("_id", k.get("id", "")))
        if "_id" in k:
            del k["_id"]
    klient["kommunikation"] = kommunikation
    
    # Get activities
    aktivitaeten = await db.klient_aktivitaeten.find({"klient_id": klient_id}).sort("timestamp", -1).to_list(50)
    for a in aktivitaeten:
        a["id"] = str(a.get("_id", a.get("id", "")))
        if "_id" in a:
            del a["_id"]
    klient["aktivitaeten"] = aktivitaeten
    
    # Get documents
    dokumente = await db.klient_dokumente.find({"klient_id": klient_id}).to_list(50)
    for d in dokumente:
        d["id"] = str(d.get("_id", d.get("id", "")))
        if "_id" in d:
            del d["_id"]
    klient["dokumente"] = dokumente
    
    # Calculate age
    if klient.get("geburtsdatum"):
        try:
            geb = datetime.fromisoformat(str(klient["geburtsdatum"]).replace("Z", "+00:00"))
            klient["alter"] = (now() - geb).days // 365
        except:
            klient["alter"] = None
    
    return klient

@api_router.post("/klienten")
async def create_klient(klient: KlientCreate):
    """Create a new client"""
    klient_dict = klient.model_dump()
    klient_dict["id"] = generate_id()
    klient_dict["status"] = "neu"
    klient_dict["anfrage_am"] = to_iso(now())
    klient_dict["created_at"] = to_iso(now())
    klient_dict["updated_at"] = to_iso(now())
    
    await db.klienten.insert_one(klient_dict)
    
    # Log activity
    await db.klient_aktivitaeten.insert_one({
        "id": generate_id(),
        "klient_id": klient_dict["id"],
        "aktion": "Klient angelegt",
        "nachher_wert": "neu",
        "timestamp": to_iso(now())
    })
    
    return klient_dict

@api_router.put("/klienten/{klient_id}")
async def update_klient(klient_id: str, klient: KlientUpdate):
    """Update a client"""
    existing = await db.klienten.find_one({"id": klient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Klient nicht gefunden")
    
    update_data = {k: v for k, v in klient.model_dump().items() if v is not None}
    update_data["updated_at"] = to_iso(now())
    
    # Log status change
    if "status" in update_data and update_data["status"] != existing.get("status"):
        await db.klient_aktivitaeten.insert_one({
            "id": generate_id(),
            "klient_id": klient_id,
            "aktion": "Status geändert",
            "vorher_wert": existing.get("status"),
            "nachher_wert": update_data["status"],
            "timestamp": to_iso(now())
        })
        
        # If becoming bewohner and has zimmer, update zimmer
        if update_data["status"] == "bewohner" and update_data.get("zimmer_id"):
            await db.wg_zimmer.update_one(
                {"id": update_data["zimmer_id"]},
                {"$set": {"status": "belegt", "aktueller_bewohner_id": klient_id}}
            )
    
    await db.klienten.update_one({"id": klient_id}, {"$set": update_data})
    
    updated = await db.klienten.find_one({"id": klient_id})
    if updated and "_id" in updated:
        del updated["_id"]
    return updated

@api_router.delete("/klienten/{klient_id}")
async def delete_klient(klient_id: str):
    """Delete a client"""
    # Free up room if occupied
    klient = await db.klienten.find_one({"id": klient_id})
    if klient and klient.get("zimmer_id"):
        await db.wg_zimmer.update_one(
            {"id": klient["zimmer_id"]},
            {"$set": {"status": "frei", "aktueller_bewohner_id": None}}
        )
    
    await db.klienten.delete_one({"id": klient_id})
    await db.klient_kommunikation.delete_many({"klient_id": klient_id})
    await db.klient_aktivitaeten.delete_many({"klient_id": klient_id})
    await db.klient_dokumente.delete_many({"klient_id": klient_id})
    
    return {"message": "Klient gelöscht"}

# Kommunikation
@api_router.post("/klienten/{klient_id}/kommunikation")
async def create_kommunikation(klient_id: str, komm: KommunikationCreate):
    """Add communication entry for a client"""
    komm_dict = komm.model_dump()
    komm_dict["id"] = generate_id()
    komm_dict["klient_id"] = klient_id
    komm_dict["erstellt_am"] = to_iso(now())
    
    await db.klient_kommunikation.insert_one(komm_dict)
    
    # Log activity
    typ_labels = {
        "email_aus": "E-Mail gesendet",
        "email_ein": "E-Mail erhalten",
        "anruf_aus": "Anruf durchgeführt",
        "anruf_ein": "Anruf erhalten",
        "whatsapp_aus": "WhatsApp gesendet",
        "whatsapp_ein": "WhatsApp erhalten",
        "notiz": "Notiz hinzugefügt",
        "besichtigung": "Besichtigung durchgeführt"
    }
    
    await db.klient_aktivitaeten.insert_one({
        "id": generate_id(),
        "klient_id": klient_id,
        "aktion": typ_labels.get(komm_dict["typ"], komm_dict["typ"]),
        "timestamp": to_iso(now())
    })
    
    return komm_dict

@api_router.get("/klienten/{klient_id}/kommunikation")
async def get_kommunikation(klient_id: str):
    """Get all communication for a client"""
    kommunikation = await db.klient_kommunikation.find({"klient_id": klient_id}).sort("erstellt_am", -1).to_list(100)
    for k in kommunikation:
        k["id"] = str(k.get("_id", k.get("id", "")))
        if "_id" in k:
            del k["_id"]
    return kommunikation

# Klienten Pipeline Drag & Drop
@api_router.post("/klienten/{klient_id}/status")
async def update_klient_status(klient_id: str, status: str):
    """Quick status update for pipeline drag & drop"""
    existing = await db.klienten.find_one({"id": klient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Klient nicht gefunden")
    
    old_status = existing.get("status")
    
    await db.klienten.update_one(
        {"id": klient_id},
        {"$set": {"status": status, "updated_at": to_iso(now())}}
    )
    
    # Log activity
    await db.klient_aktivitaeten.insert_one({
        "id": generate_id(),
        "klient_id": klient_id,
        "aktion": "Status geändert",
        "vorher_wert": old_status,
        "nachher_wert": status,
        "timestamp": to_iso(now())
    })
    
    return {"message": "Status aktualisiert", "old_status": old_status, "new_status": status}

# Zimmer Zuordnung
@api_router.post("/klienten/{klient_id}/zimmer/{zimmer_id}")
async def assign_klient_to_zimmer(klient_id: str, zimmer_id: str):
    """Assign a client to a room"""
    klient = await db.klienten.find_one({"id": klient_id})
    if not klient:
        raise HTTPException(status_code=404, detail="Klient nicht gefunden")
    
    zimmer = await db.wg_zimmer.find_one({"id": zimmer_id})
    if not zimmer:
        raise HTTPException(status_code=404, detail="Zimmer nicht gefunden")
    
    if zimmer.get("status") == "belegt" and zimmer.get("aktueller_bewohner_id") != klient_id:
        raise HTTPException(status_code=400, detail="Zimmer ist bereits belegt")
    
    # Free old room if exists
    if klient.get("zimmer_id") and klient["zimmer_id"] != zimmer_id:
        await db.wg_zimmer.update_one(
            {"id": klient["zimmer_id"]},
            {"$set": {"status": "frei", "aktueller_bewohner_id": None}}
        )
    
    # Assign new room
    await db.wg_zimmer.update_one(
        {"id": zimmer_id},
        {"$set": {"status": "belegt", "aktueller_bewohner_id": klient_id}}
    )
    
    # Update client
    await db.klienten.update_one(
        {"id": klient_id},
        {"$set": {
            "zimmer_id": zimmer_id,
            "status": "bewohner",
            "einzugsdatum": to_iso(now()),
            "updated_at": to_iso(now())
        }}
    )
    
    # Log activity
    wg = next((w for w in PFLEGE_WGS_DATA if w["id"] == zimmer.get("pflege_wg_id")), None)
    await db.klient_aktivitaeten.insert_one({
        "id": generate_id(),
        "klient_id": klient_id,
        "aktion": f"Zimmer {zimmer.get('nummer')} in {wg.get('kurzname', 'WG')} zugewiesen",
        "nachher_wert": zimmer_id,
        "timestamp": to_iso(now())
    })
    
    return {"message": "Zimmer zugewiesen"}

# Seed Klientenmanagement Data
@api_router.post("/seed-klienten")
async def seed_klienten_data():
    """Seed Klientenmanagement with sample data"""
    # Check if already seeded
    existing = await db.wg_zimmer.count_documents({})
    if existing > 0:
        return {"message": "Klientendaten bereits vorhanden", "zimmer_count": existing}
    
    # Seed rooms for each WG
    zimmer_data = [
        # Sterndamm (3 Zimmer)
        {"id": generate_id(), "pflege_wg_id": "wg-sterndamm", "nummer": "1", "name": "Zimmer 1", "flaeche_qm": 18.0, "status": "belegt", "position_x": 450, "position_y": 550, "breite": 200, "hoehe": 250},
        {"id": generate_id(), "pflege_wg_id": "wg-sterndamm", "nummer": "2", "name": "Zimmer 2", "flaeche_qm": 20.0, "status": "belegt", "position_x": 450, "position_y": 150, "breite": 200, "hoehe": 300},
        {"id": generate_id(), "pflege_wg_id": "wg-sterndamm", "nummer": "3", "name": "Zimmer 3", "flaeche_qm": 22.0, "status": "frei", "position_x": 200, "position_y": 50, "breite": 180, "hoehe": 200},
        # Kupferkessel Klein (4 Zimmer)
        {"id": generate_id(), "pflege_wg_id": "wg-kupferkessel-klein", "nummer": "1", "name": "Zimmer 1", "flaeche_qm": 16.0, "status": "belegt", "position_x": 550, "position_y": 550, "breite": 150, "hoehe": 200},
        {"id": generate_id(), "pflege_wg_id": "wg-kupferkessel-klein", "nummer": "2", "name": "Zimmer 2", "flaeche_qm": 18.0, "status": "frei", "position_x": 480, "position_y": 180, "breite": 150, "hoehe": 200},
        {"id": generate_id(), "pflege_wg_id": "wg-kupferkessel-klein", "nummer": "3", "name": "Zimmer 3", "flaeche_qm": 17.0, "status": "belegt", "position_x": 150, "position_y": 180, "breite": 150, "hoehe": 200},
        {"id": generate_id(), "pflege_wg_id": "wg-kupferkessel-klein", "nummer": "4", "name": "Zimmer 4", "flaeche_qm": 15.0, "status": "frei", "position_x": 100, "position_y": 480, "breite": 120, "hoehe": 180},
        # Drachenblick (4 Zimmer)
        {"id": generate_id(), "pflege_wg_id": "wg-drachenblick", "nummer": "1", "name": "Zimmer 1", "flaeche_qm": 14.0, "status": "belegt", "position_x": 500, "position_y": 450, "breite": 150, "hoehe": 180},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenblick", "nummer": "2", "name": "Zimmer 2", "flaeche_qm": 16.0, "status": "belegt", "position_x": 500, "position_y": 150, "breite": 150, "hoehe": 200},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenblick", "nummer": "3", "name": "Zimmer 3", "flaeche_qm": 15.0, "status": "frei", "position_x": 120, "position_y": 150, "breite": 150, "hoehe": 200},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenblick", "nummer": "4", "name": "Zimmer 4", "flaeche_qm": 13.0, "status": "frei", "position_x": 100, "position_y": 400, "breite": 130, "hoehe": 180},
        # Drachenwiese (12 Zimmer)
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "1", "name": "Zimmer 1", "flaeche_qm": 24.5, "status": "belegt", "position_x": 80, "position_y": 120, "breite": 120, "hoehe": 100},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "2", "name": "Zimmer 2", "flaeche_qm": 22.0, "status": "belegt", "position_x": 80, "position_y": 230, "breite": 100, "hoehe": 90},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "3", "name": "Zimmer 3", "flaeche_qm": 17.6, "status": "belegt", "position_x": 80, "position_y": 330, "breite": 100, "hoehe": 85},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "4", "name": "Zimmer 4", "flaeche_qm": 17.1, "status": "frei", "position_x": 80, "position_y": 425, "breite": 100, "hoehe": 85},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "5", "name": "Zimmer 5", "flaeche_qm": 17.1, "status": "belegt", "position_x": 80, "position_y": 520, "breite": 100, "hoehe": 85},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "6", "name": "Zimmer 6", "flaeche_qm": 20.3, "status": "belegt", "position_x": 550, "position_y": 120, "breite": 110, "hoehe": 95},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "7", "name": "Zimmer 7", "flaeche_qm": 20.3, "status": "belegt", "position_x": 550, "position_y": 225, "breite": 110, "hoehe": 95},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "8", "name": "Zimmer 8", "flaeche_qm": 19.4, "status": "belegt", "position_x": 550, "position_y": 330, "breite": 110, "hoehe": 95},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "9", "name": "Zimmer 9", "flaeche_qm": 19.6, "status": "frei", "position_x": 550, "position_y": 435, "breite": 110, "hoehe": 90},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "10", "name": "Zimmer 10", "flaeche_qm": 22.4, "status": "belegt", "position_x": 550, "position_y": 535, "breite": 110, "hoehe": 95},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "11", "name": "Zimmer 11", "flaeche_qm": 19.3, "status": "belegt", "position_x": 295, "position_y": 535, "breite": 100, "hoehe": 90},
        {"id": generate_id(), "pflege_wg_id": "wg-drachenwiese", "nummer": "12", "name": "Zimmer 12", "flaeche_qm": 21.9, "status": "belegt", "position_x": 405, "position_y": 535, "breite": 105, "hoehe": 95},
    ]
    
    for z in zimmer_data:
        z["created_at"] = to_iso(now())
        z["updated_at"] = to_iso(now())
    
    await db.wg_zimmer.insert_many(zimmer_data)
    
    # Seed sample clients
    klienten_data = [
        # Bewohner
        {"id": generate_id(), "vorname": "Helga", "nachname": "Bergmann", "geburtsdatum": "1938-03-15", "geschlecht": "weiblich", "pflegegrad": "3", "besonderheiten": "Leichte Demenz, benötigt Rollator", "kontakt_name": "Thomas Bergmann", "kontakt_beziehung": "Sohn", "kontakt_telefon": "+49 30 12345678", "kontakt_email": "thomas.bergmann@email.de", "status": "bewohner", "anfrage_quelle": "empfehlung", "dringlichkeit": "flexibel"},
        {"id": generate_id(), "vorname": "Werner", "nachname": "Fischer", "geburtsdatum": "1935-07-22", "geschlecht": "männlich", "pflegegrad": "4", "besonderheiten": "Diabetes, Sturzgefahr", "kontakt_name": "Petra Fischer", "kontakt_beziehung": "Tochter", "kontakt_telefon": "+49 30 98765432", "kontakt_email": "p.fischer@email.de", "status": "bewohner", "anfrage_quelle": "vermittlung", "dringlichkeit": "flexibel"},
        {"id": generate_id(), "vorname": "Irmgard", "nachname": "Schulze", "geburtsdatum": "1940-11-08", "geschlecht": "weiblich", "pflegegrad": "2", "besonderheiten": "Mobil mit Gehhilfe", "kontakt_name": "Klaus Schulze", "kontakt_beziehung": "Ehemann", "kontakt_telefon": "+49 30 55544433", "kontakt_email": "schulze.klaus@email.de", "status": "bewohner", "anfrage_quelle": "email", "dringlichkeit": "flexibel"},
        # Interessenten
        {"id": generate_id(), "vorname": "Gerda", "nachname": "Hoffmann", "geburtsdatum": "1942-05-20", "geschlecht": "weiblich", "pflegegrad": "3", "besonderheiten": "Fortgeschrittene Demenz, benötigt 24h Betreuung", "kontakt_name": "Michael Hoffmann", "kontakt_beziehung": "Sohn", "kontakt_telefon": "+49 30 11122233", "kontakt_email": "m.hoffmann@email.de", "status": "neu", "anfrage_quelle": "email", "dringlichkeit": "sofort", "bevorzugte_wgs": ["wg-drachenwiese", "wg-drachenblick"]},
        {"id": generate_id(), "vorname": "Hans-Jürgen", "nachname": "Meyer", "geburtsdatum": "1937-09-12", "geschlecht": "männlich", "pflegegrad": "2", "besonderheiten": "Leichte kognitive Einschränkungen", "kontakt_name": "Sabine Meyer", "kontakt_beziehung": "Tochter", "kontakt_telefon": "+49 30 44455566", "kontakt_email": "s.meyer@email.de", "status": "erstgespraech", "anfrage_quelle": "telefon", "dringlichkeit": "4_wochen", "bevorzugte_wgs": ["wg-sterndamm"]},
        {"id": generate_id(), "vorname": "Elfriede", "nachname": "Wagner", "geburtsdatum": "1939-02-28", "geschlecht": "weiblich", "pflegegrad": "4", "besonderheiten": "Bettlägerig, PEG-Sonde", "kontakt_name": "Andrea Wagner", "kontakt_beziehung": "Tochter", "kontakt_telefon": "+49 30 77788899", "kontakt_email": "a.wagner@web.de", "status": "besichtigung_geplant", "anfrage_quelle": "vermittlung", "vermittler": "Vivantes Klinikum Neukölln", "dringlichkeit": "sofort", "bevorzugte_wgs": ["wg-drachenwiese"]},
        {"id": generate_id(), "vorname": "Ingeborg", "nachname": "Becker", "geburtsdatum": "1944-08-05", "geschlecht": "weiblich", "pflegegrad": "3", "besonderheiten": "Diabetes, Herzinsuffizienz", "kontakt_name": "Frank Becker", "kontakt_beziehung": "Sohn", "kontakt_telefon": "+49 30 33344455", "kontakt_email": "fbecker@gmail.com", "status": "unterlagen_gesendet", "anfrage_quelle": "website", "dringlichkeit": "3_monate", "bevorzugte_wgs": ["wg-kupferkessel-klein", "wg-drachenblick"]},
        {"id": generate_id(), "vorname": "Kurt", "nachname": "Richter", "geburtsdatum": "1936-12-18", "geschlecht": "männlich", "pflegegrad": "5", "besonderheiten": "Schwere Demenz, Weglauftendenz", "kontakt_name": "Monika Richter", "kontakt_beziehung": "Ehefrau", "kontakt_telefon": "+49 30 66677788", "kontakt_email": "monika.richter@t-online.de", "status": "entscheidung_ausstehend", "anfrage_quelle": "empfehlung", "dringlichkeit": "sofort", "bevorzugte_wgs": ["wg-drachenwiese"]},
    ]
    
    for k in klienten_data:
        k["anfrage_am"] = to_iso(now() - timedelta(days=hash(k["nachname"]) % 14))
        k["created_at"] = to_iso(now())
        k["updated_at"] = to_iso(now())
        if "bevorzugte_wgs" not in k:
            k["bevorzugte_wgs"] = []
    
    await db.klienten.insert_many(klienten_data)
    
    # Assign some clients to rooms
    bewohner = [k for k in klienten_data if k["status"] == "bewohner"]
    belegte_zimmer = [z for z in zimmer_data if z["status"] == "belegt"]
    
    for i, bew in enumerate(bewohner[:len(belegte_zimmer)]):
        zimmer = belegte_zimmer[i]
        await db.wg_zimmer.update_one(
            {"id": zimmer["id"]},
            {"$set": {"aktueller_bewohner_id": bew["id"]}}
        )
        await db.klienten.update_one(
            {"id": bew["id"]},
            {"$set": {"zimmer_id": zimmer["id"]}}
        )
    
    return {
        "message": "Klientendaten erfolgreich angelegt",
        "zimmer_count": len(zimmer_data),
        "klienten_count": len(klienten_data)
    }

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
