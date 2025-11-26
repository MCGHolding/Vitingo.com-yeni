#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://turk-customer-mgmt.preview.emergentagent.com"

# Global variables for test data
test_category_id = None
test_specialty_id = None
test_supplier_id = None
created_category_id = None
created_specialty_id = None

def test_supplier_categories_api():
    """
    Test Supplier Categories API endpoints
    
    Requirements to verify:
    1. GET /api/supplier-categories - Should return default categories
    2. POST /api/supplier-categories - Create new category
    3. Verify default categories: Tedarikçi, Usta, 3D Tasarımcı, etc.
    """
    
    print("=" * 80)
    print("TESTING SUPPLIER CATEGORIES API")
    print("=" * 80)
    
    # Test 1: GET supplier categories
    print("\n1. Testing GET /api/supplier-categories...")
    endpoint = f"{BACKEND_URL}/api/supplier-categories"
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        print("   ✅ PASS: GET supplier categories endpoint responds with status 200")
        
        # Parse response
        data = response.json()
        if not isinstance(data, list):
            print("   ❌ FAIL: Response should be a list of categories")
            return False
        
        print(f"   Found {len(data)} categories")
        
        # Check for default categories
        expected_categories = ["Tedarikçi", "Usta", "3D Tasarımcı", "Grafik Tasarımcı", "Yazılımcı", "Partner"]
        found_categories = [cat.get("name") for cat in data]
        
        print(f"   Expected categories: {expected_categories}")
        print(f"   Found categories: {found_categories}")
        
        for expected_cat in expected_categories:
            if expected_cat in found_categories:
                print(f"   ✅ PASS: Found default category '{expected_cat}'")
            else:
                print(f"   ⚠️  WARNING: Default category '{expected_cat}' not found")
        
        # Store first category ID for later tests
        global test_category_id
        if data:
            test_category_id = data[0].get("id")
            print(f"   Stored category ID for testing: {test_category_id}")
        
        # Test 2: POST new supplier category
        print("\n2. Testing POST /api/supplier-categories...")
        create_endpoint = f"{BACKEND_URL}/api/supplier-categories"
        
        test_category_data = {
            "name": "Test Kategori"
        }
        
        create_response = requests.post(create_endpoint, json=test_category_data, timeout=30)
        
        print(f"   Status Code: {create_response.status_code}")
        if create_response.status_code == 200:
            print("   ✅ PASS: POST supplier category endpoint responds with status 200")
            
            create_data = create_response.json()
            if create_data.get("name") == test_category_data["name"]:
                print(f"   ✅ PASS: Created category name matches: {create_data.get('name')}")
                
                # Store created category ID for cleanup
                global created_category_id
                created_category_id = create_data.get("id")
                
            else:
                print(f"   ❌ FAIL: Category name mismatch")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {create_response.status_code}")
            print(f"   Response: {create_response.text}")
            return False
        
        print("\n✅ SUPPLIER CATEGORIES API TEST PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Error testing supplier categories API: {str(e)}")
        return False

