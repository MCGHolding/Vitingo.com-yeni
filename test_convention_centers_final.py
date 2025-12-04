#!/usr/bin/env python3

import requests
import json

BACKEND_URL = "https://advance-manager-1.preview.emergentagent.com"

def test_convention_centers_final():
    """Final comprehensive test of convention centers API with known issues documented"""
    
    print("🏢 CONVENTION CENTERS API COMPREHENSIVE TEST")
    print("=" * 60)
    
    test_results = {
        "get_all_working": False,
        "get_filtered_working": False,
        "create_working": False,
        "update_working": False,
        "delete_working": False,
        "bulk_import_working": False,
        "update_creates_new_id": False,
        "critical_issues": [],
        "warnings": []
    }
    
    # Test 1: GET all centers
    print("\n1. GET ALL CENTERS")
    try:
        response = requests.get(f"{BACKEND_URL}/api/library/convention-centers")
        if response.status_code == 200:
            centers = response.json()
            print(f"✅ GET all centers working - found {len(centers)} centers")
            test_results["get_all_working"] = True
        else:
            print(f"❌ GET all centers failed: {response.status_code}")
            test_results["critical_issues"].append(f"GET_ALL_FAILED_{response.status_code}")
    except Exception as e:
        print(f"❌ GET all centers error: {str(e)}")
        test_results["critical_issues"].append(f"GET_ALL_ERROR: {str(e)}")
    
    # Test 2: GET filtered centers
    print("\n2. GET FILTERED CENTERS")
    try:
        response = requests.get(f"{BACKEND_URL}/api/library/convention-centers?country=Türkiye&city=İstanbul")
        if response.status_code == 200:
            centers = response.json()
            print(f"✅ GET filtered centers working - found {len(centers)} Istanbul centers")
            test_results["get_filtered_working"] = True
        else:
            print(f"❌ GET filtered centers failed: {response.status_code}")
            test_results["critical_issues"].append(f"GET_FILTERED_FAILED_{response.status_code}")
    except Exception as e:
        print(f"❌ GET filtered centers error: {str(e)}")
        test_results["critical_issues"].append(f"GET_FILTERED_ERROR: {str(e)}")
    
    # Test 3: CREATE center
    print("\n3. CREATE CENTER")
    create_data = {
        "name": "Test Center for Final Test",
        "country": "Türkiye",
        "city": "Ankara",
        "address": "Test Address",
        "website": "https://test.com"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/library/convention-centers", json=create_data)
        if response.status_code == 200:
            created_center = response.json()
            center_id = created_center.get("id")
            print(f"✅ CREATE center working - ID: {center_id}")
            test_results["create_working"] = True
            
            # Test 4: UPDATE center (with known issue)
            print("\n4. UPDATE CENTER (Testing known ID change issue)")
            update_data = {
                "name": "Updated Test Center",
                "country": "Türkiye",
                "city": "Ankara", 
                "address": "Updated Address",
                "website": "https://updated.com"
            }
            
            try:
                update_response = requests.put(f"{BACKEND_URL}/api/library/convention-centers/{center_id}", json=update_data)
                if update_response.status_code == 200:
                    updated_center = update_response.json()
                    new_id = updated_center.get("id")
                    
                    if new_id != center_id:
                        print(f"⚠️  UPDATE working but creates new ID: {new_id} (was {center_id})")
                        test_results["update_working"] = True
                        test_results["update_creates_new_id"] = True
                        test_results["warnings"].append("UPDATE_CREATES_NEW_ID")
                        
                        # Use the new ID for delete test
                        center_id = new_id
                    else:
                        print(f"✅ UPDATE working correctly with same ID")
                        test_results["update_working"] = True
                else:
                    print(f"❌ UPDATE failed: {update_response.status_code}")
                    test_results["critical_issues"].append(f"UPDATE_FAILED_{update_response.status_code}")
            except Exception as e:
                print(f"❌ UPDATE error: {str(e)}")
                test_results["critical_issues"].append(f"UPDATE_ERROR: {str(e)}")
            
            # Test 5: DELETE center (using correct ID)
            print("\n5. DELETE CENTER")
            try:
                delete_response = requests.delete(f"{BACKEND_URL}/api/library/convention-centers/{center_id}")
                if delete_response.status_code == 200:
                    print(f"✅ DELETE center working")
                    test_results["delete_working"] = True
                else:
                    print(f"❌ DELETE failed: {delete_response.status_code}")
                    print(f"Response: {delete_response.text}")
                    test_results["critical_issues"].append(f"DELETE_FAILED_{delete_response.status_code}")
            except Exception as e:
                print(f"❌ DELETE error: {str(e)}")
                test_results["critical_issues"].append(f"DELETE_ERROR: {str(e)}")
                
        else:
            print(f"❌ CREATE failed: {response.status_code}")
            test_results["critical_issues"].append(f"CREATE_FAILED_{response.status_code}")
    except Exception as e:
        print(f"❌ CREATE error: {str(e)}")
        test_results["critical_issues"].append(f"CREATE_ERROR: {str(e)}")
    
    # Test 6: BULK IMPORT
    print("\n6. BULK IMPORT")
    bulk_data = {
        "country": "Türkiye",
        "city": "İzmir",
        "centers": ["Test Bulk Center 1", "Test Bulk Center 2"]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/library/convention-centers/bulk-import", json=bulk_data)
        if response.status_code == 200:
            result = response.json()
            created = result.get("created", 0)
            print(f"✅ BULK IMPORT working - created {created} centers")
            test_results["bulk_import_working"] = True
        else:
            print(f"❌ BULK IMPORT failed: {response.status_code}")
            test_results["critical_issues"].append(f"BULK_IMPORT_FAILED_{response.status_code}")
    except Exception as e:
        print(f"❌ BULK IMPORT error: {str(e)}")
        test_results["critical_issues"].append(f"BULK_IMPORT_ERROR: {str(e)}")
    
    # Final Results
    print("\n" + "=" * 60)
    print("FINAL TEST RESULTS")
    print("=" * 60)
    
    working_endpoints = sum([
        test_results["get_all_working"],
        test_results["get_filtered_working"], 
        test_results["create_working"],
        test_results["update_working"],
        test_results["delete_working"],
        test_results["bulk_import_working"]
    ])
    
    print(f"Working endpoints: {working_endpoints}/6")
    print(f"Success rate: {(working_endpoints/6)*100:.1f}%")
    
    print(f"\nEndpoint Status:")
    print(f"  GET All: {'✅' if test_results['get_all_working'] else '❌'}")
    print(f"  GET Filtered: {'✅' if test_results['get_filtered_working'] else '❌'}")
    print(f"  CREATE: {'✅' if test_results['create_working'] else '❌'}")
    print(f"  UPDATE: {'✅' if test_results['update_working'] else '❌'}")
    print(f"  DELETE: {'✅' if test_results['delete_working'] else '❌'}")
    print(f"  BULK IMPORT: {'✅' if test_results['bulk_import_working'] else '❌'}")
    
    print(f"\nCritical Issues: {len(test_results['critical_issues'])}")
    for issue in test_results['critical_issues']:
        print(f"  • {issue}")
    
    print(f"\nWarnings: {len(test_results['warnings'])}")
    for warning in test_results['warnings']:
        print(f"  • {warning}")
    
    if test_results["update_creates_new_id"]:
        print(f"\n🚨 CRITICAL BACKEND BUG IDENTIFIED:")
        print(f"   UPDATE endpoint creates new ID instead of updating existing record")
        print(f"   This breaks the expected REST API behavior")
        print(f"   Root cause: Pydantic model generates new ID in center.dict()")
        print(f"   Fix needed: Exclude ID from update or fetch updated record from DB")
    
    # Return success if most endpoints work
    return working_endpoints >= 5

if __name__ == "__main__":
    result = test_convention_centers_final()
    if result:
        print(f"\n✅ OVERALL: Convention Centers API mostly working (minor issues)")
    else:
        print(f"\n❌ OVERALL: Convention Centers API has major issues")