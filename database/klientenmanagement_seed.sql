-- =====================================================
-- DomusVita Klientenmanagement Seed Data
-- Pflege-WGs und Zimmer
-- =====================================================

-- =====================================================
-- PFLEGE-WGS (Verknüpfung mit bestehenden Properties)
-- =====================================================

-- Hinweis: Die property_id muss mit den echten IDs aus der properties Tabelle übereinstimmen
-- Diese werden bei der tatsächlichen Implementierung dynamisch zugewiesen

INSERT INTO pflege_wgs (id, property_id, kurzname, kapazitaet, grundriss_url, beschreibung) VALUES
    ('wg100000-0000-0000-0000-000000000001', 'p8000000-0000-0000-0000-000000000008', 'Sterndamm', 3, 'https://customer-assets.emergentagent.com/job_domushome/artifacts/gv8gcuns_Grundriss%20Sterndamm.png', 'Ambulant betreute Wohngemeinschaft mit 3 Zimmern, Küche, WC und Flur'),
    ('wg200000-0000-0000-0000-000000000002', 'p4000000-0000-0000-0000-000000000004', 'Kupferkessel', 8, NULL, 'Große ambulant betreute Wohngemeinschaft mit 8 Bewohnerzimmern'),
    ('wg300000-0000-0000-0000-000000000003', 'p4000000-0000-0000-0000-000000000004', 'Kupferkessel Klein', 3, 'https://customer-assets.emergentagent.com/job_domushome/artifacts/suv923c5_KUPFERKESSEL%20KLEIN%20GRUNDRISS.png', 'Kleinere Wohngemeinschaft mit 3 Zimmern'),
    ('wg400000-0000-0000-0000-000000000004', 'p6000000-0000-0000-0000-000000000006', 'Drachenwiese', 12, 'https://customer-assets.emergentagent.com/job_domushome/artifacts/afidfcuk_Grundriss%20WG%20Drachenwiese%20Gro%C3%9F.png', 'Große ambulant betreute Wohngemeinschaft mit 12 Zimmern an der Glienickerstraße'),
    ('wg500000-0000-0000-0000-000000000005', 'p7000000-0000-0000-0000-000000000007', 'Drachenblick', 4, 'https://customer-assets.emergentagent.com/job_domushome/artifacts/fti3j6nz_Grundriss%20Drachenblick.png', 'Ambulant betreute Wohngemeinschaft mit 4 Zimmern, Küche/Wohnen, Bad und Terrasse');

-- =====================================================
-- ZIMMER FÜR STERNDAMM (3 Zimmer)
-- =====================================================

INSERT INTO wg_zimmer (pflege_wg_id, nummer, name, flaeche_qm, status, position_x, position_y, breite, hoehe) VALUES
    ('wg100000-0000-0000-0000-000000000001', '1', 'Zimmer 1', 18.0, 'belegt', 450, 550, 200, 250),
    ('wg100000-0000-0000-0000-000000000001', '2', 'Zimmer 2', 20.0, 'belegt', 450, 150, 200, 300),
    ('wg100000-0000-0000-0000-000000000001', '3', 'Zimmer 3', 22.0, 'frei', 200, 50, 180, 200);

-- =====================================================
-- ZIMMER FÜR KUPFERKESSEL KLEIN (3 Zimmer)
-- Basierend auf Grundriss: Zimmer 1-4, Küche/Wohnen, Bad, Terrasse
-- =====================================================

INSERT INTO wg_zimmer (pflege_wg_id, nummer, name, flaeche_qm, status, position_x, position_y, breite, hoehe) VALUES
    ('wg300000-0000-0000-0000-000000000003', '1', 'Zimmer 1', 16.0, 'belegt', 550, 550, 150, 200),
    ('wg300000-0000-0000-0000-000000000003', '2', 'Zimmer 2', 18.0, 'frei', 480, 180, 150, 200),
    ('wg300000-0000-0000-0000-000000000003', '3', 'Zimmer 3', 17.0, 'belegt', 150, 180, 150, 200),
    ('wg300000-0000-0000-0000-000000000003', '4', 'Zimmer 4', 15.0, 'frei', 100, 480, 120, 180);

-- =====================================================
-- ZIMMER FÜR DRACHENBLICK (4 Zimmer + Gemeinschaftsräume)
-- Basierend auf Grundriss
-- =====================================================