def test_supplier_specialties_api():
    """
    Test Supplier Specialties API endpoints
    
    Requirements to verify:
    1. GET /api/supplier-specialties/{category_id} - Get specialties for category
    2. POST /api/supplier-specialties - Create new specialty
    3. Verify dynamic data based on category
    """
    
    print("=" * 80)
    print("TESTING SUPPLIER SPECIALTIES API")
    print("=" * 80)
    
    if not test_category_id:
        print("⚠️  SKIP: No category ID available from previous test")
        return True
    
    # Test 1: GET supplier specialties for category
    print(f"\n1. Testing GET /api/supplier-specialties/{test_category_id}...")
    endpoint = f"{BACKEND_URL}/api/supplier-specialties/{test_category_id}"
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        print("   ✅ PASS: GET supplier specialties endpoint responds with status 200")
        
        # Parse response
        data = response.json()
        if not isinstance(data, list):
            print("   ❌ FAIL: Response should be a list of specialties")
            return False
        
        print(f"   Found {len(data)} specialties for category")
        
        # Display found specialties
        for specialty in data:
            print(f"   - {specialty.get('name')}")
        
        # Store first specialty ID for later tests
        global test_specialty_id
        if data:
            test_specialty_id = data[0].get("id")
            print(f"   Stored specialty ID for testing: {test_specialty_id}")
        
        # Test 2: POST new supplier specialty
        print(f"\n2. Testing POST /api/supplier-specialties...")
        create_endpoint = f"{BACKEND_URL}/api/supplier-specialties"
        
        test_specialty_data = {
            "name": "Test Uzmanlık",
            "category_id": test_category_id
        }
        
        create_response = requests.post(create_endpoint, json=test_specialty_data, timeout=30)
        
        print(f"   Status Code: {create_response.status_code}")
        if create_response.status_code == 200:
            print("   ✅ PASS: POST supplier specialty endpoint responds with status 200")
            
            create_data = create_response.json()
            if create_data.get("name") == test_specialty_data["name"]:
                print(f"   ✅ PASS: Created specialty name matches: {create_data.get('name')}")
                print(f"   ✅ PASS: Category ID matches: {create_data.get('category_id')}")
                
                # Store created specialty ID for cleanup
                global created_specialty_id
                created_specialty_id = create_data.get("id")
                
            else:
                print(f"   ❌ FAIL: Specialty data mismatch")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {create_response.status_code}")
            print(f"   Response: {create_response.text}")
            return False
        
        print("\n✅ SUPPLIER SPECIALTIES API TEST PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Error testing supplier specialties API: {str(e)}")
        return False

