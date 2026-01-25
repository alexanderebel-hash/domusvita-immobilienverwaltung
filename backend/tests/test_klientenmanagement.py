"""
Test suite for DomusVita Klientenmanagement Module
Tests: Pflege-WGs, Klienten, Dashboard, Pipeline Status Updates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://domushome.preview.emergentagent.com').rstrip('/')


class TestPflegeWGs:
    """Tests for Pflege-WG endpoints"""
    
    def test_get_all_pflege_wgs(self):
        """Test GET /api/pflege-wgs - should return 5 WGs"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5, f"Expected 5 WGs, got {len(data)}"
        
        # Verify WG names
        wg_names = [wg['kurzname'] for wg in data]
        expected_names = ['Sterndamm', 'Kupferkessel', 'Kupferkessel Klein', 'Drachenwiese', 'Drachenblick']
        for name in expected_names:
            assert name in wg_names, f"Missing WG: {name}"
    
    def test_pflege_wg_structure(self):
        """Test that each WG has required fields"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ['id', 'kurzname', 'property_name', 'property_address', 'kapazitaet', 
                          'beschreibung', 'freie_zimmer', 'belegte_zimmer', 'reservierte_zimmer', 'gesamt_zimmer']
        
        for wg in data:
            for field in required_fields:
                assert field in wg, f"Missing field '{field}' in WG {wg.get('kurzname', 'unknown')}"
    
    def test_get_wg_drachenwiese_detail(self):
        """Test GET /api/pflege-wgs/wg-drachenwiese - should return WG with 12 rooms"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/wg-drachenwiese")
        assert response.status_code == 200
        
        data = response.json()
        assert data['kurzname'] == 'Drachenwiese'
        assert data['kapazitaet'] == 12
        assert 'zimmer' in data
        assert len(data['zimmer']) == 12, f"Expected 12 rooms, got {len(data['zimmer'])}"
        assert data['grundriss_url'] is not None, "Drachenwiese should have a Grundriss URL"
    
    def test_get_wg_sterndamm_detail(self):
        """Test GET /api/pflege-wgs/wg-sterndamm - should return WG with 3 rooms"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/wg-sterndamm")
        assert response.status_code == 200
        
        data = response.json()
        assert data['kurzname'] == 'Sterndamm'
        assert data['kapazitaet'] == 3
        assert 'zimmer' in data
        assert len(data['zimmer']) == 3
    
    def test_get_wg_not_found(self):
        """Test GET /api/pflege-wgs/invalid-id - should return 404"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/invalid-wg-id")
        assert response.status_code == 404
    
    def test_wg_room_positions(self):
        """Test that rooms have position data for interactive floor plan"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/wg-drachenwiese")
        assert response.status_code == 200
        
        data = response.json()
        for zimmer in data['zimmer']:
            assert 'position_x' in zimmer, f"Room {zimmer.get('nummer')} missing position_x"
            assert 'position_y' in zimmer, f"Room {zimmer.get('nummer')} missing position_y"
            assert 'breite' in zimmer, f"Room {zimmer.get('nummer')} missing breite"
            assert 'hoehe' in zimmer, f"Room {zimmer.get('nummer')} missing hoehe"


class TestKlientenDashboard:
    """Tests for Klienten Dashboard endpoint"""
    
    def test_get_dashboard(self):
        """Test GET /api/klienten/dashboard - should return dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/klienten/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ['gesamt_klienten', 'bewohner', 'interessenten', 'freie_zimmer', 'pipeline', 'handlungsbedarf']
        for field in required_fields:
            assert field in data, f"Missing field '{field}' in dashboard"
    
    def test_dashboard_pipeline_structure(self):
        """Test that pipeline has correct structure"""
        response = requests.get(f"{BASE_URL}/api/klienten/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        pipeline = data['pipeline']
        assert isinstance(pipeline, list)
        
        expected_statuses = ['neu', 'erstgespraech', 'besichtigung_geplant', 'unterlagen_gesendet', 'entscheidung_ausstehend', 'zusage']
        pipeline_statuses = [p['status'] for p in pipeline]
        
        for status in expected_statuses:
            assert status in pipeline_statuses, f"Missing pipeline status: {status}"
        
        # Each pipeline item should have required fields
        for item in pipeline:
            assert 'status' in item
            assert 'label' in item
            assert 'anzahl' in item
            assert 'dringend' in item
    
    def test_dashboard_counts_consistency(self):
        """Test that dashboard counts are consistent"""
        response = requests.get(f"{BASE_URL}/api/klienten/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        # Bewohner + Interessenten should be <= gesamt_klienten
        assert data['bewohner'] + data['interessenten'] <= data['gesamt_klienten']


class TestKlienten:
    """Tests for Klienten CRUD endpoints"""
    
    def test_get_all_klienten(self):
        """Test GET /api/klienten - should return list of clients"""
        response = requests.get(f"{BASE_URL}/api/klienten")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 8, f"Expected at least 8 clients, got {len(data)}"
    
    def test_klient_structure(self):
        """Test that each klient has required fields"""
        response = requests.get(f"{BASE_URL}/api/klienten")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ['id', 'vorname', 'nachname', 'status', 'kontakt_name']
        
        for klient in data:
            for field in required_fields:
                assert field in klient, f"Missing field '{field}' in klient {klient.get('vorname', 'unknown')}"
    
    def test_filter_klienten_by_status(self):
        """Test GET /api/klienten?status=bewohner - should filter by status"""
        response = requests.get(f"{BASE_URL}/api/klienten?status=bewohner")
        assert response.status_code == 200
        
        data = response.json()
        for klient in data:
            assert klient['status'] == 'bewohner', f"Expected status 'bewohner', got '{klient['status']}'"
    
    def test_get_single_klient(self):
        """Test GET /api/klienten/{id} - should return single client"""
        # First get list to get a valid ID
        list_response = requests.get(f"{BASE_URL}/api/klienten")
        klienten = list_response.json()
        
        if klienten:
            klient_id = klienten[0]['id']
            response = requests.get(f"{BASE_URL}/api/klienten/{klient_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data['id'] == klient_id
            # Single klient should have additional fields
            assert 'kommunikation' in data
            assert 'aktivitaeten' in data
    
    def test_get_klient_not_found(self):
        """Test GET /api/klienten/invalid-id - should return 404"""
        response = requests.get(f"{BASE_URL}/api/klienten/invalid-klient-id")
        assert response.status_code == 404


class TestKlientenStatusUpdate:
    """Tests for Klienten Pipeline Status Update (Drag & Drop)"""
    
    def test_status_update_success(self):
        """Test POST /api/klienten/{id}/status - should update status"""
        # Get a klient with status 'neu'
        list_response = requests.get(f"{BASE_URL}/api/klienten")
        klienten = list_response.json()
        
        # Find a klient that's not a bewohner (to avoid breaking room assignments)
        test_klient = None
        for k in klienten:
            if k['status'] not in ['bewohner', 'ausgezogen', 'verstorben']:
                test_klient = k
                break
        
        if test_klient:
            original_status = test_klient['status']
            new_status = 'erstgespraech' if original_status != 'erstgespraech' else 'besichtigung_geplant'
            
            # Update status
            response = requests.post(f"{BASE_URL}/api/klienten/{test_klient['id']}/status?status={new_status}")
            assert response.status_code == 200
            
            data = response.json()
            assert data['message'] == 'Status aktualisiert'
            assert data['old_status'] == original_status
            assert data['new_status'] == new_status
            
            # Verify the change persisted
            verify_response = requests.get(f"{BASE_URL}/api/klienten/{test_klient['id']}")
            assert verify_response.status_code == 200
            assert verify_response.json()['status'] == new_status
            
            # Revert the status
            requests.post(f"{BASE_URL}/api/klienten/{test_klient['id']}/status?status={original_status}")
    
    def test_status_update_not_found(self):
        """Test POST /api/klienten/invalid-id/status - should return 404"""
        response = requests.post(f"{BASE_URL}/api/klienten/invalid-id/status?status=neu")
        assert response.status_code == 404


class TestWGRoomStats:
    """Tests for WG room statistics"""
    
    def test_room_stats_consistency(self):
        """Test that room stats are consistent across WGs"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs")
        assert response.status_code == 200
        
        data = response.json()
        for wg in data:
            total = wg['freie_zimmer'] + wg['belegte_zimmer'] + wg['reservierte_zimmer']
            assert total == wg['gesamt_zimmer'], f"Room stats inconsistent for {wg['kurzname']}: {total} != {wg['gesamt_zimmer']}"
    
    def test_drachenwiese_has_most_rooms(self):
        """Test that Drachenwiese has 12 rooms (largest WG)"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs/wg-drachenwiese")
        assert response.status_code == 200
        
        data = response.json()
        assert data['kapazitaet'] == 12
        assert len(data['zimmer']) == 12


class TestGrundrissUrls:
    """Tests for Grundriss (floor plan) URLs"""
    
    def test_grundriss_urls_present(self):
        """Test that WGs with Grundriss have valid URLs"""
        response = requests.get(f"{BASE_URL}/api/pflege-wgs")
        assert response.status_code == 200
        
        data = response.json()
        wgs_with_grundriss = [wg for wg in data if wg['grundriss_url']]
        
        # At least 4 WGs should have Grundriss
        assert len(wgs_with_grundriss) >= 4, f"Expected at least 4 WGs with Grundriss, got {len(wgs_with_grundriss)}"
        
        for wg in wgs_with_grundriss:
            assert wg['grundriss_url'].startswith('https://'), f"Invalid Grundriss URL for {wg['kurzname']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
