#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://version-control-7.preview.emergentagent.com"

def test_contract_create_page_dropdown_apis():
    """
    URGENT: ContractCreatePage Dropdown Data API'leri Testi
    
    **Test Hedefleri:**
    Sözleşme oluşturma formundaki dropdown'ları dolduracak olan 4 API endpoint'ini test et:

    **1. GET /api/group-companies**
    - Şirket listesinin döndüğünü doğrula
    - Response yapısını kontrol et (id, name, address alanları)
    - En az birkaç grup şirketi olup olmadığını kontrol et

    **2. GET /api/customers**
    - Müşteri listesinin döndüğünü doğrula  
    - Response yapısını kontrol et (id, companyName, address, contactPerson alanları)
    - isProspect=false olan müşterilerin geldiğini doğrula

    **3. GET /api/users**
    - Kullanıcı listesinin döndüğünü doğrula
    - Response yapısını kontrol et (id, fullName veya name alanları)
    - Aktif kullanıcıların geldiğini doğrula

    **4. GET /api/projects**
    - Proje listesinin döndüğünü doğrula
    - Response yapısını kontrol et (id, name, customer, fairName, fairStartDate, fairEndDate alanları)
    - Customer bilgisinin projede olduğunu doğrula

    **Başarı Kriterleri:**
    - Tüm 4 endpoint 200 status code dönmeli
    - Her endpoint veri içermeli (boş değil)
    - Response formatları frontend ile uyumlu olmalı
    - Türkçe karakter desteği olmalı
    """
    
    print("=" * 100)
    print("🚨 URGENT: CONTRACTCREATEPAGE DROPDOWN DATA API'LERİ TESTİ 🚨")
    print("=" * 100)
    print("CONTEXT: Sözleşme oluşturma formundaki dropdown'ları dolduracak olan")
    print("4 API endpoint'ini test ediyoruz. Bu API'ler ContractCreatePage.jsx'te")
    print("fetchDropdownData() fonksiyonu tarafından çağrılıyor.")
    print("=" * 100)
    
    test_results = {
        "group_companies_working": False,
        "customers_working": False,
        "users_working": False,
        "projects_working": False,
        "group_companies_data": [],
        "customers_data": [],
        "users_data": [],
        "projects_data": [],
        "critical_issues": [],
        "warnings": []
    }
    
    # TEST 1: GET /api/group-companies
    print("\n" + "=" * 80)
    print("TEST 1: GET /api/group-companies - GRUP ŞİRKETLERİ API TESTİ")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/group-companies"
    print(f"Testing endpoint: {endpoint}")
    print("Beklenen alanlar: id, name, address")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Group companies endpoint responds with 200")
            
            try:
                data = response.json()
                print(f"Response type: {type(data)}")
                
                if isinstance(data, list):
                    company_count = len(data)
                    print(f"📊 Group Companies Count: {company_count}")
                    
                    if company_count == 0:
                        print("❌ CRITICAL: No group companies found - dropdown will be empty!")
                        test_results["critical_issues"].append("NO_GROUP_COMPANIES")
                    else:
                        print(f"✅ PASS: Found {company_count} group companies")
                        test_results["group_companies_working"] = True
                        test_results["group_companies_data"] = data[:3]  # Store first 3 for analysis
                        
                        # Analyze first few companies
                        print(f"\n📋 GROUP COMPANIES DATA ANALYSIS (First 3):")
                        for i, company in enumerate(data[:3], 1):
                            company_id = company.get("id", "N/A")
                            company_name = company.get("name", "N/A")
                            company_address = company.get("address", "N/A")
                            
                            print(f"   {i}. ID: {company_id}")
                            print(f"      Name: {company_name}")
                            print(f"      Address: {company_address}")
                            
                            # Check required fields
                            required_fields = ["id", "name", "address"]
                            missing_fields = [field for field in required_fields if field not in company or not company[field]]
                            
                            if missing_fields:
                                print(f"      ⚠️  Missing/empty fields: {missing_fields}")
                                test_results["warnings"].append(f"GROUP_COMPANY_{i}_MISSING_FIELDS_{missing_fields}")
                            else:
                                print(f"      ✅ All required fields present")
                            
                            # Check Turkish character support
                            turkish_chars = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']
                            has_turkish = any(char in str(company_name) + str(company_address) for char in turkish_chars)
                            if has_turkish:
                                print(f"      ✅ Turkish character support verified")
                else:
                    print("❌ FAIL: Response should be an array")
                    test_results["critical_issues"].append("GROUP_COMPANIES_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Could not parse group companies response: {str(e)}")
                test_results["critical_issues"].append(f"GROUP_COMPANIES_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Group companies endpoint error: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"GROUP_COMPANIES_API_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Group companies request error: {str(e)}")
        test_results["critical_issues"].append(f"GROUP_COMPANIES_REQUEST_ERROR: {str(e)}")
    
    # TEST 2: GET /api/customers
    print("\n" + "=" * 80)
    print("TEST 2: GET /api/customers - MÜŞTERİLER API TESTİ")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/customers"
    print(f"Testing endpoint: {endpoint}")
    print("Beklenen alanlar: id, companyName, address, contactPerson")
    print("Beklenen filtre: isProspect=false olan müşteriler")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Customers endpoint responds with 200")
            
            try:
                data = response.json()
                print(f"Response type: {type(data)}")
                
                if isinstance(data, list):
                    customer_count = len(data)
                    print(f"📊 Total Customers Count: {customer_count}")
                    
                    # Filter customers by isProspect=false
                    regular_customers = [c for c in data if not c.get("isProspect", False)]
                    regular_count = len(regular_customers)
                    
                    print(f"📊 Regular Customers (isProspect=false): {regular_count}")
                    
                    if regular_count == 0:
                        print("❌ CRITICAL: No regular customers found - dropdown will be empty!")
                        test_results["critical_issues"].append("NO_REGULAR_CUSTOMERS")
                    else:
                        print(f"✅ PASS: Found {regular_count} regular customers")
                        test_results["customers_working"] = True
                        test_results["customers_data"] = regular_customers[:3]  # Store first 3 for analysis
                        
                        # Analyze first few customers
                        print(f"\n📋 CUSTOMERS DATA ANALYSIS (First 3 regular customers):")
                        for i, customer in enumerate(regular_customers[:3], 1):
                            customer_id = customer.get("id", "N/A")
                            company_name = customer.get("companyName", "N/A")
                            address = customer.get("address", "N/A")
                            contact_person = customer.get("contactPerson", "N/A")
                            is_prospect = customer.get("isProspect", "N/A")
                            
                            print(f"   {i}. ID: {customer_id}")
                            print(f"      Company Name: {company_name}")
                            print(f"      Address: {address}")
                            print(f"      Contact Person: {contact_person}")
                            print(f"      Is Prospect: {is_prospect}")
                            
                            # Check required fields
                            required_fields = ["id", "companyName"]
                            missing_fields = [field for field in required_fields if field not in customer or not customer[field]]
                            
                            if missing_fields:
                                print(f"      ⚠️  Missing/empty required fields: {missing_fields}")
                                test_results["warnings"].append(f"CUSTOMER_{i}_MISSING_FIELDS_{missing_fields}")
                            else:
                                print(f"      ✅ Required fields present")
                            
                            # Verify isProspect=false
                            if customer.get("isProspect", False):
                                print(f"      ❌ FAIL: Customer should have isProspect=false")
                                test_results["warnings"].append(f"CUSTOMER_{i}_WRONG_PROSPECT_STATUS")
                            else:
                                print(f"      ✅ Correct prospect status (false)")
                            
                            # Check Turkish character support
                            turkish_chars = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']
                            has_turkish = any(char in str(company_name) + str(address) + str(contact_person) for char in turkish_chars)
                            if has_turkish:
                                print(f"      ✅ Turkish character support verified")
                else:
                    print("❌ FAIL: Response should be an array")
                    test_results["critical_issues"].append("CUSTOMERS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Could not parse customers response: {str(e)}")
                test_results["critical_issues"].append(f"CUSTOMERS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Customers endpoint error: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"CUSTOMERS_API_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Customers request error: {str(e)}")
        test_results["critical_issues"].append(f"CUSTOMERS_REQUEST_ERROR: {str(e)}")
    
    # TEST 3: GET /api/users
    print("\n" + "=" * 80)
    print("TEST 3: GET /api/users - KULLANICILAR API TESTİ")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/users"
    print(f"Testing endpoint: {endpoint}")
    print("Beklenen alanlar: id, fullName veya name")
    print("Beklenen filtre: Aktif kullanıcılar")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Users endpoint responds with 200")
            
            try:
                data = response.json()
                print(f"Response type: {type(data)}")
                
                if isinstance(data, list):
                    user_count = len(data)
                    print(f"📊 Total Users Count: {user_count}")
                    
                    # Filter active users (assuming status='active' or no status field means active)
                    active_users = [u for u in data if u.get("status", "active") == "active"]
                    active_count = len(active_users)
                    
                    print(f"📊 Active Users Count: {active_count}")
                    
                    if active_count == 0:
                        print("❌ CRITICAL: No active users found - dropdown will be empty!")
                        test_results["critical_issues"].append("NO_ACTIVE_USERS")
                    else:
                        print(f"✅ PASS: Found {active_count} active users")
                        test_results["users_working"] = True
                        test_results["users_data"] = active_users[:3]  # Store first 3 for analysis
                        
                        # Analyze first few users
                        print(f"\n📋 USERS DATA ANALYSIS (First 3 active users):")
                        for i, user in enumerate(active_users[:3], 1):
                            user_id = user.get("id", "N/A")
                            full_name = user.get("fullName", user.get("name", "N/A"))
                            email = user.get("email", "N/A")
                            status = user.get("status", "active")
                            role = user.get("role", "N/A")
                            
                            print(f"   {i}. ID: {user_id}")
                            print(f"      Full Name: {full_name}")
                            print(f"      Email: {email}")
                            print(f"      Status: {status}")
                            print(f"      Role: {role}")
                            
                            # Check required fields
                            required_fields = ["id"]
                            name_field_present = "fullName" in user or "name" in user
                            
                            missing_fields = [field for field in required_fields if field not in user or not user[field]]
                            
                            if missing_fields:
                                print(f"      ⚠️  Missing/empty required fields: {missing_fields}")
                                test_results["warnings"].append(f"USER_{i}_MISSING_FIELDS_{missing_fields}")
                            elif not name_field_present:
                                print(f"      ⚠️  Missing name field (fullName or name)")
                                test_results["warnings"].append(f"USER_{i}_MISSING_NAME_FIELD")
                            else:
                                print(f"      ✅ Required fields present")
                            
                            # Check Turkish character support
                            turkish_chars = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']
                            has_turkish = any(char in str(full_name) for char in turkish_chars)
                            if has_turkish:
                                print(f"      ✅ Turkish character support verified")
                else:
                    print("❌ FAIL: Response should be an array")
                    test_results["critical_issues"].append("USERS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Could not parse users response: {str(e)}")
                test_results["critical_issues"].append(f"USERS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Users endpoint error: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"USERS_API_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Users request error: {str(e)}")
        test_results["critical_issues"].append(f"USERS_REQUEST_ERROR: {str(e)}")
    
    # TEST 4: GET /api/projects
    print("\n" + "=" * 80)
    print("TEST 4: GET /api/projects - PROJELER API TESTİ")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/projects"
    print(f"Testing endpoint: {endpoint}")
    print("Beklenen alanlar: id, name, customer, fairName, fairStartDate, fairEndDate")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Projects endpoint responds with 200")
            
            try:
                data = response.json()
                print(f"Response type: {type(data)}")
                
                if isinstance(data, list):
                    project_count = len(data)
                    print(f"📊 Projects Count: {project_count}")
                    
                    if project_count == 0:
                        print("❌ CRITICAL: No projects found - dropdown will be empty!")
                        test_results["critical_issues"].append("NO_PROJECTS")
                    else:
                        print(f"✅ PASS: Found {project_count} projects")
                        test_results["projects_working"] = True
                        test_results["projects_data"] = data[:3]  # Store first 3 for analysis
                        
                        # Analyze first few projects
                        print(f"\n📋 PROJECTS DATA ANALYSIS (First 3 projects):")
                        for i, project in enumerate(data[:3], 1):
                            project_id = project.get("id", "N/A")
                            project_name = project.get("name", "N/A")
                            customer = project.get("customer", project.get("customerName", "N/A"))
                            fair_name = project.get("fairName", "N/A")
                            fair_start_date = project.get("fairStartDate", "N/A")
                            fair_end_date = project.get("fairEndDate", "N/A")
                            
                            print(f"   {i}. ID: {project_id}")
                            print(f"      Name: {project_name}")
                            print(f"      Customer: {customer}")
                            print(f"      Fair Name: {fair_name}")
                            print(f"      Fair Start Date: {fair_start_date}")
                            print(f"      Fair End Date: {fair_end_date}")
                            
                            # Check required fields
                            required_fields = ["id", "name"]
                            missing_fields = [field for field in required_fields if field not in project or not project[field]]
                            
                            if missing_fields:
                                print(f"      ⚠️  Missing/empty required fields: {missing_fields}")
                                test_results["warnings"].append(f"PROJECT_{i}_MISSING_FIELDS_{missing_fields}")
                            else:
                                print(f"      ✅ Required fields present")
                            
                            # Check customer information
                            if not customer or customer == "N/A":
                                print(f"      ⚠️  Missing customer information")
                                test_results["warnings"].append(f"PROJECT_{i}_MISSING_CUSTOMER")
                            else:
                                print(f"      ✅ Customer information present")
                            
                            # Check Turkish character support
                            turkish_chars = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']
                            has_turkish = any(char in str(project_name) + str(customer) + str(fair_name) for char in turkish_chars)
                            if has_turkish:
                                print(f"      ✅ Turkish character support verified")
                else:
                    print("❌ FAIL: Response should be an array")
                    test_results["critical_issues"].append("PROJECTS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Could not parse projects response: {str(e)}")
                test_results["critical_issues"].append(f"PROJECTS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Projects endpoint error: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"PROJECTS_API_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Projects request error: {str(e)}")
        test_results["critical_issues"].append(f"PROJECTS_REQUEST_ERROR: {str(e)}")
    
    # FINAL TEST RESULTS SUMMARY
    print("\n" + "=" * 100)
    print("🔍 CONTRACTCREATEPAGE DROPDOWN API'LERİ TEST SONUÇLARI")
    print("=" * 100)
    
    print(f"📊 API ENDPOINT DURUMU:")
    print(f"   • Group Companies API: {'✅ Working' if test_results['group_companies_working'] else '❌ Failed'}")
    print(f"   • Customers API: {'✅ Working' if test_results['customers_working'] else '❌ Failed'}")
    print(f"   • Users API: {'✅ Working' if test_results['users_working'] else '❌ Failed'}")
    print(f"   • Projects API: {'✅ Working' if test_results['projects_working'] else '❌ Failed'}")
    
    print(f"\n📈 VERİ SAYILARI:")
    print(f"   • Group Companies: {len(test_results['group_companies_data'])} (sample)")
    print(f"   • Customers: {len(test_results['customers_data'])} (sample)")
    print(f"   • Users: {len(test_results['users_data'])} (sample)")
    print(f"   • Projects: {len(test_results['projects_data'])} (sample)")
    
    print(f"\n🚨 CRITICAL ISSUES: {len(test_results['critical_issues'])}")
    for issue in test_results['critical_issues']:
        print(f"   • {issue}")
    
    print(f"\n⚠️  WARNINGS: {len(test_results['warnings'])}")
    for warning in test_results['warnings']:
        print(f"   • {warning}")
    
    # CONCLUSIONS AND RECOMMENDATIONS
    print(f"\n📋 SONUÇLAR VE ÖNERİLER:")
    
    working_apis = sum([
        test_results['group_companies_working'],
        test_results['customers_working'],
        test_results['users_working'],
        test_results['projects_working']
    ])
    
    if working_apis == 4:
        print("🎉 EXCELLENT: Tüm 4 API endpoint çalışıyor!")
        print("   ContractCreatePage dropdown'ları veri alabilir")
        print("   Frontend ile backend entegrasyonu hazır")
    elif working_apis >= 2:
        print(f"⚠️  PARTIAL SUCCESS: {working_apis}/4 API endpoint çalışıyor")
        print("   Bazı dropdown'lar boş kalabilir")
        print("   Çalışmayan API'leri düzeltmek gerekiyor")
    else:
        print("🚨 CRITICAL FAILURE: Çoğu API endpoint çalışmıyor!")
        print("   ContractCreatePage dropdown'ları boş kalacak")
        print("   Backend API'lerini acilen düzeltmek gerekiyor")
    
    print(f"\n🎯 NEXT STEPS:")
    if not test_results['group_companies_working']:
        print("   1. Group Companies API'sini kontrol et ve düzelt")
    if not test_results['customers_working']:
        print("   2. Customers API'sini kontrol et (isProspect=false filtresi)")
    if not test_results['users_working']:
        print("   3. Users API'sini kontrol et (aktif kullanıcı filtresi)")
    if not test_results['projects_working']:
        print("   4. Projects API'sini kontrol et (customer bilgisi)")
    
    if working_apis == 4:
        print("   ✅ Tüm API'ler çalışıyor - Frontend entegrasyonunu test et")
    
    # Return overall test result
    has_critical_issues = len(test_results['critical_issues']) > 0
    
    if has_critical_issues:
        print(f"\n❌ OVERALL RESULT: CRITICAL ISSUES FOUND - DROPDOWN DATA API'LERİ SORUNLU")
        return False
    elif working_apis == 4:
        print(f"\n✅ OVERALL RESULT: ALL DROPDOWN DATA API'S WORKING CORRECTLY")
        return True
    else:
        print(f"\n⚠️  OVERALL RESULT: PARTIAL SUCCESS - SOME API'S NEED ATTENTION")
        return False

if __name__ == "__main__":
    print("🚀 Starting ContractCreatePage Dropdown APIs Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    success = test_contract_create_page_dropdown_apis()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED!")
        sys.exit(1)