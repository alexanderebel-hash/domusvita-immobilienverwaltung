#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DomusVitaAPITester:
    def __init__(self, base_url="https://pflege-wgs-test.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:200] if response.text else ""
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_seed_database(self):
        """Test database seeding"""
        return self.run_test("Seed Database", "POST", "seed", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_dashboard_insights(self):
        """Test dashboard insights endpoint"""
        return self.run_test("Dashboard Insights", "GET", "dashboard/insights", 200)

    def test_get_properties(self):
        """Test get all properties"""
        return self.run_test("Get Properties", "GET", "properties", 200)

    def test_get_property_types(self):
        """Test get property types"""
        return self.run_test("Get Property Types", "GET", "properties/types/list", 200)

    def test_get_cities(self):
        """Test get cities"""
        return self.run_test("Get Cities", "GET", "properties/cities/list", 200)

    def test_get_statuses(self):
        """Test get statuses"""
        return self.run_test("Get Statuses", "GET", "properties/statuses/list", 200)

    def test_create_property(self):
        """Test creating a new property"""
        property_data = {
            "name": "Test Immobilie API",
            "address": "Teststraße 123",
            "city": "Berlin",
            "postal_code": "10115",
            "property_type": "Wohnung",
            "status": "Eigentum",
            "units_count": 2,
            "description": "Test property created by API test"
        }
        success, response = self.run_test("Create Property", "POST", "properties", 200, data=property_data)
        return success, response.get('id') if success else None

    def test_get_property_by_id(self, property_id):
        """Test getting a property by ID"""
        if not property_id:
            print("❌ Skipping get property by ID - no property ID available")
            return False, {}
        return self.run_test("Get Property by ID", "GET", f"properties/{property_id}", 200)

    def test_delete_property(self, property_id):
        """Test deleting a property"""
        if not property_id:
            print("❌ Skipping delete property - no property ID available")
            return False, {}
        return self.run_test("Delete Property", "DELETE", f"properties/{property_id}", 200)

    def test_ai_query(self):
        """Test AI assistant query"""
        query_data = {
            "query": "Wie viele Immobilien gibt es?",
            "context": "Test query from API test"
        }
        return self.run_test("AI Query", "POST", "ai/query", 200, data=query_data)

    # ==================== HANDWERKER PORTAL TESTS ====================
    
    def test_get_handwerker_contacts(self):
        """Test getting handwerker contacts for demo login"""
        return self.run_test("Get Handwerker Contacts", "GET", "contacts", 200, params={"role": "Handwerker"})
    
    def test_handwerker_login(self):
        """Test handwerker login with contact ID"""
        # First get handwerker contacts to find a valid ID
        success, contacts = self.run_test("Get Handwerker for Login", "GET", "contacts", 200, params={"role": "Handwerker"})
        
        if not success or not contacts:
            print("❌ No handwerker contacts found for login test")
            return False, None
            
        # Use first handwerker for login test
        handwerker_id = contacts[0].get('id') if contacts else None
        if not handwerker_id:
            print("❌ No valid handwerker ID found")
            return False, None
            
        login_data = {
            "handwerker_id": handwerker_id
        }
        success, response = self.run_test("Handwerker Login", "POST", "handwerker/login", 200, data=login_data)
        
        if success:
            token = response.get('token')
            return success, {"token": token, "handwerker_id": handwerker_id}
        return False, None
    
    def test_handwerker_verify_token(self, auth_data):
        """Test handwerker token verification"""
        if not auth_data or not auth_data.get('token'):
            print("❌ Skipping token verification - no token available")
            return False, {}
        
        token = auth_data['token']
        return self.run_test("Verify Handwerker Token", "GET", f"handwerker/verify/{token}", 200)
    
    def test_get_handwerker_tickets(self, auth_data):
        """Test getting tickets assigned to handwerker"""
        if not auth_data or not auth_data.get('handwerker_id'):
            print("❌ Skipping get tickets - no handwerker ID available")
            return False, {}
        
        handwerker_id = auth_data['handwerker_id']
        success, response = self.run_test("Get Handwerker Tickets", "GET", f"handwerker/tickets/{handwerker_id}", 200)
        
        if success and response:
            # Return first ticket ID for further testing
            ticket_id = response[0].get('id') if response else None
            return success, {"tickets": response, "ticket_id": ticket_id}
        return False, {}
    
    def test_get_handwerker_ticket_detail(self, ticket_data):
        """Test getting detailed ticket information"""
        if not ticket_data or not ticket_data.get('ticket_id'):
            print("❌ Skipping ticket detail - no ticket ID available")
            return False, {}
        
        ticket_id = ticket_data['ticket_id']
        return self.run_test("Get Handwerker Ticket Detail", "GET", f"handwerker/ticket/{ticket_id}", 200)
    
    def test_handwerker_status_options(self):
        """Test getting available status options for handwerker"""
        return self.run_test("Get Handwerker Status Options", "GET", "handwerker/status-options", 200)
    
    def test_update_ticket_status(self, ticket_data):
        """Test updating ticket status from handwerker"""
        if not ticket_data or not ticket_data.get('ticket_id'):
            print("❌ Skipping status update - no ticket ID available")
            return False, {}
        
        ticket_id = ticket_data['ticket_id']
        status_data = {
            "ticket_id": ticket_id,
            "status": "Unterwegs",
            "note": "API Test - Status update",
            "location": "Test Location"
        }
        return self.run_test("Update Ticket Status", "POST", f"handwerker/ticket/{ticket_id}/status", 200, data=status_data)
    
    def test_create_work_report(self, ticket_data):
        """Test creating work report for ticket"""
        if not ticket_data or not ticket_data.get('ticket_id'):
            print("❌ Skipping work report - no ticket ID available")
            return False, {}
        
        ticket_id = ticket_data['ticket_id']
        report_data = {
            "ticket_id": ticket_id,
            "description": "API Test - Durchgeführte Arbeiten",
            "materials_used": "Test Material, Test Werkzeug",
            "work_hours": 2.5,
            "material_cost": 50.0,
            "labor_cost": 125.0,
            "notes": "API Test Notizen"
        }
        return self.run_test("Create Work Report", "POST", f"handwerker/ticket/{ticket_id}/report", 200, data=report_data)
    
    def test_get_work_report(self, ticket_data):
        """Test getting work report for ticket"""
        if not ticket_data or not ticket_data.get('ticket_id'):
            print("❌ Skipping get work report - no ticket ID available")
            return False, {}
        
        ticket_id = ticket_data['ticket_id']
        return self.run_test("Get Work Report", "GET", f"handwerker/ticket/{ticket_id}/report", 200)
    
    def test_get_status_history(self, ticket_data):
        """Test getting status history for ticket"""
        if not ticket_data or not ticket_data.get('ticket_id'):
            print("❌ Skipping status history - no ticket ID available")
            return False, {}
        
        ticket_id = ticket_data['ticket_id']
        return self.run_test("Get Status History", "GET", f"handwerker/ticket/{ticket_id}/status-history", 200)

    def test_get_units(self):
        """Test get units endpoint"""
        return self.run_test("Get Units", "GET", "units", 200)

    def test_get_maintenance_tickets(self):
        """Test get maintenance tickets"""
        return self.run_test("Get Maintenance Tickets", "GET", "maintenance", 200)

    def test_property_filters(self):
        """Test property filtering"""
        # Test filter by type
        success1, _ = self.run_test("Filter by Type", "GET", "properties", 200, params={"property_type": "Wohnung"})
        
        # Test filter by city
        success2, _ = self.run_test("Filter by City", "GET", "properties", 200, params={"city": "Berlin"})
        
        # Test filter by status
        success3, _ = self.run_test("Filter by Status", "GET", "properties", 200, params={"status": "Eigentum"})
        
        return success1 and success2 and success3

def main():
    print("🏠 DomusVita API Testing Suite")
    print("=" * 50)
    
    tester = DomusVitaAPITester()
    
    # Test basic endpoints
    print("\n📋 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    tester.test_seed_database()
    
    # Test dashboard endpoints
    print("\n📊 Testing Dashboard Endpoints...")
    tester.test_dashboard_stats()
    tester.test_dashboard_insights()
    
    # Test property endpoints
    print("\n🏢 Testing Property Endpoints...")
    tester.test_get_properties()
    tester.test_get_property_types()
    tester.test_get_cities()
    tester.test_get_statuses()
    
    # Test property CRUD operations
    print("\n🔧 Testing Property CRUD Operations...")
    success, property_id = tester.test_create_property()
    tester.test_get_property_by_id(property_id)
    tester.test_delete_property(property_id)
    
    # Test filtering
    print("\n🔍 Testing Property Filters...")
    tester.test_property_filters()
    
    # Test other endpoints
    print("\n🏠 Testing Other Endpoints...")
    tester.test_get_units()
    tester.test_get_maintenance_tickets()
    
    # Test AI functionality
    print("\n🤖 Testing AI Assistant...")
    tester.test_ai_query()
    
    # ==================== HANDWERKER PORTAL TESTS ====================
    print("\n🔨 Testing Handwerker Portal...")
    
    # Test handwerker contacts and login
    tester.test_get_handwerker_contacts()
    success, auth_data = tester.test_handwerker_login()
    
    if success and auth_data:
        # Test token verification
        tester.test_handwerker_verify_token(auth_data)
        
        # Test getting tickets
        success, ticket_data = tester.test_get_handwerker_tickets(auth_data)
        
        if success and ticket_data and ticket_data.get('ticket_id'):
            # Test ticket detail
            tester.test_get_handwerker_ticket_detail(ticket_data)
            
            # Test status options
            tester.test_handwerker_status_options()
            
            # Test status update
            tester.test_update_ticket_status(ticket_data)
            
            # Test work report creation
            tester.test_create_work_report(ticket_data)
            
            # Test getting work report
            tester.test_get_work_report(ticket_data)
            
            # Test status history
            tester.test_get_status_history(ticket_data)
        else:
            print("⚠️  Warning: No tickets found for handwerker - skipping ticket-specific tests")
    else:
        print("⚠️  Warning: Handwerker login failed - skipping handwerker portal tests")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate < 80:
        print("⚠️  Warning: Success rate below 80%")
        return 1
    elif success_rate == 100:
        print("🎉 All tests passed!")
        return 0
    else:
        print("✅ Most tests passed")
        return 0

if __name__ == "__main__":
    sys.exit(main())