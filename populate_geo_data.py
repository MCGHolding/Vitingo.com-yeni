#!/usr/bin/env python3

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Sample countries data
countries_data = [
    {
        "id": str(uuid.uuid4()),
        "iso2": "TR",
        "iso3": "TUR", 
        "name": "Turkey",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "iso2": "US",
        "iso3": "USA",
        "name": "United States",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "iso2": "DE",
        "iso3": "DEU",
        "name": "Germany", 
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "iso2": "AE",
        "iso3": "ARE",
        "name": "United Arab Emirates",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "iso2": "GB",
        "iso3": "GBR",
        "name": "United Kingdom",
        "created_at": datetime.utcnow()
    }
]

# Sample cities data
cities_data = [
    # Turkey cities
    {
        "id": str(uuid.uuid4()),
        "name": "Istanbul",
        "country_iso2": "TR",
        "admin1": "Istanbul",
        "lat": 41.0082,
        "lng": 28.9784,
        "population": 15462452,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Ankara",
        "country_iso2": "TR",
        "admin1": "Ankara",
        "lat": 39.9334,
        "lng": 32.8597,
        "population": 5663322,
        "is_capital": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Izmir",
        "country_iso2": "TR",
        "admin1": "Izmir",
        "lat": 38.4192,
        "lng": 27.1287,
        "population": 4394694,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Bursa",
        "country_iso2": "TR",
        "admin1": "Bursa",
        "lat": 40.1826,
        "lng": 29.0665,
        "population": 3194720,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    # UAE cities
    {
        "id": str(uuid.uuid4()),
        "name": "Dubai",
        "country_iso2": "AE",
        "admin1": "Dubai",
        "lat": 25.2048,
        "lng": 55.2708,
        "population": 3331420,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Abu Dhabi",
        "country_iso2": "AE",
        "admin1": "Abu Dhabi",
        "lat": 24.4539,
        "lng": 54.3773,
        "population": 1482816,
        "is_capital": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Sharjah",
        "country_iso2": "AE",
        "admin1": "Sharjah",
        "lat": 25.3463,
        "lng": 55.4209,
        "population": 1274749,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    # US cities
    {
        "id": str(uuid.uuid4()),
        "name": "New York",
        "country_iso2": "US",
        "admin1": "New York",
        "lat": 40.7128,
        "lng": -74.0060,
        "population": 8336817,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Los Angeles",
        "country_iso2": "US",
        "admin1": "California",
        "lat": 34.0522,
        "lng": -118.2437,
        "population": 3979576,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Chicago",
        "country_iso2": "US",
        "admin1": "Illinois",
        "lat": 41.8781,
        "lng": -87.6298,
        "population": 2693976,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Houston",
        "country_iso2": "US",
        "admin1": "Texas",
        "lat": 29.7604,
        "lng": -95.3698,
        "population": 2320268,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Phoenix",
        "country_iso2": "US",
        "admin1": "Arizona",
        "lat": 33.4484,
        "lng": -112.0740,
        "population": 1680992,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Philadelphia",
        "country_iso2": "US",
        "admin1": "Pennsylvania",
        "lat": 39.9526,
        "lng": -75.1652,
        "population": 1584064,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "San Antonio",
        "country_iso2": "US",
        "admin1": "Texas",
        "lat": 29.4241,
        "lng": -98.4936,
        "population": 1547253,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "San Diego",
        "country_iso2": "US",
        "admin1": "California",
        "lat": 32.7157,
        "lng": -117.1611,
        "population": 1423851,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Dallas",
        "country_iso2": "US",
        "admin1": "Texas",
        "lat": 32.7767,
        "lng": -96.7970,
        "population": 1343573,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "San Jose",
        "country_iso2": "US",
        "admin1": "California",
        "lat": 37.3382,
        "lng": -121.8863,
        "population": 1021795,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    # Germany cities
    {
        "id": str(uuid.uuid4()),
        "name": "Berlin",
        "country_iso2": "DE",
        "admin1": "Berlin",
        "lat": 52.5200,
        "lng": 13.4050,
        "population": 3669491,
        "is_capital": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Hamburg",
        "country_iso2": "DE",
        "admin1": "Hamburg",
        "lat": 53.5511,
        "lng": 9.9937,
        "population": 1899160,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Munich",
        "country_iso2": "DE",
        "admin1": "Bavaria",
        "lat": 48.1351,
        "lng": 11.5820,
        "population": 1484226,
        "is_capital": False,
        "created_at": datetime.utcnow()
    },
    # UK cities
    {
        "id": str(uuid.uuid4()),
        "name": "London",
        "country_iso2": "GB",
        "admin1": "England",
        "lat": 51.5074,
        "lng": -0.1278,
        "population": 9648110,
        "is_capital": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Birmingham",
        "country_iso2": "GB",
        "admin1": "England",
        "lat": 52.4862,
        "lng": -1.8904,
        "population": 1141816,
        "is_capital": False,
        "created_at": datetime.utcnow()
    }
]

async def populate_geo_data():
    """Populate the database with sample geographic data"""
    print("🌍 POPULATING GEOGRAPHIC DATA")
    print("=" * 50)
    
    try:
        # Clear existing data
        print("Clearing existing countries and cities data...")
        await db.countries.delete_many({})
        await db.cities.delete_many({})
        
        # Insert countries
        print(f"Inserting {len(countries_data)} countries...")
        result = await db.countries.insert_many(countries_data)
        print(f"✅ Inserted {len(result.inserted_ids)} countries")
        
        # Insert cities
        print(f"Inserting {len(cities_data)} cities...")
        result = await db.cities.insert_many(cities_data)
        print(f"✅ Inserted {len(result.inserted_ids)} cities")
        
        # Verify data
        print("\nVerifying data...")
        countries_count = await db.countries.count_documents({})
        cities_count = await db.cities.count_documents({})
        
        print(f"Countries in database: {countries_count}")
        print(f"Cities in database: {cities_count}")
        
        # Show sample countries
        print("\nSample countries:")
        async for country in db.countries.find().limit(5):
            print(f"  {country['iso2']}: {country['name']}")
        
        # Show sample cities by country
        print("\nSample cities by country:")
        for iso2 in ["TR", "US", "AE", "DE", "GB"]:
            city_count = await db.cities.count_documents({"country_iso2": iso2})
            print(f"  {iso2}: {city_count} cities")
            async for city in db.cities.find({"country_iso2": iso2}).limit(3):
                print(f"    - {city['name']} (pop: {city.get('population', 'N/A')})")
        
        print("\n🎉 Geographic data population completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error populating geographic data: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(populate_geo_data())
    exit(0 if success else 1)