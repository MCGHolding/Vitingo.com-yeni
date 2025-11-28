#!/usr/bin/env python3

import requests
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://docwizard-2.preview.emergentagent.com"

def test_customer_tags_functionality():
    """
    Test Customer CRUD endpoints specifically focusing on the new 'tags' field functionality.
    
    Test Scenarios:
    1. POST /api/customers - Create new customer with tags field
    2. GET /api/customers - Get all customers and verify tags field is returned
    3. PUT /api/customers/{id} - Update customer and modify tags field
    
    Expected Results:
    - POST should succeed and save tags field
    - GET should return tags field
    - PUT should allow tags updates
    - Tags should be stored and returned as array
    """
    
    print("=" * 80)
    print("🏷️  TESTING CUSTOMER TAGS FIELD FUNCTIONALITY")
    print("=" * 80)
    print("Testing the new 'tags' field in Customer CRUD endpoints")
    print("Focus: Verify tags field works correctly in all CRUD operations")
    
    endpoint = f"{BACKEND_URL}/api/customers"
    print(f"Testing endpoint: {endpoint}")
    
    # Test data as specified in the request
    test_customer_data = {
        "companyName": "Etiket Test Şirketi A.Ş.",
        "relationshipType": "customer",
        "email": "test@etikettest.com",
        "country": "TR",
        "sector": "Teknoloji",
        "tags": ["TEKNOLOJI", "SANAYI", "İHRACAT"]
    }
    
    created_customer_id = None
    
    try:
        # TEST 1: POST /api/customers - Create customer with tags
        print("\n" + "=" * 60)
        print("TEST 1: POST /api/customers - Create customer with tags field")
        print("=" * 60)
        
        print(f"Test Data: {test_customer_data}")
        print(f"Tags to create: {test_customer_data['tags']}")
        
        print("\n1. Making POST request to create customer with tags...")
        response = requests.post(endpoint, json=test_customer_data, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Customer creation with tags responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Parse response
        print("\n2. Parsing POST response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Validate response structure
        print("\n3. Validating POST response structure...")
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a dictionary")
            return False
        
        # Check customer ID
        created_customer_id = data.get("id")
        if not created_customer_id:
            print("   ❌ FAIL: Customer ID should not be empty")
            return False
        
        print(f"   ✅ PASS: Customer created with ID: {created_customer_id}")
        
        # TEST CRITICAL: Verify tags field in POST response
        print("\n4. Verifying tags field in POST response...")
        response_tags = data.get("tags")
        expected_tags = test_customer_data["tags"]
        
        if response_tags is None:
            print("   ❌ FAIL: Tags field is missing from POST response")
            return False
        
        if not isinstance(response_tags, list):
            print(f"   ❌ FAIL: Tags should be a list, got {type(response_tags)}")
            return False
        
        if response_tags != expected_tags:
            print(f"   ❌ FAIL: Tags mismatch. Expected: {expected_tags}, Got: {response_tags}")
            return False
        
        print(f"   ✅ PASS: Tags field correctly saved and returned: {response_tags}")
        print(f"   Tags count: {len(response_tags)}")
        print(f"   Tags content: {', '.join(response_tags)}")
        
        # Verify other fields too
        print("\n5. Verifying other customer fields...")
        for field, expected_value in test_customer_data.items():
            if field == "tags":
                continue  # Already verified above
            actual_value = data.get(field)
            if actual_value != expected_value:
                print(f"   ❌ FAIL: Field {field} mismatch. Expected: {expected_value}, Got: {actual_value}")
                return False
        
        print("   ✅ PASS: All customer fields match input data")
        
        # TEST 2: GET /api/customers - Verify tags in list response
        print("\n" + "=" * 60)
        print("TEST 2: GET /api/customers - Verify tags field in list response")
        print("=" * 60)
        
        print("\n1. Making GET request to retrieve all customers...")
        get_response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {get_response.status_code}")
        if get_response.status_code == 200:
            print("   ✅ PASS: GET all customers responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {get_response.status_code}")
            return False
        
        # Parse GET response
        print("\n2. Parsing GET response...")
        try:
            get_data = get_response.json()
            print(f"   Response type: {type(get_data)}")
            print(f"   Number of customers: {len(get_data) if isinstance(get_data, list) else 'N/A'}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Validate GET response structure
        print("\n3. Validating GET response structure...")
        if not isinstance(get_data, list):
            print("   ❌ FAIL: GET response should be a list of customers")
            return False
        
        # Find our created customer in the list
        print("\n4. Finding created customer in list...")
        created_customer = None
        for customer in get_data:
            if customer.get("id") == created_customer_id:
                created_customer = customer
                break
        
        if not created_customer:
            print(f"   ❌ FAIL: Created customer with ID {created_customer_id} not found in list")
            return False
        
        print(f"   ✅ PASS: Created customer found in list")
        
        # TEST CRITICAL: Verify tags field in GET response
        print("\n5. Verifying tags field in GET response...")
        get_tags = created_customer.get("tags")
        
        if get_tags is None:
            print("   ❌ FAIL: Tags field is missing from GET response")
            return False
        
        if not isinstance(get_tags, list):
            print(f"   ❌ FAIL: Tags should be a list, got {type(get_tags)}")
            return False
        
        if get_tags != expected_tags:
            print(f"   ❌ FAIL: Tags mismatch in GET. Expected: {expected_tags}, Got: {get_tags}")
            return False
        
        print(f"   ✅ PASS: Tags field correctly returned in GET: {get_tags}")
        print(f"   Company: {created_customer.get('companyName')}")
        print(f"   Tags: {', '.join(get_tags)}")
        
        # TEST 3: PUT /api/customers/{id} - Update tags field
        print("\n" + "=" * 60)
        print("TEST 3: PUT /api/customers/{id} - Update customer tags field")
        print("=" * 60)
        
        update_endpoint = f"{endpoint}/{created_customer_id}"
        print(f"Update endpoint: {update_endpoint}")
        
        # New tags for update
        updated_tags = ["TEKNOLOJI", "YAZILIM", "İHRACAT", "YENİLİK"]
        update_data = {
            "companyName": "Etiket Test Şirketi A.Ş. (Updated)",
            "tags": updated_tags
        }
        
        print(f"   Original tags: {expected_tags}")
        print(f"   Updated tags: {updated_tags}")
        
        print("\n1. Making PUT request to update customer tags...")
        put_response = requests.put(update_endpoint, json=update_data, timeout=30)
        
        print(f"   Status Code: {put_response.status_code}")
        if put_response.status_code == 200:
            print("   ✅ PASS: Customer update with tags responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {put_response.status_code}")
            print(f"   Response: {put_response.text}")
            return False
        
        # Parse PUT response
        print("\n2. Parsing PUT response...")
        try:
            put_data = put_response.json()
            print(f"   Response type: {type(put_data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # TEST CRITICAL: Verify updated tags field
        print("\n3. Verifying updated tags field...")
        updated_response_tags = put_data.get("tags")
        
        if updated_response_tags is None:
            print("   ❌ FAIL: Tags field is missing from PUT response")
            return False
        
        if not isinstance(updated_response_tags, list):
            print(f"   ❌ FAIL: Tags should be a list, got {type(updated_response_tags)}")
            return False
        
        if updated_response_tags != updated_tags:
            print(f"   ❌ FAIL: Updated tags mismatch. Expected: {updated_tags}, Got: {updated_response_tags}")
            return False
        
        print(f"   ✅ PASS: Tags field correctly updated: {updated_response_tags}")
        print(f"   Updated company name: {put_data.get('companyName')}")
        print(f"   Updated tags count: {len(updated_response_tags)}")
        print(f"   Updated tags: {', '.join(updated_response_tags)}")
        
        # Verify other fields were updated too
        print("\n4. Verifying other updated fields...")
        if put_data.get("companyName") != update_data["companyName"]:
            print(f"   ❌ FAIL: Company name not updated correctly")
            return False
        
        print("   ✅ PASS: All updated fields are correct")
        
        # TEST 4: GET specific customer to double-check tags persistence
        print("\n" + "=" * 60)
        print("TEST 4: GET /api/customers/{id} - Verify tags persistence")
        print("=" * 60)
        
        specific_endpoint = f"{endpoint}/{created_customer_id}"
        print(f"Specific customer endpoint: {specific_endpoint}")
        
        print("\n1. Making GET request for specific customer...")
        specific_response = requests.get(specific_endpoint, timeout=30)
        
        print(f"   Status Code: {specific_response.status_code}")
        if specific_response.status_code == 200:
            print("   ✅ PASS: GET specific customer responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {specific_response.status_code}")
            return False
        
        # Parse specific GET response
        print("\n2. Parsing specific GET response...")
        try:
            specific_data = specific_response.json()
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Final verification of tags persistence
        print("\n3. Final verification of tags persistence...")
        final_tags = specific_data.get("tags")
        
        if final_tags != updated_tags:
            print(f"   ❌ FAIL: Tags not persisted correctly. Expected: {updated_tags}, Got: {final_tags}")
            return False
        
        print(f"   ✅ PASS: Tags correctly persisted: {final_tags}")
        
        # FINAL SUMMARY
        print("\n" + "=" * 80)
        print("🎉 CUSTOMER TAGS FUNCTIONALITY TEST RESULTS")
        print("=" * 80)
        print("✅ POST /api/customers - Customer creation with tags field: WORKING")
        print("✅ GET /api/customers - Tags field returned in list: WORKING")
        print("✅ PUT /api/customers/{id} - Tags field update: WORKING")
        print("✅ GET /api/customers/{id} - Tags persistence verification: WORKING")
        print("\n🏷️  TAGS FIELD FUNCTIONALITY: FULLY OPERATIONAL")
        print(f"   ✓ Tags stored as array: {type(final_tags).__name__}")
        print(f"   ✓ Tags count: {len(final_tags)}")
        print(f"   ✓ Final tags: {', '.join(final_tags)}")
        print(f"   ✓ Customer: {specific_data.get('companyName')}")
        print(f"   ✓ Customer ID: {created_customer_id}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False
    
    finally:
        # Cleanup: Delete the test customer
        if created_customer_id:
            print(f"\n🧹 Cleaning up test customer: {created_customer_id}")
            try:
                delete_endpoint = f"{endpoint}/{created_customer_id}"
                delete_response = requests.delete(delete_endpoint, timeout=30)
                if delete_response.status_code == 200:
                    print("   ✅ Test customer cleaned up successfully")
                else:
                    print(f"   ⚠️  Warning: Could not clean up test customer (status: {delete_response.status_code})")
            except Exception as e:
                print(f"   ⚠️  Warning: Error during cleanup: {str(e)}")

def main():
    """Run Customer CRUD tests with focus on tags field functionality"""
    print("🏷️  MÜŞTERİ CRUD ENDPOINTS - TAGS FIELD TESTİ")
    print("=" * 80)
    print("Müşteri CRUD endpoints'ini test et ve yeni eklenen 'tags' alanının çalışıp çalışmadığını kontrol et")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test başlangıç zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n🎯 TEST EDİLECEK SENARYOLAR:")
    print("1. POST /api/customers - Yeni müşteri oluştur (tags alanı ile birlikte)")
    print("2. GET /api/customers - Tüm müşterileri getir (tags alanının dönüp dönmediğini kontrol et)")
    print("3. PUT /api/customers/{id} - Müşteriyi güncelle (tags alanını değiştir)")
    
    print("\n📋 TEST VERİSİ:")
    print("• companyName: 'Etiket Test Şirketi A.Ş.'")
    print("• relationshipType: 'customer'")
    print("• email: 'test@etikettest.com'")
    print("• country: 'TR'")
    print("• sector: 'Teknoloji'")
    print("• tags: ['TEKNOLOJI', 'SANAYI', 'İHRACAT']")
    
    print("\n✅ BEKLENİLEN SONUÇLAR:")
    print("• POST request başarılı olmalı ve tags alanı kaydedilmeli")
    print("• GET request'te tags alanı dönmeli")
    print("• PUT request ile tags güncellenebilmeli")
    print("• Tags array olarak saklanmalı ve geri dönmeli")
    
    # Run the main tags functionality test
    print("\n" + "=" * 80)
    print("🏷️  CUSTOMER TAGS FIELD FUNCTIONALITY TEST")
    print("=" * 80)
    
    tags_test_passed = test_customer_tags_functionality()
    
    # Final summary
    print("\n" + "=" * 80)
    print("📊 FINAL TEST SUMMARY")
    print("=" * 80)
    
    if tags_test_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Customer tags field functionality is working correctly")
        print("✅ Backend supports tags field in all CRUD operations")
        print("✅ Tags are properly stored and retrieved as arrays")
        print("✅ Tags field updates work correctly")
        
        print("\n🔍 DETAILED RESULTS:")
        print("• POST /api/customers with tags: ✅ WORKING")
        print("• GET /api/customers returns tags: ✅ WORKING")
        print("• PUT /api/customers updates tags: ✅ WORKING")
        print("• Tags persistence verification: ✅ WORKING")
        
        print("\n🏷️  TAGS FIELD IMPLEMENTATION: FULLY FUNCTIONAL")
        return 0
    else:
        print("❌ TESTS FAILED!")
        print("❌ Customer tags field functionality has issues")
        print("❌ Backend may not properly support tags field")
        
        print("\n🔍 ISSUES FOUND:")
        print("• Check backend Customer model for tags field")
        print("• Verify tags field is included in CRUD operations")
        print("• Ensure tags are stored as array type")
        print("• Check database schema for tags field")
        
        print("\n🏷️  TAGS FIELD IMPLEMENTATION: NEEDS ATTENTION")
        return 1

if __name__ == "__main__":
    sys.exit(main())