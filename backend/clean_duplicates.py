"""
Clean duplicate countries from MongoDB
Keeps the entry with more cities, or the first one if cities are equal
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict

async def clean_duplicates():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🧹 Cleaning duplicate countries from: {db_name}")
    
    # Get all countries
    countries = await db.countries.find().to_list(length=None)
    print(f"📊 Total countries before cleanup: {len(countries)}")
    
    # Group by name
    country_groups = defaultdict(list)
    for country in countries:
        country_groups[country['name']].append(country)
    
    # Find duplicates
    duplicates = {name: entries for name, entries in country_groups.items() if len(entries) > 1}
    print(f"🔍 Found {len(duplicates)} duplicate country names")
    
    deleted_count = 0
    for name, entries in duplicates.items():
        print(f"\n🔄 Processing: {name} ({len(entries)} entries)")
        
        # Sort by number of cities (descending), then by creation order
        entries_sorted = sorted(entries, key=lambda x: len(x.get('cities', [])), reverse=True)
        
        # Keep the first one (with most cities)
        keep = entries_sorted[0]
        print(f"  ✅ Keeping: ID={keep['id']}, cities={len(keep.get('cities', []))}")
        
        # Delete the rest
        for entry in entries_sorted[1:]:
            print(f"  ❌ Deleting: ID={entry['id']}, cities={len(entry.get('cities', []))}")
            await db.countries.delete_one({"_id": entry['_id']})
            deleted_count += 1
    
    # Final count
    final_count = await db.countries.count_documents({})
    print(f"\n✅ Cleanup completed!")
    print(f"📊 Deleted: {deleted_count} duplicate entries")
    print(f"📊 Final country count: {final_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clean_duplicates())
