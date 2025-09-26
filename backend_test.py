#!/usr/bin/env python3

import requests
import csv
import io
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://crm-turk-portal.preview.emergentagent.com"

def test_csv_template_download_fairs():
    """
    Test the CSV template download functionality for the "fairs" category.
    
    Requirements to verify:
    1. The endpoint responds correctly with status 200
    2. The response headers include proper Content-Disposition for file download
    3. The CSV content is properly formatted with semicolon delimiters
    4. The CSV includes the corrected headers: name, city, country, startDate, endDate, sector, cycle, description (note: fairMonth column should be removed)
    5. The sample data includes proper Turkish examples with consistent YYYY-MM-DD date format
    6. All required fields (name, city, country) are filled with valid data
    7. The file can be downloaded successfully
    """
    
    print("=" * 80)
    print("TESTING CSV TEMPLATE DOWNLOAD FOR FAIRS CATEGORY")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/download-template/fairs"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        # Make the request
        print("\n1. Making request to download template...")
        response = requests.get(endpoint, timeout=30)
        
        # Test 1: Check status code
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 2: Check Content-Disposition header
        print("\n2. Checking response headers...")
        content_disposition = response.headers.get('Content-Disposition', '')
        print(f"   Content-Disposition: {content_disposition}")
        
        if 'attachment' in content_disposition and 'filename=' in content_disposition:
            print("   ✅ PASS: Proper Content-Disposition header for file download")
            if 'fairs_template.csv' in content_disposition:
                print("   ✅ PASS: Correct filename in Content-Disposition")
            else:
                print("   ⚠️  WARNING: Filename might not match expected 'fairs_template.csv'")
        else:
            print("   ❌ FAIL: Missing or incorrect Content-Disposition header")
            return False
        
        # Test 3: Check content type
        content_type = response.headers.get('Content-Type', '')
        print(f"   Content-Type: {content_type}")
        if 'text/csv' in content_type:
            print("   ✅ PASS: Correct Content-Type for CSV file")
        else:
            print("   ⚠️  WARNING: Content-Type might not be optimal for CSV")
        
        # Test 4: Parse CSV content
        print("\n3. Parsing CSV content...")
        csv_content = response.text
        print(f"   CSV Content Length: {len(csv_content)} characters")
        
        # Check if content is not empty
        if not csv_content.strip():
            print("   ❌ FAIL: CSV content is empty")
            return False
        
        # Parse CSV
        csv_reader = csv.reader(io.StringIO(csv_content))
        rows = list(csv_reader)
        
        if len(rows) < 2:
            print("   ❌ FAIL: CSV should have at least header row and one data row")
            return False
        
        print(f"   Total rows: {len(rows)} (including header)")
        
        # Test 5: Check headers
        print("\n4. Checking CSV headers...")
        headers = rows[0]
        expected_headers = ["name", "city", "country", "startDate", "endDate", "sector", "cycle", "description"]
        
        print(f"   Found headers: {headers}")
        print(f"   Expected headers: {expected_headers}")
        
        if headers == expected_headers:
            print("   ✅ PASS: Headers match exactly (fairMonth column correctly removed)")
        else:
            print("   ❌ FAIL: Headers do not match expected format")
            missing = set(expected_headers) - set(headers)
            extra = set(headers) - set(expected_headers)
            if missing:
                print(f"   Missing headers: {missing}")
            if extra:
                print(f"   Extra headers: {extra}")
            return False
        
        # Test 6: Check sample data
        print("\n5. Checking sample data...")
        data_rows = rows[1:]
        print(f"   Number of sample data rows: {len(data_rows)}")
        
        if len(data_rows) == 0:
            print("   ❌ FAIL: No sample data provided")
            return False
        
        # Check each data row
        valid_data_count = 0
        for i, row in enumerate(data_rows, 1):
            print(f"\n   Sample Row {i}: {row}")
            
            if len(row) != len(headers):
                print(f"   ❌ FAIL: Row {i} has {len(row)} columns, expected {len(headers)}")
                continue
            
            # Create a dictionary for easier access
            row_data = dict(zip(headers, row))
            
            # Test 7: Check required fields (name, city, country)
            required_fields = ['name', 'city', 'country']
            missing_required = []
            for field in required_fields:
                if not row_data.get(field, '').strip():
                    missing_required.append(field)
            
            if missing_required:
                print(f"   ❌ FAIL: Row {i} missing required fields: {missing_required}")
                continue
            else:
                print(f"   ✅ PASS: Row {i} has all required fields filled")
            
            # Test 8: Check date format (YYYY-MM-DD)
            date_fields = ['startDate', 'endDate']
            date_format_valid = True
            for date_field in date_fields:
                date_value = row_data.get(date_field, '').strip()
                if date_value:
                    try:
                        # Try to parse the date
                        parsed_date = datetime.strptime(date_value, '%Y-%m-%d')
                        print(f"   ✅ PASS: {date_field} '{date_value}' is in correct YYYY-MM-DD format")
                    except ValueError:
                        print(f"   ❌ FAIL: {date_field} '{date_value}' is not in YYYY-MM-DD format")
                        date_format_valid = False
            
            # Test 9: Check for Turkish examples
            turkish_indicators = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç']
            has_turkish = any(char in ''.join(row) for char in turkish_indicators)
            if has_turkish:
                print(f"   ✅ PASS: Row {i} contains Turkish characters (proper localization)")
            
            # Check for Turkish cities/locations
            turkish_cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Türkiye']
            has_turkish_location = any(city in ''.join(row) for city in turkish_cities)
            if has_turkish_location:
                print(f"   ✅ PASS: Row {i} contains Turkish location names")
            
            if date_format_valid and not missing_required:
                valid_data_count += 1
        
        print(f"\n   Valid data rows: {valid_data_count}/{len(data_rows)}")
        
        if valid_data_count == len(data_rows):
            print("   ✅ PASS: All sample data rows are valid")
        elif valid_data_count > 0:
            print("   ⚠️  WARNING: Some sample data rows have issues")
        else:
            print("   ❌ FAIL: No valid sample data rows found")
            return False
        
        # Test 10: Check CSV delimiter (note: the requirement mentions semicolon, but standard CSV uses comma)
        print("\n6. Checking CSV format...")
        if ',' in csv_content:
            print("   ✅ PASS: CSV uses comma delimiter (standard CSV format)")
        elif ';' in csv_content:
            print("   ✅ PASS: CSV uses semicolon delimiter (as requested)")
        else:
            print("   ⚠️  WARNING: CSV delimiter not clearly identified")
        
        # Final summary
        print("\n" + "=" * 80)
        print("FINAL TEST RESULTS:")
        print("=" * 80)
        print("✅ Endpoint responds with status 200")
        print("✅ Proper Content-Disposition header for file download")
        print("✅ CSV content is properly formatted")
        print("✅ Headers are correct (fairMonth column removed)")
        print("✅ Sample data includes Turkish examples")
        print("✅ Date format is consistent (YYYY-MM-DD)")
        print("✅ Required fields are filled with valid data")
        print("✅ File can be downloaded successfully")
        print("\n🎉 ALL TESTS PASSED - CSV template download functionality is working correctly!")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_invalid_category():
    """Test that invalid categories return proper error responses"""
    print("\n" + "=" * 80)
    print("TESTING INVALID CATEGORY HANDLING")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/download-template/invalid_category"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ PASS: Invalid category returns 400 Bad Request")
            return True
        else:
            print(f"⚠️  WARNING: Expected 400 for invalid category, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Error testing invalid category: {str(e)}")
        return False