INSERT INTO wg_zimmer (pflege_wg_id, nummer, name, flaeche_qm, status, position_x, position_y, breite, hoehe) VALUES
    ('wg500000-0000-0000-0000-000000000005', '1', 'Zimmer 1', 14.0, 'belegt', 500, 450, 150, 180),
    ('wg500000-0000-0000-0000-000000000005', '2', 'Zimmer 2', 16.0, 'belegt', 500, 150, 150, 200),
    ('wg500000-0000-0000-0000-000000000005', '3', 'Zimmer 3', 15.0, 'frei', 120, 150, 150, 200),
    ('wg500000-0000-0000-0000-000000000005', '4', 'Zimmer 4', 13.0, 'frei', 100, 400, 130, 180);

-- =====================================================
-- ZIMMER FÜR DRACHENWIESE (12 Zimmer)
-- Basierend auf detailliertem Grundriss
-- =====================================================

INSERT INTO wg_zimmer (pflege_wg_id, nummer, name, flaeche_qm, status, position_x, position_y, breite, hoehe) VALUES
    ('wg400000-0000-0000-0000-000000000004', '1', 'Zimmer 1', 24.5, 'belegt', 550, 80, 120, 150),
    ('wg400000-0000-0000-0000-000000000004', '2', 'Zimmer 2', 22.0, 'belegt', 150, 80, 100, 130),
    ('wg400000-0000-0000-0000-000000000004', '3', 'Zimmer 3', 17.6, 'belegt', 150, 150, 100, 120),
    ('wg400000-0000-0000-0000-000000000004', '4', 'Zimmer 4', 17.1, 'frei', 50, 220, 100, 120),
    ('wg400000-0000-0000-0000-000000000004', '5', 'Zimmer 5', 17.1, 'belegt', 50, 300, 100, 120),
    ('wg400000-0000-0000-0000-000000000004', '6', 'Zimmer 6', 20.3, 'belegt', 450, 220, 130, 140),
    ('wg400000-0000-0000-0000-000000000004', '7', 'Zimmer 7', 20.3, 'belegt', 600, 220, 130, 140),
    ('wg400000-0000-0000-0000-000000000004', '8', 'Zimmer 8', 19.4, 'belegt', 80, 550, 130, 140),
    ('wg400000-0000-0000-0000-000000000004', '9', 'Zimmer 9', 19.6, 'frei', 220, 550, 120, 140),
    ('wg400000-0000-0000-0000-000000000004', '10', 'Zimmer 10', 22.4, 'belegt', 360, 550, 130, 140),
    ('wg400000-0000-0000-0000-000000000004', '11', 'Zimmer 11', 19.3, 'belegt', 500, 550, 130, 140),
    ('wg400000-0000-0000-0000-000000000004', '12', 'Zimmer 12', 21.9, 'belegt', 640, 550, 130, 140);

-- =====================================================
-- BEISPIEL-KLIENTEN (Mix aus Bewohnern und Interessenten)
-- =====================================================

-- Bewohner (bereits eingezogen)
INSERT INTO klienten (id, vorname, nachname, geburtsdatum, geschlecht, pflegegrad, besonderheiten, kontakt_name, kontakt_beziehung, kontakt_telefon, kontakt_email, status, anfrage_quelle, dringlichkeit, zimmer_id) VALUES
    ('k1000000-0000-0000-0000-000000000001', 'Helga', 'Bergmann', '1938-03-15', 'weiblich', '3', 'Leichte Demenz, benötigt Rollator', 'Thomas Bergmann', 'Sohn', '+49 30 12345678', 'thomas.bergmann@email.de', 'bewohner', 'empfehlung', 'flexibel', (SELECT id FROM wg_zimmer WHERE pflege_wg_id = 'wg400000-0000-0000-0000-000000000004' AND nummer = '1')),
    ('k2000000-0000-0000-0000-000000000002', 'Werner', 'Fischer', '1935-07-22', 'männlich', '4', 'Diabetes, Sturzgefahr', 'Petra Fischer', 'Tochter', '+49 30 98765432', 'p.fischer@email.de', 'bewohner', 'vermittlung', 'flexibel', (SELECT id FROM wg_zimmer WHERE pflege_wg_id = 'wg400000-0000-0000-0000-000000000004' AND nummer = '2')),
    ('k3000000-0000-0000-0000-000000000003', 'Irmgard', 'Schulze', '1940-11-08', 'weiblich', '2', 'Mobil mit Gehhilfe', 'Klaus Schulze', 'Ehemann', '+49 30 55544433', 'schulze.klaus@email.de', 'bewohner', 'email', 'flexibel', (SELECT id FROM wg_zimmer WHERE pflege_wg_id = 'wg100000-0000-0000-0000-000000000001' AND nummer = '1'));

