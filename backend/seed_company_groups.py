"""
Seed Company Groups Data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from uuid import uuid4

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = AsyncIOMotorClient(MONGO_URL)
db = client['test_database']


async def seed_company_groups():
    """Seed sample company groups"""
    
    # Clear existing data
    await db.company_groups.delete_many({})
    
    # Sample company groups
    groups = [
        {
            "id": str(uuid4()),
            "name": "Borusan Holding",
            "user_id": "demo-user",
            "companies": [
                {
                    "id": str(uuid4()),
                    "name": "Borusan Otomotiv",
                    "address": "Ahi Evran Caddesi No:1 Maslak",
                    "city": "İstanbul",
                    "country": "Türkiye",
                    "phone": "+90 212 335 10 00",
                    "email": "info@borusanotomotiv.com",
                    "website": "www.borusanotomotiv.com",
                    "tax_office": "Maslak Vergi Dairesi",
                    "tax_number": "1234567890"
                },
                {
                    "id": str(uuid4()),
                    "name": "Borusan Lojistik",
                    "address": "Ahi Evran Caddesi No:3 Maslak",
                    "city": "İstanbul",
                    "country": "Türkiye",
                    "phone": "+90 212 335 20 00",
                    "email": "info@borusanlojistik.com",
                    "website": "www.borusanlojistik.com",
                    "tax_office": "Maslak Vergi Dairesi",
                    "tax_number": "9876543210"
                },
                {
                    "id": str(uuid4()),
                    "name": "Borusan Makina",
                    "address": "Ahi Evran Caddesi No:5 Maslak",
                    "city": "İstanbul",
                    "country": "Türkiye",
                    "phone": "+90 212 335 30 00",
                    "email": "info@borusanmakina.com",
                    "website": "www.borusanmakina.com",
                    "tax_office": "Maslak Vergi Dairesi",
                    "tax_number": "5555555555"
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid4()),
            "name": "ABC Grup",
            "user_id": "demo-user",
            "companies": [
                {
                    "id": str(uuid4()),
                    "name": "ABC İnşaat A.Ş.",
                    "address": "Levent Caddesi No:10",
                    "city": "İstanbul",
                    "country": "Türkiye",
                    "phone": "+90 212 280 10 00",
                    "email": "info@abcinsaat.com",
                    "website": "www.abcinsaat.com",
                    "tax_office": "Beşiktaş Vergi Dairesi",
                    "tax_number": "1111111111"
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Insert data
    result = await db.company_groups.insert_many(groups)
    print(f"✅ Inserted {len(result.inserted_ids)} company groups")
    
    for group in groups:
        print(f"  - {group['name']}: {len(group['companies'])} şirket")


if __name__ == "__main__":
    asyncio.run(seed_company_groups())