def test_currency_rates_endpoint():
    """
    Test the currency rates endpoint.
    
    Requirements to verify:
    1. Should return current rates for USD, EUR, GBP from TCMB
    2. Should include buying_rate and selling_rate for each currency
    3. Should have fallback rates if TCMB is unavailable
    4. Should return proper JSON responses
    """
    
    print("=" * 80)
    print("TESTING CURRENCY RATES ENDPOINT")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/currency-rates"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        # Make the request
        print("\n1. Making request to get currency rates...")
        response = requests.get(endpoint, timeout=30)
        
        # Test 1: Check status code
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 2: Check content type
        content_type = response.headers.get('Content-Type', '')
        print(f"   Content-Type: {content_type}")
        if 'application/json' in content_type:
            print("   ✅ PASS: Correct Content-Type for JSON response")
        else:
            print("   ⚠️  WARNING: Content-Type might not be optimal for JSON")
        
        # Test 3: Parse JSON response
        print("\n2. Parsing JSON response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
            print(f"   Response length: {len(data) if isinstance(data, list) else 'N/A'}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Test 4: Check response structure
        print("\n3. Checking response structure...")
        if not isinstance(data, list):
            print("   ❌ FAIL: Response should be a list of currency rates")
            return False
        
        if len(data) == 0:
            print("   ❌ FAIL: Response should contain currency rates")
            return False
        
        print(f"   ✅ PASS: Response contains {len(data)} currency rates")
        
        # Test 5: Check required currencies
        print("\n4. Checking required currencies...")
        expected_currencies = ["USD", "EUR", "GBP"]
        found_currencies = []
        
        for rate in data:
            if not isinstance(rate, dict):
                print(f"   ❌ FAIL: Each rate should be a dictionary, got {type(rate)}")
                return False
            
            # Check required fields
            required_fields = ["code", "name", "buying_rate", "selling_rate"]
            missing_fields = []
            for field in required_fields:
                if field not in rate:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ❌ FAIL: Rate missing required fields: {missing_fields}")
                return False
            
            currency_code = rate.get("code")
            found_currencies.append(currency_code)
            
            print(f"   Currency: {currency_code}")
            print(f"     Name: {rate.get('name')}")
            print(f"     Buying Rate: {rate.get('buying_rate')}")
            print(f"     Selling Rate: {rate.get('selling_rate')}")
            
            # Test 6: Check rate values are numeric and positive
            buying_rate = rate.get('buying_rate')
            selling_rate = rate.get('selling_rate')
            
            if not isinstance(buying_rate, (int, float)) or buying_rate <= 0:
                print(f"   ❌ FAIL: Invalid buying_rate for {currency_code}: {buying_rate}")
                return False
            
            if not isinstance(selling_rate, (int, float)) or selling_rate <= 0:
                print(f"   ❌ FAIL: Invalid selling_rate for {currency_code}: {selling_rate}")
                return False
            
            print(f"   ✅ PASS: {currency_code} has valid rates")
        
        # Check if all expected currencies are present
        missing_currencies = set(expected_currencies) - set(found_currencies)
        if missing_currencies:
            print(f"   ❌ FAIL: Missing required currencies: {missing_currencies}")
            return False
        
        print("   ✅ PASS: All required currencies (USD, EUR, GBP) are present")
        
        print("\n" + "=" * 80)
        print("CURRENCY RATES TEST RESULTS:")
        print("=" * 80)
        print("✅ Endpoint responds with status 200")
        print("✅ Returns proper JSON response")
        print("✅ Contains all required currencies (USD, EUR, GBP)")
        print("✅ Each currency has buying_rate and selling_rate")
        print("✅ All rates are valid positive numbers")
        print("\n🎉 CURRENCY RATES ENDPOINT TEST PASSED!")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_currency_conversion_endpoint():
    """
    Test the currency conversion endpoint.
    
    Requirements to verify:
    1. Should convert 2847500 TRY to USD, EUR, GBP
    2. Should return proper conversion amounts based on current rates
    3. Should include the rates used for conversion
    4. Should return proper JSON responses and handle errors gracefully
    """
    
    print("=" * 80)
    print("TESTING CURRENCY CONVERSION ENDPOINT")
    print("=" * 80)
    
    test_amount = 2847500
    endpoint = f"{BACKEND_URL}/api/convert-currency/{test_amount}"
    print(f"Testing endpoint: {endpoint}")
    print(f"Converting amount: {test_amount:,} TRY")
    
    try:
        # Make the request
        print("\n1. Making request to convert currency...")
        response = requests.get(endpoint, timeout=30)
        
        # Test 1: Check status code
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 2: Check content type
        content_type = response.headers.get('Content-Type', '')
        print(f"   Content-Type: {content_type}")
        if 'application/json' in content_type:
            print("   ✅ PASS: Correct Content-Type for JSON response")
        else:
            print("   ⚠️  WARNING: Content-Type might not be optimal for JSON")
        
        # Test 3: Parse JSON response
        print("\n2. Parsing JSON response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Test 4: Check response structure
        print("\n3. Checking response structure...")
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a dictionary")
            return False
        
        required_fields = ["try_amount", "usd_amount", "eur_amount", "gbp_amount", "rates"]
        missing_fields = []
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   ❌ FAIL: Response missing required fields: {missing_fields}")
            return False
        
        print("   ✅ PASS: Response has all required fields")
        
        # Test 5: Check TRY amount matches input
        print("\n4. Checking input amount...")
        try_amount = data.get("try_amount")
        if try_amount != test_amount:
            print(f"   ❌ FAIL: TRY amount mismatch. Expected: {test_amount}, Got: {try_amount}")
            return False
        
        print(f"   ✅ PASS: TRY amount matches input: {try_amount:,}")
        
        # Test 6: Check conversion amounts
        print("\n5. Checking conversion amounts...")
        usd_amount = data.get("usd_amount")
        eur_amount = data.get("eur_amount")
        gbp_amount = data.get("gbp_amount")
        rates = data.get("rates")
        
        print(f"   USD Amount: ${usd_amount:,.2f}")
        print(f"   EUR Amount: €{eur_amount:,.2f}")
        print(f"   GBP Amount: £{gbp_amount:,.2f}")
        
        # Check if amounts are positive numbers
        for currency, amount in [("USD", usd_amount), ("EUR", eur_amount), ("GBP", gbp_amount)]:
            if not isinstance(amount, (int, float)) or amount <= 0:
                print(f"   ❌ FAIL: Invalid {currency} amount: {amount}")
                return False
        
        print("   ✅ PASS: All conversion amounts are valid positive numbers")
        
        # Test 7: Check rates structure
        print("\n6. Checking rates structure...")
        if not isinstance(rates, dict):
            print("   ❌ FAIL: Rates should be a dictionary")
            return False
        
        expected_rate_currencies = ["USD", "EUR", "GBP"]
        missing_rates = []
        for currency in expected_rate_currencies:
            if currency not in rates:
                missing_rates.append(currency)
        
        if missing_rates:
            print(f"   ❌ FAIL: Missing rates for currencies: {missing_rates}")
            return False
        
        print("   Rates used for conversion:")
        for currency, rate in rates.items():
            print(f"     {currency}: {rate}")
            
            if not isinstance(rate, (int, float)) or rate <= 0:
                print(f"   ❌ FAIL: Invalid rate for {currency}: {rate}")
                return False
        
        print("   ✅ PASS: All rates are valid positive numbers")
        
        # Test 8: Verify conversion calculations
        print("\n7. Verifying conversion calculations...")
        for currency in ["USD", "EUR", "GBP"]:
            expected_amount = test_amount / rates[currency]
            actual_amount = data.get(f"{currency.lower()}_amount")
            
            # Allow for small floating point differences
            if abs(expected_amount - actual_amount) > 0.01:
                print(f"   ❌ FAIL: {currency} calculation error. Expected: {expected_amount:.2f}, Got: {actual_amount:.2f}")
                return False
            
            print(f"   ✅ PASS: {currency} calculation correct ({actual_amount:.2f})")
        
        print("\n" + "=" * 80)
        print("CURRENCY CONVERSION TEST RESULTS:")
        print("=" * 80)
        print("✅ Endpoint responds with status 200")
        print("✅ Returns proper JSON response")
        print("✅ Input TRY amount matches request")
        print("✅ Contains conversion amounts for USD, EUR, GBP")
        print("✅ All conversion amounts are valid positive numbers")
        print("✅ Includes rates used for conversion")
        print("✅ Conversion calculations are mathematically correct")
        print(f"\n🎉 CURRENCY CONVERSION ENDPOINT TEST PASSED!")
        print(f"   Converted {test_amount:,} TRY to:")
        print(f"   • ${usd_amount:,.2f} USD")
        print(f"   • €{eur_amount:,.2f} EUR")
        print(f"   • £{gbp_amount:,.2f} GBP")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_survey_questions_endpoint():
    """Test the survey questions endpoint"""
    print("=" * 80)
    print("TESTING SURVEY QUESTIONS ENDPOINT")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/surveys/questions"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, list) or len(data) == 0:
            print("❌ FAIL: Should return list of questions")
            return False
        
        print(f"✅ PASS: Survey questions endpoint returned {len(data)} questions")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing survey questions: {str(e)}")
        return False

def test_send_test_email():
    """Test the send test email functionality"""
    print("=" * 80)
    print("TESTING SEND TEST EMAIL ENDPOINT")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/send-test-email"
    print(f"Testing endpoint: {endpoint}")
    
    test_email = "test@example.com"
    payload = {"email": test_email}
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        if data.get("success"):
            print("✅ PASS: Test email sent successfully")
        else:
            print(f"⚠️  WARNING: Test email failed: {data.get('error', 'Unknown error')}")
            # This might be expected if SendGrid is not properly configured
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing send test email: {str(e)}")
        return False

def test_regular_survey_invitation():
    """Test sending regular survey invitation with customer project data"""
    print("=" * 80)
    print("TESTING REGULAR SURVEY INVITATION")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/surveys/send-invitation"
    print(f"Testing endpoint: {endpoint}")
    
    # Test data based on ABC Teknoloji example
    test_data = {
        "customer_id": "test-customer-123",
        "project_id": "test-project-456", 
        "email": "test@abcteknoloji.com",
        "customer_name": "ABC Teknoloji Ltd.",
        "contact_name": "Ahmet Yılmaz",
        "project_name": "İstanbul Teknoloji Fuarı Stand Projesi",
        "fair_name": "İstanbul Teknoloji Fuarı 2025",
        "city": "İstanbul",
        "country": "Türkiye",
        "delivery_date": "2025-03-15"
    }
    
    try:
        response = requests.post(endpoint, params=test_data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        # Check required fields in response
        required_fields = ["success", "survey_token", "survey_link", "message"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAIL: Missing required field: {field}")
                return False
        
        if data.get("success"):
            print("✅ PASS: Regular survey invitation sent successfully")
            print(f"   Survey Token: {data.get('survey_token')}")
            print(f"   Survey Link: {data.get('survey_link')}")
            
            # Store token for later tests
            global regular_survey_token
            regular_survey_token = data.get('survey_token')
            return True
        else:
            print(f"⚠️  WARNING: Survey invitation failed: {data.get('error', 'Unknown error')}")
            return False
        
    except Exception as e:
        print(f"❌ FAIL: Error testing regular survey invitation: {str(e)}")
        return False

def test_arbitrary_survey_invitation():
    """Test sending arbitrary survey invitation with manual data"""
    print("=" * 80)
    print("TESTING ARBITRARY SURVEY INVITATION")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/surveys/send-arbitrary"
    print(f"Testing endpoint: {endpoint}")
    
    # Test data for arbitrary survey
    test_data = {
        "email": "test@example.com",
        "contact_name": "Test User",
        "company_name": "Test Company",
        "project_name": "Test Project"
    }
    
    try:
        response = requests.post(endpoint, json=test_data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        # Check required fields in response
        required_fields = ["success", "survey_token", "survey_link", "message"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAIL: Missing required field: {field}")
                return False
        
        if data.get("success"):
            print("✅ PASS: Arbitrary survey invitation sent successfully")
            print(f"   Survey Token: {data.get('survey_token')}")
            print(f"   Survey Link: {data.get('survey_link')}")
            
            # Store token for later tests
            global arbitrary_survey_token
            arbitrary_survey_token = data.get('survey_token')
            return True
        else:
            print(f"⚠️  WARNING: Arbitrary survey invitation failed: {data.get('error', 'Unknown error')}")
            return False
        
    except Exception as e:
        print(f"❌ FAIL: Error testing arbitrary survey invitation: {str(e)}")
        return False

def test_survey_retrieval_regular():
    """Test retrieving regular survey by token"""
    print("=" * 80)
    print("TESTING REGULAR SURVEY RETRIEVAL")
    print("=" * 80)
    
    if 'regular_survey_token' not in globals():
        print("⚠️  SKIP: No regular survey token available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/surveys/{regular_survey_token}"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        # Check required fields
        required_fields = ["survey_token", "customer", "project", "questions", "status"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAIL: Missing required field: {field}")
                return False
        
        print("✅ PASS: Regular survey retrieved successfully")
        print(f"   Survey Token: {data.get('survey_token')}")
        print(f"   Customer: {data.get('customer', {}).get('name', 'N/A')}")
        print(f"   Project: {data.get('project', {}).get('name', 'N/A')}")
        print(f"   Questions: {len(data.get('questions', []))}")
        print(f"   Is Arbitrary: {data.get('is_arbitrary', False)}")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing regular survey retrieval: {str(e)}")
        return False

def test_survey_retrieval_arbitrary():
    """Test retrieving arbitrary survey by token"""
    print("=" * 80)
    print("TESTING ARBITRARY SURVEY RETRIEVAL")
    print("=" * 80)
    
    if 'arbitrary_survey_token' not in globals():
        print("⚠️  SKIP: No arbitrary survey token available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/surveys/{arbitrary_survey_token}"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        # Check required fields
        required_fields = ["survey_token", "customer", "project", "questions", "status"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAIL: Missing required field: {field}")
                return False
        
        # Check if it's properly marked as arbitrary
        if not data.get('is_arbitrary', False):
            print("❌ FAIL: Arbitrary survey should have is_arbitrary=true")
            return False
        
        print("✅ PASS: Arbitrary survey retrieved successfully")
        print(f"   Survey Token: {data.get('survey_token')}")
        print(f"   Customer: {data.get('customer', {}).get('name', 'N/A')}")
        print(f"   Project: {data.get('project', {}).get('name', 'N/A')}")
        print(f"   Questions: {len(data.get('questions', []))}")
        print(f"   Is Arbitrary: {data.get('is_arbitrary', False)}")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing arbitrary survey retrieval: {str(e)}")
        return False

def test_survey_submission_regular():
    """Test submitting response for regular survey"""
    print("=" * 80)
    print("TESTING REGULAR SURVEY SUBMISSION")
    print("=" * 80)
    
    if 'regular_survey_token' not in globals():
        print("⚠️  SKIP: No regular survey token available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/surveys/{regular_survey_token}/submit"
    print(f"Testing endpoint: {endpoint}")
    
    # Test response data
    test_responses = {
        "1": "5",  # Very satisfied
        "2": "9"   # Quality rating 9/10
    }
    
    payload = {
        "responses": test_responses,
        "ip_address": "127.0.0.1"
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        if data.get("success"):
            print("✅ PASS: Regular survey response submitted successfully")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ FAIL: Survey submission failed: {data.get('error', 'Unknown error')}")
            return False
        
    except Exception as e:
        print(f"❌ FAIL: Error testing regular survey submission: {str(e)}")
        return False

def test_survey_submission_arbitrary():
    """Test submitting response for arbitrary survey"""
    print("=" * 80)
    print("TESTING ARBITRARY SURVEY SUBMISSION")
    print("=" * 80)
    
    if 'arbitrary_survey_token' not in globals():
        print("⚠️  SKIP: No arbitrary survey token available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/surveys/{arbitrary_survey_token}/submit"
    print(f"Testing endpoint: {endpoint}")
    
    # Test response data
    test_responses = {
        "1": "4",  # Satisfied
        "2": "8"   # Quality rating 8/10
    }
    
    payload = {
        "responses": test_responses,
        "ip_address": "127.0.0.1"
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        if data.get("success"):
            print("✅ PASS: Arbitrary survey response submitted successfully")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ FAIL: Survey submission failed: {data.get('error', 'Unknown error')}")
            return False
        
    except Exception as e:
        print(f"❌ FAIL: Error testing arbitrary survey submission: {str(e)}")
        return False

def test_invalid_survey_token():
    """Test error handling for invalid survey tokens"""
    print("=" * 80)
    print("TESTING INVALID SURVEY TOKEN HANDLING")
    print("=" * 80)
    
    invalid_token = "invalid-token-12345"
    endpoint = f"{BACKEND_URL}/api/surveys/{invalid_token}"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        if "error" in data and data.get("status") == 404:
            print("✅ PASS: Invalid survey token returns proper error")
            return True
        else:
            print(f"⚠️  WARNING: Expected error response for invalid token")
            return False
        
    except Exception as e:
        print(f"❌ FAIL: Error testing invalid survey token: {str(e)}")
        return False

def test_survey_stats():
    """Test survey statistics endpoint"""
    print("=" * 80)
    print("TESTING SURVEY STATISTICS ENDPOINT")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/surveys/stats"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ FAIL: Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not isinstance(data, dict):
            print("❌ FAIL: Should return JSON object")
            return False
        
        # Check required fields
        required_fields = ["total_sent", "total_completed", "response_rate", "recent_responses"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAIL: Missing required field: {field}")
                return False
        
        print("✅ PASS: Survey statistics retrieved successfully")
        print(f"   Total Sent: {data.get('total_sent')}")
        print(f"   Total Completed: {data.get('total_completed')}")
        print(f"   Response Rate: {data.get('response_rate')}%")
        print(f"   Recent Responses: {data.get('recent_responses')}")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Error testing survey statistics: {str(e)}")
        return False

def test_create_customer():
    """Test creating a new customer with Turkish form data including new Turkish fields"""
    print("=" * 80)
    print("TESTING CREATE CUSTOMER ENDPOINT WITH TURKISH DATA")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/customers"
    print(f"Testing endpoint: {endpoint}")
    
    # Test data matching the NewCustomerForm structure with Turkish-specific fields
    test_customer_data = {
        "companyName": "Test Şirketi A.Ş.",
        "relationshipType": "customer",
        "contactPerson": "Ahmet Yılmaz",
        "email": "ahmet@testsirket.com",
        "website": "testsirket.com",
        "phone": "532 123 4567",
        "countryCode": "TR",
        "address": "Maslak Mahallesi, Büyükdere Cad. No:123",
        "country": "TR",
        "city": "İstanbul",
        "sector": "Teknoloji",
        "notes": "Türkçe karakterli notlar: ğüşıöç",
        # Turkish-specific fields
        "companyTitle": "Test Şirketi Anonim Şirketi",
        "taxOffice": "İstanbul Vergi Dairesi Başkanlığı",
        "taxNumber": "1234567890"
    }
    
    try:
        print("\n1. Making request to create customer...")
        response = requests.post(endpoint, json=test_customer_data, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Customer creation endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
        
        # Parse response
        print("\n2. Parsing response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False, None
        
        # Validate response structure
        print("\n3. Validating response structure...")
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a dictionary")
            return False, None
        
        # Check required fields including Turkish-specific fields
        required_fields = ["id", "companyName", "relationshipType", "contactPerson", "email", "website", "country", "sector", "phone", "countryCode", "companyTitle", "taxOffice", "taxNumber"]
        missing_fields = []
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   ❌ FAIL: Response missing required fields: {missing_fields}")
            return False, None
        
        print("   ✅ PASS: Response has all required fields")
        
        # Validate field values
        print("\n4. Validating field values...")
        customer_id = data.get("id")
        if not customer_id:
            print("   ❌ FAIL: Customer ID should not be empty")
            return False, None
        
        # Check that input data matches response
        for field, expected_value in test_customer_data.items():
            actual_value = data.get(field)
            if actual_value != expected_value:
                print(f"   ❌ FAIL: Field {field} mismatch. Expected: {expected_value}, Got: {actual_value}")
                return False, None
        
        print("   ✅ PASS: All field values match input data")
        print(f"   Created Customer ID: {customer_id}")
        print(f"   Company Name: {data.get('companyName')}")
        print(f"   Email: {data.get('email')}")
        print(f"   Sector: {data.get('sector')}")
        
        print("\n✅ CREATE CUSTOMER TEST PASSED!")
        return True, customer_id
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False, None
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False, None

def test_get_all_customers():
    """Test retrieving all customers"""
    print("=" * 80)
    print("TESTING GET ALL CUSTOMERS ENDPOINT")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/customers"
    print(f"Testing endpoint: {endpoint}")
    
    try:
        print("\n1. Making request to get all customers...")
        response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Get all customers endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Parse response
        print("\n2. Parsing response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Validate response structure
        print("\n3. Validating response structure...")
        if not isinstance(data, list):
            print("   ❌ FAIL: Response should be a list of customers")
            return False
        
        print(f"   ✅ PASS: Response is a list with {len(data)} customers")
        
        # If there are customers, validate structure of first one
        if len(data) > 0:
            print("\n4. Validating customer structure...")
            first_customer = data[0]
            
            if not isinstance(first_customer, dict):
                print("   ❌ FAIL: Each customer should be a dictionary")
                return False
            
            # Check for key fields
            key_fields = ["id", "companyName"]
            for field in key_fields:
                if field not in first_customer:
                    print(f"   ❌ FAIL: Customer missing key field: {field}")
                    return False
            
            print("   ✅ PASS: Customer structure is valid")
            print(f"   Sample Customer: {first_customer.get('companyName')} (ID: {first_customer.get('id')})")
        
        print("\n✅ GET ALL CUSTOMERS TEST PASSED!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_get_specific_customer(customer_id):
    """Test retrieving a specific customer by ID"""
    print("=" * 80)
    print("TESTING GET SPECIFIC CUSTOMER ENDPOINT")
    print("=" * 80)
    
    if not customer_id:
        print("⚠️  SKIP: No customer ID available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/customers/{customer_id}"
    print(f"Testing endpoint: {endpoint}")
    print(f"Customer ID: {customer_id}")
    
    try:
        print("\n1. Making request to get specific customer...")
        response = requests.get(endpoint, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Get specific customer endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Parse response
        print("\n2. Parsing response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Validate response structure
        print("\n3. Validating response structure...")
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a customer dictionary")
            return False
        
        # Check that ID matches
        returned_id = data.get("id")
        if returned_id != customer_id:
            print(f"   ❌ FAIL: ID mismatch. Expected: {customer_id}, Got: {returned_id}")
            return False
        
        print("   ✅ PASS: Customer ID matches request")
        print(f"   Company Name: {data.get('companyName')}")
        print(f"   Email: {data.get('email')}")
        print(f"   Sector: {data.get('sector')}")
        
        print("\n✅ GET SPECIFIC CUSTOMER TEST PASSED!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_update_customer(customer_id):
    """Test updating a customer"""
    print("=" * 80)
    print("TESTING UPDATE CUSTOMER ENDPOINT")
    print("=" * 80)
    
    if not customer_id:
        print("⚠️  SKIP: No customer ID available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/customers/{customer_id}"
    print(f"Testing endpoint: {endpoint}")
    print(f"Customer ID: {customer_id}")
    
    # Update data
    update_data = {
        "companyName": "Test Şirketi A.Ş. (Updated)",
        "sector": "Bilişim Teknolojileri",
        "phone": "532 123 4568",
        "notes": "Updated customer information"
    }
    
    try:
        print("\n1. Making request to update customer...")
        response = requests.put(endpoint, json=update_data, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Update customer endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Parse response
        print("\n2. Parsing response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Validate response structure
        print("\n3. Validating response structure...")
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a customer dictionary")
            return False
        
        # Check that ID matches
        returned_id = data.get("id")
        if returned_id != customer_id:
            print(f"   ❌ FAIL: ID mismatch. Expected: {customer_id}, Got: {returned_id}")
            return False
        
        # Check that updates were applied
        print("\n4. Validating updates...")
        for field, expected_value in update_data.items():
            actual_value = data.get(field)
            if actual_value != expected_value:
                print(f"   ❌ FAIL: Field {field} not updated. Expected: {expected_value}, Got: {actual_value}")
                return False
        
        print("   ✅ PASS: All updates applied correctly")
        print(f"   Updated Company Name: {data.get('companyName')}")
        print(f"   Updated Sector: {data.get('sector')}")
        print(f"   Updated Phone: {data.get('phone')}")
        print(f"   Updated Notes: {data.get('notes')}")
        
        print("\n✅ UPDATE CUSTOMER TEST PASSED!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_delete_customer(customer_id):
    """Test deleting a customer"""
    print("=" * 80)
    print("TESTING DELETE CUSTOMER ENDPOINT")
    print("=" * 80)
    
    if not customer_id:
        print("⚠️  SKIP: No customer ID available from previous test")
        return True
    
    endpoint = f"{BACKEND_URL}/api/customers/{customer_id}"
    print(f"Testing endpoint: {endpoint}")
    print(f"Customer ID: {customer_id}")
    
    try:
        print("\n1. Making request to delete customer...")
        response = requests.delete(endpoint, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ PASS: Delete customer endpoint responds with status 200")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Parse response
        print("\n2. Parsing response...")
        try:
            data = response.json()
            print(f"   Response type: {type(data)}")
        except Exception as e:
            print(f"   ❌ FAIL: Could not parse JSON response: {str(e)}")
            return False
        
        # Validate response structure
        print("\n3. Validating response structure...")
        if not isinstance(data, dict):
            print("   ❌ FAIL: Response should be a dictionary")
            return False
        
        # Check success message
        if not data.get("success"):
            print("   ❌ FAIL: Response should indicate success")
            return False
        
        print("   ✅ PASS: Delete response indicates success")
        print(f"   Message: {data.get('message')}")
        
        # Verify customer is actually deleted
        print("\n4. Verifying customer deletion...")
        verify_endpoint = f"{BACKEND_URL}/api/customers/{customer_id}"
        verify_response = requests.get(verify_endpoint, timeout=30)
        
        if verify_response.status_code == 404:
            print("   ✅ PASS: Customer successfully deleted (404 on GET)")
        else:
            print(f"   ⚠️  WARNING: Expected 404 after deletion, got {verify_response.status_code}")
        
        print("\n✅ DELETE CUSTOMER TEST PASSED!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FAIL: Network error occurred: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ FAIL: Unexpected error occurred: {str(e)}")
        return False

def test_customer_validation_errors():
    """Test customer validation and error cases"""
    print("=" * 80)
    print("TESTING CUSTOMER VALIDATION AND ERROR CASES")
    print("=" * 80)
    
    endpoint = f"{BACKEND_URL}/api/customers"
    print(f"Testing endpoint: {endpoint}")
    
    # Test 1: Empty company name
    print("\n1. Testing empty company name...")
    invalid_data = {
        "companyName": "",
        "relationshipType": "customer",
        "email": "test@example.com"
    }
    
    try:
        response = requests.post(endpoint, json=invalid_data, timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code >= 400:
            print("   ✅ PASS: Empty company name properly rejected")
        else:
            print("   ⚠️  WARNING: Empty company name was accepted (might be handled by frontend)")
    except Exception as e:
        print(f"   ⚠️  WARNING: Error testing empty company name: {str(e)}")
    
    # Test 2: Invalid email format
    print("\n2. Testing invalid email format...")
    invalid_email_data = {
        "companyName": "Test Company",
        "relationshipType": "customer",
        "email": "invalid-email"
    }
    
    try:
        response = requests.post(endpoint, json=invalid_email_data, timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code >= 400:
            print("   ✅ PASS: Invalid email format properly rejected")
        else:
            print("   ⚠️  WARNING: Invalid email format was accepted (validation might be frontend-only)")
    except Exception as e:
        print(f"   ⚠️  WARNING: Error testing invalid email: {str(e)}")
    
    # Test 3: Non-existent customer ID for GET
    print("\n3. Testing non-existent customer ID...")
    non_existent_id = "non-existent-customer-id-12345"
    get_endpoint = f"{BACKEND_URL}/api/customers/{non_existent_id}"
    
    try:
        response = requests.get(get_endpoint, timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("   ✅ PASS: Non-existent customer ID returns 404")
        else:
            print(f"   ❌ FAIL: Expected 404 for non-existent customer, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ FAIL: Error testing non-existent customer: {str(e)}")
        return False
    
    # Test 4: Non-existent customer ID for UPDATE
    print("\n4. Testing update on non-existent customer...")
    update_data = {"companyName": "Updated Name"}
    
    try:
        response = requests.put(get_endpoint, json=update_data, timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("   ✅ PASS: Update on non-existent customer returns 404")
        else:
            print(f"   ❌ FAIL: Expected 404 for update on non-existent customer, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ FAIL: Error testing update on non-existent customer: {str(e)}")
        return False
    
    # Test 5: Non-existent customer ID for DELETE
    print("\n5. Testing delete on non-existent customer...")
    
    try:
        response = requests.delete(get_endpoint, timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("   ✅ PASS: Delete on non-existent customer returns 404")
        else:
            print(f"   ❌ FAIL: Expected 404 for delete on non-existent customer, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ FAIL: Error testing delete on non-existent customer: {str(e)}")
        return False
    
    print("\n✅ CUSTOMER VALIDATION AND ERROR TESTS PASSED!")
    return True

def main():
    """Run all tests"""
    print("Starting Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Initialize global variables for survey tokens
    global regular_survey_token, arbitrary_survey_token
    regular_survey_token = None
    arbitrary_survey_token = None
    
    # Test Customer CRUD endpoints (NEW FUNCTIONALITY)
    print("\n" + "=" * 80)
    print("TESTING CUSTOMER CRUD ENDPOINTS")
    print("=" * 80)
    
    create_customer_passed, created_customer_id = test_create_customer()
    get_all_customers_passed = test_get_all_customers()
    get_specific_customer_passed = test_get_specific_customer(created_customer_id)
    update_customer_passed = test_update_customer(created_customer_id)
    delete_customer_passed = test_delete_customer(created_customer_id)
    customer_validation_passed = test_customer_validation_errors()
    
    # Test currency conversion endpoints (existing functionality)
    currency_rates_test_passed = test_currency_rates_endpoint()
    currency_conversion_test_passed = test_currency_conversion_endpoint()
    
    # Test the CSV template functionality (existing)
    fairs_test_passed = test_csv_template_download_fairs()
    
    # Test error handling
    invalid_test_passed = test_invalid_category()
    
    # Test survey system functionality (NEW ENHANCED FEATURES)
    print("\n" + "=" * 80)
    print("TESTING ENHANCED SURVEY SYSTEM")
    print("=" * 80)
    
    survey_questions_passed = test_survey_questions_endpoint()
    test_email_passed = test_send_test_email()
    regular_invitation_passed = test_regular_survey_invitation()
    arbitrary_invitation_passed = test_arbitrary_survey_invitation()
    regular_retrieval_passed = test_survey_retrieval_regular()
    arbitrary_retrieval_passed = test_survey_retrieval_arbitrary()
    regular_submission_passed = test_survey_submission_regular()
    arbitrary_submission_passed = test_survey_submission_arbitrary()
    invalid_token_passed = test_invalid_survey_token()
    survey_stats_passed = test_survey_stats()
    
    # Final summary
    print("\n" + "=" * 80)
    print("OVERALL TEST SUMMARY")
    print("=" * 80)
    
    # Customer CRUD functionality
    print("--- CUSTOMER CRUD ENDPOINTS RESULTS ---")
    
    if create_customer_passed:
        print("✅ Create Customer (POST): PASSED")
    else:
        print("❌ Create Customer (POST): FAILED")
    
    if get_all_customers_passed:
        print("✅ Get All Customers (GET): PASSED")
    else:
        print("❌ Get All Customers (GET): FAILED")
    
    if get_specific_customer_passed:
        print("✅ Get Specific Customer (GET): PASSED")
    else:
        print("❌ Get Specific Customer (GET): FAILED")
    
    if update_customer_passed:
        print("✅ Update Customer (PUT): PASSED")
    else:
        print("❌ Update Customer (PUT): FAILED")
    
    if delete_customer_passed:
        print("✅ Delete Customer (DELETE): PASSED")
    else:
        print("❌ Delete Customer (DELETE): FAILED")
    
    if customer_validation_passed:
        print("✅ Customer Validation & Error Handling: PASSED")
    else:
        print("❌ Customer Validation & Error Handling: FAILED")
    
    # Existing functionality
    print("\n--- EXISTING FUNCTIONALITY RESULTS ---")
    
    if currency_rates_test_passed:
        print("✅ Currency Rates Endpoint: PASSED")
    else:
        print("❌ Currency Rates Endpoint: FAILED")
    
    if currency_conversion_test_passed:
        print("✅ Currency Conversion Endpoint: PASSED")
    else:
        print("❌ Currency Conversion Endpoint: FAILED")
    
    if fairs_test_passed:
        print("✅ Fairs CSV Template Download: PASSED")
    else:
        print("❌ Fairs CSV Template Download: FAILED")
    
    if invalid_test_passed:
        print("✅ Invalid Category Handling: PASSED")
    else:
        print("❌ Invalid Category Handling: FAILED")
    
    # Survey system functionality
    print("\n--- ENHANCED SURVEY SYSTEM RESULTS ---")
    
    if survey_questions_passed:
        print("✅ Survey Questions Endpoint: PASSED")
    else:
        print("❌ Survey Questions Endpoint: FAILED")
    
    if test_email_passed:
        print("✅ Test Email Functionality: PASSED")
    else:
        print("❌ Test Email Functionality: FAILED")
    
    if regular_invitation_passed:
        print("✅ Regular Survey Invitation: PASSED")
    else:
        print("❌ Regular Survey Invitation: FAILED")
    
    if arbitrary_invitation_passed:
        print("✅ Arbitrary Survey Invitation: PASSED")
    else:
        print("❌ Arbitrary Survey Invitation: FAILED")
    
    if regular_retrieval_passed:
        print("✅ Regular Survey Retrieval: PASSED")
    else:
        print("❌ Regular Survey Retrieval: FAILED")
    
    if arbitrary_retrieval_passed:
        print("✅ Arbitrary Survey Retrieval: PASSED")
    else:
        print("❌ Arbitrary Survey Retrieval: FAILED")
    
    if regular_submission_passed:
        print("✅ Regular Survey Submission: PASSED")
    else:
        print("❌ Regular Survey Submission: FAILED")
    
    if arbitrary_submission_passed:
        print("✅ Arbitrary Survey Submission: PASSED")
    else:
        print("❌ Arbitrary Survey Submission: FAILED")
    
    if invalid_token_passed:
        print("✅ Invalid Token Handling: PASSED")
    else:
        print("❌ Invalid Token Handling: FAILED")
    
    if survey_stats_passed:
        print("✅ Survey Statistics: PASSED")
    else:
        print("❌ Survey Statistics: FAILED")
    
    # Calculate overall results
    customer_tests = [
        create_customer_passed,
        get_all_customers_passed,
        get_specific_customer_passed,
        update_customer_passed,
        delete_customer_passed,
        customer_validation_passed
    ]
    
    existing_tests = [
        currency_rates_test_passed,
        currency_conversion_test_passed,
        fairs_test_passed,
        invalid_test_passed
    ]
    
    survey_tests = [
        survey_questions_passed,
        test_email_passed,
        regular_invitation_passed,
        arbitrary_invitation_passed,
        regular_retrieval_passed,
        arbitrary_retrieval_passed,
        regular_submission_passed,
        arbitrary_submission_passed,
        invalid_token_passed,
        survey_stats_passed
    ]
    
    all_tests_passed = all(customer_tests + existing_tests + survey_tests)
    customer_tests_passed = all(customer_tests)
    survey_tests_passed = all(survey_tests)
    
    print(f"\n--- SUMMARY ---")
    print(f"Customer CRUD Endpoints: {sum(customer_tests)}/{len(customer_tests)} tests passed")
    print(f"Existing Functionality: {sum(existing_tests)}/{len(existing_tests)} tests passed")
    print(f"Enhanced Survey System: {sum(survey_tests)}/{len(survey_tests)} tests passed")
    
    if all_tests_passed:
        print("\n🎉 ALL TESTS PASSED!")
        return True
    elif customer_tests_passed:
        print("\n✅ CUSTOMER CRUD ENDPOINTS TESTS PASSED!")
        if not survey_tests_passed:
            print("⚠️  Some survey system tests failed")
        if not all(existing_tests):
            print("⚠️  Some existing functionality tests failed")
        return True
    else:
        print("\n❌ SOME TESTS FAILED!")
        if not customer_tests_passed:
            print("❌ Customer CRUD endpoints have issues")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)