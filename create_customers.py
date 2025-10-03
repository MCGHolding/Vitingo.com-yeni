#!/usr/bin/env python3

import sys
import os
sys.path.append('/app/backend')

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

async def create_mock_customers():
    # MongoDB connection
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.test_database
    
    # Clear existing customers
    await db.customers.delete_many({})
    print("Cleared existing customers")
    
    # Company data
    companies = [
        ("Anadolu Holding", "Anadolu Endüstri Holding Anonim Şirketi", "Holding", "Ataşehir V.D.", "8860094304"),
        ("Turkcell", "Turkcell İletişim Hizmetleri Anonim Şirketi", "Telekomunikasyon", "Beşiktaş V.D.", "3530808304"),
        ("Arçelik", "Arçelik Anonim Şirketi", "Beyaz Eşya", "Sütlüce V.D.", "8850003907"),
        ("Garanti BBVA", "Türkiye Garanti Bankası Anonim Şirketi", "Bankacılık", "Levent V.D.", "1261070407"),
        ("Trendyol", "Trendyol E-Ticaret Anonim Şirketi", "E-Ticaret", "Sarıyer V.D.", "0870877304"),
        ("Migros", "Migros Ticaret Anonim Şirketi", "Perakende", "Ataşehir V.D.", "8690051901"),
        ("TAV Havalimanları", "TAV Havalimanları Holding Anonim Şirketi", "Havacılık", "Bakırköy V.D.", "5770051726"),
        ("BIM", "BİM Birleşik Mağazalar Anonim Şirketi", "Perakende", "Şişli V.D.", "3890851304"),
        ("Coca-Cola İçecek", "Coca-Cola İçecek Anonim Şirketi", "İçecek", "Etiler V.D.", "2220051304"),
        ("Enka İnşaat", "Enka İnşaat ve Sanayi Anonim Şirketi", "İnşaat", "Sarıyer V.D.", "5770051901"),
        ("Vakıfbank", "Türkiye Vakıflar Bankası Türk Anonim Ortaklığı", "Bankacılık", "Ümraniye V.D.", "1261074507"),
        ("Eczacıbaşı Holding", "Eczacıbaşı Holding Anonim Şirketi", "Holding", "Levent V.D.", "8860094507"),
        ("Ford Otosan", "Ford Otomotiv Sanayi Anonim Şirketi", "Otomotiv", "Gebze V.D.", "4130051304"),
        ("Halkbank", "Türkiye Halk Bankası Anonim Şirketi", "Bankacılık", "Ataşehir V.D.", "1261074304"),
        ("Getir", "Getir Perakende Lojistik Anonim Şirketi", "Teknoloji", "Beykoz V.D.", "0870877507"),
        ("Pegasus", "Pegasus Hava Taşımacılığı Anonim Şirketi", "Havacılık", "Bakırköy V.D.", "8760051304"),
        ("Akbank", "Akbank Türk Anonim Şirketi", "Bankacılık", "Levent V.D.", "1261070304"),
        ("THY", "Türk Hava Yolları Anonim Ortaklığı", "Havacılık", "Yeşilköy V.D.", "2200051304"),
        ("Teknosa", "Teknosa İç ve Dış Ticaret Anonim Şirketi", "Teknoloji", "Sarıyer V.D.", "0870877401"),
        ("Zorlu Holding", "Zorlu Holding Anonim Şirketi", "Holding", "Beşiktaş V.D.", "8860094401"),
        ("Siemens Türkiye", "Siemens Sanayi ve Ticaret Anonim Şirketi", "Teknoloji", "Maslak V.D.", "1330051304"),
        ("Borusan Holding", "Borusan Holding Anonim Şirketi", "Holding", "Okmeydanı V.D.", "8860094202"),
        ("Vestel", "Vestel Elektronik Sanayi ve Ticaret Anonim Şirketi", "Elektronik", "Manisa V.D.", "4500051304"),
        ("CarrefourSA", "CarrefourSA Carrefour Sabancı Ticaret Merkezi Anonim Şirketi", "Perakende", "Levent V.D.", "8690051702"),
        ("Şişe Cam", "Türkiye Şişe ve Cam Fabrikaları Anonim Şirketi", "Cam", "Ataşehir V.D.", "2860051304"),
        ("Doğan Holding", "Doğan Şirketler Grubu Holding Anonim Şirketi", "Medya", "Etiler V.D.", "8860094101"),
        ("Yemeksepeti", "Yemeksepeti Elektronik İletişim Tanıtım ve Pazarlama Ltd. Şti.", "Teknoloji", "Sarıyer V.D.", "0870877201"),
        ("TOFAŞ", "Tofaş Türk Otomobil Fabrikası Anonim Şirketi", "Otomotiv", "Bursa V.D.", "1610051304"),
        ("Petkim", "Petkim Petrokimya Holding Anonim Şirketi", "Petrokimya", "İzmir V.D.", "3500051304"),
        ("İş Bankası", "Türkiye İş Bankası Anonim Şirketi", "Bankacılık", "Levent V.D.", "1261070201")
    ]
    
    mock_customers = []
    for i, (short_name, full_name, sector, tax_office, tax_number) in enumerate(companies):
        # Clean name for email/website
        clean_name = (short_name.lower()
                     .replace(' ', '')
                     .replace('ç', 'c')
                     .replace('ğ', 'g') 
                     .replace('ı', 'i')
                     .replace('ö', 'o')
                     .replace('ş', 's')
                     .replace('ü', 'u'))
        
        customer = {
            "id": str(uuid.uuid4()),
            "companyName": short_name,
            "companyTitle": full_name,
            "email": f"info@{clean_name}.com.tr",
            "phone": f"+90 212 {300 + i:03d} {10 + i:02d} {20 + i:02d}",
            "address": f"Merkez Mah. {short_name} Sok. No:{10 + i} 34000 İstanbul",
            "city": "İstanbul",
            "country": "Türkiye",
            "sector": sector,
            "relationshipType": "Müşteri",
            "website": f"www.{clean_name}.com.tr",
            "taxNumber": tax_number,
            "taxOffice": tax_office,
            "status": "active",
            "customerSince": datetime.now().isoformat(),
            "lastActivity": datetime.now().isoformat(),
            "totalOrders": i * 2,
            "totalRevenue": float(i * 50000 + 100000),
            "currency": "TRY",
            "countryCode": "TR",
            "contactPerson": f"{short_name} Temsilcisi",
            "contactPersonId": "",
            "notes": f"{sector} sektöründe faaliyet gösteren önemli müşteri",
            "logo": "",
            "tags": [sector.lower(), "aktif"]
        }
        mock_customers.append(customer)
    
    # Insert all customers
    result = await db.customers.insert_many(mock_customers)
    print(f"Successfully created {len(result.inserted_ids)} mock customers")
    
    # Verify
    count = await db.customers.count_documents({})
    print(f"Total customers in database: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_mock_customers())