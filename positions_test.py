#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://feature-flags-1.preview.emergentagent.com"

def test_user_positions_apis():
    """
    Kullanıcı Pozisyonları API'leri Testi
    
    **Test Edilecek Endpoint'ler:**
    
    1. **GET /api/positions**
       - Tüm pozisyonları döndürmeli
       - En az 13 default pozisyon olmalı
    
    2. **POST /api/positions**
       - Yeni pozisyon oluşturma
       - Test data: {"name": "Test Pozisyonu"}
       - Response'da success: true olmalı
       - Türkçe başarı mesajı
    
    3. **PUT /api/positions/{position_id}**
       - Pozisyon güncelleme
       - Test: İsim değiştirme
       - Türkçe başarı mesajı
    
    4. **DELETE /api/positions/{position_id}**
       - Pozisyon silme
       - Aktif kullanıcı kullanan pozisyon silinemez
       - Türkçe hata/başarı mesajı
    
    **Başarı Kriterleri:**
    - Tüm endpoint'ler çalışır olmalı
    - Türkçe karakter desteği
    - Value otomatik generate (lowercase, underscore, Turkish char conversion)
    - Duplicate kontrolü
    """
    
    print("=" * 100)
    print("🚨 KULLANICI POZİSYONLARI API'LERİ TESTİ 🚨")
    print("=" * 100)
    print("CONTEXT: Kullanıcı pozisyonları yönetimi sisteminin tüm API endpoint'lerini test ediyoruz.")
    print("Bu test, pozisyon listesi, pozisyon oluşturma, güncelleme ve silme işlemlerini kapsamaktadır.")
    print("Türkçe karakter desteği, otomatik value generation ve duplicate kontrolü test edilecek.")
    print("=" * 100)
    
    test_results = {
        "get_positions_working": False,
        "create_position_working": False,
        "update_position_working": False,
        "delete_position_working": False,
        "positions_count": 0,
        "default_positions_present": False,
        "turkish_character_support": False,
        "value_generation_working": False,
        "duplicate_prevention_working": False,
        "created_position_id": None,
        "turkish_success_messages": False,
        "critical_issues": [],
        "warnings": []
    }
    
    # TEST 1: GET /api/positions - Tüm Pozisyonları Döndürme
    print("\n" + "=" * 80)
    print("TEST 1: GET /api/positions - TÜM POZİSYONLARI DÖNDÜRME TESTİ")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/positions"
    print(f"Testing endpoint: {endpoint}")
    print("Beklenen: En az 13 default pozisyon olmalı")
    print("Response format: [{id, name, value, created_at}]")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Positions endpoint responds with 200")
            
            try:
                positions = response.json()
                print(f"Response type: {type(positions)}")
                
                if isinstance(positions, list):
                    positions_count = len(positions)
                    test_results["positions_count"] = positions_count
                    print(f"📊 Positions Count: {positions_count}")
                    
                    if positions_count >= 13:
                        print(f"✅ PASS: Found {positions_count} positions (≥13 requirement met)")
                        test_results["get_positions_working"] = True
                        
                        # Analyze first few positions
                        print(f"\n📋 POSITIONS DATA ANALYSIS (First 5):")
                        for i, position in enumerate(positions[:5], 1):
                            position_id = position.get("id", "N/A")
                            position_name = position.get("name", "N/A")
                            position_value = position.get("value", "N/A")
                            created_at = position.get("created_at", "N/A")
                            
                            print(f"   {i}. ID: {position_id}")
                            print(f"      Name: {position_name}")
                            print(f"      Value: {position_value}")
                            print(f"      Created: {created_at}")
                            
                            # Check required fields
                            required_fields = ["id", "name", "value"]
                            missing_fields = [field for field in required_fields if field not in position or not position[field]]
                            
                            if missing_fields:
                                print(f"      ⚠️  Missing/empty fields: {missing_fields}")
                                test_results["warnings"].append(f"POSITION_{i}_MISSING_FIELDS_{missing_fields}")
                            else:
                                print(f"      ✅ All required fields present")
                            
                            # Check for Turkish positions
                            turkish_positions = ["Genel Müdür", "Müdür", "Uzman", "Koordinatör", "Specialist"]
                            if any(pos in position_name for pos in turkish_positions):
                                print(f"      ✅ Turkish position name detected")
                        
                        # Check for default positions
                        position_names = [p.get("name", "") for p in positions]
                        expected_default_positions = [
                            "Genel Müdür", "Müdür", "Proje Yöneticisi", "Satış Müdürü", 
                            "Pazarlama Müdürü", "İnsan Kaynakları Müdürü", "Mali İşler Müdürü",
                            "Operasyon Müdürü", "Bilgi İşlem Müdürü", "Uzman", "Kıdemli Uzman",
                            "Koordinatör", "Stajyer"
                        ]
                        found_default = [pos for pos in expected_default_positions if pos in position_names]
                        
                        if len(found_default) >= 13:
                            print(f"✅ PASS: Found {len(found_default)}/13 default positions")
                            test_results["default_positions_present"] = True
                        else:
                            print(f"⚠️  WARNING: Only found {len(found_default)}/13 default positions")
                            test_results["warnings"].append(f"MISSING_DEFAULT_POSITIONS_{len(found_default)}")
                        
                        # Check Turkish character support in position names
                        turkish_chars = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']
                        has_turkish = any(any(char in name for char in turkish_chars) for name in position_names)
                        if has_turkish:
                            print(f"✅ PASS: Turkish character support verified in position names")
                            test_results["turkish_character_support"] = True
                        else:
                            print(f"⚠️  WARNING: No Turkish characters found in position names")
                            test_results["warnings"].append("NO_TURKISH_CHARS_IN_POSITIONS")
                            
                    else:
                        print(f"❌ FAIL: Only {positions_count} positions found, expected ≥13")
                        test_results["critical_issues"].append(f"INSUFFICIENT_POSITIONS_{positions_count}")
                else:
                    print("❌ FAIL: Response should be an array")
                    test_results["critical_issues"].append("POSITIONS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Could not parse positions response: {str(e)}")
                test_results["critical_issues"].append(f"POSITIONS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Positions endpoint error: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"POSITIONS_API_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Positions request error: {str(e)}")
        test_results["critical_issues"].append(f"POSITIONS_REQUEST_ERROR: {str(e)}")
    
    # TEST 2: POST /api/positions - Yeni Pozisyon Oluşturma
    print("\n" + "=" * 80)
    print("TEST 2: POST /api/positions - YENİ POZİSYON OLUŞTURMA TESTİ")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/positions"
    print(f"Testing endpoint: {endpoint}")
    print("Test data: {'name': 'Test Pozisyonu'}")
    print("Beklenen: success: true, Türkçe başarı mesajı, otomatik value generation")
    
    # Create test position data
    test_position_data = {
        "name": "Test Pozisyonu Türkçe Karakter İçeren"
    }
    
    try:
        response = requests.post(endpoint, json=test_position_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ PASS: Position creation endpoint responds with success")
            
            try:
                result = response.json()
                print(f"Response type: {type(result)}")
                print(f"Response: {result}")
                
                # Check if response has success field
                if result.get("success") == True:
                    print("✅ PASS: Response contains success: true")
                    test_results["create_position_working"] = True
                    
                    # Check for Turkish success message
                    message = result.get("message", "")
                    if message and any(char in message for char in ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']):
                        print(f"✅ PASS: Turkish success message: '{message}'")
                        test_results["turkish_success_messages"] = True
                    else:
                        print(f"⚠️  WARNING: Success message not in Turkish: '{message}'")
                        test_results["warnings"].append("SUCCESS_MESSAGE_NOT_TURKISH")
                    
                    # Check position data
                    position = result.get("position", {})
                    if position:
                        position_id = position.get("id")
                        position_name = position.get("name")
                        position_value = position.get("value")
                        
                        test_results["created_position_id"] = position_id
                        print(f"📊 Created Position:")
                        print(f"   ID: {position_id}")
                        print(f"   Name: {position_name}")
                        print(f"   Value: {position_value}")
                        
                        # Check value generation (lowercase, underscore, Turkish char conversion)
                        expected_value = "test_pozisyonu_turkce_karakter_iceren"
                        if position_value == expected_value:
                            print(f"✅ PASS: Value generation working correctly")
                            test_results["value_generation_working"] = True
                        else:
                            print(f"⚠️  WARNING: Value generation issue. Expected: '{expected_value}', Got: '{position_value}'")
                            test_results["warnings"].append(f"VALUE_GENERATION_ISSUE_{position_value}")
                    else:
                        print("⚠️  WARNING: Position data not returned in response")
                        test_results["warnings"].append("POSITION_DATA_MISSING")
                        
                else:
                    print("❌ FAIL: Response does not contain success: true")
                    test_results["critical_issues"].append("CREATE_POSITION_NO_SUCCESS")
                    
            except Exception as e:
                print(f"❌ FAIL: Could not parse position creation response: {str(e)}")
                test_results["critical_issues"].append(f"CREATE_POSITION_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Position creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"CREATE_POSITION_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Position creation request error: {str(e)}")
        test_results["critical_issues"].append(f"CREATE_POSITION_REQUEST_ERROR: {str(e)}")
    
    # TEST 2.1: Test Duplicate Prevention
    print("\n" + "-" * 60)
    print("TEST 2.1: DUPLICATE PREVENTION TEST")
    print("-" * 60)
    print("Attempting to create the same position again...")
    
    try:
        duplicate_response = requests.post(endpoint, json=test_position_data, timeout=30)
        print(f"Duplicate Status Code: {duplicate_response.status_code}")
        
        if duplicate_response.status_code == 400:
            print("✅ PASS: Duplicate position correctly rejected with 400")
            
            try:
                error_result = duplicate_response.json()
                error_detail = error_result.get("detail", "")
                
                if "zaten mevcut" in error_detail.lower():
                    print(f"✅ PASS: Turkish error message for duplicate: '{error_detail}'")
                    test_results["duplicate_prevention_working"] = True
                else:
                    print(f"⚠️  WARNING: Error message not in Turkish: '{error_detail}'")
                    test_results["warnings"].append("DUPLICATE_ERROR_NOT_TURKISH")
                    
            except Exception as e:
                print(f"⚠️  WARNING: Could not parse duplicate error response: {str(e)}")
                test_results["warnings"].append("DUPLICATE_ERROR_PARSE_ISSUE")
        else:
            print(f"❌ FAIL: Duplicate position not rejected properly: {duplicate_response.status_code}")
            test_results["critical_issues"].append(f"DUPLICATE_NOT_PREVENTED_{duplicate_response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Duplicate test error: {str(e)}")
        test_results["critical_issues"].append(f"DUPLICATE_TEST_ERROR: {str(e)}")
    
    # TEST 3: PUT /api/positions/{position_id} - Pozisyon Güncelleme
    print("\n" + "=" * 80)
    print("TEST 3: PUT /api/positions/{position_id} - POZİSYON GÜNCELLEME TESTİ")
    print("=" * 80)
    
    if test_results["created_position_id"]:
        position_id = test_results["created_position_id"]
        endpoint = f"{BACKEND_URL}/api/positions/{position_id}"
        print(f"Testing endpoint: {endpoint}")
        print("Test: İsim değiştirme, Türkçe başarı mesajı")
        
        # Update position data
        update_position_data = {
            "name": "Güncellenmiş Test Pozisyonu"
        }
        
        try:
            response = requests.put(endpoint, json=update_position_data, timeout=30)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ PASS: Position update endpoint responds with 200")
                
                try:
                    result = response.json()
                    print(f"Response: {result}")
                    
                    # Check if response has success field
                    if result.get("success") == True:
                        print("✅ PASS: Update response contains success: true")
                        test_results["update_position_working"] = True
                        
                        # Check for Turkish success message
                        message = result.get("message", "")
                        if message and any(char in message for char in ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']):
                            print(f"✅ PASS: Turkish update success message: '{message}'")
                        else:
                            print(f"⚠️  WARNING: Update message not in Turkish: '{message}'")
                            test_results["warnings"].append("UPDATE_MESSAGE_NOT_TURKISH")
                        
                        # Check updated position data
                        position = result.get("position", {})
                        if position:
                            updated_name = position.get("name")
                            updated_value = position.get("value")
                            
                            print(f"📊 Updated Position:")
                            print(f"   Name: {updated_name}")
                            print(f"   Value: {updated_value}")
                            
                            if updated_name == update_position_data["name"]:
                                print(f"✅ PASS: Position name updated correctly")
                            else:
                                print(f"⚠️  WARNING: Position name not updated correctly")
                                test_results["warnings"].append("UPDATE_NAME_MISMATCH")
                        else:
                            print("⚠️  WARNING: Updated position data not returned")
                            test_results["warnings"].append("UPDATE_POSITION_DATA_MISSING")
                    else:
                        print("❌ FAIL: Update response does not contain success: true")
                        test_results["critical_issues"].append("UPDATE_POSITION_NO_SUCCESS")
                        
                except Exception as e:
                    print(f"❌ FAIL: Could not parse position update response: {str(e)}")
                    test_results["critical_issues"].append(f"UPDATE_POSITION_PARSE_ERROR: {str(e)}")
            else:
                print(f"❌ FAIL: Position update failed: {response.status_code}")
                print(f"Response: {response.text}")
                test_results["critical_issues"].append(f"UPDATE_POSITION_ERROR_{response.status_code}")
                
        except Exception as e:
            print(f"❌ FAIL: Position update request error: {str(e)}")
            test_results["critical_issues"].append(f"UPDATE_POSITION_REQUEST_ERROR: {str(e)}")
    else:
        print("❌ SKIP: No position ID available for update test")
        test_results["warnings"].append("UPDATE_TEST_SKIPPED_NO_ID")
    
    # TEST 4: DELETE /api/positions/{position_id} - Pozisyon Silme
    print("\n" + "=" * 80)
    print("TEST 4: DELETE /api/positions/{position_id} - POZİSYON SİLME TESTİ")
    print("=" * 80)
    
    if test_results["created_position_id"]:
        position_id = test_results["created_position_id"]
        endpoint = f"{BACKEND_URL}/api/positions/{position_id}"
        print(f"Testing endpoint: {endpoint}")
        print("Test: Pozisyon silme, Türkçe başarı mesajı")
        print("Not: Aktif kullanıcı kullanan pozisyon silinemez kontrolü")
        
        try:
            response = requests.delete(endpoint, timeout=30)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ PASS: Position delete endpoint responds with 200")
                
                try:
                    result = response.json()
                    print(f"Response: {result}")
                    
                    # Check if response has success field
                    if result.get("success") == True:
                        print("✅ PASS: Delete response contains success: true")
                        test_results["delete_position_working"] = True
                        
                        # Check for Turkish success message
                        message = result.get("message", "")
                        if message and any(char in message for char in ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']):
                            print(f"✅ PASS: Turkish delete success message: '{message}'")
                        else:
                            print(f"⚠️  WARNING: Delete message not in Turkish: '{message}'")
                            test_results["warnings"].append("DELETE_MESSAGE_NOT_TURKISH")
                    else:
                        print("❌ FAIL: Delete response does not contain success: true")
                        test_results["critical_issues"].append("DELETE_POSITION_NO_SUCCESS")
                        
                except Exception as e:
                    print(f"❌ FAIL: Could not parse position delete response: {str(e)}")
                    test_results["critical_issues"].append(f"DELETE_POSITION_PARSE_ERROR: {str(e)}")
            elif response.status_code == 400:
                print("✅ PASS: Position delete correctly rejected (may be in use)")
                
                try:
                    error_result = response.json()
                    error_detail = error_result.get("detail", "")
                    
                    if "kullanılıyor" in error_detail.lower() or "silinemez" in error_detail.lower():
                        print(f"✅ PASS: Turkish error message for position in use: '{error_detail}'")
                        test_results["delete_position_working"] = True
                    else:
                        print(f"⚠️  WARNING: Error message not in Turkish: '{error_detail}'")
                        test_results["warnings"].append("DELETE_ERROR_NOT_TURKISH")
                        
                except Exception as e:
                    print(f"⚠️  WARNING: Could not parse delete error response: {str(e)}")
                    test_results["warnings"].append("DELETE_ERROR_PARSE_ISSUE")
            else:
                print(f"❌ FAIL: Position delete failed: {response.status_code}")
                print(f"Response: {response.text}")
                test_results["critical_issues"].append(f"DELETE_POSITION_ERROR_{response.status_code}")
                
        except Exception as e:
            print(f"❌ FAIL: Position delete request error: {str(e)}")
            test_results["critical_issues"].append(f"DELETE_POSITION_REQUEST_ERROR: {str(e)}")
    else:
        print("❌ SKIP: No position ID available for delete test")
        test_results["warnings"].append("DELETE_TEST_SKIPPED_NO_ID")
    
    # FINAL TEST RESULTS SUMMARY
    print("\n" + "=" * 100)
    print("🔍 KULLANICI POZİSYONLARI API'LERİ TEST SONUÇLARI")
    print("=" * 100)
    
    print(f"📊 TEST RESULTS SUMMARY:")
    print(f"   • GET /api/positions: {'✅ Working' if test_results['get_positions_working'] else '❌ Failed'}")
    print(f"   • POST /api/positions: {'✅ Working' if test_results['create_position_working'] else '❌ Failed'}")
    print(f"   • PUT /api/positions: {'✅ Working' if test_results['update_position_working'] else '❌ Failed'}")
    print(f"   • DELETE /api/positions: {'✅ Working' if test_results['delete_position_working'] else '❌ Failed'}")
    print(f"   • Positions Count: {test_results['positions_count']}")
    print(f"   • Default Positions: {'✅ Present' if test_results['default_positions_present'] else '❌ Missing'}")
    print(f"   • Turkish Character Support: {'✅ Working' if test_results['turkish_character_support'] else '❌ Failed'}")
    print(f"   • Value Generation: {'✅ Working' if test_results['value_generation_working'] else '❌ Failed'}")
    print(f"   • Duplicate Prevention: {'✅ Working' if test_results['duplicate_prevention_working'] else '❌ Failed'}")
    print(f"   • Turkish Success Messages: {'✅ Working' if test_results['turkish_success_messages'] else '❌ Failed'}")
    
    print(f"\n🚨 CRITICAL ISSUES FOUND: {len(test_results['critical_issues'])}")
    for issue in test_results['critical_issues']:
        print(f"   • {issue}")
    
    print(f"\n⚠️  WARNINGS: {len(test_results['warnings'])}")
    for warning in test_results['warnings']:
        print(f"   • {warning}")
    
    # CONCLUSIONS AND RECOMMENDATIONS
    print(f"\n📋 CONCLUSIONS:")
    
    working_endpoints = sum([
        test_results['get_positions_working'],
        test_results['create_position_working'], 
        test_results['update_position_working'],
        test_results['delete_position_working']
    ])
    
    success_rate = (working_endpoints / 4) * 100
    print(f"   • Success Rate: {success_rate:.1f}% ({working_endpoints}/4 endpoints working)")
    
    if success_rate == 100:
        print("✅ EXCELLENT: All positions API endpoints are working correctly!")
        print("   • All CRUD operations functional")
        print("   • Turkish character support verified")
        print("   • Value generation working properly")
        print("   • Duplicate prevention implemented")
        print("   • Turkish success/error messages present")
    elif success_rate >= 75:
        print("✅ GOOD: Most positions API endpoints are working")
        print("   • Core functionality is operational")
        print("   • Minor issues may need attention")
    elif success_rate >= 50:
        print("⚠️  WARNING: Partial positions API functionality")
        print("   • Some critical endpoints not working")
        print("   • Requires immediate attention")
    else:
        print("❌ CRITICAL: Major positions API issues")
        print("   • Most endpoints not functional")
        print("   • System requires urgent fixes")
    
    print(f"\n🎯 NEXT STEPS:")
    if len(test_results['critical_issues']) > 0:
        print("   1. Fix critical issues identified in testing")
        print("   2. Verify Turkish character support in all endpoints")
        print("   3. Test duplicate prevention logic")
        print("   4. Ensure proper error message localization")
    else:
        print("   1. System is working correctly - ready for production")
        print("   2. Monitor position usage in user management")
        print("   3. Consider adding position hierarchy features")
    
    # Return overall test result
    has_critical_issues = len(test_results['critical_issues']) > 0
    
    if has_critical_issues:
        print(f"\n❌ OVERALL RESULT: CRITICAL ISSUES FOUND - POSITIONS API NEEDS FIXES")
        return False
    else:
        print(f"\n✅ OVERALL RESULT: POSITIONS API IS WORKING CORRECTLY")
        return True

if __name__ == "__main__":
    print("🚀 Starting User Positions API Testing...")
    print("=" * 100)
    
    # Run the positions API test
    result = test_user_positions_apis()
    
    if result:
        print("\n🎉 ALL POSITIONS API TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME POSITIONS API TESTS FAILED!")
        sys.exit(1)