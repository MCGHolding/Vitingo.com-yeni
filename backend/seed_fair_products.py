#!/usr/bin/env python3
"""
Fuar hizmetleri için standart ürünleri veritabanına ekleyen script
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# Standard Fair Services Products
FAIR_PRODUCTS = [
    # Fuar Hizmetleri
    {
        "id": str(uuid.uuid4()),
        "name": "Stand Tasarımı ve Projelendirme",
        "name_en": "Stand Design and Project Planning",
        "category": "fair_services",
        "unit": "adet",
        "default_price": 15000.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Stand Kurulumu ve Montajı",
        "name_en": "Stand Setup and Assembly",
        "category": "fair_services",
        "unit": "adet",
        "default_price": 8500.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Stand Sökümü ve Taşıma",
        "name_en": "Stand Dismantling and Transport",
        "category": "fair_services",
        "unit": "adet",
        "default_price": 4500.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Grafik Tasarım ve Baskı Hizmetleri",
        "name_en": "Graphic Design and Printing Services",
        "category": "fair_services",
        "unit": "adet",
        "default_price": 2500.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Hosteslik Hizmetleri",
        "name_en": "Hostess Services",
        "category": "fair_services",
        "unit": "gün",
        "default_price": 1200.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Çeviri Hizmetleri",
        "name_en": "Translation Services",
        "category": "fair_services",
        "unit": "saat",
        "default_price": 350.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    
    # Ekipman Kiralama
    {
        "id": str(uuid.uuid4()),
        "name": "LED Ekran Kiralama (3x2m)",
        "name_en": "LED Screen Rental (3x2m)",
        "category": "equipment_rental",
        "unit": "gün",
        "default_price": 800.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Ses Sistemi Kiralama",
        "name_en": "Sound System Rental",
        "category": "equipment_rental",
        "unit": "gün",
        "default_price": 450.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Projeksiyon Cihazı Kiralama",
        "name_en": "Projector Rental",
        "category": "equipment_rental",
        "unit": "gün",
        "default_price": 300.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Mobilya Kiralama (Masa-Sandalye)",
        "name_en": "Furniture Rental (Table-Chair)",
        "category": "equipment_rental",
        "unit": "takım",
        "default_price": 150.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    
    # Altyapı Hizmetleri  
    {
        "id": str(uuid.uuid4()),
        "name": "Elektrik Bağlantısı ve Aydınlatma",
        "name_en": "Electrical Connection and Lighting",
        "category": "utilities",
        "unit": "adet",
        "default_price": 1800.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "İnternet ve Telefon Bağlantısı",
        "name_en": "Internet and Phone Connection",
        "category": "utilities",
        "unit": "adet",
        "default_price": 650.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Klima ve Havalandırma",
        "name_en": "Air Conditioning and Ventilation",
        "category": "utilities",
        "unit": "adet",
        "default_price": 950.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    
    # Ulaşım ve Transfer
    {
        "id": str(uuid.uuid4()),
        "name": "Havaalanı Transfer Hizmeti",
        "name_en": "Airport Transfer Service",
        "category": "transportation",
        "unit": "gidiş-dönüş",
        "default_price": 450.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Şehir İçi Transfer",
        "name_en": "City Transfer",
        "category": "transportation",
        "unit": "saat",
        "default_price": 200.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Kargo ve Nakliye Hizmeti",
        "name_en": "Cargo and Transportation Service",
        "category": "transportation",
        "unit": "kg",
        "default_price": 15.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    
    # Konaklama
    {
        "id": str(uuid.uuid4()),
        "name": "Otel Rezervasyon (4* Otel)",
        "name_en": "Hotel Reservation (4* Hotel)",
        "category": "accommodation",
        "unit": "gece",
        "default_price": 650.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Otel Rezervasyon (5* Otel)",
        "name_en": "Hotel Reservation (5* Hotel)",
        "category": "accommodation",
        "unit": "gece",
        "default_price": 1200.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    
    # Etkinlik ve Organizasyon
    {
        "id": str(uuid.uuid4()),
        "name": "Açılış Kokteyli Organizasyonu",
        "name_en": "Opening Cocktail Organization",
        "category": "events",
        "unit": "adet",
        "default_price": 8500.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "B2B Görüşme Salonu Kiralama",
        "name_en": "B2B Meeting Room Rental",
        "category": "events",
        "unit": "gün",
        "default_price": 2500.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Protokol ve VIP Hizmetleri",
        "name_en": "Protocol and VIP Services",
        "category": "events",
        "unit": "gün",
        "default_price": 3500.00,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

async def seed_fair_products():
    """Fuar hizmetleri ürünlerini veritabanına ekle"""
    
    # MongoDB bağlantısı
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.vitingo_crm
    
    try:
        # Mevcut ürünleri kontrol et
        existing_products = await db.products.count_documents({})
        print(f"Mevcut ürün sayısı: {existing_products}")
        
        # Ürünleri ekle
        for product in FAIR_PRODUCTS:
            # Aynı isimde ürün var mı kontrol et
            existing = await db.products.find_one({"name": product["name"]})
            
            if not existing:
                await db.products.insert_one(product)
                print(f"✅ Eklendi: {product['name']}")
            else:
                print(f"⚠️  Zaten mevcut: {product['name']}")
        
        # Toplam ürün sayısını göster
        total_products = await db.products.count_documents({})
        print(f"\n🎉 İşlem tamamlandı! Toplam ürün sayısı: {total_products}")
        
        # Kategori bazında ürün sayıları
        categories = {}
        async for product in db.products.find():
            category = product.get('category', 'unknown')
            categories[category] = categories.get(category, 0) + 1
        
        print("\n📊 Kategori bazında ürün sayıları:")
        for category, count in categories.items():
            print(f"   {category}: {count} ürün")
            
    except Exception as e:
        print(f"❌ Hata: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_fair_products())