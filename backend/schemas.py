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


# ==================== HANDWERKER PORTAL SCHEMAS ====================

class HandwerkerLoginRequest(BaseModel):
    handwerker_id: str
    pin: Optional[str] = None

class HandwerkerLoginResponse(BaseModel):
    success: bool
    token: str
    handwerker_id: str
    name: str
    specialty: Optional[str] = None

class HandwerkerTicketStatus(str, Enum):
    UNTERWEGS = "Unterwegs"
    VOR_ORT = "Vor Ort"
    IN_ARBEIT = "In Arbeit"
    ERLEDIGT = "Erledigt"
    MATERIAL_FEHLT = "Material fehlt"

class TicketPhotoCategory(str, Enum):
    VORHER = "Vorher"
    WAEHREND = "Während"
    NACHHER = "Nachher"

class TicketPhotoCreate(BaseModel):
    ticket_id: str
    category: str = "Während"
    description: Optional[str] = None

class TicketPhotoResponse(BaseModel):
    id: str
    ticket_id: str
    category: str
    photo_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class WorkReportCreate(BaseModel):
    ticket_id: str
    description: str
    materials_used: Optional[str] = None
    work_hours: float = 0
    material_cost: float = 0
    labor_cost: float = 0
    tenant_signature: Optional[str] = None  # Base64 encoded signature
    notes: Optional[str] = None

class WorkReportResponse(BaseModel):
    id: str
    ticket_id: str
    description: str
    materials_used: Optional[str] = None
    work_hours: float
    material_cost: float
    labor_cost: float
    total_cost: float
    tenant_signature: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class StatusUpdateCreate(BaseModel):
    ticket_id: str
    status: str
    note: Optional[str] = None
    location: Optional[str] = None  # GPS coordinates if available

class StatusUpdateResponse(BaseModel):
    id: str
    ticket_id: str
    status: str
    note: Optional[str] = None
    location: Optional[str] = None
    timestamp: datetime
    updated_by: str
    
    class Config:
        from_attributes = True

class HandwerkerTicketResponse(BaseModel):
    id: str
    property_id: str
    property_name: str
    property_address: str
    property_city: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    category: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    photos: List[TicketPhotoResponse] = []
    status_updates: List[StatusUpdateResponse] = []
    work_report: Optional[WorkReportResponse] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== KLIENTENMANAGEMENT SCHEMAS ====================

class KlientStatusEnum(str, Enum):
    NEU = "neu"
    ERSTGESPRAECH = "erstgespraech"
    BESICHTIGUNG_GEPLANT = "besichtigung_geplant"
    UNTERLAGEN_GESENDET = "unterlagen_gesendet"
    ENTSCHEIDUNG_AUSSTEHEND = "entscheidung_ausstehend"
    ZUSAGE = "zusage"
    EINZUG_GEPLANT = "einzug_geplant"
    BEWOHNER = "bewohner"
    AUSZUG_GEPLANT = "auszug_geplant"
    AUSGEZOGEN = "ausgezogen"
    VERSTORBEN = "verstorben"
    ABGESAGT = "abgesagt"

class PflegegradEnum(str, Enum):
    KEINER = "keiner"
    BEANTRAGT = "beantragt"
    GRAD_1 = "1"
    GRAD_2 = "2"
    GRAD_3 = "3"
    GRAD_4 = "4"
    GRAD_5 = "5"

class DringlichkeitEnum(str, Enum):
    SOFORT = "sofort"
    VIER_WOCHEN = "4_wochen"
    DREI_MONATE = "3_monate"
    FLEXIBEL = "flexibel"

class ZimmerStatusEnum(str, Enum):
    FREI = "frei"
    BELEGT = "belegt"
    RESERVIERT = "reserviert"
    RENOVIERUNG = "renovierung"

class KommunikationTypEnum(str, Enum):
    EMAIL_EIN = "email_ein"
    EMAIL_AUS = "email_aus"
    ANRUF_EIN = "anruf_ein"
    ANRUF_AUS = "anruf_aus"
    WHATSAPP_EIN = "whatsapp_ein"
    WHATSAPP_AUS = "whatsapp_aus"
    NOTIZ = "notiz"
    BESICHTIGUNG = "besichtigung"

# Pflege-WG Schemas
class PflegeWGBase(BaseModel):
    kurzname: str
    kapazitaet: int = 8
    grundriss_url: Optional[str] = None
    konzept_url: Optional[str] = None
    preisliste_url: Optional[str] = None
    beschreibung: Optional[str] = None

