-- =====================================================
-- DomusVita PostgreSQL Seed Data
-- Echte Immobiliendaten
-- =====================================================

-- =====================================================
-- KONTAKTE
-- =====================================================

INSERT INTO contacts (id, name, role, email, phone, address, company, specialty, rating) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Hans Müller', 'Mieter', 'hans.mueller@email.de', '+49 30 12345678', 'Sterndamm 10, 12109 Berlin', NULL, NULL, NULL),
    ('c2000000-0000-0000-0000-000000000002', 'Maria Schmidt', 'Eigentümer', 'm.schmidt@email.de', '+49 89 98765432', NULL, 'Schmidt Immobilien GmbH', NULL, NULL),
    ('c3000000-0000-0000-0000-000000000003', 'Elektro Weber', 'Handwerker', 'info@elektro-weber.de', '+49 30 55544433', NULL, 'Weber Elektrotechnik', 'Elektrik', 5),
    ('c4000000-0000-0000-0000-000000000004', 'Sanitär König', 'Handwerker', 'info@koenig-sanitaer.de', '+49 30 66677788', NULL, 'König Sanitär GmbH', 'Sanitär', 4),
    ('c5000000-0000-0000-0000-000000000005', 'Stadtwerke Berlin', 'Versorger', 'service@stadtwerke-berlin.de', '+49 30 11122233', NULL, 'Stadtwerke Berlin AG', NULL, NULL),
    ('c6000000-0000-0000-0000-000000000006', 'Bezirksamt Treptow-Köpenick', 'Behörde', 'info@ba-tk.berlin.de', '+49 30 90297-0', 'Alt-Köpenick 21, 12555 Berlin', NULL, NULL, NULL);

-- =====================================================
-- IMMOBILIEN (Echte DomusVita Daten)
-- =====================================================

INSERT INTO properties (id, name, address, city, postal_code, property_type, status, units_count, description, image_url, notification_email) VALUES
    ('p1000000-0000-0000-0000-000000000001', 'Büro DV Gesundheit Kreuzberg (Neu)', 'Waldemarstraße 5', 'Berlin', '10999', 'Büro', 'Eigentum', 1, 'Bürostandort im Bezirk Friedrichshain-Kreuzberg.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', NULL),
    ('p2000000-0000-0000-0000-000000000002', 'Haus Hebron', 'Hartriegelstraße 132', 'Berlin', '12439', 'Pflegewohngemeinschaft', 'Eigentum', 8, 'Pflegeeinrichtung und Wohngemeinschaft im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', NULL),
    ('p3000000-0000-0000-0000-000000000003', 'Büro DV Gesundheit Treptow', 'Baumschulenstraße 24', 'Berlin', '12437', 'Büro', 'Eigentum', 1, 'Bürostandort im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800', NULL),
    ('p4000000-0000-0000-0000-000000000004', 'WG Kupferkessel & Mietwohnungen', 'Baumschulenstraße 64', 'Berlin', '12437', 'Pflegewohngemeinschaft', 'Eigentum', 6, 'Kombination aus ambulant betreuter Wohngemeinschaft und sechs Mietwohnungen im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', NULL),
    ('p5000000-0000-0000-0000-000000000005', 'Eilertstraße 1', 'Eilertstraße 1', 'Berlin', '14165', 'Wohnung', 'Eigentum', 1, 'Immobilie im Bezirk Steglitz-Zehlendorf.', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', NULL),
    ('p6000000-0000-0000-0000-000000000006', 'WG Drachenwiese', 'Rudower Straße 228', 'Berlin', '12557', 'Pflegewohngemeinschaft', 'Gemietet', 12, 'Große ambulant betreute Wohngemeinschaft mit 12 Zimmern im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', NULL),
    ('p7000000-0000-0000-0000-000000000007', 'WG Drachenblick', 'Rudower Straße 226', 'Berlin', '12557', 'Pflegewohngemeinschaft', 'Gemietet', 4, 'Kleinere ambulant betreute Wohngemeinschaft mit 4 Zimmern im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', NULL),
    ('p8000000-0000-0000-0000-000000000008', 'WG Sterndamm', 'Sterndamm 10', 'Berlin', '12109', 'Pflegewohngemeinschaft', 'Gemietet', 8, 'Ambulant betreute Wohngemeinschaft im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800', NULL),
    ('p9000000-0000-0000-0000-000000000009', 'Michael-Brückner-Straße 4', 'Michael-Brückner-Straße 4', 'Berlin', '12439', 'Wohnung', 'Gemietet', 1, 'Immobilie im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', NULL),
    ('pa000000-0000-0000-0000-000000000010', 'Michael-Brückner-Straße 5', 'Michael-Brückner-Straße 5', 'Berlin', '12439', 'Wohnung', 'Gemietet', 1, 'Immobilie im Bezirk Treptow-Köpenick.', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', NULL),
    ('pb000000-0000-0000-0000-000000000011', 'Siefos', 'Waldemarstraße 12', 'Berlin', '10999', 'Gewerbe', 'Gemietet', 1, 'Immobilie im Bezirk Friedrichshain-Kreuzberg.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', NULL),
    ('pc000000-0000-0000-0000-000000000012', 'DV Gesundheit Kreuzberg (Alt)', 'Waldemarstraße 10a', 'Berlin', '10999', 'Büro', 'Gemietet', 1, 'Bürostandort im Bezirk Friedrichshain-Kreuzberg.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', NULL),
    ('pd000000-0000-0000-0000-000000000013', 'Herzogin Luise Haus', 'Waldemarstraße 10a', 'Berlin', '10999', 'Pflegewohngemeinschaft', 'Gemietet', 6, 'Möglicherweise im gleichen Gebäude wie DV Gesundheit Kreuzberg (Alt). Im Bezirk Friedrichshain-Kreuzberg.', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', NULL);

-- =====================================================
-- EINHEITEN (Beispieldaten für Hauptimmobilien)
-- =====================================================

-- Haus Hebron (8 Zimmer)
INSERT INTO units (property_id, unit_number, floor, rooms, area_sqm, rent_amount, is_vacant, tenant_id) VALUES
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 1', 0, 1, 22, 1200, TRUE, NULL),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 2', 0, 1, 24, 1200, TRUE, NULL),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 3', 0, 1, 26, 1200, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 4', 1, 1, 28, 1200, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 5', 1, 1, 30, 1200, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 6', 1, 1, 32, 1200, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 7', 2, 1, 34, 1200, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p2000000-0000-0000-0000-000000000002', 'Zimmer 8', 2, 1, 36, 1200, FALSE, 'c1000000-0000-0000-0000-000000000001');

-- WG Kupferkessel (6 Wohnungen)
INSERT INTO units (property_id, unit_number, floor, rooms, area_sqm, rent_amount, is_vacant, tenant_id) VALUES
    ('p4000000-0000-0000-0000-000000000004', 'Wohnung 1', 0, 2, 45, 750, TRUE, NULL),
    ('p4000000-0000-0000-0000-000000000004', 'Wohnung 2', 0, 2, 50, 800, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p4000000-0000-0000-0000-000000000004', 'Wohnung 3', 1, 2, 55, 850, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p4000000-0000-0000-0000-000000000004', 'Wohnung 4', 1, 2, 60, 900, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p4000000-0000-0000-0000-000000000004', 'Wohnung 5', 2, 2, 65, 950, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p4000000-0000-0000-0000-000000000004', 'Wohnung 6', 2, 2, 70, 1000, FALSE, 'c1000000-0000-0000-0000-000000000001');

-- WG Drachenwiese (12 Zimmer)
INSERT INTO units (property_id, unit_number, floor, rooms, area_sqm, rent_amount, is_vacant, tenant_id) VALUES
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 1', 0, 1, 18, 1100, TRUE, NULL),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 2', 0, 1, 20, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 3', 0, 1, 22, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 4', 0, 1, 24, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 5', 1, 1, 18, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 6', 1, 1, 20, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 7', 1, 1, 22, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 8', 1, 1, 24, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 9', 2, 1, 18, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 10', 2, 1, 20, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 11', 2, 1, 22, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001'),
    ('p6000000-0000-0000-0000-000000000006', 'Zimmer 12', 2, 1, 24, 1100, FALSE, 'c1000000-0000-0000-0000-000000000001');

