#!/usr/bin/env python3

import requests
import json

BACKEND_URL = "https://payday-manager-7.preview.emergentagent.com"

def debug_convention_centers():
    """Debug the convention centers DELETE issue"""
    
    print("🔍 DEBUGGING CONVENTION CENTERS DELETE ISSUE")
    print("=" * 60)
    
    # Step 1: Create a test center
    print("\n1. Creating a test center...")
    create_data = {
        "name": "Debug Test Center",
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
        print(f"Created center ID: {center_id}")
        
        # Step 2: Verify it exists
        print(f"\n2. Verifying center exists...")
        get_response = requests.get(f"{BACKEND_URL}/api/library/convention-centers")
        if get_response.status_code == 200:
            centers = get_response.json()
            found = False
            for center in centers:
                if center.get("id") == center_id:
                    found = True
                    print(f"✅ Center found in list: {center.get('name')}")
                    break
            if not found:
                print("❌ Center not found in list!")
        
        # Step 3: Try to delete it
        print(f"\n3. Attempting to delete center...")
        delete_response = requests.delete(f"{BACKEND_URL}/api/library/convention-centers/{center_id}")
        print(f"Delete Status: {delete_response.status_code}")
        print(f"Delete Response: {delete_response.text}")
        
        if delete_response.status_code == 200:
            print("✅ Delete successful")
            
            # Step 4: Verify it's gone
            print(f"\n4. Verifying center is deleted...")
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
            print(f"❌ Delete failed: {delete_response.status_code}")
            print(f"Response: {delete_response.text}")
    else:
        print(f"❌ Create failed: {create_response.status_code}")
        print(f"Response: {create_response.text}")

if __name__ == "__main__":
    debug_convention_centers()