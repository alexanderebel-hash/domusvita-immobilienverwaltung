"""
DomusVita API Tests - Comprehensive backend testing
Tests all CRUD operations, filters, and Handwerker Portal endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pflege-wgs-test.preview.emergentagent.com').rstrip('/')

class TestDashboard:
    """Dashboard statistics and insights tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "DomusVita" in data["message"]
    
    def test_dashboard_stats(self):
        """Test dashboard statistics - verify 13 properties, 4 vacant, 4 open tasks"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected values from real DomusVita data
        assert data["total_properties"] == 13, f"Expected 13 properties, got {data['total_properties']}"
        assert data["vacant_units"] == 4, f"Expected 4 vacant units, got {data['vacant_units']}"
        assert data["pending_tasks"] == 4, f"Expected 4 pending tasks, got {data['pending_tasks']}"
        assert data["total_contacts"] == 6
        assert data["active_contracts"] == 4
    
    def test_dashboard_insights(self):
        """Test AI insights endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/insights")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have insights about properties and tasks
        assert len(data) > 0


class TestProperties:
    """Properties CRUD and filter tests"""
    
    def test_get_all_properties(self):
        """Test getting all 13 real DomusVita properties"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 13, f"Expected 13 properties, got {len(data)}"
        
        # Verify some known property names
        property_names = [p["name"] for p in data]
        assert "Haus Hebron" in property_names
        assert "WG Kupferkessel & Mietwohnungen" in property_names
        assert "WG Drachenwiese" in property_names
        assert "Büro DV Gesundheit Kreuzberg (Neu)" in property_names
    
    def test_filter_properties_by_city(self):
        """Test filtering properties by city (Berlin)"""
        response = requests.get(f"{BASE_URL}/api/properties?city=Berlin")
        assert response.status_code == 200
        data = response.json()
        
        # All properties should be in Berlin
        assert len(data) == 13
        for prop in data:
            assert prop["city"] == "Berlin"
    
    def test_filter_properties_by_type(self):
        """Test filtering properties by type (Pflegewohngemeinschaft)"""
        response = requests.get(f"{BASE_URL}/api/properties?property_type=Pflegewohngemeinschaft")
        assert response.status_code == 200
        data = response.json()
        
        # Should have multiple Pflegewohngemeinschaft properties
        assert len(data) >= 5
        for prop in data:
            assert prop["property_type"] == "Pflegewohngemeinschaft"
    
    def test_filter_properties_by_status(self):
        """Test filtering properties by status (Eigentum)"""
        response = requests.get(f"{BASE_URL}/api/properties?status=Eigentum")
        assert response.status_code == 200
        data = response.json()
        
        for prop in data:
            assert prop["status"] == "Eigentum"
    
    def test_get_cities_list(self):
        """Test getting list of cities"""
        response = requests.get(f"{BASE_URL}/api/properties/cities/list")
        assert response.status_code == 200
        data = response.json()
        assert "cities" in data
        assert "Berlin" in data["cities"]
    
    def test_get_property_types_list(self):
        """Test getting list of property types"""
        response = requests.get(f"{BASE_URL}/api/properties/types/list")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert "Wohnung" in data["types"]
        assert "Pflegewohngemeinschaft" in data["types"]
    
    def test_get_property_by_id(self):
        """Test getting a specific property by ID"""
        # First get all properties
        response = requests.get(f"{BASE_URL}/api/properties")
        properties = response.json()
        
        # Get first property by ID
        prop_id = properties[0]["id"]
        response = requests.get(f"{BASE_URL}/api/properties/{prop_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == prop_id
    
    def test_get_nonexistent_property(self):
        """Test getting a non-existent property returns 404"""
        response = requests.get(f"{BASE_URL}/api/properties/nonexistent-id-12345")
        assert response.status_code == 404


class TestContacts:
    """Contacts CRUD and filter tests"""
    
    def test_get_all_contacts(self):
        """Test getting all contacts with all roles"""
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 6
        
        # Verify all roles are present
        roles = [c["role"] for c in data]
        assert "Mieter" in roles
        assert "Eigentümer" in roles
        assert "Handwerker" in roles
        assert "Versorger" in roles
        assert "Behörde" in roles
    
    def test_filter_contacts_by_role_handwerker(self):
        """Test filtering contacts by Handwerker role"""
        response = requests.get(f"{BASE_URL}/api/contacts?role=Handwerker")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 2  # Elektro Weber and Sanitär König
        for contact in data:
            assert contact["role"] == "Handwerker"
        
        names = [c["name"] for c in data]
        assert "Elektro Weber" in names
        assert "Sanitär König" in names
    
    def test_filter_contacts_by_role_mieter(self):
        """Test filtering contacts by Mieter role"""
        response = requests.get(f"{BASE_URL}/api/contacts?role=Mieter")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 1
        for contact in data:
            assert contact["role"] == "Mieter"
    
    def test_get_contact_roles_list(self):
        """Test getting list of contact roles"""
        response = requests.get(f"{BASE_URL}/api/contacts/roles/list")
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        expected_roles = ["Mieter", "Eigentümer", "Handwerker", "Versorger", "Behörde"]
        for role in expected_roles:
            assert role in data["roles"]
    
    def test_search_contacts(self):
        """Test searching contacts by name"""
        response = requests.get(f"{BASE_URL}/api/contacts?search=Weber")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 1
        assert any("Weber" in c["name"] for c in data)


class TestMaintenance:
    """Maintenance tickets tests"""
    
    def test_get_all_maintenance_tickets(self):
        """Test getting all maintenance tickets"""
        response = requests.get(f"{BASE_URL}/api/maintenance")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 4
        
        # Verify ticket titles
        titles = [t["title"] for t in data]
        assert "Heizung prüfen" in titles
        assert "Wasserschaden Badezimmer" in titles
        assert "Reinigung Treppenhaus" in titles
        assert "Elektrik Prüfung" in titles
    
    def test_filter_tickets_by_status_offen(self):
        """Test filtering tickets by Offen status"""
        response = requests.get(f"{BASE_URL}/api/maintenance?status=Offen")
        assert response.status_code == 200
        data = response.json()
        
        # Should have 3 open tickets
        assert len(data) >= 3
        for ticket in data:
            assert ticket["status"] == "Offen"
    
    def test_filter_tickets_by_status_in_bearbeitung(self):
        """Test filtering tickets by In Bearbeitung status"""
        response = requests.get(f"{BASE_URL}/api/maintenance?status=In%20Bearbeitung")
        assert response.status_code == 200
        data = response.json()
        
        for ticket in data:
            assert ticket["status"] == "In Bearbeitung"
    
    def test_get_maintenance_categories(self):
        """Test getting maintenance categories"""
        response = requests.get(f"{BASE_URL}/api/maintenance/categories/list")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "Heizung" in data["categories"]
        assert "Sanitär" in data["categories"]
        assert "Elektrik" in data["categories"]
    
    def test_get_maintenance_statuses(self):
        """Test getting maintenance statuses"""
        response = requests.get(f"{BASE_URL}/api/maintenance/statuses/list")
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        assert "Offen" in data["statuses"]
        assert "In Bearbeitung" in data["statuses"]
        assert "Erledigt" in data["statuses"]
    
    def test_get_maintenance_priorities(self):
        """Test getting maintenance priorities"""
        response = requests.get(f"{BASE_URL}/api/maintenance/priorities/list")
        assert response.status_code == 200
        data = response.json()
        assert "priorities" in data
        assert "Niedrig" in data["priorities"]
        assert "Normal" in data["priorities"]
        assert "Hoch" in data["priorities"]
        assert "Dringend" in data["priorities"]


class TestHandwerkerPortal:
    """Handwerker Portal authentication and ticket management tests"""
    
    @pytest.fixture
    def handwerker_id(self):
        """Get Elektro Weber's ID for testing"""
        response = requests.get(f"{BASE_URL}/api/contacts?role=Handwerker")
        contacts = response.json()
        elektro_weber = next((c for c in contacts if "Weber" in c["name"]), None)
        return elektro_weber["id"] if elektro_weber else None
    
    def test_handwerker_login_elektro_weber(self, handwerker_id):
        """Test Handwerker login with Elektro Weber"""
        if not handwerker_id:
            pytest.skip("Elektro Weber not found")
        
        response = requests.post(f"{BASE_URL}/api/handwerker/login", json={
            "handwerker_id": handwerker_id
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "token" in data
        assert data["name"] == "Elektro Weber"
        assert data["specialty"] == "Elektrik"
    
    def test_handwerker_login_invalid_id(self):
        """Test Handwerker login with invalid ID"""
        response = requests.post(f"{BASE_URL}/api/handwerker/login", json={
            "handwerker_id": "invalid-id-12345"
        })
        assert response.status_code == 401
    
    def test_handwerker_verify_token(self, handwerker_id):
        """Test token verification"""
        if not handwerker_id:
            pytest.skip("Elektro Weber not found")
        
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/handwerker/login", json={
            "handwerker_id": handwerker_id
        })
        token = login_response.json()["token"]
        
        # Verify token
        response = requests.get(f"{BASE_URL}/api/handwerker/verify/{token}")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["handwerker_id"] == handwerker_id
    
    def test_handwerker_verify_invalid_token(self):
        """Test verification with invalid token"""
        response = requests.get(f"{BASE_URL}/api/handwerker/verify/invalid-token-12345")
        assert response.status_code == 401
    
    def test_handwerker_get_tickets(self, handwerker_id):
        """Test getting tickets assigned to Handwerker"""
        if not handwerker_id:
            pytest.skip("Elektro Weber not found")
        
        response = requests.get(f"{BASE_URL}/api/handwerker/tickets/{handwerker_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Elektro Weber should have assigned tickets
        assert isinstance(data, list)
        for ticket in data:
            assert "id" in ticket
            assert "title" in ticket
            assert "property_name" in ticket
            assert "status" in ticket
    
    def test_handwerker_status_options(self):
        """Test getting Handwerker status options"""
        response = requests.get(f"{BASE_URL}/api/handwerker/status-options")
        assert response.status_code == 200
        data = response.json()
        
        assert "statuses" in data
        expected_statuses = ["Unterwegs", "Vor Ort", "In Arbeit", "Erledigt", "Material fehlt"]
        for status in expected_statuses:
            assert status in data["statuses"]
        
        assert "photo_categories" in data
        expected_categories = ["Vorher", "Während", "Nachher"]
        for cat in expected_categories:
            assert cat in data["photo_categories"]


class TestContracts:
    """Contracts tests"""
    
    def test_get_all_contracts(self):
        """Test getting all contracts"""
        response = requests.get(f"{BASE_URL}/api/contracts")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 4
        
        # Verify contract types
        types = [c["contract_type"] for c in data]
        assert "Mietvertrag" in types
        assert "Hauptmietvertrag" in types
        assert "Versicherung" in types
        assert "Wartungsvertrag" in types
    
    def test_filter_active_contracts(self):
        """Test filtering active contracts"""
        response = requests.get(f"{BASE_URL}/api/contracts?is_active=true")
        assert response.status_code == 200
        data = response.json()
        
        for contract in data:
            assert contract["is_active"] == True
    
    def test_get_contract_types_list(self):
        """Test getting contract types"""
        response = requests.get(f"{BASE_URL}/api/contracts/types/list")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert "Mietvertrag" in data["types"]


class TestDocuments:
    """Documents tests"""
    
    def test_get_all_documents(self):
        """Test getting all documents"""
        response = requests.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 3
    
    def test_get_document_categories(self):
        """Test getting document categories"""
        response = requests.get(f"{BASE_URL}/api/documents/categories/list")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "Vertrag" in data["categories"]
        assert "Grundriss" in data["categories"]


class TestUnits:
    """Units tests"""
    
    def test_get_all_units(self):
        """Test getting all units"""
        response = requests.get(f"{BASE_URL}/api/units")
        assert response.status_code == 200
        data = response.json()
        
        # Should have 26 units total
        assert len(data) == 26
    
    def test_get_units_by_property(self):
        """Test getting units for a specific property"""
        # Get Haus Hebron property
        props_response = requests.get(f"{BASE_URL}/api/properties")
        properties = props_response.json()
        haus_hebron = next((p for p in properties if "Hebron" in p["name"]), None)
        
        if haus_hebron:
            response = requests.get(f"{BASE_URL}/api/units?property_id={haus_hebron['id']}")
            assert response.status_code == 200
            data = response.json()
            
            # Haus Hebron should have 8 units
            assert len(data) == 8


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
