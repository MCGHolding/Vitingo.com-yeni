#!/usr/bin/env python3

import requests
import json

BACKEND_URL = "https://banktrans.preview.emergentagent.com"

def verify_update_issue():
    """Verify the update issue by checking database state"""
    
    print("🔍 VERIFYING UPDATE ISSUE")
    print("=" * 40)
    
    # Create a center
    print("\n1. Creating center...")
    create_data = {
        "name": "Original Name",
        "country": "Türkiye",
        "city": "Ankara",
        "address": "Original Address",
        "website": "https://original.com"
    }
    
    create_response = requests.post(f"{BACKEND_URL}/api/library/convention-centers", json=create_data)
    if create_response.status_code == 200:
        created_center = create_response.json()
        original_id = created_center.get("id")
        print(f"✅ Created center ID: {original_id}")
        print(f"Original name: {created_center.get('name')}")
        
        # Update the center
        print(f"\n2. Updating center...")
        update_data = {
            "name": "Updated Name",
            "country": "Türkiye", 
            "city": "Ankara",
            "address": "Updated Address",
            "website": "https://updated.com"
        }
        
        update_response = requests.put(f"{BACKEND_URL}/api/library/convention-centers/{original_id}", json=update_data)
        print(f"Update Status: {update_response.status_code}")
        
        if update_response.status_code == 200:
            update_result = update_response.json()
            response_id = update_result.get("id")
            print(f"Response ID: {response_id}")
            print(f"Response name: {update_result.get('name')}")
            print(f"ID changed: {original_id != response_id}")
            
            # Check what's actually in the database
            print(f"\n3. Checking database state...")
            get_response = requests.get(f"{BACKEND_URL}/api/library/convention-centers")
            if get_response.status_code == 200:
                centers = get_response.json()
                
                original_found = False
                response_found = False
                
                for center in centers:
                    center_id = center.get("id")
                    center_name = center.get("name")
                    
                    if center_id == original_id:
                        original_found = True
                        print(f"✅ Original ID {original_id} found with name: {center_name}")
                    
                    if center_id == response_id:
                        response_found = True
                        print(f"✅ Response ID {response_id} found with name: {center_name}")
                
                if not original_found:
                    print(f"❌ Original ID {original_id} not found in database")
                if not response_found:
                    print(f"❌ Response ID {response_id} not found in database")
                
                # Try to delete using original ID
                print(f"\n4. Testing delete with original ID...")
                delete_response = requests.delete(f"{BACKEND_URL}/api/library/convention-centers/{original_id}")
                print(f"Delete Status: {delete_response.status_code}")
                print(f"Delete Response: {delete_response.text}")
        
    else:
        print(f"❌ Create failed: {create_response.status_code}")

if __name__ == "__main__":
    verify_update_issue()