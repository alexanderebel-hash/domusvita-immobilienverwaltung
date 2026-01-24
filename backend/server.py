from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="DomusVita API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# ==================== MODELS ====================

class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    postal_code: str
    property_type: str  # Wohnung, Gewerbe, Pflegewohngemeinschaft, Mehrfamilienhaus
    status: str  # Eigentum, Gemietet, Untervermietet
    units_count: int = 0
    image_url: Optional[str] = None
    description: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class Property(PropertyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UnitBase(BaseModel):
    property_id: str
    unit_number: str
    floor: int
    rooms: int
    area_sqm: float
    rent_amount: float
    is_vacant: bool = True
    tenant_name: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class Unit(UnitBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    total_properties: int
    vacant_units: int
    pending_tasks: int
    upcoming_deadlines: int
    total_units: int
    occupied_units: int

class AIInsight(BaseModel):
    message: str
    type: str  # warning, info, success
    property_id: Optional[str] = None

class AIQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None

class AIQueryResponse(BaseModel):
    response: str
    success: bool

class MaintenanceTicket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    property_name: str
    title: str
    description: str
    status: str = "Offen"  # Offen, In Bearbeitung, Erledigt
    priority: str = "Normal"  # Niedrig, Normal, Hoch, Dringend
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MaintenanceTicketCreate(BaseModel):
    property_id: str
    property_name: str
    title: str
    description: str
    priority: str = "Normal"

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "DomusVita API läuft"}

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Hole Dashboard-Statistiken"""
    total_properties = await db.properties.count_documents({})
    total_units = await db.units.count_documents({})
    vacant_units = await db.units.count_documents({"is_vacant": True})
    pending_tasks = await db.maintenance_tickets.count_documents({"status": {"$ne": "Erledigt"}})
    
    # Mock upcoming deadlines for now
    upcoming_deadlines = 3
    
    return DashboardStats(
        total_properties=total_properties,
        vacant_units=vacant_units,
        pending_tasks=pending_tasks,
        upcoming_deadlines=upcoming_deadlines,
        total_units=total_units,
        occupied_units=total_units - vacant_units
    )

@api_router.get("/dashboard/insights", response_model=List[AIInsight])
async def get_ai_insights():
    """Hole KI-generierte Einblicke"""
    insights = []
    
    # Check for vacant units
    vacant_count = await db.units.count_documents({"is_vacant": True})
    if vacant_count > 0:
        insights.append(AIInsight(
            message=f"{vacant_count} Einheiten stehen leer",
            type="warning"
        ))
    
    # Check for pending maintenance
    pending_maintenance = await db.maintenance_tickets.count_documents({"status": "Offen"})
    if pending_maintenance > 0:
        insights.append(AIInsight(
            message=f"{pending_maintenance} offene Wartungsaufgaben",
            type="info"
        ))
    
    # Add some contextual insights
    total_properties = await db.properties.count_documents({})
    if total_properties > 0:
        insights.append(AIInsight(
            message=f"Sie verwalten {total_properties} Immobilien",
            type="success"
        ))
    
    # Default insight if empty
    if not insights:
        insights.append(AIInsight(
            message="Fügen Sie Ihre erste Immobilie hinzu, um loszulegen",
            type="info"
        ))
    
    return insights

# ==================== PROPERTIES ROUTES ====================

@api_router.post("/properties", response_model=Property)
async def create_property(property_data: PropertyCreate):
    """Erstelle eine neue Immobilie"""
    property_obj = Property(**property_data.model_dump())
    doc = property_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.properties.insert_one(doc)
    return property_obj

@api_router.get("/properties", response_model=List[Property])
async def get_properties(
    property_type: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None
):
    """Hole alle Immobilien mit optionalen Filtern"""
    query = {}
    if property_type:
        query["property_type"] = property_type
    if city:
        query["city"] = city
    if status:
        query["status"] = status
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(1000)
    
    for prop in properties:
        if isinstance(prop.get('created_at'), str):
            prop['created_at'] = datetime.fromisoformat(prop['created_at'])
        if isinstance(prop.get('updated_at'), str):
            prop['updated_at'] = datetime.fromisoformat(prop['updated_at'])
    
    return properties

@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    """Hole eine einzelne Immobilie"""
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Immobilie nicht gefunden")
    
    if isinstance(property_doc.get('created_at'), str):
        property_doc['created_at'] = datetime.fromisoformat(property_doc['created_at'])
    if isinstance(property_doc.get('updated_at'), str):
        property_doc['updated_at'] = datetime.fromisoformat(property_doc['updated_at'])
    
    return property_doc

@api_router.put("/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, property_data: PropertyCreate):
    """Aktualisiere eine Immobilie"""
    existing = await db.properties.find_one({"id": property_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Immobilie nicht gefunden")
    
    update_data = property_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.properties.update_one({"id": property_id}, {"$set": update_data})
    
    updated = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    """Lösche eine Immobilie"""
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Immobilie nicht gefunden")
    
    # Also delete associated units
    await db.units.delete_many({"property_id": property_id})
    
    return {"message": "Immobilie gelöscht", "id": property_id}

# ==================== UNITS ROUTES ====================

@api_router.post("/units", response_model=Unit)
async def create_unit(unit_data: UnitCreate):
    """Erstelle eine neue Einheit"""
    # Verify property exists
    property_doc = await db.properties.find_one({"id": unit_data.property_id})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Immobilie nicht gefunden")
    
    unit_obj = Unit(**unit_data.model_dump())
    doc = unit_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.units.insert_one(doc)
    
    # Update property units count
    await db.properties.update_one(
        {"id": unit_data.property_id},
        {"$inc": {"units_count": 1}}
    )
    
    return unit_obj

@api_router.get("/units", response_model=List[Unit])
async def get_units(property_id: Optional[str] = None):
    """Hole alle Einheiten"""
    query = {}
    if property_id:
        query["property_id"] = property_id
    
    units = await db.units.find(query, {"_id": 0}).to_list(1000)
    
    for unit in units:
        if isinstance(unit.get('created_at'), str):
            unit['created_at'] = datetime.fromisoformat(unit['created_at'])
    
    return units

@api_router.get("/properties/cities/list")
async def get_cities():
    """Hole alle einzigartigen Städte"""
    cities = await db.properties.distinct("city")
    return {"cities": cities}

@api_router.get("/properties/types/list")
async def get_property_types():
    """Hole alle Immobilientypen"""
    return {"types": ["Wohnung", "Gewerbe", "Pflegewohngemeinschaft", "Mehrfamilienhaus"]}

@api_router.get("/properties/statuses/list")
async def get_statuses():
    """Hole alle Status-Optionen"""
    return {"statuses": ["Eigentum", "Gemietet", "Untervermietet"]}

# ==================== MAINTENANCE ROUTES ====================

@api_router.post("/maintenance", response_model=MaintenanceTicket)
async def create_maintenance_ticket(ticket_data: MaintenanceTicketCreate):
    """Erstelle ein neues Wartungsticket"""
    ticket_obj = MaintenanceTicket(**ticket_data.model_dump())
    doc = ticket_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.maintenance_tickets.insert_one(doc)
    return ticket_obj

@api_router.get("/maintenance", response_model=List[MaintenanceTicket])
async def get_maintenance_tickets(status: Optional[str] = None):
    """Hole alle Wartungstickets"""
    query = {}
    if status:
        query["status"] = status
    
    tickets = await db.maintenance_tickets.find(query, {"_id": 0}).to_list(1000)
    
    for ticket in tickets:
        if isinstance(ticket.get('created_at'), str):
            ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
    
    return tickets

@api_router.put("/maintenance/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, status: str):
    """Aktualisiere Ticket-Status"""
    result = await db.maintenance_tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    return {"message": "Status aktualisiert", "status": status}

# ==================== AI ASSISTANT ROUTES ====================

@api_router.post("/ai/query", response_model=AIQueryResponse)
async def query_ai_assistant(request: AIQueryRequest):
    """KI-Assistent für natürliche Anfragen"""
    try:
        # Get some context from database
        total_properties = await db.properties.count_documents({})
        vacant_units = await db.units.count_documents({"is_vacant": True})
        pending_tasks = await db.maintenance_tickets.count_documents({"status": {"$ne": "Erledigt"}})
        
        system_prompt = f"""Du bist der DomusVita KI-Assistent für Immobilienverwaltung in Deutschland.
        
Aktuelle Daten:
- Gesamtzahl Immobilien: {total_properties}
- Leerstehende Einheiten: {vacant_units}
- Offene Wartungsaufgaben: {pending_tasks}

Antworte immer auf Deutsch und sei hilfreich und präzise."""

        if request.context:
            system_prompt += f"\n\nZusätzlicher Kontext: {request.context}"

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system_prompt
        )
        
        user_msg = UserMessage(text=request.query)
        response = await chat.send_message(user_msg)
        
        return AIQueryResponse(response=response, success=True)
    except Exception as e:
        logging.error(f"AI query error: {str(e)}")
        return AIQueryResponse(
            response="Es tut mir leid, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es später erneut.",
            success=False
        )

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with sample data"""
    # Check if already seeded
    existing = await db.properties.count_documents({})
    if existing > 0:
        return {"message": "Datenbank bereits befüllt", "properties_count": existing}
    
    sample_properties = [
        {
            "id": str(uuid.uuid4()),
            "name": "Pflegewohngemeinschaft Sterndamm",
            "address": "Sterndamm 10",
            "city": "Berlin",
            "postal_code": "12109",
            "property_type": "Pflegewohngemeinschaft",
            "status": "Eigentum",
            "units_count": 8,
            "image_url": "https://images.unsplash.com/photo-1664813954641-1ffcb7b55fd1?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "description": "Moderne Pflegewohngemeinschaft mit 8 Einheiten",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mehrfamilienhaus Prenzlauer Berg",
            "address": "Schönhauser Allee 45",
            "city": "Berlin",
            "postal_code": "10437",
            "property_type": "Mehrfamilienhaus",
            "status": "Eigentum",
            "units_count": 12,
            "image_url": "https://images.unsplash.com/photo-1664813953897-ada06817c48c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "description": "Altbau mit 12 Wohneinheiten im begehrten Prenzlauer Berg",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Gewerbeobjekt Mitte",
            "address": "Friedrichstraße 123",
            "city": "Berlin",
            "postal_code": "10117",
            "property_type": "Gewerbe",
            "status": "Untervermietet",
            "units_count": 4,
            "image_url": "https://images.unsplash.com/photo-1664813953310-ea2953c0ec99?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "description": "Büroflächen in zentraler Lage",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Seniorenresidenz am Park",
            "address": "Parkstraße 22",
            "city": "München",
            "postal_code": "80333",
            "property_type": "Pflegewohngemeinschaft",
            "status": "Gemietet",
            "units_count": 16,
            "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "description": "Exklusive Seniorenresidenz mit Parkblick",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Stadtwohnung Charlottenburg",
            "address": "Kurfürstendamm 88",
            "city": "Berlin",
            "postal_code": "10709",
            "property_type": "Wohnung",
            "status": "Eigentum",
            "units_count": 1,
            "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "description": "Luxuriöse Stadtwohnung am Kurfürstendamm",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.properties.insert_many(sample_properties)
    
    # Create sample units
    sample_units = []
    for prop in sample_properties[:2]:
        for i in range(min(3, prop["units_count"])):
            sample_units.append({
                "id": str(uuid.uuid4()),
                "property_id": prop["id"],
                "unit_number": f"{i+1}",
                "floor": i,
                "rooms": 2 + (i % 3),
                "area_sqm": 55 + (i * 10),
                "rent_amount": 850 + (i * 150),
                "is_vacant": i == 0,
                "tenant_name": None if i == 0 else f"Mieter {i}",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    if sample_units:
        await db.units.insert_many(sample_units)
    
    # Create sample maintenance tickets
    sample_tickets = [
        {
            "id": str(uuid.uuid4()),
            "property_id": sample_properties[0]["id"],
            "property_name": sample_properties[0]["name"],
            "title": "Heizung prüfen",
            "description": "Jährliche Heizungswartung durchführen",
            "status": "Offen",
            "priority": "Normal",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "property_id": sample_properties[1]["id"],
            "property_name": sample_properties[1]["name"],
            "title": "Wasserschaden Keller",
            "description": "Feuchtigkeit im Kellerbereich festgestellt",
            "status": "In Bearbeitung",
            "priority": "Hoch",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.maintenance_tickets.insert_many(sample_tickets)
    
    return {"message": "Datenbank erfolgreich befüllt", "properties_count": len(sample_properties)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