class PflegeWGResponse(PflegeWGBase):
    id: str
    property_id: str
    property_name: Optional[str] = None
    property_address: Optional[str] = None
    freie_zimmer: int = 0
    belegte_zimmer: int = 0
    reservierte_zimmer: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

# Zimmer Schemas
class ZimmerBase(BaseModel):
    nummer: str
    name: Optional[str] = None
    flaeche_qm: Optional[float] = None
    status: str = "frei"
    position_x: int = 0
    position_y: int = 0
    breite: int = 100
    hoehe: int = 100
    notizen: Optional[str] = None

class ZimmerCreate(ZimmerBase):
    pflege_wg_id: str

class ZimmerUpdate(BaseModel):
    name: Optional[str] = None
    flaeche_qm: Optional[float] = None
    status: Optional[str] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    breite: Optional[int] = None
    hoehe: Optional[int] = None
    notizen: Optional[str] = None

class ZimmerResponse(ZimmerBase):
    id: str
    pflege_wg_id: str
    aktueller_bewohner_id: Optional[str] = None
    bewohner_name: Optional[str] = None
    bewohner_alter: Optional[int] = None
    bewohner_pflegegrad: Optional[str] = None
    einzugsdatum: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Klient Schemas
class KlientBase(BaseModel):
    vorname: str
    nachname: str
    geburtsdatum: Optional[datetime] = None
    geschlecht: Optional[str] = None
    pflegegrad: str = "keiner"
    besonderheiten: Optional[str] = None
    diagnosen: Optional[str] = None
    kontakt_name: Optional[str] = None
    kontakt_beziehung: Optional[str] = None
    kontakt_telefon: Optional[str] = None
    kontakt_email: Optional[str] = None
    anfrage_quelle: str = "email"
    vermittler: Optional[str] = None
    dringlichkeit: str = "flexibel"
    bevorzugte_wgs: List[str] = []

class KlientCreate(KlientBase):
    pass

class KlientUpdate(BaseModel):
    vorname: Optional[str] = None
    nachname: Optional[str] = None
    geburtsdatum: Optional[datetime] = None
    geschlecht: Optional[str] = None
    pflegegrad: Optional[str] = None
    besonderheiten: Optional[str] = None
    diagnosen: Optional[str] = None
    kontakt_name: Optional[str] = None
    kontakt_beziehung: Optional[str] = None
    kontakt_telefon: Optional[str] = None
    kontakt_email: Optional[str] = None
    status: Optional[str] = None
    anfrage_quelle: Optional[str] = None
    vermittler: Optional[str] = None
    dringlichkeit: Optional[str] = None
    bevorzugte_wgs: Optional[List[str]] = None
    zimmer_id: Optional[str] = None
    einzugsdatum: Optional[datetime] = None
    auszugsdatum: Optional[datetime] = None
    auszugsgrund: Optional[str] = None

class KlientResponse(KlientBase):
    id: str
    status: str
    foto_url: Optional[str] = None
    zimmer_id: Optional[str] = None
    zimmer_nummer: Optional[str] = None
    wg_name: Optional[str] = None
    einzugsdatum: Optional[datetime] = None
    auszugsdatum: Optional[datetime] = None
    anfrage_am: datetime
    created_at: datetime
    updated_at: datetime
    alter: Optional[int] = None
    
    class Config:
        from_attributes = True

# Kommunikation Schemas
class KommunikationCreate(BaseModel):
    klient_id: str
    typ: str
    betreff: Optional[str] = None
    inhalt: str
    anhaenge: List[str] = []

class KommunikationResponse(BaseModel):
    id: str
    klient_id: str
    typ: str
    betreff: Optional[str] = None
    inhalt: str
    anhaenge: List[str] = []
    erstellt_von_name: Optional[str] = None
    erstellt_am: datetime
    
    class Config:
        from_attributes = True

# Aktivität Schemas
class AktivitaetResponse(BaseModel):
    id: str
    klient_id: str
    benutzer_name: Optional[str] = None
    aktion: str
    vorher_wert: Optional[str] = None
    nachher_wert: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Pipeline Stats
class PipelineStats(BaseModel):
    status: str
    anzahl: int
    dringend: int = 0
    
class KlientenDashboard(BaseModel):
    gesamt_klienten: int
    bewohner: int
    interessenten: int
    freie_zimmer: int
    pipeline: List[PipelineStats]
    handlungsbedarf: List[dict]
