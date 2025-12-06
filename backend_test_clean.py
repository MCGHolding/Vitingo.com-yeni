#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://vitingo-banking.preview.emergentagent.com"

def test_calendar_archive_and_meeting_requests():
    """
    Backend Arşiv ve Toplantı Talepleri Test Görevleri
    
    Test edilecek endpoint'ler:
    1. POST /api/calendar/events/archive-past - Geçmiş toplantıları arşivlemek
    2. GET /api/calendar/events?archived_only=true - Sadece arşivlenmiş toplantıları getirmek
    3. GET /api/calendar/events?include_archived=false - Sadece aktif toplantıları getirmek
    4. GET /api/meeting-requests - Tüm toplantı taleplerini çekmek
    
    Beklenen Sonuçlar:
    - Tüm endpoint'ler düzgün çalışmalı
    - Arşiv endpoint'i geçmiş toplantıları arşivlemeli
    - Filtreler doğru çalışmalı (archived_only, include_archived)
    - Toplantı talepleri endpoint'i düzgün veri dönmeli
    """
    
    print("=" * 100)
    print("🗂️ BACKEND ARŞİV VE TOPLANTI TALEPLERİ TEST GÖREVLERİ 🗂️")
    print("=" * 100)
    print("CONTEXT: Takvim etkinlikleri arşivleme ve toplantı talepleri API'lerini test ediyoruz.")
    print("Bu test, geçmiş toplantıları arşivleme, arşivlenmiş/aktif toplantıları filtreleme")
    print("ve toplantı taleplerini çekme işlemlerini kapsamaktadır.")
    print("=" * 100)
    
    test_results = {
        "archive_endpoint_working": False,
        "archived_only_filter_working": False,
        "include_archived_filter_working": False,
        "meeting_requests_working": False,
        "archived_meetings_count": 0,
        "active_meetings_count": 0,
        "meeting_requests_count": 0,
        "archive_operation_successful": False,
        "critical_issues": [],
        "warnings": []
    }
    
    # TEST 1: Arşiv Endpoint'i - POST /api/calendar/events/archive-past
    print("\n" + "=" * 80)
    print("TEST 1: ARŞİV ENDPOINT'İ - POST /api/calendar/events/archive-past")
    print("=" * 80)
    print("Amaç: Geçmiş tarihteki tüm toplantıları otomatik olarak arşivlemek")
    
    archive_endpoint = f"{BACKEND_URL}/api/calendar/events/archive-past"
    print(f"Testing endpoint: {archive_endpoint}")
    
    try:
        # Make POST request to archive past events
        print("\n1. Geçmiş toplantıları arşivleme işlemi başlatılıyor...")
        response = requests.post(archive_endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Arşiv endpoint'i başarıyla yanıt verdi")
            test_results["archive_endpoint_working"] = True
            
            try:
                result = response.json()
                print(f"Response type: {type(result)}")
                print(f"Response content: {result}")
                
                # Check if response contains archived count
                if "archived_count" in result:
                    archived_count = result["archived_count"]
                    print(f"📊 Arşivlenen toplantı sayısı: {archived_count}")
                    test_results["archive_operation_successful"] = True
                    
                    if archived_count > 0:
                        print(f"✅ PASS: {archived_count} toplantı başarıyla arşivlendi")
                    else:
                        print("ℹ️  INFO: Arşivlenecek geçmiş toplantı bulunamadı")
                        test_results["warnings"].append("NO_PAST_MEETINGS_TO_ARCHIVE")
                else:
                    print("⚠️  WARNING: Response'da archived_count bilgisi yok")
                    test_results["warnings"].append("MISSING_ARCHIVED_COUNT_IN_RESPONSE")
                    
            except Exception as e:
                print(f"❌ FAIL: Arşiv response'u parse edilemedi: {str(e)}")
                test_results["critical_issues"].append(f"ARCHIVE_RESPONSE_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Arşiv endpoint'i hata döndü: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"ARCHIVE_ENDPOINT_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Arşiv endpoint'i request hatası: {str(e)}")
        test_results["critical_issues"].append(f"ARCHIVE_REQUEST_ERROR: {str(e)}")
    
    # TEST 2: Arşivlenmiş Toplantıları Çekme - GET /api/calendar/events?archived_only=true
    print("\n" + "=" * 80)
    print("TEST 2: ARŞİVLENMİŞ TOPLANTILARI ÇEKME - GET /api/calendar/events?archived_only=true")
    print("=" * 80)
    print("Amaç: Sadece arşivlenmiş toplantıları getirmek")
    
    archived_endpoint = f"{BACKEND_URL}/api/calendar/events?archived_only=true"
    print(f"Testing endpoint: {archived_endpoint}")
    
    try:
        print("\n1. Arşivlenmiş toplantıları çekme işlemi...")
        response = requests.get(archived_endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Arşivlenmiş toplantılar endpoint'i yanıt verdi")
            
            try:
                archived_events = response.json()
                print(f"Response type: {type(archived_events)}")
                
                if isinstance(archived_events, list):
                    archived_count = len(archived_events)
                    test_results["archived_meetings_count"] = archived_count
                    print(f"📊 Arşivlenmiş toplantı sayısı: {archived_count}")
                    
                    if archived_count > 0:
                        print("✅ PASS: Arşivlenmiş toplantılar bulundu")
                        test_results["archived_only_filter_working"] = True
                        
                        # Verify all returned events are archived
                        print("\n2. Arşivlenmiş toplantıları doğrulama...")
                        all_archived = True
                        past_date_count = 0
                        
                        for i, event in enumerate(archived_events[:5], 1):  # Check first 5
                            event_id = event.get("id", "N/A")
                            title = event.get("title", "N/A")
                            is_archived = event.get("is_archived", False)
                            end_datetime = event.get("end_datetime", "")
                            
                            print(f"   {i}. ID: {event_id}")
                            print(f"      Başlık: {title}")
                            print(f"      Arşivlenmiş: {is_archived}")
                            print(f"      Bitiş Tarihi: {end_datetime}")
                            
                            # Check if event is marked as archived
                            if not is_archived:
                                print(f"      ❌ FAIL: Toplantı arşivlenmiş olarak işaretlenmemiş!")
                                all_archived = False
                            else:
                                print(f"      ✅ PASS: Toplantı arşivlenmiş olarak işaretli")
                            
                            # Check if end_datetime is in the past
                            if end_datetime:
                                try:
                                    end_dt = datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
                                    now = datetime.now(end_dt.tzinfo)
                                    if end_dt < now:
                                        past_date_count += 1
                                        print(f"      ✅ PASS: Toplantı geçmiş tarihli")
                                    else:
                                        print(f"      ⚠️  WARNING: Toplantı gelecek tarihli ama arşivlenmiş")
                                except Exception as e:
                                    print(f"      ⚠️  WARNING: Tarih parse edilemedi: {str(e)}")
                        
                        if all_archived:
                            print("✅ PASS: Tüm dönen toplantılar is_archived=true")
                        else:
                            print("❌ FAIL: Bazı toplantılar arşivlenmiş olarak işaretlenmemiş")
                            test_results["critical_issues"].append("NON_ARCHIVED_EVENTS_IN_ARCHIVED_FILTER")
                        
                        print(f"📊 Geçmiş tarihli toplantı sayısı: {past_date_count}/{min(5, archived_count)}")
                        
                    else:
                        print("ℹ️  INFO: Arşivlenmiş toplantı bulunamadı")
                        test_results["archived_only_filter_working"] = True  # Still working, just no data
                        test_results["warnings"].append("NO_ARCHIVED_MEETINGS_FOUND")
                else:
                    print("❌ FAIL: Response array formatında değil")
                    test_results["critical_issues"].append("ARCHIVED_EVENTS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Arşivlenmiş toplantılar response'u parse edilemedi: {str(e)}")
                test_results["critical_issues"].append(f"ARCHIVED_EVENTS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Arşivlenmiş toplantılar endpoint'i hata döndü: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"ARCHIVED_EVENTS_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Arşivlenmiş toplantılar request hatası: {str(e)}")
        test_results["critical_issues"].append(f"ARCHIVED_EVENTS_REQUEST_ERROR: {str(e)}")
    
    # TEST 3: Aktif Toplantıları Çekme - GET /api/calendar/events?include_archived=false
    print("\n" + "=" * 80)
    print("TEST 3: AKTİF TOPLANTILARI ÇEKME - GET /api/calendar/events?include_archived=false")
    print("=" * 80)
    print("Amaç: Sadece aktif (arşivlenmemiş) toplantıları getirmek")
    
    active_endpoint = f"{BACKEND_URL}/api/calendar/events?include_archived=false"
    print(f"Testing endpoint: {active_endpoint}")
    
    try:
        print("\n1. Aktif toplantıları çekme işlemi...")
        response = requests.get(active_endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Aktif toplantılar endpoint'i yanıt verdi")
            
            try:
                active_events = response.json()
                print(f"Response type: {type(active_events)}")
                
                if isinstance(active_events, list):
                    active_count = len(active_events)
                    test_results["active_meetings_count"] = active_count
                    print(f"📊 Aktif toplantı sayısı: {active_count}")
                    
                    if active_count > 0:
                        print("✅ PASS: Aktif toplantılar bulundu")
                        test_results["include_archived_filter_working"] = True
                        
                        # Verify no returned events are archived
                        print("\n2. Aktif toplantıları doğrulama...")
                        all_active = True
                        future_date_count = 0
                        
                        for i, event in enumerate(active_events[:5], 1):  # Check first 5
                            event_id = event.get("id", "N/A")
                            title = event.get("title", "N/A")
                            is_archived = event.get("is_archived", False)
                            start_datetime = event.get("start_datetime", "")
                            
                            print(f"   {i}. ID: {event_id}")
                            print(f"      Başlık: {title}")
                            print(f"      Arşivlenmiş: {is_archived}")
                            print(f"      Başlangıç Tarihi: {start_datetime}")
                            
                            # Check if event is NOT archived
                            if is_archived:
                                print(f"      ❌ FAIL: Arşivlenmiş toplantı aktif listede!")
                                all_active = False
                            else:
                                print(f"      ✅ PASS: Toplantı aktif (arşivlenmemiş)")
                            
                            # Check if start_datetime is in the future (optional)
                            if start_datetime:
                                try:
                                    start_dt = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
                                    now = datetime.now(start_dt.tzinfo)
                                    if start_dt >= now:
                                        future_date_count += 1
                                        print(f"      ✅ PASS: Toplantı gelecek tarihli")
                                    else:
                                        print(f"      ℹ️  INFO: Toplantı geçmiş tarihli ama aktif")
                                except Exception as e:
                                    print(f"      ⚠️  WARNING: Tarih parse edilemedi: {str(e)}")
                        
                        if all_active:
                            print("✅ PASS: Hiçbir dönen toplantı is_archived=true değil")
                        else:
                            print("❌ FAIL: Bazı arşivlenmiş toplantılar aktif listede")
                            test_results["critical_issues"].append("ARCHIVED_EVENTS_IN_ACTIVE_FILTER")
                        
                        print(f"📊 Gelecek tarihli toplantı sayısı: {future_date_count}/{min(5, active_count)}")
                        
                    else:
                        print("ℹ️  INFO: Aktif toplantı bulunamadı (liste boş olabilir)")
                        test_results["include_archived_filter_working"] = True  # Still working, just no data
                        test_results["warnings"].append("NO_ACTIVE_MEETINGS_FOUND")
                else:
                    print("❌ FAIL: Response array formatında değil")
                    test_results["critical_issues"].append("ACTIVE_EVENTS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Aktif toplantılar response'u parse edilemedi: {str(e)}")
                test_results["critical_issues"].append(f"ACTIVE_EVENTS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Aktif toplantılar endpoint'i hata döndü: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"ACTIVE_EVENTS_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Aktif toplantılar request hatası: {str(e)}")
        test_results["critical_issues"].append(f"ACTIVE_EVENTS_REQUEST_ERROR: {str(e)}")
    
    # TEST 4: Toplantı Talepleri Endpoint'i - GET /api/meeting-requests
    print("\n" + "=" * 80)
    print("TEST 4: TOPLANTI TALEPLERİ ENDPOINT'İ - GET /api/meeting-requests")
    print("=" * 80)
    print("Amaç: Tüm toplantı taleplerini çekmek")
    
    meeting_requests_endpoint = f"{BACKEND_URL}/api/meeting-requests"
    print(f"Testing endpoint: {meeting_requests_endpoint}")
    
    try:
        print("\n1. Toplantı taleplerini çekme işlemi...")
        response = requests.get(meeting_requests_endpoint, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Toplantı talepleri endpoint'i yanıt verdi")
            test_results["meeting_requests_working"] = True
            
            try:
                meeting_requests = response.json()
                print(f"Response type: {type(meeting_requests)}")
                
                if isinstance(meeting_requests, list):
                    requests_count = len(meeting_requests)
                    test_results["meeting_requests_count"] = requests_count
                    print(f"📊 Toplantı talebi sayısı: {requests_count}")
                    
                    if requests_count > 0:
                        print("✅ PASS: Toplantı talepleri bulundu")
                        
                        # Verify meeting request structure
                        print("\n2. Toplantı taleplerini doğrulama...")
                        valid_requests = 0
                        
                        for i, request in enumerate(meeting_requests[:5], 1):  # Check first 5
                            request_id = request.get("id", "N/A")
                            subject = request.get("subject", "N/A")
                            date = request.get("date", "N/A")
                            start_time = request.get("start_time", "N/A")
                            end_time = request.get("end_time", "N/A")
                            meeting_type = request.get("meeting_type", "N/A")
                            
                            print(f"   {i}. ID: {request_id}")
                            print(f"      Konu: {subject}")
                            print(f"      Tarih: {date}")
                            print(f"      Saat: {start_time} - {end_time}")
                            print(f"      Tür: {meeting_type}")
                            
                            # Check required fields
                            required_fields = ["id", "subject", "date", "start_time", "end_time"]
                            missing_fields = []
                            for field in required_fields:
                                if field not in request or not request[field]:
                                    missing_fields.append(field)
                            
                            if missing_fields:
                                print(f"      ❌ FAIL: Eksik alanlar: {missing_fields}")
                                test_results["warnings"].append(f"MEETING_REQUEST_{i}_MISSING_FIELDS_{missing_fields}")
                            else:
                                print(f"      ✅ PASS: Tüm gerekli alanlar mevcut")
                                valid_requests += 1
                        
                        print(f"📊 Geçerli toplantı talebi sayısı: {valid_requests}/{min(5, requests_count)}")
                        
                        if valid_requests == min(5, requests_count):
                            print("✅ PASS: Tüm toplantı talepleri geçerli yapıda")
                        else:
                            print("⚠️  WARNING: Bazı toplantı taleplerinde eksik alanlar var")
                        
                    else:
                        print("ℹ️  INFO: Toplantı talebi bulunamadı")
                        test_results["warnings"].append("NO_MEETING_REQUESTS_FOUND")
                else:
                    print("❌ FAIL: Response array formatında değil")
                    test_results["critical_issues"].append("MEETING_REQUESTS_NOT_ARRAY")
                    
            except Exception as e:
                print(f"❌ FAIL: Toplantı talepleri response'u parse edilemedi: {str(e)}")
                test_results["critical_issues"].append(f"MEETING_REQUESTS_PARSE_ERROR: {str(e)}")
        else:
            print(f"❌ FAIL: Toplantı talepleri endpoint'i hata döndü: {response.status_code}")
            print(f"Response: {response.text}")
            test_results["critical_issues"].append(f"MEETING_REQUESTS_ERROR_{response.status_code}")
            
    except Exception as e:
        print(f"❌ FAIL: Toplantı talepleri request hatası: {str(e)}")
        test_results["critical_issues"].append(f"MEETING_REQUESTS_REQUEST_ERROR: {str(e)}")
    
    # FINAL TEST REPORT
    print("\n" + "=" * 100)
    print("🔍 FINAL TEST REPORT - ARŞİV VE TOPLANTI TALEPLERİ")
    print("=" * 100)
    
    print(f"📊 TEST SONUÇLARI:")
    print(f"   • Arşiv Endpoint'i: {'✅ Çalışıyor' if test_results['archive_endpoint_working'] else '❌ Çalışmıyor'}")
    print(f"   • Arşivlenmiş Filtre: {'✅ Çalışıyor' if test_results['archived_only_filter_working'] else '❌ Çalışmıyor'}")
    print(f"   • Aktif Filtre: {'✅ Çalışıyor' if test_results['include_archived_filter_working'] else '❌ Çalışmıyor'}")
    print(f"   • Toplantı Talepleri: {'✅ Çalışıyor' if test_results['meeting_requests_working'] else '❌ Çalışmıyor'}")
    
    print(f"\n📈 VERİ İSTATİSTİKLERİ:")
    print(f"   • Arşivlenmiş Toplantı Sayısı: {test_results['archived_meetings_count']}")
    print(f"   • Aktif Toplantı Sayısı: {test_results['active_meetings_count']}")
    print(f"   • Toplantı Talebi Sayısı: {test_results['meeting_requests_count']}")
    
    print(f"\n🚨 KRİTİK SORUNLAR: {len(test_results['critical_issues'])}")
    for issue in test_results['critical_issues']:
        print(f"   • {issue}")
    
    print(f"\n⚠️  UYARILAR: {len(test_results['warnings'])}")
    for warning in test_results['warnings']:
        print(f"   • {warning}")
    
    # CONCLUSIONS AND RECOMMENDATIONS
    print(f"\n📋 SONUÇLAR VE ÖNERİLER:")
    
    working_endpoints = sum([
        test_results['archive_endpoint_working'],
        test_results['archived_only_filter_working'],
        test_results['include_archived_filter_working'],
        test_results['meeting_requests_working']
    ])
    
    if working_endpoints == 4:
        print("🎉 MÜKEMMEL: Tüm endpoint'ler düzgün çalışıyor!")
        print("   • Arşiv endpoint'i geçmiş toplantıları arşivleyebiliyor")
        print("   • Filtreler doğru çalışıyor (archived_only, include_archived)")
        print("   • Toplantı talepleri endpoint'i düzgün veri dönüyor")
        
        if test_results['archived_meetings_count'] == 0 and test_results['active_meetings_count'] == 0:
            print("\n📝 NOT: Veritabanında test verisi yoksa, lütfen durumu belirt ama endpoint'lerin çalıştığını doğrula.")
        
    elif working_endpoints >= 3:
        print("✅ İYİ: Çoğu endpoint çalışıyor, küçük sorunlar var")
        print("   ÖNERİ: Çalışmayan endpoint'leri kontrol edin")
        
    elif working_endpoints >= 2:
        print("⚠️  ORTA: Bazı endpoint'ler çalışıyor, önemli sorunlar var")
        print("   ÖNERİ: Backend servis loglarını kontrol edin")
        
    else:
        print("🚨 KRİTİK: Çoğu endpoint çalışmıyor!")
        print("   ÖNERİ: Backend servisini yeniden başlatın ve logları kontrol edin")
    
    print(f"\n🎯 SONRAKI ADIMLAR:")
    print("   1. Eğer veritabanında test verisi yoksa, sample data oluşturun")
    print("   2. Backend servis loglarını kontrol edin (/var/log/supervisor/backend.*.log)")
    print("   3. MongoDB bağlantısını doğrulayın")
    print("   4. Endpoint'lerin doğru URL'lerle çağrıldığını kontrol edin")
    
    # Return overall test result
    has_critical_issues = len(test_results['critical_issues']) > 0
    
    if has_critical_issues:
        print(f"\n❌ GENEL SONUÇ: KRİTİK SORUNLAR BULUNDU")
        return False
    elif working_endpoints >= 3:
        print(f"\n✅ GENEL SONUÇ: ENDPOINT'LER BAŞARIYLA ÇALIŞIYOR")
        return True
    else:
        print(f"\n⚠️  GENEL SONUÇ: BAZI SORUNLAR VAR AMA TEMEL İŞLEVSELLİK ÇALIŞIYOR")
        return True

if __name__ == "__main__":
    print("🚀 Starting Backend API Tests...")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    # Run the specific test requested in the review
    print("\n🔍 Running Calendar Archive and Meeting Requests Test...")
    try:
        result = test_calendar_archive_and_meeting_requests()
        if result:
            print("\n🎉 CALENDAR ARCHIVE AND MEETING REQUESTS TEST PASSED!")
            sys.exit(0)
        else:
            print("\n❌ CALENDAR ARCHIVE AND MEETING REQUESTS TEST FAILED!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Calendar Archive and Meeting Requests test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)