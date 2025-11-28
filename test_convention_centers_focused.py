#!/usr/bin/env python3

import requests
import json

BACKEND_URL = "https://docwizard-2.preview.emergentagent.com"

def test_convention_centers_focused():
    """Focused test of convention centers with better error handling"""
    
    print("🏢 FOCUSED CONVENTION CENTERS API TEST")
    print("=" * 50)
    
    # Test 1: Create
    print("\n1. CREATE TEST")
    create_data = {
        "name": "Test Convention Center",
        "country": "Türkiye",
        "city": "Ankara", 
        "address": "Test Address",
        "website": "https://test.com"
    }
    
    create_response = requests.post(f"{BACKEND_URL}/api/library/convention-centers", json=create_data)
    print(f"Create Status: {create_response.status_code}")
    
    if create_response.status_code == 200:
        created_center = create_response.json()
        center_id = created_center.get("id")
        print(f"✅ Created center ID: {center_id}")
        
        # Test 2: Update
        print(f"\n2. UPDATE TEST")
        update_data = {
            "name": "Updated Test Convention Center",
            "country": "Türkiye",
            "city": "Ankara",
            "address": "Updated Address", 
            "website": "https://updated.com"
        }
        
        update_response = requests.put(f"{BACKEND_URL}/api/library/convention-centers/{center_id}", json=update_data)
        print(f"Update Status: {update_response.status_code}")
        print(f"Update Response: {update_response.text}")
        
        if update_response.status_code == 200:
            print("✅ Update successful")
            updated_center = update_response.json()
            print(f"Updated name: {updated_center.get('name')}")
        else:
            print(f"❌ Update failed")
        
        # Test 3: Verify still exists after update
        print(f"\n3. VERIFY EXISTENCE AFTER UPDATE")
        get_response = requests.get(f"{BACKEND_URL}/api/library/convention-centers")
        if get_response.status_code == 200:
            centers = get_response.json()
            found = False
            for center in centers:
                if center.get("id") == center_id:
                    found = True
                    print(f"✅ Center still exists: {center.get('name')}")
                    break
            if not found:
                print("❌ Center disappeared after update!")
        
        # Test 4: Delete
        print(f"\n4. DELETE TEST")
        delete_response = requests.delete(f"{BACKEND_URL}/api/library/convention-centers/{center_id}")
        print(f"Delete Status: {delete_response.status_code}")
        print(f"Delete Response: {delete_response.text}")
        
        if delete_response.status_code == 200:
            print("✅ Delete successful")
        else:
            print(f"❌ Delete failed")
            
        # Test 5: Verify deletion
        print(f"\n5. VERIFY DELETION")
        verify_response = requests.get(f"{BACKEND_URL}/api/library/convention-centers")
        if verify_response.status_code == 200:
            centers = verify_response.json()
            found = False
            for center in centers:
                if center.get("id") == center_id:
                    found = True
                    break
            if not found:
                print("✅ Center successfully deleted")
            else:
                print("❌ Center still exists after delete")
    else:
        print(f"❌ Create failed: {create_response.status_code}")

if __name__ == "__main__":
    test_convention_centers_focused()