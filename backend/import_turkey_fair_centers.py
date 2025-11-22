"""
Import Turkey fair centers to MongoDB
"""
import asyncio
import os
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

async def import_fair_centers():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🏢 Importing Turkey fair centers to: {db_name}")
    
    # Fair centers data
    fair_centers = [
        {"country": "Türkiye", "city": "İstanbul", "name": "Tuyap Fair and Congress Center"},
        {"country": "Türkiye", "city": "İstanbul", "name": "Istanbul Expo Center (IFM)"},
        {"country": "Türkiye", "city": "İzmir", "name": "İzmir Expo Center (Gaziemir)"},
        {"country": "Türkiye", "city": "Konya", "name": "Tüyap Konya International Expo Center"},
        {"country": "Türkiye", "city": "Antalya", "name": "Antalya Expo Center"},
        {"country": "Türkiye", "city": "Bursa", "name": "Bursa International Expo Center"},
        {"country": "Türkiye", "city": "Gaziantep", "name": "Gaziantep Chamber of Industry Expo Center"},
        {"country": "Türkiye", "city": "Erzurum", "name": "Erzurum Recep Tayyip Erdoğan Exhibition Center"},
        {"country": "Türkiye", "city": "İzmir", "name": "Kulturpark Exhibition Center"},
        {"country": "Türkiye", "city": "Şanlıurfa", "name": "Şanlıurfa Fair Center"},
        {"country": "Türkiye", "city": "Kayseri", "name": "Kayseri World Fair Center"},
        {"country": "Türkiye", "city": "Van", "name": "Van Expo Fair Center"},
        {"country": "Türkiye", "city": "İstanbul", "name": "Istanbul Congress Center"},
        {"country": "Türkiye", "city": "Adana", "name": "Tüyap Adana International Fair and Congress Center"},
        {"country": "Türkiye", "city": "Malatya", "name": "Malatya Mişmiş Park Fair Center"},
        {"country": "Türkiye", "city": "Samsun", "name": "Tüyap Samsun Fair Center"},
        {"country": "Türkiye", "city": "İstanbul", "name": "Dr.Kadir Topbaş Culture and Art Center"},
        {"country": "Türkiye", "city": "Eskişehir", "name": "Eskişehir Chamber of Industry Expo Center"},
        {"country": "Türkiye", "city": "Ankara", "name": "ATO Fair and Congress Center"},
        {"country": "Türkiye", "city": "Denizli", "name": "Egs Fair and Congress Center"},
        {"country": "Türkiye", "city": "Diyarbakır", "name": "ALZ Diyarbakır Mesopotamia Fair Center"},
        {"country": "Türkiye", "city": "İstanbul", "name": "Haliç Congress Center"},
        {"country": "Türkiye", "city": "Ankara", "name": "Anfa Altınpark Fair Center"},
        {"country": "Türkiye", "city": "Bursa", "name": "Merinos Atatürk Congress and Culture Center"},
        {"country": "Türkiye", "city": "İstanbul", "name": "Lütfi Kırdar Congress and Fair Center"},
        {"country": "Türkiye", "city": "Isparta", "name": "Gökkubbe Fair Center"},
        {"country": "Türkiye", "city": "Antalya", "name": "Cam Pyramid Sabancı Congress and Fair Center"},
        {"country": "Türkiye", "city": "Kütahya", "name": "Kütahya Belediyesi Fair Center"},
        {"country": "Türkiye", "city": "Adıyaman", "name": "Adıyaman Congress and Fair Center"},
        {"country": "Türkiye", "city": "Mersin", "name": "Mersin Yenişehir Municipality Fair Center"},
        {"country": "Türkiye", "city": "Yozgat", "name": "Yozgat Chamber of Industry Expo Center"},
        {"country": "Türkiye", "city": "Kocaeli", "name": "Kocaeli Belediyesi Congress and Fair Center"},
        {"country": "Türkiye", "city": "Kütahya", "name": "Kütahya Municipality Fair Center"},
    ]
    
    # Add id and address to each
    fair_centers_docs = []
    for center in fair_centers:
        fair_centers_docs.append({
            "id": str(uuid.uuid4()),
            "name": center["name"],
            "country": center["country"],
            "city": center["city"],
            "address": ""
        })
    
    # Insert to database
    if fair_centers_docs:
        result = await db.fair_centers.insert_many(fair_centers_docs)
        print(f"✅ {len(result.inserted_ids)} fuar merkezi eklendi")
    
    # Show summary by city
    print("\n📊 Şehirlere Göre Dağılım:")
    from collections import Counter
    city_counts = Counter([c["city"] for c in fair_centers])
    for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {city}: {count} fuar merkezi")
    
    print(f"\n✅ Import tamamlandı!")
    print(f"Toplam: {len(fair_centers)} fuar merkezi")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_fair_centers())
