-- =====================================================
-- DomusVita PostgreSQL Database Schema
-- Version: 2.1
-- Für Azure PostgreSQL
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE property_type AS ENUM (
    'Pflegewohngemeinschaft',
    'Wohnung',
    'Mehrfamilienhaus',
    'Büro',
    'Gewerbe'
);

CREATE TYPE property_status AS ENUM (
    'Eigentum',
    'Gemietet',
    'Untervermietet'
);

CREATE TYPE contact_role AS ENUM (
    'Mieter',
    'Eigentümer',
    'Handwerker',
    'Versorger',
    'Behörde'
);

CREATE TYPE ticket_status AS ENUM (
    'Offen',
    'In Bearbeitung',
    'Erledigt'
);

CREATE TYPE ticket_priority AS ENUM (
    'Niedrig',
    'Normal',
    'Hoch',
    'Dringend'
);

CREATE TYPE handwerker_status AS ENUM (
    'Unterwegs',
    'Vor Ort',
    'In Arbeit',
    'Erledigt',
    'Material fehlt'
);

CREATE TYPE photo_category AS ENUM (
    'Vorher',
    'Während',
    'Nachher'
);

CREATE TYPE contract_type AS ENUM (
    'Mietvertrag',
    'Hauptmietvertrag',
    'Versicherung',
    'Wartungsvertrag'
);

CREATE TYPE document_category AS ENUM (
    'Vertrag',
    'Protokoll',
    'Rechnung',
    'Grundriss',
    'Sonstiges'
);

-- =====================================================
-- HAUPTTABELLEN
-- =====================================================

-- Kontakte (Mieter, Eigentümer, Handwerker, etc.)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role contact_role NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    company VARCHAR(255),
    specialty VARCHAR(100),  -- Für Handwerker (Elektrik, Sanitär, etc.)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_role ON contacts(role);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Immobilien
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Berlin',
    postal_code VARCHAR(10),
    property_type property_type NOT NULL,
    status property_status NOT NULL DEFAULT 'Eigentum',
    units_count INTEGER DEFAULT 1,
    description TEXT,
    image_url TEXT,
    -- Benachrichtigungseinstellungen pro Immobilie
    notification_email VARCHAR(255),  -- E-Mail für Benachrichtigungen
    notify_on_status_change BOOLEAN DEFAULT TRUE,
    notify_statuses handwerker_status[] DEFAULT ARRAY['Vor Ort', 'Erledigt', 'Material fehlt']::handwerker_status[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(status);

-- Einheiten (Wohnungen/Zimmer innerhalb einer Immobilie)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    floor INTEGER DEFAULT 0,
    rooms INTEGER DEFAULT 1,
    area_sqm DECIMAL(10,2),
    rent_amount DECIMAL(10,2),
    is_vacant BOOLEAN DEFAULT TRUE,
    tenant_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_tenant ON units(tenant_id);
CREATE INDEX idx_units_vacant ON units(is_vacant);

-- Verträge
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contract_type contract_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT FALSE,
    notice_period_days INTEGER DEFAULT 90,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contracts_property ON contracts(property_id);
CREATE INDEX idx_contracts_contact ON contracts(contact_id);
CREATE INDEX idx_contracts_active ON contracts(is_active);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- Wartungstickets / Instandhaltung
CREATE TABLE maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    assigned_to_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- Heizung, Sanitär, Elektrik, etc.
    status ticket_status DEFAULT 'Offen',
    priority ticket_priority DEFAULT 'Normal',
    scheduled_date DATE,
    completed_date TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10,2),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_interval_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_property ON maintenance_tickets(property_id);
CREATE INDEX idx_tickets_assigned ON maintenance_tickets(assigned_to_id);
CREATE INDEX idx_tickets_status ON maintenance_tickets(status);
CREATE INDEX idx_tickets_priority ON maintenance_tickets(priority);

-- Dokumente
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category document_category DEFAULT 'Sonstiges',
    file_url TEXT NOT NULL,
    file_size INTEGER,  -- in bytes
    file_type VARCHAR(100),
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_category ON documents(category);

-- =====================================================
-- HANDWERKER PORTAL TABELLEN
-- =====================================================

-- Handwerker Sessions (für Token-basierte Auth)
CREATE TABLE handwerker_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handwerker_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON handwerker_sessions(token);
CREATE INDEX idx_sessions_handwerker ON handwerker_sessions(handwerker_id);

