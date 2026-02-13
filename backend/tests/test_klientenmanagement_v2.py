"""
Backend Tests for DomusVita Klientenmanagement - V2
Tests document upload, email sending, cost overview APIs, and activity logging
"""
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pflege-wgs-test.preview.emergentagent.com').rstrip('/')


class TestPflegeWGsOverview:
    """Tests for Pflege-WGs overview endpoints"""
    
    def test_get_pflege_wgs_list(self):
        """GET /api/pflege-wgs returns all 5 WGs with stats"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 5, f"Expected 5 WGs, got {len(data)}"
        
        # Verify WG IDs
        wg_ids = [wg['id'] for wg in data]
        expected_ids = ['wg-sterndamm', 'wg-kupferkessel', 'wg-kupferkessel-klein', 
                       'wg-drachenwiese', 'wg-drachenblick']
        for wg_id in expected_ids:
            assert wg_id in wg_ids, f"Missing WG: {wg_id}"
        
        # Verify structure
        for wg in data:
            assert 'kurzname' in wg
            assert 'kapazitaet' in wg
            assert 'freie_zimmer' in wg
            assert 'belegte_zimmer' in wg
            print(f"WG {wg['kurzname']}: {wg['belegte_zimmer']}/{wg['kapazitaet']} belegt")
    
    def test_get_pflege_wg_detail_sterndamm(self):
        """GET /api/pflege-wgs/wg-sterndamm returns WG with Grundriss"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/wg-sterndamm")
        assert response.status_code == 200
        data = response.json()
        
        assert data['kurzname'] == 'Sterndamm'
        assert data['grundriss_url'] is not None
        assert 'zimmer' in data
        assert len(data['zimmer']) >= 1
        print(f"Sterndamm has {len(data['zimmer'])} zimmer, grundriss_url: {data['grundriss_url'][:50]}...")


class TestKostenUebersicht:
    """Tests for cost overview endpoints"""
    
    def test_get_wg_kosten(self):
        """GET /api/pflege-wgs/{wg_id}/kosten returns cost breakdown"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/wg-drachenblick/kosten")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data['wg_id'] == 'wg-drachenblick'
        assert data['wg_name'] == 'Drachenblick'
        assert 'belegte_zimmer' in data
        assert 'kapazitaet' in data
        assert 'auslastung_prozent' in data
        assert 'kosten_detail' in data
        assert 'gesamt_monatlich' in data
        assert 'gesamt_jaehrlich' in data
        assert 'entgangene_einnahmen' in data
        
        # Verify kosten_detail structure
        kosten_detail = data['kosten_detail']
        required_fields = ['miete', 'nebenkosten', 'betreuungspauschale', 'verpflegung', 'investitionskosten']
        for field in required_fields:
            assert field in kosten_detail
            assert 'pro_zimmer' in kosten_detail[field]
            assert 'gesamt' in kosten_detail[field]
        
        print(f"Drachenblick Kosten: {data['gesamt_monatlich']}€/Monat, Auslastung: {data['auslastung_prozent']}%")
    
    def test_get_gesamt_kosten(self):
        """GET /api/pflege-wgs/kosten/gesamt returns aggregated costs"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/kosten/gesamt")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert 'wgs' in data
        assert 'gesamt_monatlich' in data
        assert 'gesamt_jaehrlich' in data
        assert 'gesamt_entgangen' in data
        assert 'gesamt_bewohner' in data
        assert 'gesamt_kapazitaet' in data
        assert 'gesamt_auslastung' in data
        
        # Verify each WG in the list
        assert len(data['wgs']) == 5
        for wg in data['wgs']:
            assert 'wg_id' in wg
            assert 'wg_name' in wg
            assert 'monatlich' in wg
            assert 'auslastung' in wg
        
        print(f"Gesamt: {data['gesamt_monatlich']}€/Monat, {data['gesamt_bewohner']}/{data['gesamt_kapazitaet']} Bewohner")


class TestKlientDokumente:
    """Tests for document upload and management APIs"""
    
    @pytest.fixture
    def klient_id(self):
        """Get a klient ID with status 'neu'"""
        response = requests.get(f"{BASE_URL}/api/klienten?status=neu")
        assert response.status_code == 200
        klienten = response.json()
        if not klienten:
            pytest.skip("No klient with status 'neu' found")
        return klienten[0]['id']
    
    def test_upload_document(self, klient_id):
        """POST /api/klienten/{id}/dokumente uploads a document"""
        # Create a test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("TEST_DOCUMENT_CONTENT_" + str(os.urandom(4).hex()))
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as file:
                response = requests.post(
                    f"{BASE_URL}/api/klienten/{klient_id}/dokumente",
                    params={'kategorie': 'infomaterial'},
                    files={'file': ('test_upload.txt', file, 'text/plain')}
                )
            
            assert response.status_code == 200
            data = response.json()
            
            assert 'id' in data
            assert data['klient_id'] == klient_id
            assert data['kategorie'] == 'infomaterial'
            assert data['status'] == 'hochgeladen'
            assert 'file_data' not in data  # Should not return file content
            print(f"Document uploaded: {data['id']}")
            
            # Cleanup: store doc_id for later tests
            return data['id']
        finally:
            os.unlink(temp_path)
    
    def test_list_documents(self, klient_id):
        """GET /api/klienten/{id}/dokumente returns document list"""
        response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}/dokumente")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            doc = data[0]
            assert 'id' in doc
            assert 'name' in doc
            assert 'kategorie' in doc
            assert 'file_data' not in doc  # Should not include file content
            print(f"Found {len(data)} documents for klient")
    
    def test_download_document(self, klient_id):
        """GET /api/klienten/{id}/dokumente/{dok_id}/download returns file"""
        # First get a document
        docs_response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}/dokumente")
        docs = docs_response.json()
        
        if not docs:
            pytest.skip("No documents to download")
        
        dok_id = docs[0]['id']
        response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}/dokumente/{dok_id}/download")
        
        assert response.status_code == 200
        assert len(response.content) > 0
        assert 'Content-Disposition' in response.headers
        print(f"Downloaded document {dok_id}, size: {len(response.content)} bytes")


