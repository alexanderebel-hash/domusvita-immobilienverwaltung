#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DomusVitaAPITester:
    def __init__(self, base_url="https://domusvita-app.preview.emergentagent.com/api"):
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