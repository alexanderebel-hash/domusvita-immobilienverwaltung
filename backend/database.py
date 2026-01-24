from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/domusvita")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# Enums
class PropertyType(str, enum.Enum):
    WOHNUNG = "Wohnung"
    GEWERBE = "Gewerbe"
    PFLEGEWOHNGEMEINSCHAFT = "Pflegewohngemeinschaft"
    MEHRFAMILIENHAUS = "Mehrfamilienhaus"

class PropertyStatus(str, enum.Enum):
    EIGENTUM = "Eigentum"
    GEMIETET = "Gemietet"
    UNTERVERMIETET = "Untervermietet"

class ContactRole(str, enum.Enum):
    MIETER = "Mieter"
    EIGENTUEMER = "Eigentümer"
    HANDWERKER = "Handwerker"
    VERSORGER = "Versorger"
    BEHOERDE = "Behörde"

class ContractType(str, enum.Enum):
    MIETVERTRAG = "Mietvertrag"
    HAUPTMIETVERTRAG = "Hauptmietvertrag"
    VERSICHERUNG = "Versicherung"
    WARTUNGSVERTRAG = "Wartungsvertrag"

class TicketStatus(str, enum.Enum):
    OFFEN = "Offen"
    IN_BEARBEITUNG = "In Bearbeitung"
    ERLEDIGT = "Erledigt"

class TicketPriority(str, enum.Enum):
    NIEDRIG = "Niedrig"
    NORMAL = "Normal"
    HOCH = "Hoch"
    DRINGEND = "Dringend"

class DocumentCategory(str, enum.Enum):
    VERTRAG = "Vertrag"
    PROTOKOLL = "Protokoll"
    RECHNUNG = "Rechnung"
    GRUNDRISS = "Grundriss"
    SONSTIGES = "Sonstiges"

# Models
class Property(Base):
    __tablename__ = "properties"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(10))
    property_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    units_count = Column(Integer, default=0)
    image_url = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    units = relationship("Unit", back_populates="property", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="property", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="property", cascade="all, delete-orphan")
    maintenance_tickets = relationship("MaintenanceTicket", back_populates="property", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"
    
    id = Column(String(36), primary_key=True)
    property_id = Column(String(36), ForeignKey("properties.id"), nullable=False)
    unit_number = Column(String(50), nullable=False)
    floor = Column(Integer, default=0)
    rooms = Column(Integer, default=1)
    area_sqm = Column(Float, default=0)
    rent_amount = Column(Float, default=0)
    is_vacant = Column(Boolean, default=True)
    tenant_id = Column(String(36), ForeignKey("contacts.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    property = relationship("Property", back_populates="units")
    tenant = relationship("Contact", back_populates="rented_units")

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    company = Column(String(255))
    notes = Column(Text)
    rating = Column(Integer, default=0)  # For Handwerker
    specialty = Column(String(255))  # For Handwerker
    image_url = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    rented_units = relationship("Unit", back_populates="tenant")
    contracts = relationship("Contract", back_populates="contact")
    assigned_tickets = relationship("MaintenanceTicket", back_populates="assigned_to")

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(String(36), primary_key=True)
    property_id = Column(String(36), ForeignKey("properties.id"), nullable=False)
    contact_id = Column(String(36), ForeignKey("contacts.id"), nullable=True)
    contract_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    monthly_amount = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    auto_renew = Column(Boolean, default=False)
    notice_period_days = Column(Integer, default=30)
    document_url = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    property = relationship("Property", back_populates="contracts")
    contact = relationship("Contact", back_populates="contracts")

class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"
    
    id = Column(String(36), primary_key=True)
    property_id = Column(String(36), ForeignKey("properties.id"), nullable=False)
    assigned_to_id = Column(String(36), ForeignKey("contacts.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="Offen")
    priority = Column(String(50), default="Normal")
    category = Column(String(100))
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    cost = Column(Float, default=0)
    is_recurring = Column(Boolean, default=False)
    recurrence_interval_days = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    property = relationship("Property", back_populates="maintenance_tickets")
    assigned_to = relationship("Contact", back_populates="assigned_tickets")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True)
    property_id = Column(String(36), ForeignKey("properties.id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    file_url = Column(Text, nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(50))
    description = Column(Text)
    uploaded_by = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    property = relationship("Property", back_populates="documents")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    hashed_password = Column(String(255))
    azure_ad_id = Column(String(255), unique=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with async_session() as session:
        yield session