-- =====================================================
-- VERTRÄGE
-- =====================================================

INSERT INTO contracts (property_id, contact_id, contract_type, title, start_date, end_date, monthly_amount, is_active, notice_period_days) VALUES
    ('p2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Mietvertrag', 'Mietvertrag Haus Hebron', CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', 9600, TRUE, 90),
    ('p6000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000002', 'Hauptmietvertrag', 'Hauptmietvertrag WG Drachenwiese', CURRENT_DATE - INTERVAL '730 days', CURRENT_DATE + INTERVAL '180 days', 13200, TRUE, 90),
    ('p4000000-0000-0000-0000-000000000004', NULL, 'Versicherung', 'Gebäudeversicherung WG Kupferkessel', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '185 days', 250, TRUE, 30),
    ('p2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000003', 'Wartungsvertrag', 'Elektrowartung Haus Hebron', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 150, TRUE, 30);

-- =====================================================
-- WARTUNGSTICKETS
-- =====================================================

INSERT INTO maintenance_tickets (property_id, assigned_to_id, title, description, category, status, priority, scheduled_date) VALUES
    ('p2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000003', 'Heizung prüfen', 'Jährliche Heizungswartung im Haus Hebron', 'Heizung', 'Offen', 'Normal', CURRENT_DATE + INTERVAL '7 days'),
    ('p6000000-0000-0000-0000-000000000006', 'c4000000-0000-0000-0000-000000000004', 'Wasserschaden Badezimmer', 'Feuchtigkeit in Zimmer 5 der WG Drachenwiese festgestellt', 'Sanitär', 'In Bearbeitung', 'Hoch', NULL),
    ('p4000000-0000-0000-0000-000000000004', NULL, 'Reinigung Treppenhaus', 'Wöchentliche Reinigung WG Kupferkessel', 'Reinigung', 'Offen', 'Niedrig', NULL),
    ('p7000000-0000-0000-0000-000000000007', 'c3000000-0000-0000-0000-000000000003', 'Elektrik Prüfung', 'E-Check fällig in WG Drachenblick', 'Elektrik', 'Offen', 'Normal', CURRENT_DATE + INTERVAL '14 days');

-- =====================================================
-- DOKUMENTE
-- =====================================================

INSERT INTO documents (property_id, name, category, file_url, file_size, file_type) VALUES
    ('p2000000-0000-0000-0000-000000000002', 'Mietvertrag_HausHebron.pdf', 'Vertrag', 'https://storage.example.com/docs/mietvertrag_hebron.pdf', 245000, 'application/pdf'),
    ('p6000000-0000-0000-0000-000000000006', 'Grundriss_WG_Drachenwiese.pdf', 'Grundriss', 'https://storage.example.com/docs/grundriss_drachenwiese.pdf', 1200000, 'application/pdf'),
    ('p4000000-0000-0000-0000-000000000004', 'Versicherungspolice_2024.pdf', 'Vertrag', 'https://storage.example.com/docs/versicherung_kupferkessel.pdf', 380000, 'application/pdf');
