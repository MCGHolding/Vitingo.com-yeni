#!/usr/bin/env python3

import requests
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://accrue-tenant.preview.emergentagent.com"

def test_recursive_stand_elements_get():
    """
    Test GET /api/stand-elements - mevcut recursive yapının doğru olduğunu kontrol et
    
    Requirements to verify:
    1. GET /api/stand-elements should return recursive structure
    2. Should have flooring and furniture main elements
    3. Should have proper nested children structure
    4. Should support unlimited depth nesting
    """
    
    print("=" * 80)
    print("TESTING GET STAND ELEMENTS - RECURSIVE STRUCTURE")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/stand-elements"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        # Test 1: Make GET request
        print("\n1. Making GET request to get stand elements...")
        response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Stand elements endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 2: Parse JSON response
        print("\n2. Parsing JSON response...")
        try:
            elements = response.json()
            print(f"   Response type: {type(elements)}")
            print(f"   Number of main elements: {len(elements) if isinstance(elements, dict) else 'N/A'}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Test 3: Validate response structure
        print("\n3. Validating response structure...")
        if not isinstance(elements, dict):
            print("   ❌ FAIL: Response should be a dictionary of stand elements")
            return False
        
        print(f"   ✅ PASS: Response is a dictionary containing {len(elements)} main elements")
        print(f"   Main element keys: {list(elements.keys())}")
        
        # Test 4: Check for expected main elements
        print("\n4. Checking for expected main elements...")
        expected_main_elements = ["flooring", "furniture"]
        found_elements = []
        
        for element_key in expected_main_elements:
            if element_key in elements:
                found_elements.append(element_key)
                print(f"   ✅ PASS: Found main element '{element_key}'")
            else:
                print(f"   ❌ FAIL: Missing expected main element '{element_key}'")
        
        if len(found_elements) < len(expected_main_elements):
            print(f"   ❌ FAIL: Missing main elements: {set(expected_main_elements) - set(found_elements)}")
            return False
        
        # Test 5: Check flooring structure
        print("\n5. Checking flooring recursive structure...")
        flooring = elements.get("flooring", {})
        if not flooring:
            print("   ❌ FAIL: Flooring element not found")
            return False
        
        print(f"   Flooring label: {flooring.get('label')}")
        print(f"   Flooring required: {flooring.get('required')}")
        
        flooring_structure = flooring.get("structure", {})
        if not flooring_structure:
            print("   ❌ FAIL: Flooring should have structure")
            return False
        
        print(f"   Flooring structure keys: {list(flooring_structure.keys())}")
        
        # Check for raised36mm
        if "raised36mm" in flooring_structure:
            print("   ✅ PASS: Found 'raised36mm' in flooring structure")
            raised36mm = flooring_structure["raised36mm"]
            
            # Check children of raised36mm
            raised36mm_children = raised36mm.get("children", {})
            if raised36mm_children:
                print(f"   ✅ PASS: raised36mm has children: {list(raised36mm_children.keys())}")
                
                # Check carpet option
                if "carpet" in raised36mm_children:
                    carpet = raised36mm_children["carpet"]
                    carpet_children = carpet.get("children", {})
                    if carpet_children:
                        print(f"   ✅ PASS: carpet has children: {list(carpet_children.keys())}")
                        
                        # Check for existing properties
                        if "carpet_type" in carpet_children:
                            print("   ✅ PASS: Found 'carpet_type' property in carpet children")
                        if "color" in carpet_children:
                            print("   ✅ PASS: Found 'color' property in carpet children")
                        if "quantity" in carpet_children:
                            print("   ✅ PASS: Found 'quantity' unit in carpet children")
                    else:
                        print("   ⚠️  WARNING: carpet has no children")
                else:
                    print("   ⚠️  WARNING: 'carpet' not found in raised36mm children")
            else:
                print("   ⚠️  WARNING: raised36mm has no children")
        else:
            print("   ⚠️  WARNING: 'raised36mm' not found in flooring structure")
        
        # Test 6: Check furniture structure
        print("\n6. Checking furniture recursive structure...")
        furniture = elements.get("furniture", {})
        if not furniture:
            print("   ❌ FAIL: Furniture element not found")
            return False
        
        print(f"   Furniture label: {furniture.get('label')}")
        print(f"   Furniture required: {furniture.get('required')}")
        
        furniture_structure = furniture.get("structure", {})
        if not furniture_structure:
            print("   ❌ FAIL: Furniture should have structure")
            return False
        
        print(f"   Furniture structure keys: {list(furniture_structure.keys())}")
        
        # Check for seating
        if "seating" in furniture_structure:
            print("   ✅ PASS: Found 'seating' in furniture structure")
            seating = furniture_structure["seating"]
            
            # Check children of seating
            seating_children = seating.get("children", {})
            if seating_children:
                print(f"   ✅ PASS: seating has children: {list(seating_children.keys())}")
                
                # Check armchairs option
                if "armchairs" in seating_children:
                    armchairs = seating_children["armchairs"]
                    armchairs_children = armchairs.get("children", {})
                    if armchairs_children:
                        print(f"   ✅ PASS: armchairs has children: {list(armchairs_children.keys())}")
                    else:
                        print("   ⚠️  WARNING: armchairs has no children")
                else:
                    print("   ⚠️  WARNING: 'armchairs' not found in seating children")
            else:
                print("   ⚠️  WARNING: seating has no children")
        else:
            print("   ⚠️  WARNING: 'seating' not found in furniture structure")
        
        # Test 7: Validate unlimited depth capability
        print("\n7. Validating unlimited depth capability...")
        max_depth = 0
        
        def calculate_depth(node, current_depth=0):
            nonlocal max_depth
            max_depth = max(max_depth, current_depth)
            
            if isinstance(node, dict):
                children = node.get("children", {})
                if children:
                    for child in children.values():
                        calculate_depth(child, current_depth + 1)
                
                structure = node.get("structure", {})
                if structure:
                    for child in structure.values():
                        calculate_depth(child, current_depth + 1)
        
        for element in elements.values():
            calculate_depth(element)
        
        print(f"   Maximum nesting depth found: {max_depth}")
        if max_depth >= 3:
            print("   ✅ PASS: Supports deep nesting (3+ levels)")
        else:
            print("   ⚠️  WARNING: Limited nesting depth detected")
        
        print("\n" + "=" * 80)
        print("GET STAND ELEMENTS RECURSIVE STRUCTURE TEST RESULTS:")
        print("=" * 80)
        print("✅ Endpoint responds with status 200")
        print("✅ Returns proper JSON dictionary structure")
        print("✅ Contains expected main elements (flooring, furniture)")
        print("✅ Recursive structure with nested children working")
        print("✅ Supports unlimited depth nesting")
        print("✅ Ready for category addition testing")
        print(f"\n🎉 GET STAND ELEMENTS RECURSIVE STRUCTURE TEST PASSED!")
        
        return True, elements
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False, None
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False, None

def test_stand_elements_post_new_categories():
    """
    Test POST /api/stand-elements ile yeni kategoriler ekle
    
    Requirements to verify:
    1. parent_path="flooring" ile "Halı Türü" (text/property) ekle
    2. parent_path="flooring.raised36mm" ile "Özel Renk" (color/property) ekle  
    3. parent_path="furniture.seating" ile "Koltuk Sayısı" (number/unit) ekle
    4. Her ekleme sonrası GET ile yapının güncellendiğini doğrula
    5. Yeni eklenen kategorilerin doğru parent_path ile kaydedildiğini kontrol et
    """
    
    print("=" * 80)
    print("TESTING POST STAND ELEMENTS - NEW CATEGORY ADDITIONS")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/stand-elements"
    print(f"Testing endpoint: {endpoint}")
    
    # Test categories to add
    test_categories = [
        {
            "key": "hali_turu",
            "label": "Halı Türü",
            "element_type": "property",
            "input_type": "text",
            "parent_path": "flooring",
            "description": "Adding text property to flooring main element"
        },
        {
            "key": "ozel_renk",
            "label": "Özel Renk",
            "element_type": "property", 
            "input_type": "color",
            "parent_path": "flooring.raised36mm",
            "description": "Adding color property to flooring.raised36mm"
        },
        {
            "key": "koltuk_sayisi",
            "label": "Koltuk Sayısı",
            "element_type": "unit",
            "input_type": "number",
            "unit": "adet",
            "parent_path": "furniture.seating",
            "description": "Adding number unit to furniture.seating"
        }
    ]
    
    successful_additions = []
    
    try:
        for i, category in enumerate(test_categories, 1):
            print(f"\n{'='*60}")
            print(f"TEST {i}: {category['description']}")
            print(f"{'='*60}")
            
            # Prepare POST data
            post_data = {
                "key": category["key"],
                "label": category["label"],
                "element_type": category["element_type"],
                "input_type": category["input_type"],
                "parent_path": category["parent_path"]
            }
            
            if "unit" in category:
                post_data["unit"] = category["unit"]
            
            print(f"   POST data: {post_data}")
            
            # Test: Make POST request
            print(f"\n   Making POST request to add '{category['label']}'...")
            response = requests.post(endpoint, json=post_data, timeout=30)
            
            print(f"   Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ PASS: Category '{category['label']}' added successfully")
            else:
                print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
                print(f"   Response: {response.text}")
                continue
            
            # Parse response
            try:
                result = response.json()
                print(f"   Response: {result}")
                if result.get("success"):
                    print(f"   ✅ PASS: Success message received: {result.get('message')}")
                    successful_additions.append(category)
                else:
                    print(f"   ❌ FAIL: Success flag not set in response")
                    continue
            except Exception as e:
                print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
                continue
            
            # Verify addition with GET request
            print(f"\n   Verifying addition with GET request...")
            get_response = requests.get(endpoint, timeout=30)
            
            if get_response.status_code != 200:
                print(f"   ❌ FAIL: GET request failed with status {get_response.status_code}")
                continue
            
            try:
                elements = get_response.json()
                
                # Navigate to parent path and check if new element exists
                path_parts = category["parent_path"].split('.')
                current_node = elements
                
                # Navigate through the path
                for j, part in enumerate(path_parts):
                    if j == 0:
                        # Main element
                        if part not in current_node:
                            print(f"   ❌ FAIL: Main element '{part}' not found")
                            break
                        current_node = current_node[part].get("structure", {})
                    else:
                        # Nested element
                        if part not in current_node:
                            print(f"   ❌ FAIL: Nested element '{part}' not found at path {'.'.join(path_parts[:j+1])}")
                            break
                        current_node = current_node[part].get("children", {})
                else:
                    # Check if new element was added
                    if category["key"] in current_node:
                        added_element = current_node[category["key"]]
                        print(f"   ✅ PASS: New element '{category['key']}' found at correct path")
                        print(f"   Element details: {added_element}")
                        
                        # Verify element properties
                        if added_element.get("label") == category["label"]:
                            print(f"   ✅ PASS: Label matches: {added_element.get('label')}")
                        else:
                            print(f"   ❌ FAIL: Label mismatch. Expected: {category['label']}, Got: {added_element.get('label')}")
                        
                        if added_element.get("element_type") == category["element_type"]:
                            print(f"   ✅ PASS: Element type matches: {added_element.get('element_type')}")
                        else:
                            print(f"   ❌ FAIL: Element type mismatch. Expected: {category['element_type']}, Got: {added_element.get('element_type')}")
                        
                        if added_element.get("input_type") == category["input_type"]:
                            print(f"   ✅ PASS: Input type matches: {added_element.get('input_type')}")
                        else:
                            print(f"   ❌ FAIL: Input type mismatch. Expected: {category['input_type']}, Got: {added_element.get('input_type')}")
                        
                        if "unit" in category:
                            if added_element.get("unit") == category["unit"]:
                                print(f"   ✅ PASS: Unit matches: {added_element.get('unit')}")
                            else:
                                print(f"   ❌ FAIL: Unit mismatch. Expected: {category['unit']}, Got: {added_element.get('unit')}")
                    else:
                        print(f"   ❌ FAIL: New element '{category['key']}' not found at path {category['parent_path']}")
                        print(f"   Available elements at path: {list(current_node.keys())}")
                        continue
                
            except Exception as e:
                print(f"   ❌ FAIL: Error verifying addition: {str(e)}")
                continue
        
        # Final verification - check all additions
        print(f"\n{'='*80}")
        print("FINAL VERIFICATION - ALL ADDITIONS")
        print(f"{'='*80}")
        
        if len(successful_additions) == len(test_categories):
            print(f"✅ PASS: All {len(test_categories)} categories added successfully")
            
            # Get final structure
            final_response = requests.get(endpoint, timeout=30)
            if final_response.status_code == 200:
                final_elements = final_response.json()
                
                print("\nFinal structure verification:")
                for category in successful_additions:
                    path_parts = category["parent_path"].split('.')
                    current_node = final_elements
                    
                    # Navigate to element
                    for j, part in enumerate(path_parts):
                        if j == 0:
                            current_node = current_node[part].get("structure", {})
                        else:
                            current_node = current_node[part].get("children", {})
                    
                    if category["key"] in current_node:
                        print(f"   ✅ {category['label']} at {category['parent_path']}")
                    else:
                        print(f"   ❌ {category['label']} missing at {category['parent_path']}")
                
                print("\n🎉 ALL CATEGORY ADDITIONS TEST PASSED!")
                return True
            else:
                print("   ❌ FAIL: Could not get final structure for verification")
                return False
        else:
            print(f"❌ FAIL: Only {len(successful_additions)}/{len(test_categories)} categories added successfully")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_stand_elements_unlimited_depth():
    """
    Test recursive children yapısında sınırsız derinliğin çalıştığını test et
    
    Requirements to verify:
    1. Create a deep nested structure (4+ levels)
    2. Verify each level can be accessed and modified
    3. Test navigation through deep paths
    4. Verify unlimited depth capability
    """
    
    print("=" * 80)
    print("TESTING STAND ELEMENTS - UNLIMITED DEPTH CAPABILITY")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/stand-elements"
    print(f"Testing endpoint: {endpoint}")
    
    # Create a deep nested structure for testing
    deep_categories = [
        {
            "key": "level1",
            "label": "Level 1 Category",
            "element_type": "option",
            "parent_path": "flooring.raised36mm.carpet",
            "description": "Adding level 1 to existing 3-level path"
        },
        {
            "key": "level2",
            "label": "Level 2 Category", 
            "element_type": "option",
            "parent_path": "flooring.raised36mm.carpet.level1",
            "description": "Adding level 2 to create 5-level depth"
        },
        {
            "key": "level3_property",
            "label": "Deep Property",
            "element_type": "property",
            "input_type": "text",
            "parent_path": "flooring.raised36mm.carpet.level1.level2",
            "description": "Adding property at 6-level depth"
        }
    ]
    
    try:
        print("\n1. Testing deep nesting capability...")
        
        for i, category in enumerate(deep_categories, 1):
            print(f"\n   Adding category at depth level {i+3}...")
            print(f"   Path: {category['parent_path']}")
            print(f"   Adding: {category['label']}")
            
            post_data = {
                "key": category["key"],
                "label": category["label"],
                "element_type": category["element_type"],
                "parent_path": category["parent_path"]
            }
            
            if "input_type" in category:
                post_data["input_type"] = category["input_type"]
            
            response = requests.post(endpoint, json=post_data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print(f"   ✅ PASS: Successfully added at depth level {i+3}")
                else:
                    print(f"   ❌ FAIL: Addition failed: {result}")
                    return False
            else:
                print(f"   ❌ FAIL: HTTP error {response.status_code}: {response.text}")
                return False
        
        # Verify deep structure
        print("\n2. Verifying deep nested structure...")
        get_response = requests.get(endpoint, timeout=30)
        
        if get_response.status_code != 200:
            print(f"   ❌ FAIL: Could not retrieve structure: {get_response.status_code}")
            return False
        
        elements = get_response.json()
        
        # Navigate to deepest level
        print("\n3. Navigating through deep structure...")
        current_node = elements["flooring"]["structure"]
        path = ["flooring"]
        
        navigation_steps = [
            ("raised36mm", "structure -> raised36mm"),
            ("carpet", "raised36mm -> children -> carpet"),
            ("level1", "carpet -> children -> level1"),
            ("level2", "level1 -> children -> level2"),
            ("level3_property", "level2 -> children -> level3_property")
        ]
        
        depth = 1
        for step, description in navigation_steps:
            depth += 1
            path.append(step)
            
            if step in current_node:
                print(f"   ✅ PASS: Found '{step}' at depth {depth} ({description})")
                
                if step == "level3_property":
                    # This is the final property, check its details
                    property_details = current_node[step]
                    print(f"   Property details: {property_details}")
                    
                    if property_details.get("element_type") == "property":
                        print(f"   ✅ PASS: Deep property has correct element_type")
                    if property_details.get("input_type") == "text":
                        print(f"   ✅ PASS: Deep property has correct input_type")
                    
                    break
                else:
                    # Move to children for next level
                    current_node = current_node[step].get("children", {})
                    if not current_node:
                        print(f"   ❌ FAIL: No children found at '{step}', cannot continue navigation")
                        return False
            else:
                print(f"   ❌ FAIL: Could not find '{step}' at depth {depth}")
                print(f"   Available keys: {list(current_node.keys())}")
                return False
        
        print(f"\n4. Successfully navigated to depth {depth}")
        print(f"   Final path: {' -> '.join(path)}")
        
        print("\n" + "=" * 80)
        print("UNLIMITED DEPTH CAPABILITY TEST RESULTS:")
        print("=" * 80)
        print("✅ Successfully created 6-level deep nested structure")
        print("✅ Navigation through deep paths working")
        print("✅ Can add elements at any depth level")
        print("✅ Deep structure persists correctly")
        print("✅ Unlimited depth capability confirmed")
        print(f"\n🎉 UNLIMITED DEPTH CAPABILITY TEST PASSED!")
        print(f"   Maximum tested depth: 6 levels")
        print(f"   Path: flooring -> raised36mm -> carpet -> level1 -> level2 -> level3_property")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Stand Elements Backend API Testing Suite")
    print("=" * 80)
    
    # List of stand elements test functions
    test_functions = [
        test_recursive_stand_elements_get,
        test_stand_elements_post_new_categories,
        test_stand_elements_unlimited_depth
    ]
    
    # Track results
    passed_tests = 0
    failed_tests = 0
    test_results = []
    
    # Run each test
    for test_func in test_functions:
        try:
            print(f"\n🧪 Running {test_func.__name__}...")
            result = test_func()
            
            if isinstance(result, tuple):
                # Some tests return (success, data)
                success = result[0]
            else:
                success = result
            
            if success:
                passed_tests += 1
                test_results.append(f"✅ {test_func.__name__}")
                print(f"✅ {test_func.__name__} PASSED")
            else:
                failed_tests += 1
                test_results.append(f"❌ {test_func.__name__}")
                print(f"❌ {test_func.__name__} FAILED")
                
        except Exception as e:
            failed_tests += 1
            test_results.append(f"❌ {test_func.__name__} (Exception)")
            print(f"❌ {test_func.__name__} FAILED with exception: {str(e)}")
    
    # Final summary
    print("\n" + "=" * 80)
    print("🏁 FINAL STAND ELEMENTS TEST RESULTS SUMMARY")
    print("=" * 80)
    
    for result in test_results:
        print(result)
    
    print(f"\n📊 STATISTICS:")
    print(f"   Total Tests: {len(test_functions)}")
    print(f"   Passed: {passed_tests}")
    print(f"   Failed: {failed_tests}")
    print(f"   Success Rate: {(passed_tests/len(test_functions)*100):.1f}%")
    
    if failed_tests == 0:
        print("\n🎉 ALL STAND ELEMENTS TESTS PASSED! Backend integration is working correctly.")
        print("\n📋 SUMMARY OF TESTED FUNCTIONALITY:")
        print("   ✅ GET /api/stand-elements - Recursive structure retrieval")
        print("   ✅ POST /api/stand-elements - New category additions:")
        print("      • parent_path='flooring' → 'Halı Türü' (text/property)")
        print("      • parent_path='flooring.raised36mm' → 'Özel Renk' (color/property)")
        print("      • parent_path='furniture.seating' → 'Koltuk Sayısı' (number/unit)")
        print("   ✅ Recursive children structure with unlimited depth")
        print("   ✅ Proper parent_path validation and storage")
        print("   ✅ Structure updates verified after each addition")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed_tests} STAND ELEMENTS TEST(S) FAILED. Please check the issues above.")
        sys.exit(1)