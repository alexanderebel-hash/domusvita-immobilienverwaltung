-- =====================================================
-- DomusVita Klientenmanagement Schema Extension
-- Für ambulant betreute Pflege-Wohngemeinschaften
-- =====================================================

-- =====================================================
-- NEUE ENUM TYPES FÜR KLIENTENMANAGEMENT
-- =====================================================

CREATE TYPE klient_status AS ENUM (
    'neu',
    'erstgespraech',
    'besichtigung_geplant',
    'unterlagen_gesendet',
    'entscheidung_ausstehend',
    'zusage',
    'einzug_geplant',
    'bewohner',
    'auszug_geplant',
    'ausgezogen',
    'verstorben',
    'abgesagt'
);

CREATE TYPE pflegegrad AS ENUM (
    'keiner',
    'beantragt',
    '1',
    '2',
    '3',
    '4',
    '5'
);

CREATE TYPE dringlichkeit AS ENUM (
    'sofort',
    '4_wochen',
    '3_monate',
    'flexibel'
);

CREATE TYPE anfrage_quelle AS ENUM (
    'email',
    'telefon',
    'vermittlung',
    'empfehlung',
    'website',
    'sonstige'
);

CREATE TYPE kommunikation_typ AS ENUM (
    'email_ein',
    'email_aus',
    'anruf_ein',
    'anruf_aus',
    'whatsapp_ein',
    'whatsapp_aus',
    'notiz',
    'besichtigung'
);

CREATE TYPE zimmer_status AS ENUM (
    'frei',
    'belegt',
    'reserviert',
    'renovierung'
);

CREATE TYPE dokument_status AS ENUM (
    'entwurf',
    'gesendet',
    'unterschrieben'
);

CREATE TYPE klient_dokument_typ AS ENUM (
    'mietvertrag',
    'pflegevertrag',
    'vollmacht',
    'kostenubernahme',
    'arztbrief',
    'sonstiges'
);

-- =====================================================
-- PFLEGE-WOHNGEMEINSCHAFTEN (Erweiterung von properties)
-- =====================================================

-- Pflege-WG spezifische Daten
CREATE TABLE pflege_wgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID UNIQUE NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    kurzname VARCHAR(50) NOT NULL,  -- "Sterndamm", "Kupferkessel" etc.
    kapazitaet INTEGER NOT NULL DEFAULT 8,
    grundriss_url TEXT,
    konzept_url TEXT,
    preisliste_url TEXT,
    hausordnung_url TEXT,
    beschreibung TEXT,
    besonderheiten TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pflege_wgs_property ON pflege_wgs(property_id);

-- Zimmer in Pflege-WGs (mit Position für Grundriss)
CREATE TABLE wg_zimmer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pflege_wg_id UUID NOT NULL REFERENCES pflege_wgs(id) ON DELETE CASCADE,
    nummer VARCHAR(20) NOT NULL,
    name VARCHAR(100),  -- z.B. "Bewohnerzimmer 4"
    flaeche_qm DECIMAL(6,2),
    status zimmer_status DEFAULT 'frei',
    -- Position auf dem Grundriss (für interaktive Darstellung)
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    breite INTEGER DEFAULT 100,
    hoehe INTEGER DEFAULT 100,
    -- Aktueller Bewohner
    aktueller_bewohner_id UUID,  -- FK wird später hinzugefügt
    einzugsdatum DATE,
    notizen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pflege_wg_id, nummer)
);

CREATE INDEX idx_wg_zimmer_pflege_wg ON wg_zimmer(pflege_wg_id);
CREATE INDEX idx_wg_zimmer_status ON wg_zimmer(status);

-- =====================================================
-- KLIENTEN (Interessenten und Bewohner)
-- =====================================================

CREATE TABLE klienten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Persönliche Daten
    vorname VARCHAR(100) NOT NULL,
    nachname VARCHAR(100) NOT NULL,
    geburtsdatum DATE,
    geschlecht VARCHAR(20),
    foto_url TEXT,
    -- Pflegesituation
    pflegegrad pflegegrad DEFAULT 'keiner',
    besonderheiten TEXT,  -- Demenz, Rollator, Sturzgefahr etc.
    diagnosen TEXT,
    -- Kontaktperson (Angehörige)
    kontakt_name VARCHAR(200),
    kontakt_beziehung VARCHAR(100),  -- Tochter, Sohn, Ehepartner etc.
    kontakt_telefon VARCHAR(50),
    kontakt_email VARCHAR(255),
    kontakt_adresse TEXT,
    -- Anfrage-Details
    status klient_status DEFAULT 'neu',
    anfrage_quelle anfrage_quelle DEFAULT 'email',
    vermittler VARCHAR(255),  -- Name des Vermittlers/Krankenhaus etc.
    dringlichkeit dringlichkeit DEFAULT 'flexibel',
    anfrage_am TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Bevorzugte WGs
    bevorzugte_wgs UUID[],  -- Array von pflege_wgs IDs
    -- Wohnsituation (wenn Bewohner)
    zimmer_id UUID REFERENCES wg_zimmer(id) ON DELETE SET NULL,
    einzugsdatum DATE,
    auszugsdatum DATE,
    auszugsgrund TEXT,
    -- Metadata
    zugewiesen_an UUID,  -- Bearbeiter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_klienten_status ON klienten(status);