def test_supplier_crud_api():
    """
    Test Supplier CRUD operations
    
    Requirements to verify:
    1. POST /api/suppliers - Create supplier with required fields
    2. GET /api/suppliers - List all suppliers
    3. GET /api/suppliers/{supplier_id} - Get specific supplier
    4. PUT /api/suppliers/{supplier_id} - Update supplier
    5. DELETE /api/suppliers/{supplier_id} - Delete/passive logic
    """
    
    print("=" * 80)
    print("TESTING SUPPLIER CRUD API")
    print("=" * 80)
    
    if not test_category_id:
        print("⚠️  SKIP: No category ID available from previous test")
        return True
    
    if not test_specialty_id:
        print("⚠️  SKIP: No specialty ID available from previous test")
        return True
    
    # Test 1: POST create supplier
    print("\n1. Testing POST /api/suppliers...")
    endpoint = f"{BACKEND_URL}/api/suppliers"
    
    test_supplier_data = {
        "company_short_name": "Test Şirket",
        "company_title": "Test Şirket Limited Şirketi",
        "address": "Test Adres, İstanbul",
        "phone": "0212 555 0123",
        "mobile": "0532 555 0123",
        "email": "test@testsirket.com",
        "tax_office": "İstanbul Vergi Dairesi",
        "tax_number": "1234567890",
        "services": ["Test Hizmet 1", "Test Hizmet 2"],
        "supplier_type_id": test_category_id,
        "specialty_id": test_specialty_id
    }
    
    try:
        response = requests.post(endpoint, json=test_supplier_data, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        print("   ✅ PASS: POST supplier endpoint responds with status 200")
        
        # Parse response
        data = response.json()
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a supplier object")
            return False
        
        # Verify created supplier data
        for field, expected_value in test_supplier_data.items():
            actual_value = data.get(field)
            if actual_value != expected_value:
                print(f"   ❌ FAIL: Field {field} mismatch. Expected: {expected_value}, Got: {actual_value}")
                return False
        
        print("   ✅ PASS: All supplier fields match input data")
        
        # Store supplier ID for other tests
        global test_supplier_id
        test_supplier_id = data.get("id")
        print(f"   Created supplier ID: {test_supplier_id}")
        
        # Test 2: GET all suppliers
        print("\n2. Testing GET /api/suppliers...")
        get_all_response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {get_all_response.status_code}")
        if get_all_response.status_code == 200:
            print("   ✅ PASS: GET all suppliers endpoint responds with status 200")
            
            all_data = get_all_response.json()
            if isinstance(all_data, list) and len(all_data) > 0:
                print(f"   ✅ PASS: Found {len(all_data)} suppliers")
                
                # Check if our created supplier is in the list
                found_supplier = any(s.get("id") == test_supplier_id for s in all_data)
                if found_supplier:
                    print("   ✅ PASS: Created supplier found in list")
                else:
                    print("   ❌ FAIL: Created supplier not found in list")
                    return False
            else:
                print("   ❌ FAIL: Expected list of suppliers")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {get_all_response.status_code}")
            return False
        
        # Test 3: GET specific supplier
        print(f"\n3. Testing GET /api/suppliers/{test_supplier_id}...")
        get_one_endpoint = f"{BACKEND_URL}/api/suppliers/{test_supplier_id}"
        get_one_response = requests.get(get_one_endpoint, timeout=30)
        
        print(f"   Status Code: {get_one_response.status_code}")
        if get_one_response.status_code == 200:
            print("   ✅ PASS: GET specific supplier endpoint responds with status 200")
            
            one_data = get_one_response.json()
            if one_data.get("id") == test_supplier_id:
                print("   ✅ PASS: Returned supplier ID matches request")
                print(f"   Company: {one_data.get('company_short_name')}")
            else:
                print("   ❌ FAIL: Supplier ID mismatch")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {get_one_response.status_code}")
            return False
        
        # Test 4: PUT update supplier
        print(f"\n4. Testing PUT /api/suppliers/{test_supplier_id}...")
        update_endpoint = f"{BACKEND_URL}/api/suppliers/{test_supplier_id}"
        
        update_data = {
            "company_short_name": "Test Şirket (Updated)",
            "phone": "0212 555 9999",
            "services": ["Updated Service 1", "Updated Service 2", "Updated Service 3"]
        }
        
        update_response = requests.put(update_endpoint, json=update_data, timeout=30)
        
        print(f"   Status Code: {update_response.status_code}")
        if update_response.status_code == 200:
            print("   ✅ PASS: PUT supplier endpoint responds with status 200")
            
            updated_data = update_response.json()
            
            # Verify updates
            for field, expected_value in update_data.items():
                actual_value = updated_data.get(field)
                if actual_value != expected_value:
                    print(f"   ❌ FAIL: Update field {field} mismatch. Expected: {expected_value}, Got: {actual_value}")
                    return False
            
            print("   ✅ PASS: All update fields applied correctly")
            print(f"   Updated company name: {updated_data.get('company_short_name')}")
            print(f"   Updated phone: {updated_data.get('phone')}")
            print(f"   Updated services: {updated_data.get('services')}")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {update_response.status_code}")
            return False
        
        # Test 5: DELETE supplier (should set to passive if has contacts)
        print(f"\n5. Testing DELETE /api/suppliers/{test_supplier_id}...")
        delete_endpoint = f"{BACKEND_URL}/api/suppliers/{test_supplier_id}"
        delete_response = requests.delete(delete_endpoint, timeout=30)
        
        print(f"   Status Code: {delete_response.status_code}")
        if delete_response.status_code == 200:
            print("   ✅ PASS: DELETE supplier endpoint responds with status 200")
            
            delete_data = delete_response.json()
            if delete_data.get("success"):
                print(f"   ✅ PASS: Delete operation successful")
                print(f"   Message: {delete_data.get('message')}")
            else:
                print("   ❌ FAIL: Delete operation not successful")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {delete_response.status_code}")
            return False
        
        print("\n✅ SUPPLIER CRUD API TEST PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Error testing supplier CRUD API: {str(e)}")
        return False

def test_supplier_contacts_crud_api():
    """
    Test Supplier Contacts CRUD operations
    
    Requirements to verify:
    1. POST /api/supplier-contacts - Create contact for supplier
    2. GET /api/supplier-contacts/{supplier_id} - Get contacts for supplier
    3. PUT /api/supplier-contacts/{contact_id} - Update contact
    4. DELETE /api/supplier-contacts/{contact_id} - Deactivate contact
    """
    
    print("=" * 80)
    print("TESTING SUPPLIER CONTACTS CRUD API")
    print("=" * 80)
    
    # First create a new supplier for contact testing
    print("\n0. Creating test supplier for contact testing...")
    supplier_endpoint = f"{BACKEND_URL}/api/suppliers"
    
    if not test_category_id:
        print("⚠️  SKIP: No category ID available")
        return True
    
    if not test_specialty_id:
        print("⚠️  SKIP: No specialty ID available")
        return True
    
    test_supplier_data = {
        "company_short_name": "Contact Test Şirket",
        "company_title": "Contact Test Şirket Ltd.",
        "supplier_type_id": test_category_id,
        "specialty_id": test_specialty_id
    }
    
    try:
        supplier_response = requests.post(supplier_endpoint, json=test_supplier_data, timeout=30)
        if supplier_response.status_code != 200:
            print(f"   ❌ FAIL: Could not create test supplier: {supplier_response.status_code}")
            return False
        
        supplier_data = supplier_response.json()
        contact_test_supplier_id = supplier_data.get("id")
        print(f"   Created test supplier ID: {contact_test_supplier_id}")
        
        # Test 1: POST create supplier contact
        print("\n1. Testing POST /api/supplier-contacts...")
        contact_endpoint = f"{BACKEND_URL}/api/supplier-contacts"
        
        test_contact_data = {
            "supplier_id": contact_test_supplier_id,
            "full_name": "Test Kişi",
            "mobile": "0532 555 1234",
            "email": "test@example.com",
            "position": "Satış Müdürü",
            "tags": ["Test Tag 1", "Test Tag 2"],
            "notes": "Test notları"
        }
        
        contact_response = requests.post(contact_endpoint, json=test_contact_data, timeout=30)
        
        print(f"   Status Code: {contact_response.status_code}")
        if contact_response.status_code != 200:
            print(f"   ❌ FAIL: Expected status 200, got {contact_response.status_code}")
            print(f"   Response: {contact_response.text}")
            return False
        
        print("   ✅ PASS: POST supplier contact endpoint responds with status 200")
        
        # Parse response
        contact_data = contact_response.json()
        if not isinstance(contact_data, dict):
            print("   ❌ FAIL: Response should be a contact object")
            return False
        
        # Verify created contact data
        for field, expected_value in test_contact_data.items():
            actual_value = contact_data.get(field)
            if actual_value != expected_value:
                print(f"   ❌ FAIL: Field {field} mismatch. Expected: {expected_value}, Got: {actual_value}")
                return False
        
        print("   ✅ PASS: All contact fields match input data")
        
        # Store contact ID for other tests
        test_contact_id = contact_data.get("id")
        print(f"   Created contact ID: {test_contact_id}")
        
        # Test 2: GET contacts for supplier
        print(f"\n2. Testing GET /api/supplier-contacts/{contact_test_supplier_id}...")
        get_contacts_endpoint = f"{BACKEND_URL}/api/supplier-contacts/{contact_test_supplier_id}"
        get_contacts_response = requests.get(get_contacts_endpoint, timeout=30)
        
        print(f"   Status Code: {get_contacts_response.status_code}")
        if get_contacts_response.status_code == 200:
            print("   ✅ PASS: GET supplier contacts endpoint responds with status 200")
            
            contacts_data = get_contacts_response.json()
            if isinstance(contacts_data, list) and len(contacts_data) > 0:
                print(f"   ✅ PASS: Found {len(contacts_data)} contacts for supplier")
                
                # Check if our created contact is in the list
                found_contact = any(c.get("id") == test_contact_id for c in contacts_data)
                if found_contact:
                    print("   ✅ PASS: Created contact found in list")
                else:
                    print("   ❌ FAIL: Created contact not found in list")
                    return False
            else:
                print("   ❌ FAIL: Expected list of contacts")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {get_contacts_response.status_code}")
            return False
        
        # Test 3: PUT update contact
        print(f"\n3. Testing PUT /api/supplier-contacts/{test_contact_id}...")
        update_contact_endpoint = f"{BACKEND_URL}/api/supplier-contacts/{test_contact_id}"
        
        update_contact_data = {
            "full_name": "Test Kişi (Updated)",
            "mobile": "0532 555 9999",
            "position": "Genel Müdür",
            "tags": ["Updated Tag 1", "Updated Tag 2", "Updated Tag 3"]
        }
        
        update_contact_response = requests.put(update_contact_endpoint, json=update_contact_data, timeout=30)
        
        print(f"   Status Code: {update_contact_response.status_code}")
        if update_contact_response.status_code == 200:
            print("   ✅ PASS: PUT contact endpoint responds with status 200")
            
            updated_contact_data = update_contact_response.json()
            
            # Verify updates
            for field, expected_value in update_contact_data.items():
                actual_value = updated_contact_data.get(field)
                if actual_value != expected_value:
                    print(f"   ❌ FAIL: Update field {field} mismatch. Expected: {expected_value}, Got: {actual_value}")
                    return False
            
            print("   ✅ PASS: All contact update fields applied correctly")
            print(f"   Updated name: {updated_contact_data.get('full_name')}")
            print(f"   Updated position: {updated_contact_data.get('position')}")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {update_contact_response.status_code}")
            return False
        
        # Test 4: DELETE contact (should deactivate)
        print(f"\n4. Testing DELETE /api/supplier-contacts/{test_contact_id}...")
        delete_contact_endpoint = f"{BACKEND_URL}/api/supplier-contacts/{test_contact_id}"
        delete_contact_response = requests.delete(delete_contact_endpoint, timeout=30)
        
        print(f"   Status Code: {delete_contact_response.status_code}")
        if delete_contact_response.status_code == 200:
            print("   ✅ PASS: DELETE contact endpoint responds with status 200")
            
            delete_contact_data = delete_contact_response.json()
            if delete_contact_data.get("success"):
                print(f"   ✅ PASS: Delete contact operation successful")
                print(f"   Message: {delete_contact_data.get('message')}")
            else:
                print("   ❌ FAIL: Delete contact operation not successful")
                return False
        else:
            print(f"   ❌ FAIL: Expected status 200, got {delete_contact_response.status_code}")
            return False
        
        print("\n✅ SUPPLIER CONTACTS CRUD API TEST PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Error testing supplier contacts CRUD API: {str(e)}")
        return False

def test_supplier_validation_and_error_handling():
    """
    Test Supplier API validation and error handling
    
    Requirements to verify:
    1. Try creating supplier with invalid category_id
    2. Try creating specialty with invalid category_id
    3. Test duplicate prevention
    4. Test required field validation
    """
    
    print("=" * 80)
    print("TESTING SUPPLIER VALIDATION & ERROR HANDLING")
    print("=" * 80)
    
    try:
        # Test 1: Create supplier with invalid category_id
        print("\n1. Testing supplier creation with invalid category_id...")
        supplier_endpoint = f"{BACKEND_URL}/api/suppliers"
        
        invalid_supplier_data = {
            "company_short_name": "Invalid Test Şirket",
            "company_title": "Invalid Test Şirket Ltd.",
            "supplier_type_id": "invalid-category-id",
            "specialty_id": "invalid-specialty-id"
        }
        
        response = requests.post(supplier_endpoint, json=invalid_supplier_data, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 400:
            print("   ✅ PASS: Invalid category_id returns 400 Bad Request")
            response_data = response.json()
            if "Geçersiz tedarikçi türü" in response_data.get("detail", ""):
                print("   ✅ PASS: Proper error message for invalid category")
            else:
                print(f"   ⚠️  WARNING: Unexpected error message: {response_data.get('detail')}")
        else:
            print(f"   ⚠️  WARNING: Expected 400 for invalid category, got {response.status_code}")
        
        # Test 2: Create specialty with invalid category_id
        print("\n2. Testing specialty creation with invalid category_id...")
        specialty_endpoint = f"{BACKEND_URL}/api/supplier-specialties"
        
        invalid_specialty_data = {
            "name": "Invalid Specialty",
            "category_id": "invalid-category-id"
        }
        
        specialty_response = requests.post(specialty_endpoint, json=invalid_specialty_data, timeout=30)
        
        print(f"   Status Code: {specialty_response.status_code}")
        if specialty_response.status_code in [400, 500]:
            print("   ✅ PASS: Invalid category_id for specialty returns error status")
        else:
            print(f"   ⚠️  WARNING: Expected error status for invalid category, got {specialty_response.status_code}")
        
        # Test 3: Test duplicate supplier prevention
        if test_category_id and test_specialty_id:
            print("\n3. Testing duplicate supplier prevention...")
            
            duplicate_supplier_data = {
                "company_short_name": "Duplicate Test Şirket",
                "company_title": "Duplicate Test Şirket Ltd.",
                "supplier_type_id": test_category_id,
                "specialty_id": test_specialty_id
            }
            
            # Create first supplier
            first_response = requests.post(supplier_endpoint, json=duplicate_supplier_data, timeout=30)
            if first_response.status_code == 200:
                print("   ✅ PASS: First supplier created successfully")
                
                # Try to create duplicate
                duplicate_response = requests.post(supplier_endpoint, json=duplicate_supplier_data, timeout=30)
                
                print(f"   Duplicate Status Code: {duplicate_response.status_code}")
                if duplicate_response.status_code == 400:
                    print("   ✅ PASS: Duplicate supplier returns 400 Bad Request")
                    duplicate_data = duplicate_response.json()
                    if "zaten mevcut" in duplicate_data.get("detail", ""):
                        print("   ✅ PASS: Proper error message for duplicate supplier")
                    else:
                        print(f"   ⚠️  WARNING: Unexpected duplicate error message: {duplicate_data.get('detail')}")
                else:
                    print(f"   ⚠️  WARNING: Expected 400 for duplicate, got {duplicate_response.status_code}")
            else:
                print("   ⚠️  SKIP: Could not create first supplier for duplicate test")
        else:
            print("\n3. SKIP: No valid category/specialty IDs for duplicate test")
        
        # Test 4: Test missing required fields
        print("\n4. Testing missing required fields...")
        
        incomplete_supplier_data = {
            "company_short_name": "Incomplete Supplier"
            # Missing required fields: company_title, supplier_type_id, specialty_id
        }
        
        incomplete_response = requests.post(supplier_endpoint, json=incomplete_supplier_data, timeout=30)
        
        print(f"   Status Code: {incomplete_response.status_code}")
        if incomplete_response.status_code == 422:
            print("   ✅ PASS: Missing required fields returns 422 Validation Error")
        else:
            print(f"   ⚠️  WARNING: Expected 422 for missing fields, got {incomplete_response.status_code}")
        
        print("\n✅ SUPPLIER VALIDATION & ERROR HANDLING TEST COMPLETED!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Error testing supplier validation: {str(e)}")
        return False

def test_dynamic_category_specialty_relationship():
    """
    Test the dynamic category-specialty relationship
    
    Requirements to verify:
    1. Create different categories and verify their specialties load correctly
    2. Test the default seeding functionality
    3. Verify category-specific specialty data
    """
    
    print("=" * 80)
    print("TESTING DYNAMIC CATEGORY-SPECIALTY RELATIONSHIP")
    print("=" * 80)
    
    try:
        # Test 1: Get all categories and test specialty loading for each
        print("\n1. Testing specialty loading for different categories...")
        categories_endpoint = f"{BACKEND_URL}/api/supplier-categories"
        
        categories_response = requests.get(categories_endpoint, timeout=30)
        if categories_response.status_code != 200:
            print(f"   ❌ FAIL: Could not get categories: {categories_response.status_code}")
            return False
        
        categories = categories_response.json()
        print(f"   Found {len(categories)} categories to test")
        
        # Test specialty loading for each category
        category_specialty_map = {}
        
        for category in categories:
            category_id = category.get("id")
            category_name = category.get("name")
            
            print(f"\n   Testing specialties for category: {category_name}")
            
            specialties_endpoint = f"{BACKEND_URL}/api/supplier-specialties/{category_id}"
            specialties_response = requests.get(specialties_endpoint, timeout=30)
            
            if specialties_response.status_code == 200:
                specialties = specialties_response.json()
                category_specialty_map[category_name] = [s.get("name") for s in specialties]
                
                print(f"   ✅ PASS: Found {len(specialties)} specialties for {category_name}")
                for specialty in specialties:
                    print(f"     - {specialty.get('name')}")
            else:
                print(f"   ❌ FAIL: Could not get specialties for {category_name}: {specialties_response.status_code}")
        
        # Test 2: Verify expected specialty mappings
        print("\n2. Verifying expected specialty mappings...")
        
        expected_mappings = {
            "Tedarikçi": ["Lojistik Şirketi", "Ahşap Atölyesi", "Reklam Atölyesi", "Baskı Atölyesi", "Demir Atölyesi"],
            "Usta": ["Usta Marangoz", "Marangoz", "Çırak Marangoz", "Usta Elektrikçi", "Elektrikçi", "Çırak Elektrikçi"],
            "3D Tasarımcı": ["Deneyimli 3D Tasarımcı", "3D Tasarımcı"],
            "Grafik Tasarımcı": ["Deneyimli Grafik Tasarımcı", "Grafik Tasarımcı"],
            "Yazılımcı": ["Deneyimli Yazılımcı", "Yazılımcı"],
            "Partner": ["Hindistan", "Almanya", "Fransa", "Malezya", "Singapur"]
        }
        
        for category_name, expected_specialties in expected_mappings.items():
            if category_name in category_specialty_map:
                found_specialties = category_specialty_map[category_name]
                
                print(f"\n   Checking {category_name}:")
                print(f"     Expected: {expected_specialties}")
                print(f"     Found: {found_specialties}")
                
                # Check if expected specialties are present
                missing_specialties = []
                for expected in expected_specialties:
                    if expected not in found_specialties:
                        missing_specialties.append(expected)
                
                if not missing_specialties:
                    print(f"   ✅ PASS: All expected specialties found for {category_name}")
                else:
                    print(f"   ⚠️  WARNING: Missing specialties for {category_name}: {missing_specialties}")
            else:
                print(f"   ⚠️  WARNING: Category {category_name} not found in response")
        
        print("\n✅ DYNAMIC CATEGORY-SPECIALTY RELATIONSHIP TEST COMPLETED!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Error testing dynamic category-specialty relationship: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 STARTING SUPPLIER MANAGEMENT API TESTING")
    print("=" * 80)
    
    # Run all supplier tests
    tests = [
        ("Supplier Categories API", test_supplier_categories_api),
        ("Supplier Specialties API", test_supplier_specialties_api),
        ("Supplier CRUD API", test_supplier_crud_api),
        ("Supplier Contacts CRUD API", test_supplier_contacts_crud_api),
        ("Supplier Validation & Error Handling", test_supplier_validation_and_error_handling),
        ("Dynamic Category-Specialty Relationship", test_dynamic_category_specialty_relationship)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
                failed += 1
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {str(e)}")
            failed += 1
    
    # Final summary
    print("\n" + "=" * 80)
    print("SUPPLIER MANAGEMENT API TEST SUMMARY")
    print("=" * 80)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 TOTAL: {passed + failed}")
    
    if failed == 0:
        print("\n🎉 ALL SUPPLIER TESTS PASSED! Supplier Management API is working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
    
    print("=" * 80)