-- Interessenten (verschiedene Pipeline-Status)
INSERT INTO klienten (id, vorname, nachname, geburtsdatum, geschlecht, pflegegrad, besonderheiten, kontakt_name, kontakt_beziehung, kontakt_telefon, kontakt_email, status, anfrage_quelle, dringlichkeit, vermittler, bevorzugte_wgs, anfrage_am) VALUES
    ('k4000000-0000-0000-0000-000000000004', 'Test-AG', 'Testberg-33', '1942-05-20', 'weiblich', '3', 'Fortgeschrittene Demenz, benötigt 24h Betreuung', 'Kontakt Testberg-33', 'Sohn', '+49 30 00000001', 'anonym33@example.de', 'neu', 'email', 'sofort', NULL, ARRAY['wg400000-0000-0000-0000-000000000004', 'wg500000-0000-0000-0000-000000000005']::UUID[], NOW() - INTERVAL '2 days'),
    ('k5000000-0000-0000-0000-000000000005', 'Test-AH', 'Testberg-34', '1937-09-12', 'männlich', '2', 'Leichte kognitive Einschränkungen', 'Kontakt Testberg-34', 'Tochter', '+49 30 00000002', 'anonym34@example.de', 'erstgespraech', 'telefon', '4_wochen', NULL, ARRAY['wg100000-0000-0000-0000-000000000001']::UUID[], NOW() - INTERVAL '5 days'),
    ('k6000000-0000-0000-0000-000000000006', 'Test-AI', 'Testberg-35', '1939-02-28', 'weiblich', '4', 'Bettlägerig, PEG-Sonde', 'Kontakt Testberg-35', 'Tochter', '+49 30 00000003', 'anonym35@example.de', 'besichtigung_geplant', 'vermittlung', 'sofort', 'Vivantes Klinikum Neukölln', ARRAY['wg400000-0000-0000-0000-000000000004']::UUID[], NOW() - INTERVAL '3 days'),
    ('k7000000-0000-0000-0000-000000000007', 'Test-AJ', 'Testberg-36', '1944-08-05', 'weiblich', '3', 'Diabetes, Herzinsuffizienz', 'Kontakt Testberg-36', 'Sohn', '+49 30 00000004', 'anonym36@example.de', 'unterlagen_gesendet', 'website', '3_monate', NULL, ARRAY['wg300000-0000-0000-0000-000000000003', 'wg500000-0000-0000-0000-000000000005']::UUID[], NOW() - INTERVAL '7 days'),
    ('k8000000-0000-0000-0000-000000000008', 'Test-AK', 'Testberg-37', '1936-12-18', 'männlich', '5', 'Schwere Demenz, Weglauftendenz', 'Kontakt Testberg-37', 'Ehefrau', '+49 30 00000005', 'anonym37@example.de', 'entscheidung_ausstehend', 'empfehlung', 'sofort', NULL, ARRAY['wg400000-0000-0000-0000-000000000004']::UUID[], NOW() - INTERVAL '10 days');

-- =====================================================
-- BEISPIEL-KOMMUNIKATION
-- =====================================================