CREATE INDEX idx_klienten_zimmer ON klienten(zimmer_id);
CREATE INDEX idx_klienten_name ON klienten(nachname, vorname);
CREATE INDEX idx_klienten_anfrage ON klienten(anfrage_am DESC);

-- FK von wg_zimmer zu klienten
ALTER TABLE wg_zimmer 
ADD CONSTRAINT fk_zimmer_bewohner 
FOREIGN KEY (aktueller_bewohner_id) REFERENCES klienten(id) ON DELETE SET NULL;

-- =====================================================
-- KOMMUNIKATION (E-Mails, Anrufe, WhatsApp, Notizen)
-- =====================================================

CREATE TABLE klient_kommunikation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    klient_id UUID NOT NULL REFERENCES klienten(id) ON DELETE CASCADE,
    typ kommunikation_typ NOT NULL,
    betreff VARCHAR(500),
    inhalt TEXT NOT NULL,
    anhaenge TEXT[],  -- URLs zu Anhängen
    -- Für E-Mails
    email_von VARCHAR(255),
    email_an VARCHAR(255),
    email_message_id VARCHAR(255),  -- Für Threading
    -- Für Anrufe
    anruf_dauer_sekunden INTEGER,
    anruf_transkript TEXT,
    -- Metadata
    erstellt_von UUID,  -- Benutzer-ID
    erstellt_von_name VARCHAR(255),
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kommunikation_klient ON klient_kommunikation(klient_id);
CREATE INDEX idx_kommunikation_typ ON klient_kommunikation(typ);
CREATE INDEX idx_kommunikation_datum ON klient_kommunikation(erstellt_am DESC);

-- =====================================================
-- KLIENTEN-DOKUMENTE
-- =====================================================

CREATE TABLE klient_dokumente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    klient_id UUID NOT NULL REFERENCES klienten(id) ON DELETE CASCADE,
    typ klient_dokument_typ NOT NULL,
    name VARCHAR(255) NOT NULL,
    datei_url TEXT NOT NULL,
    datei_groesse INTEGER,
    status dokument_status DEFAULT 'entwurf',
    gesendet_am TIMESTAMP WITH TIME ZONE,
    unterschrieben_am TIMESTAMP WITH TIME ZONE,
    hochgeladen_von VARCHAR(255),
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_klient_dokumente_klient ON klient_dokumente(klient_id);
CREATE INDEX idx_klient_dokumente_typ ON klient_dokumente(typ);

-- =====================================================
-- AKTIVITÄTSPROTOKOLL (für Geschäftsführung)
-- =====================================================

CREATE TABLE klient_aktivitaeten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    klient_id UUID NOT NULL REFERENCES klienten(id) ON DELETE CASCADE,
    benutzer_id UUID,
    benutzer_name VARCHAR(255),
    aktion VARCHAR(255) NOT NULL,  -- z.B. "Status geändert", "E-Mail gesendet"
    details JSONB,  -- Zusätzliche Details als JSON
    vorher_wert TEXT,
    nachher_wert TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aktivitaeten_klient ON klient_aktivitaeten(klient_id);
CREATE INDEX idx_aktivitaeten_timestamp ON klient_aktivitaeten(timestamp DESC);

-- =====================================================
-- BESICHTIGUNGEN
-- =====================================================

CREATE TABLE besichtigungen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    klient_id UUID NOT NULL REFERENCES klienten(id) ON DELETE CASCADE,
    pflege_wg_id UUID NOT NULL REFERENCES pflege_wgs(id) ON DELETE CASCADE,
    termin TIMESTAMP WITH TIME ZONE NOT NULL,
    dauer_minuten INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'geplant',  -- geplant, durchgefuehrt, abgesagt
    notizen TEXT,
    protokoll TEXT,
    durchgefuehrt_von VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_besichtigungen_klient ON besichtigungen(klient_id);
CREATE INDEX idx_besichtigungen_termin ON besichtigungen(termin);