class TestEmailSenden:
    """Tests for email sending API (MOCKED)"""
    
    @pytest.fixture
    def klient_id(self):
        """Get a klient ID with status 'neu'"""
        response = requests.get(f"{BASE_URL}/api/klienten?status=neu")
        assert response.status_code == 200
        klienten = response.json()
        if not klienten:
            pytest.skip("No klient with status 'neu' found")
        return klienten[0]['id']
    
    def test_send_email_basic(self, klient_id):
        """POST /api/klienten/{id}/email-senden creates communication entry"""
        response = requests.post(
            f"{BASE_URL}/api/klienten/{klient_id}/email-senden",
            json={
                "betreff": "TEST_Email_Subject",
                "inhalt": "TEST_Email_Body - Dies ist ein automatisierter Test",
                "empfaenger": "test_automated@example.com"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # MOCKED: email_sent should be false
        assert data['email_sent'] == False
        assert 'kommunikation' in data
        assert data['kommunikation']['typ'] == 'email_aus'
        assert data['kommunikation']['betreff'] == 'TEST_Email_Subject'
        print(f"Email saved as kommunikation entry: {data['kommunikation']['id']}")
    
    def test_send_email_with_attachments(self, klient_id):
        """POST /api/klienten/{id}/email-senden with document attachments"""
        # First get existing documents
        docs_response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}/dokumente")
        docs = docs_response.json()
        
        dok_ids = [d['id'] for d in docs[:2]] if docs else []
        
        response = requests.post(
            f"{BASE_URL}/api/klienten/{klient_id}/email-senden",
            json={
                "betreff": "TEST_Email_Mit_Anhaengen",
                "inhalt": "TEST_Email_Body mit Anhängen",
                "empfaenger": "test_attachments@example.com",
                "dokument_ids": dok_ids
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if dok_ids:
            assert 'anhaenge' in data['kommunikation']
            print(f"Email with {len(dok_ids)} attachments saved")


class TestAktivitaetsProtokoll:
    """Tests for automatic activity logging"""
    
    @pytest.fixture
    def klient_id(self):
        """Get a klient ID with status 'neu'"""
        response = requests.get(f"{BASE_URL}/api/klienten?status=neu")
        assert response.status_code == 200
        klienten = response.json()
        if not klienten:
            pytest.skip("No klient with status 'neu' found")
        return klienten[0]['id']
    
    def test_klient_has_aktivitaeten(self, klient_id):
        """Klient detail includes aktivitaeten (activity log)"""
        response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert 'aktivitaeten' in data
        assert isinstance(data['aktivitaeten'], list)
        
        # Should have activity entries from document uploads and emails
        if len(data['aktivitaeten']) > 0:
            activity = data['aktivitaeten'][0]
            assert 'aktion' in activity
            assert 'timestamp' in activity
            print(f"Found {len(data['aktivitaeten'])} activities")
            for act in data['aktivitaeten'][:3]:
                print(f"  - {act['aktion'][:50]}...")
    
    def test_klient_has_kommunikation(self, klient_id):
        """Klient detail includes kommunikation (communication log)"""
        response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert 'kommunikation' in data
        assert isinstance(data['kommunikation'], list)
        
        if len(data['kommunikation']) > 0:
            komm = data['kommunikation'][0]
            assert 'typ' in komm
            assert 'inhalt' in komm
            print(f"Found {len(data['kommunikation'])} kommunikation entries")


class TestKlientenPipeline:
    """Tests for Klienten Pipeline Kanban"""
    
    def test_get_klienten_list(self):
        """GET /api/klienten returns all klienten"""
        response = requests.get(f"{BASE_URL}/api/klienten")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            klient = data[0]
            assert 'id' in klient
            assert 'vorname' in klient
            assert 'nachname' in klient
            assert 'status' in klient
            print(f"Found {len(data)} klienten")
    
    def test_get_klienten_dashboard(self):
        """GET /api/klienten/dashboard returns pipeline stats"""
        response = requests.get(f"{BASE_URL}/api/klienten/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        assert 'bewohner' in data
        assert 'freie_zimmer' in data
        assert 'interessenten' in data
        assert 'pipeline' in data
        
        print(f"Dashboard: {data['bewohner']} Bewohner, {data['freie_zimmer']} freie Zimmer")


class TestKlientDetail:
    """Tests for Klient detail page"""
    
    @pytest.fixture
    def klient_id(self):
        """Get a klient ID"""
        response = requests.get(f"{BASE_URL}/api/klienten?status=neu")
        assert response.status_code == 200
        klienten = response.json()
        if not klienten:
            pytest.skip("No klient found")
        return klienten[0]['id']
    
    def test_get_klient_detail(self, klient_id):
        """GET /api/klienten/{id} returns full klient detail"""
        response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        required = ['id', 'vorname', 'nachname', 'status', 'kommunikation', 'aktivitaeten']
        for field in required:
            assert field in data, f"Missing field: {field}"
        
        print(f"Klient: {data['vorname']} {data['nachname']}, Status: {data['status']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