INSERT INTO klient_kommunikation (klient_id, typ, betreff, inhalt, erstellt_von_name, erstellt_am) VALUES
    ('k4000000-0000-0000-0000-000000000004', 'email_ein', 'Anfrage Pflegeplatz für meine Mutter', 'Sehr geehrte Damen und Herren,\n\nmeine Mutter (82 Jahre, Pflegegrad 3) benötigt dringend einen Pflegeplatz. Sie leidet an fortgeschrittener Demenz und benötigt 24-Stunden-Betreuung.\n\nKönnten Sie mir bitte Informationen zu freien Plätzen zusenden?\n\nMit freundlichen Grüßen\nMichael Hoffmann', 'System', NOW() - INTERVAL '2 days'),
    ('k5000000-0000-0000-0000-000000000005', 'anruf_ein', NULL, 'Tochter hat angerufen, möchte Platz für Vater. Vater ist noch relativ fit, Pflegegrad 2. Interessiert an kleiner WG. Rückruf vereinbart für morgen 10:00.', 'Anna Schmidt', NOW() - INTERVAL '5 days'),
    ('k5000000-0000-0000-0000-000000000005', 'anruf_aus', NULL, 'Rückruf durchgeführt. Details besprochen. Frau Meyer möchte mit ihrem Bruder sprechen und meldet sich Ende der Woche.', 'Anna Schmidt', NOW() - INTERVAL '4 days'),
    ('k6000000-0000-0000-0000-000000000006', 'email_aus', 'Besichtigungstermin WG Drachenwiese', 'Sehr geehrte Frau Wagner,\n\nvielen Dank für Ihr Interesse an unserer Pflege-Wohngemeinschaft Drachenwiese.\n\nGerne möchte ich Sie zu einer Besichtigung am kommenden Mittwoch um 14:00 Uhr einladen.\n\nMit freundlichen Grüßen\nAnna Schmidt\nDomusVita Pflege', 'Anna Schmidt', NOW() - INTERVAL '1 day'),
    ('k7000000-0000-0000-0000-000000000007', 'notiz', NULL, 'Infomaterial für Kupferkessel Klein und Drachenblick per E-Mail gesendet. Mietvertragsentwurf liegt bei.', 'Anna Schmidt', NOW() - INTERVAL '7 days');

-- =====================================================
-- BEISPIEL-BESICHTIGUNGEN
-- =====================================================

INSERT INTO besichtigungen (klient_id, pflege_wg_id, termin, status, notizen) VALUES
    ('k6000000-0000-0000-0000-000000000006', 'wg400000-0000-0000-0000-000000000004', NOW() + INTERVAL '2 days' + INTERVAL '14 hours', 'geplant', 'Frau Wagner kommt mit Tochter. Interesse an Zimmer 4 oder 9.');

-- =====================================================
-- VORLAGEN
-- =====================================================

INSERT INTO kommunikation_vorlagen (typ, name, kategorie, betreff, inhalt) VALUES
    ('email', 'Erstinformation', 'Erstinfo', 'Informationen zu unseren Pflege-Wohngemeinschaften', 'Sehr geehrte/r {Anrede} {Kontakt_Nachname},\n\nvielen Dank für Ihr Interesse an unseren ambulant betreuten Pflege-Wohngemeinschaften.\n\nIm Anhang finden Sie unser Konzept sowie aktuelle Informationen zu freien Plätzen.\n\nGerne stehen wir Ihnen für ein persönliches Gespräch oder eine Besichtigung zur Verfügung.\n\nMit freundlichen Grüßen\n{Absender_Name}\nDomusVita Pflege'),
    ('email', 'Besichtigungseinladung', 'Besichtigung', 'Einladung zur Besichtigung - {WG_Name}', 'Sehr geehrte/r {Anrede} {Kontakt_Nachname},\n\ngerne laden wir Sie zu einer Besichtigung unserer Wohngemeinschaft {WG_Name} ein.\n\nTerminvorschlag: {Termin}\n\nBitte bestätigen Sie den Termin oder nennen Sie uns alternative Termine.\n\nMit freundlichen Grüßen\n{Absender_Name}'),
    ('email', 'Nachfass nach Besichtigung', 'Nachfass', 'Vielen Dank für Ihren Besuch bei {WG_Name}', 'Sehr geehrte/r {Anrede} {Kontakt_Nachname},\n\nvielen Dank, dass Sie sich die Zeit genommen haben, unsere Wohngemeinschaft {WG_Name} zu besichtigen.\n\nWie besprochen sende ich Ihnen anbei die Vertragsunterlagen.\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n{Absender_Name}'),
    ('whatsapp', 'Kurze Rückfrage', 'Nachfass', NULL, 'Guten Tag {Kontakt_Vorname}, hier ist {Absender_Name} von DomusVita. Darf ich kurz nachfragen, ob Sie schon eine Entscheidung bezüglich des Pflegeplatzes für {Bewohner_Vorname} treffen konnten? Bei Fragen bin ich gerne für Sie da. 🏠'),
    ('whatsapp', 'Terminbestätigung', 'Besichtigung', NULL, 'Guten Tag! Hiermit bestätige ich unseren Besichtigungstermin am {Termin} in der WG {WG_Name}. Adresse: {WG_Adresse}. Bis dann! 👋');