-- =====================================================
-- VORLAGEN (E-Mail, WhatsApp, Dokumente)
-- =====================================================

CREATE TABLE kommunikation_vorlagen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    typ VARCHAR(50) NOT NULL,  -- 'email', 'whatsapp', 'dokument'
    name VARCHAR(255) NOT NULL,
    kategorie VARCHAR(100),  -- 'Erstinfo', 'Besichtigung', 'Nachfass' etc.
    betreff VARCHAR(500),  -- Für E-Mails
    inhalt TEXT NOT NULL,  -- Mit Platzhaltern: {Anrede}, {Name_Bewohner}, {WG_Name}
    pflege_wg_id UUID REFERENCES pflege_wgs(id) ON DELETE SET NULL,  -- WG-spezifisch
    aktiv BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vorlagen_typ ON kommunikation_vorlagen(typ);
CREATE INDEX idx_vorlagen_kategorie ON kommunikation_vorlagen(kategorie);

-- =====================================================
-- VIEWS FÜR KLIENTENMANAGEMENT
-- =====================================================

-- Dashboard-Statistiken für Pflege-WGs
CREATE VIEW pflege_wg_stats AS
SELECT 
    pw.id,
    pw.kurzname,
    pw.kapazitaet,
    p.name AS property_name,
    p.address,
    COUNT(CASE WHEN z.status = 'frei' THEN 1 END) AS freie_zimmer,
    COUNT(CASE WHEN z.status = 'belegt' THEN 1 END) AS belegte_zimmer,
    COUNT(CASE WHEN z.status = 'reserviert' THEN 1 END) AS reservierte_zimmer,
    COUNT(z.id) AS gesamt_zimmer
FROM pflege_wgs pw
JOIN properties p ON pw.property_id = p.id
LEFT JOIN wg_zimmer z ON z.pflege_wg_id = pw.id
GROUP BY pw.id, pw.kurzname, pw.kapazitaet, p.name, p.address;

-- Klienten-Pipeline Übersicht
CREATE VIEW klienten_pipeline AS
SELECT 
    status,
    COUNT(*) AS anzahl,
    COUNT(CASE WHEN dringlichkeit = 'sofort' THEN 1 END) AS dringend,
    MIN(anfrage_am) AS aelteste_anfrage
FROM klienten
WHERE status NOT IN ('bewohner', 'ausgezogen', 'verstorben', 'abgesagt')
GROUP BY status;

-- =====================================================
-- TRIGGER FÜR AKTIVITÄTSPROTOKOLL
-- =====================================================

-- Automatische Protokollierung bei Statusänderung
CREATE OR REPLACE FUNCTION log_klient_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO klient_aktivitaeten (
            klient_id, aktion, vorher_wert, nachher_wert, details
        ) VALUES (
            NEW.id,
            'Status geändert',
            OLD.status::TEXT,
            NEW.status::TEXT,
            jsonb_build_object('automatisch', true)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_klient_status_change
AFTER UPDATE ON klienten
FOR EACH ROW
EXECUTE FUNCTION log_klient_status_change();

-- Automatische Zimmer-Status-Aktualisierung
CREATE OR REPLACE FUNCTION update_zimmer_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Wenn Klient einem Zimmer zugewiesen wird
    IF NEW.zimmer_id IS NOT NULL AND OLD.zimmer_id IS DISTINCT FROM NEW.zimmer_id THEN
        -- Altes Zimmer freigeben
        IF OLD.zimmer_id IS NOT NULL THEN
            UPDATE wg_zimmer SET status = 'frei', aktueller_bewohner_id = NULL WHERE id = OLD.zimmer_id;
        END IF;
        -- Neues Zimmer belegen
        UPDATE wg_zimmer SET status = 'belegt', aktueller_bewohner_id = NEW.id WHERE id = NEW.zimmer_id;
    -- Wenn Klient aus Zimmer entfernt wird
    ELSIF NEW.zimmer_id IS NULL AND OLD.zimmer_id IS NOT NULL THEN
        UPDATE wg_zimmer SET status = 'frei', aktueller_bewohner_id = NULL WHERE id = OLD.zimmer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_zimmer_status
AFTER UPDATE ON klienten
FOR EACH ROW
EXECUTE FUNCTION update_zimmer_status();

-- Trigger für updated_at
CREATE TRIGGER update_pflege_wgs_updated_at BEFORE UPDATE ON pflege_wgs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wg_zimmer_updated_at BEFORE UPDATE ON wg_zimmer
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_klienten_updated_at BEFORE UPDATE ON klienten
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vorlagen_updated_at BEFORE UPDATE ON kommunikation_vorlagen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