-- Ticket Fotos
CREATE TABLE ticket_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    category photo_category DEFAULT 'Während',
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES contacts(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_ticket ON ticket_photos(ticket_id);

-- Status Updates (Verlauf der Statusänderungen)
CREATE TABLE status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    status handwerker_status NOT NULL,
    note TEXT,
    location JSONB,  -- GPS-Koordinaten: {"lat": 52.5, "lng": 13.4}
    updated_by UUID REFERENCES contacts(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_updates_ticket ON status_updates(ticket_id);
CREATE INDEX idx_status_updates_timestamp ON status_updates(timestamp DESC);

-- Arbeitsberichte
CREATE TABLE work_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    materials_used TEXT,
    work_hours DECIMAL(5,2),
    material_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(material_cost, 0) + COALESCE(labor_cost, 0)) STORED,
    tenant_signature TEXT,  -- Base64-encoded signature image
    notes TEXT,
    created_by UUID REFERENCES contacts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_reports_ticket ON work_reports(ticket_id);

-- =====================================================
-- BENACHRICHTIGUNGEN
-- =====================================================

-- E-Mail Benachrichtigungs-Log
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES maintenance_tickets(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_ticket ON notification_logs(ticket_id);
CREATE INDEX idx_notifications_status ON notification_logs(status);

-- Benachrichtigungseinstellungen (global)
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VIEWS FÜR DASHBOARD
-- =====================================================

-- Dashboard Statistiken View
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM properties) AS total_properties,
    (SELECT COUNT(*) FROM units WHERE is_vacant = TRUE) AS vacant_units,
    (SELECT COUNT(*) FROM units WHERE is_vacant = FALSE) AS occupied_units,
    (SELECT COUNT(*) FROM maintenance_tickets WHERE status != 'Erledigt') AS pending_tasks,
    (SELECT COUNT(*) FROM contracts WHERE is_active = TRUE AND end_date <= CURRENT_DATE + INTERVAL '30 days' AND end_date >= CURRENT_DATE) AS upcoming_deadlines,
    (SELECT COUNT(*) FROM contacts) AS total_contacts,
    (SELECT COUNT(*) FROM contracts WHERE is_active = TRUE) AS active_contracts;

-- Handwerker Tickets View
CREATE VIEW handwerker_ticket_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.category,
    t.scheduled_date,
    t.created_at,
    p.id AS property_id,
    p.name AS property_name,
    CONCAT(p.address, ', ', p.postal_code, ' ', p.city) AS property_address,
    p.city AS property_city,
    c.id AS assigned_to_id,
    c.name AS assigned_to_name,
    c.phone AS assigned_to_phone,
    tenant.name AS tenant_name,
    tenant.phone AS tenant_phone
FROM maintenance_tickets t
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN contacts c ON t.assigned_to_id = c.id
LEFT JOIN units u ON t.unit_id = u.id
LEFT JOIN contacts tenant ON u.tenant_id = tenant.id;

-- =====================================================
-- TRIGGER FUNKTIONEN
-- =====================================================

-- Automatisches Update von updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für alle Tabellen mit updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_tickets_updated_at BEFORE UPDATE ON maintenance_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_reports_updated_at BEFORE UPDATE ON work_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIALE DATEN (Optional)
-- =====================================================

-- Standard Benachrichtigungseinstellungen
INSERT INTO notification_settings (setting_key, setting_value, description) VALUES
    ('email_enabled', 'false', 'E-Mail-Benachrichtigungen aktiviert'),
    ('mail_from_address', '', 'Absender E-Mail-Adresse'),
    ('mail_from_name', 'DomusVita Benachrichtigungen', 'Absender Name'),
    ('azure_client_id', '', 'Azure App Client ID'),
    ('azure_tenant_id', '', 'Azure Tenant ID');

-- =====================================================
-- KOMMENTARE
-- =====================================================

COMMENT ON TABLE properties IS 'Immobilien und Gebäude im DomusVita Portfolio';
COMMENT ON TABLE units IS 'Einzelne Wohneinheiten/Zimmer innerhalb einer Immobilie';
COMMENT ON TABLE contacts IS 'Alle Kontakte: Mieter, Eigentümer, Handwerker, Versorger, Behörden';
COMMENT ON TABLE contracts IS 'Verträge: Miet-, Haupt-, Versicherungs- und Wartungsverträge';
COMMENT ON TABLE maintenance_tickets IS 'Wartungs- und Instandhaltungsaufgaben';
COMMENT ON TABLE documents IS 'Dokumente und Dateien zu Immobilien';
COMMENT ON TABLE ticket_photos IS 'Fotos zu Wartungstickets (Vorher/Während/Nachher)';
COMMENT ON TABLE status_updates IS 'Statusverlauf für Handwerker-Tickets';
COMMENT ON TABLE work_reports IS 'Arbeitsberichte der Handwerker';
COMMENT ON TABLE notification_logs IS 'Protokoll aller gesendeten E-Mail-Benachrichtigungen';
COMMENT ON COLUMN properties.notify_statuses IS 'Bei welchen Status-Änderungen soll benachrichtigt werden';
