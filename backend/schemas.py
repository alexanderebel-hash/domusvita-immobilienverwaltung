from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class PropertyTypeEnum(str, Enum):
    WOHNUNG = "Wohnung"
    GEWERBE = "Gewerbe"
    PFLEGEWOHNGEMEINSCHAFT = "Pflegewohngemeinschaft"
    MEHRFAMILIENHAUS = "Mehrfamilienhaus"

class PropertyStatusEnum(str, Enum):
    EIGENTUM = "Eigentum"
    GEMIETET = "Gemietet"
    UNTERVERMIETET = "Untervermietet"

class ContactRoleEnum(str, Enum):
    MIETER = "Mieter"
    EIGENTUEMER = "Eigentümer"
    HANDWERKER = "Handwerker"
    VERSORGER = "Versorger"
    BEHOERDE = "Behörde"

class ContractTypeEnum(str, Enum):
    MIETVERTRAG = "Mietvertrag"
    HAUPTMIETVERTRAG = "Hauptmietvertrag"
    VERSICHERUNG = "Versicherung"
    WARTUNGSVERTRAG = "Wartungsvertrag"

class TicketStatusEnum(str, Enum):
    OFFEN = "Offen"
    IN_BEARBEITUNG = "In Bearbeitung"
    ERLEDIGT = "Erledigt"

class TicketPriorityEnum(str, Enum):
    NIEDRIG = "Niedrig"
    NORMAL = "Normal"
    HOCH = "Hoch"
    DRINGEND = "Dringend"

class DocumentCategoryEnum(str, Enum):
    VERTRAG = "Vertrag"
    PROTOKOLL = "Protokoll"
    RECHNUNG = "Rechnung"
    GRUNDRISS = "Grundriss"
    SONSTIGES = "Sonstiges"

# ==================== PROPERTY SCHEMAS ====================

class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    postal_code: Optional[str] = None
    property_type: str
    status: str
    units_count: int = 0
    image_url: Optional[str] = None
    description: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    units_count: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== UNIT SCHEMAS ====================

class UnitBase(BaseModel):
    property_id: str
    unit_number: str
    floor: int = 0
    rooms: int = 1
    area_sqm: float = 0
    rent_amount: float = 0
    is_vacant: bool = True
    tenant_id: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class UnitResponse(UnitBase):
    id: str
    created_at: datetime
    tenant_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# ==================== CONTACT SCHEMAS ====================

class ContactBase(BaseModel):
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = 0
    specialty: Optional[str] = None
    image_url: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    specialty: Optional[str] = None
    image_url: Optional[str] = None

class ContactResponse(ContactBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== CONTRACT SCHEMAS ====================

class ContractBase(BaseModel):
    property_id: str
    contact_id: Optional[str] = None
    contract_type: str
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    monthly_amount: float = 0
    is_active: bool = True
    auto_renew: bool = False
    notice_period_days: int = 30
    document_url: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    contract_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    monthly_amount: Optional[float] = None
    is_active: Optional[bool] = None
    auto_renew: Optional[bool] = None
    notice_period_days: Optional[int] = None
    document_url: Optional[str] = None

class ContractResponse(ContractBase):
    id: str
    created_at: datetime
    updated_at: datetime
    property_name: Optional[str] = None
    contact_name: Optional[str] = None
    days_until_expiry: Optional[int] = None
    
    class Config:
        from_attributes = True

# ==================== MAINTENANCE SCHEMAS ====================

class MaintenanceTicketBase(BaseModel):
    property_id: str
    assigned_to_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "Offen"
    priority: str = "Normal"
    category: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    cost: float = 0
    is_recurring: bool = False
    recurrence_interval_days: Optional[int] = None
    notes: Optional[str] = None

class MaintenanceTicketCreate(MaintenanceTicketBase):
    pass

class MaintenanceTicketUpdate(BaseModel):
    assigned_to_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    cost: Optional[float] = None
    is_recurring: Optional[bool] = None
    recurrence_interval_days: Optional[int] = None
    notes: Optional[str] = None

class MaintenanceTicketResponse(MaintenanceTicketBase):
    id: str
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    property_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# ==================== DOCUMENT SCHEMAS ====================

class DocumentBase(BaseModel):
    property_id: str
    name: str
    category: str
    description: Optional[str] = None

class DocumentCreate(DocumentBase):
    file_url: str
    file_size: int = 0
    file_type: Optional[str] = None
    uploaded_by: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str
    file_url: str
    file_size: int
    file_type: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: datetime
    property_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# ==================== DASHBOARD SCHEMAS ====================

class DashboardStats(BaseModel):
    total_properties: int
    vacant_units: int
    pending_tasks: int
    upcoming_deadlines: int
    total_units: int
    occupied_units: int
    total_contacts: int
    active_contracts: int

class AIInsight(BaseModel):
    message: str
    type: str
    property_id: Optional[str] = None

class AIQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None

class AIQueryResponse(BaseModel):
    response: str
    success: bool

# ==================== AUTH SCHEMAS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
