#!/usr/bin/env python3
"""
Geographic Data Seed Script
Seeds countries (ISO 3166-1) and cities data into MongoDB

Usage:
    python seed_geo_data.py --reset  # Clear and reseed all data
    python seed_geo_data.py --update # Update existing data (upsert)
    python seed_geo_data.py --countries-only # Seed only countries
    python seed_geo_data.py --cities-only # Seed only cities
"""

import asyncio
import argparse
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/vitingo_crm')

# ISO 3166-1 Countries Data (prioritizing major countries and Turkey first)
COUNTRIES_DATA = [
    # Major countries first
    {"iso2": "TR", "iso3": "TUR", "name": "Turkey"},
    {"iso2": "US", "iso3": "USA", "name": "United States"},
    {"iso2": "GB", "iso3": "GBR", "name": "United Kingdom"},
    {"iso2": "DE", "iso3": "DEU", "name": "Germany"},
    {"iso2": "FR", "iso3": "FRA", "name": "France"},
    {"iso2": "IT", "iso3": "ITA", "name": "Italy"},
    {"iso2": "ES", "iso3": "ESP", "name": "Spain"},
    {"iso2": "NL", "iso3": "NLD", "name": "Netherlands"},
    {"iso2": "CH", "iso3": "CHE", "name": "Switzerland"},
    {"iso2": "AT", "iso3": "AUT", "name": "Austria"},
    {"iso2": "BE", "iso3": "BEL", "name": "Belgium"},
    {"iso2": "SE", "iso3": "SWE", "name": "Sweden"},
    {"iso2": "NO", "iso3": "NOR", "name": "Norway"},
    {"iso2": "DK", "iso3": "DNK", "name": "Denmark"},
    {"iso2": "FI", "iso3": "FIN", "name": "Finland"},
    {"iso2": "PL", "iso3": "POL", "name": "Poland"},
    {"iso2": "CZ", "iso3": "CZE", "name": "Czech Republic"},
    {"iso2": "HU", "iso3": "HUN", "name": "Hungary"},
    {"iso2": "RO", "iso3": "ROU", "name": "Romania"},
    {"iso2": "BG", "iso3": "BGR", "name": "Bulgaria"},
    {"iso2": "GR", "iso3": "GRC", "name": "Greece"},
    {"iso2": "PT", "iso3": "PRT", "name": "Portugal"},
    {"iso2": "IE", "iso3": "IRL", "name": "Ireland"},
    {"iso2": "LU", "iso3": "LUX", "name": "Luxembourg"},
    
    # Middle East & Asia
    {"iso2": "AE", "iso3": "ARE", "name": "United Arab Emirates"},
    {"iso2": "SA", "iso3": "SAU", "name": "Saudi Arabia"},
    {"iso2": "QA", "iso3": "QAT", "name": "Qatar"},
    {"iso2": "KW", "iso3": "KWT", "name": "Kuwait"},
    {"iso2": "BH", "iso3": "BHR", "name": "Bahrain"},
    {"iso2": "OM", "iso3": "OMN", "name": "Oman"},
    {"iso2": "JO", "iso3": "JOR", "name": "Jordan"},
    {"iso2": "LB", "iso3": "LBN", "name": "Lebanon"},
    {"iso2": "IL", "iso3": "ISR", "name": "Israel"},
    {"iso2": "EG", "iso3": "EGY", "name": "Egypt"},
    {"iso2": "IR", "iso3": "IRN", "name": "Iran"},
    {"iso2": "IQ", "iso3": "IRQ", "name": "Iraq"},
    {"iso2": "SY", "iso3": "SYR", "name": "Syria"},
    {"iso2": "CN", "iso3": "CHN", "name": "China"},
    {"iso2": "JP", "iso3": "JPN", "name": "Japan"},
    {"iso2": "KR", "iso3": "KOR", "name": "South Korea"},
    {"iso2": "IN", "iso3": "IND", "name": "India"},
    {"iso2": "PK", "iso3": "PAK", "name": "Pakistan"},
    {"iso2": "BD", "iso3": "BGD", "name": "Bangladesh"},
    {"iso2": "ID", "iso3": "IDN", "name": "Indonesia"},
    {"iso2": "MY", "iso3": "MYS", "name": "Malaysia"},
    {"iso2": "TH", "iso3": "THA", "name": "Thailand"},
    {"iso2": "VN", "iso3": "VNM", "name": "Vietnam"},
    {"iso2": "PH", "iso3": "PHL", "name": "Philippines"},
    {"iso2": "SG", "iso3": "SGP", "name": "Singapore"},
    
    # Americas
    {"iso2": "CA", "iso3": "CAN", "name": "Canada"},
    {"iso2": "MX", "iso3": "MEX", "name": "Mexico"},
    {"iso2": "BR", "iso3": "BRA", "name": "Brazil"},
    {"iso2": "AR", "iso3": "ARG", "name": "Argentina"},
    {"iso2": "CL", "iso3": "CHL", "name": "Chile"},
    {"iso2": "CO", "iso3": "COL", "name": "Colombia"},
    {"iso2": "PE", "iso3": "PER", "name": "Peru"},
    {"iso2": "VE", "iso3": "VEN", "name": "Venezuela"},
    
    # Africa
    {"iso2": "ZA", "iso3": "ZAF", "name": "South Africa"},
    {"iso2": "NG", "iso3": "NGA", "name": "Nigeria"},
    {"iso2": "KE", "iso3": "KEN", "name": "Kenya"},
    {"iso2": "GH", "iso3": "GHA", "name": "Ghana"},
    {"iso2": "MA", "iso3": "MAR", "name": "Morocco"},
    {"iso2": "TN", "iso3": "TUN", "name": "Tunisia"},
    {"iso2": "DZ", "iso3": "DZA", "name": "Algeria"},
    {"iso2": "ET", "iso3": "ETH", "name": "Ethiopia"},
    
    # Oceania
    {"iso2": "AU", "iso3": "AUS", "name": "Australia"},
    {"iso2": "NZ", "iso3": "NZL", "name": "New Zealand"},
    
    # Other European countries
    {"iso2": "RU", "iso3": "RUS", "name": "Russia"},
    {"iso2": "UA", "iso3": "UKR", "name": "Ukraine"},
    {"iso2": "BY", "iso3": "BLR", "name": "Belarus"},
    {"iso2": "LT", "iso3": "LTU", "name": "Lithuania"},
    {"iso2": "LV", "iso3": "LVA", "name": "Latvia"},
    {"iso2": "EE", "iso3": "EST", "name": "Estonia"},
    {"iso2": "SI", "iso3": "SVN", "name": "Slovenia"},
    {"iso2": "SK", "iso3": "SVK", "name": "Slovakia"},
    {"iso2": "HR", "iso3": "HRV", "name": "Croatia"},
    {"iso2": "RS", "iso3": "SRB", "name": "Serbia"},
    {"iso2": "BA", "iso3": "BIH", "name": "Bosnia and Herzegovina"},
    {"iso2": "MK", "iso3": "MKD", "name": "North Macedonia"},
    {"iso2": "AL", "iso3": "ALB", "name": "Albania"},
    {"iso2": "ME", "iso3": "MNE", "name": "Montenegro"},
    {"iso2": "CY", "iso3": "CYP", "name": "Cyprus"},
    {"iso2": "MT", "iso3": "MLT", "name": "Malta"},
    {"iso2": "IS", "iso3": "ISL", "name": "Iceland"},
    {"iso2": "AD", "iso3": "AND", "name": "Andorra"},
    {"iso2": "MC", "iso3": "MCO", "name": "Monaco"},
    {"iso2": "SM", "iso3": "SMR", "name": "San Marino"},
    {"iso2": "VA", "iso3": "VAT", "name": "Vatican City"},
    {"iso2": "LI", "iso3": "LIE", "name": "Liechtenstein"},
]

# Major cities data (focusing on Turkey, UAE, and other major countries)
CITIES_DATA = [
    # Turkey cities (comprehensive)
    {"name": "Istanbul", "country_iso2": "TR", "admin1": "Istanbul", "lat": 41.0082, "lng": 28.9784, "population": 15462452, "is_capital": False},
    {"name": "Ankara", "country_iso2": "TR", "admin1": "Ankara", "lat": 39.9334, "lng": 32.8597, "population": 5663322, "is_capital": True},
    {"name": "Izmir", "country_iso2": "TR", "admin1": "Izmir", "lat": 38.4192, "lng": 27.1287, "population": 4394694, "is_capital": False},
    {"name": "Bursa", "country_iso2": "TR", "admin1": "Bursa", "lat": 40.1826, "lng": 29.0665, "population": 3194720, "is_capital": False},
    {"name": "Antalya", "country_iso2": "TR", "admin1": "Antalya", "lat": 36.8969, "lng": 30.7133, "population": 2548308, "is_capital": False},
    {"name": "Adana", "country_iso2": "TR", "admin1": "Adana", "lat": 37.0000, "lng": 35.3213, "population": 2274106, "is_capital": False},
    {"name": "Konya", "country_iso2": "TR", "admin1": "Konya", "lat": 37.8713, "lng": 32.4846, "population": 2277017, "is_capital": False},
    {"name": "Gaziantep", "country_iso2": "TR", "admin1": "Gaziantep", "lat": 37.0662, "lng": 37.3833, "population": 2101157, "is_capital": False},
    {"name": "Kayseri", "country_iso2": "TR", "admin1": "Kayseri", "lat": 38.7312, "lng": 35.4787, "population": 1421362, "is_capital": False},
    {"name": "Mersin", "country_iso2": "TR", "admin1": "Mersin", "lat": 36.8000, "lng": 34.6333, "population": 1840425, "is_capital": False},
    {"name": "Eskisehir", "country_iso2": "TR", "admin1": "Eskisehir", "lat": 39.7767, "lng": 30.5206, "population": 888828, "is_capital": False},
    {"name": "Diyarbakir", "country_iso2": "TR", "admin1": "Diyarbakir", "lat": 37.9144, "lng": 40.2306, "population": 1756353, "is_capital": False},
    {"name": "Samsun", "country_iso2": "TR", "admin1": "Samsun", "lat": 41.2795, "lng": 36.3360, "population": 1348542, "is_capital": False},
    {"name": "Denizli", "country_iso2": "TR", "admin1": "Denizli", "lat": 37.7765, "lng": 29.0864, "population": 1027782, "is_capital": False},
    {"name": "Trabzon", "country_iso2": "TR", "admin1": "Trabzon", "lat": 41.0015, "lng": 39.7178, "population": 808974, "is_capital": False},
    {"name": "Malatya", "country_iso2": "TR", "admin1": "Malatya", "lat": 38.3552, "lng": 38.3095, "population": 812580, "is_capital": False},
    {"name": "Van", "country_iso2": "TR", "admin1": "Van", "lat": 38.4891, "lng": 43.4089, "population": 1123784, "is_capital": False},
    {"name": "Erzurum", "country_iso2": "TR", "admin1": "Erzurum", "lat": 39.9000, "lng": 41.2700, "population": 762321, "is_capital": False},
    {"name": "Elazığ", "country_iso2": "TR", "admin1": "Elazığ", "lat": 38.6810, "lng": 39.2264, "population": 591098, "is_capital": False},
    {"name": "Manisa", "country_iso2": "TR", "admin1": "Manisa", "lat": 38.6191, "lng": 27.4289, "population": 1440611, "is_capital": False},
    
    # UAE cities 
    {"name": "Dubai", "country_iso2": "AE", "admin1": "Dubai", "lat": 25.2048, "lng": 55.2708, "population": 3331420, "is_capital": False},
    {"name": "Abu Dhabi", "country_iso2": "AE", "admin1": "Abu Dhabi", "lat": 24.4539, "lng": 54.3773, "population": 1482816, "is_capital": True},
    {"name": "Sharjah", "country_iso2": "AE", "admin1": "Sharjah", "lat": 25.3463, "lng": 55.4209, "population": 1684649, "is_capital": False},
    {"name": "Ajman", "country_iso2": "AE", "admin1": "Ajman", "lat": 25.4052, "lng": 55.5136, "population": 540000, "is_capital": False},
    {"name": "Ras Al Khaimah", "country_iso2": "AE", "admin1": "Ras Al Khaimah", "lat": 25.7889, "lng": 55.9598, "population": 400000, "is_capital": False},
    {"name": "Fujairah", "country_iso2": "AE", "admin1": "Fujairah", "lat": 25.1164, "lng": 56.3444, "population": 256000, "is_capital": False},
    {"name": "Umm Al Quwain", "country_iso2": "AE", "admin1": "Umm Al Quwain", "lat": 25.5641, "lng": 55.6552, "population": 72000, "is_capital": False},
    
    # USA major cities
    {"name": "New York", "country_iso2": "US", "admin1": "New York", "lat": 40.7128, "lng": -74.0060, "population": 8336817, "is_capital": False},
    {"name": "Los Angeles", "country_iso2": "US", "admin1": "California", "lat": 34.0522, "lng": -118.2437, "population": 3979576, "is_capital": False},
    {"name": "Chicago", "country_iso2": "US", "admin1": "Illinois", "lat": 41.8781, "lng": -87.6298, "population": 2693976, "is_capital": False},
    {"name": "Houston", "country_iso2": "US", "admin1": "Texas", "lat": 29.7604, "lng": -95.3698, "population": 2320268, "is_capital": False},
    {"name": "Phoenix", "country_iso2": "US", "admin1": "Arizona", "lat": 33.4484, "lng": -112.0740, "population": 1680992, "is_capital": False},
    {"name": "Philadelphia", "country_iso2": "US", "admin1": "Pennsylvania", "lat": 39.9526, "lng": -75.1652, "population": 1584064, "is_capital": False},
    {"name": "San Antonio", "country_iso2": "US", "admin1": "Texas", "lat": 29.4241, "lng": -98.4936, "population": 1547253, "is_capital": False},
    {"name": "San Diego", "country_iso2": "US", "admin1": "California", "lat": 32.7157, "lng": -117.1611, "population": 1423851, "is_capital": False},
    {"name": "Dallas", "country_iso2": "US", "admin1": "Texas", "lat": 32.7767, "lng": -96.7970, "population": 1343573, "is_capital": False},
    {"name": "San Jose", "country_iso2": "US", "admin1": "California", "lat": 37.3382, "lng": -121.8863, "population": 1021795, "is_capital": False},
    {"name": "Washington", "country_iso2": "US", "admin1": "District of Columbia", "lat": 38.9072, "lng": -77.0369, "population": 705749, "is_capital": True},
    
    # UK major cities
    {"name": "London", "country_iso2": "GB", "admin1": "England", "lat": 51.5074, "lng": -0.1278, "population": 9304016, "is_capital": True},
    {"name": "Birmingham", "country_iso2": "GB", "admin1": "England", "lat": 52.4862, "lng": -1.8904, "population": 2607437, "is_capital": False},
    {"name": "Manchester", "country_iso2": "GB", "admin1": "England", "lat": 53.4808, "lng": -2.2426, "population": 2720000, "is_capital": False},
    {"name": "Glasgow", "country_iso2": "GB", "admin1": "Scotland", "lat": 55.8642, "lng": -4.2518, "population": 1680000, "is_capital": False},
    {"name": "Liverpool", "country_iso2": "GB", "admin1": "England", "lat": 53.4084, "lng": -2.9916, "population": 900000, "is_capital": False},
    {"name": "Edinburgh", "country_iso2": "GB", "admin1": "Scotland", "lat": 55.9533, "lng": -3.1883, "population": 540000, "is_capital": False},
    {"name": "Leeds", "country_iso2": "GB", "admin1": "England", "lat": 53.8008, "lng": -1.5491, "population": 812000, "is_capital": False},
    {"name": "Cardiff", "country_iso2": "GB", "admin1": "Wales", "lat": 51.4816, "lng": -3.1791, "population": 481082, "is_capital": False},
    {"name": "Belfast", "country_iso2": "GB", "admin1": "Northern Ireland", "lat": 54.5973, "lng": -5.9301, "population": 343542, "is_capital": False},
    
    # Germany major cities
    {"name": "Berlin", "country_iso2": "DE", "admin1": "Berlin", "lat": 52.5200, "lng": 13.4050, "population": 3669491, "is_capital": True},
    {"name": "Hamburg", "country_iso2": "DE", "admin1": "Hamburg", "lat": 53.5511, "lng": 9.9937, "population": 1945532, "is_capital": False},
    {"name": "Munich", "country_iso2": "DE", "admin1": "Bavaria", "lat": 48.1351, "lng": 11.5820, "population": 1488202, "is_capital": False},
    {"name": "Cologne", "country_iso2": "DE", "admin1": "North Rhine-Westphalia", "lat": 50.9375, "lng": 6.9603, "population": 1085664, "is_capital": False},
    {"name": "Frankfurt", "country_iso2": "DE", "admin1": "Hesse", "lat": 50.1109, "lng": 8.6821, "population": 753056, "is_capital": False},
    {"name": "Stuttgart", "country_iso2": "DE", "admin1": "Baden-Württemberg", "lat": 48.7758, "lng": 9.1829, "population": 626275, "is_capital": False},
    {"name": "Düsseldorf", "country_iso2": "DE", "admin1": "North Rhine-Westphalia", "lat": 51.2277, "lng": 6.7735, "population": 653253, "is_capital": False},
    
    # France major cities
    {"name": "Paris", "country_iso2": "FR", "admin1": "Île-de-France", "lat": 48.8566, "lng": 2.3522, "population": 11020000, "is_capital": True},
    {"name": "Marseille", "country_iso2": "FR", "admin1": "Provence-Alpes-Côte d'Azur", "lat": 43.2965, "lng": 5.3698, "population": 870731, "is_capital": False},
    {"name": "Lyon", "country_iso2": "FR", "admin1": "Auvergne-Rhône-Alpes", "lat": 45.7640, "lng": 4.8357, "population": 518635, "is_capital": False},
    {"name": "Toulouse", "country_iso2": "FR", "admin1": "Occitanie", "lat": 43.6047, "lng": 1.4442, "population": 479553, "is_capital": False},
    {"name": "Nice", "country_iso2": "FR", "admin1": "Provence-Alpes-Côte d'Azur", "lat": 43.7102, "lng": 7.2620, "population": 342637, "is_capital": False},
    {"name": "Strasbourg", "country_iso2": "FR", "admin1": "Grand Est", "lat": 48.5734, "lng": 7.7521, "population": 285677, "is_capital": False},
    
    # Add more cities for other countries as needed...
    # This is a comprehensive starter set focusing on Turkey, UAE, and major global cities
]

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client.vitingo_crm
        # Test connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {MONGO_URL}")
        return db
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

async def seed_countries(db, reset=False):
    """Seed countries data"""
    logger.info("Seeding countries data...")
    
    if reset:
        logger.info("Clearing existing countries...")
        await db.countries.delete_many({})
    
    # Create indexes
    await db.countries.create_index("iso2", unique=True)
    await db.countries.create_index("iso3", unique=True) 
    await db.countries.create_index("name")
    
    seeded_count = 0
    updated_count = 0
    
    for country_data in COUNTRIES_DATA:
        country_doc = {
            "id": str(uuid.uuid4()),
            "iso2": country_data["iso2"],
            "iso3": country_data["iso3"],
            "name": country_data["name"],
            "created_at": datetime.utcnow()
        }
        
        try:
            # Upsert by iso2
            result = await db.countries.update_one(
                {"iso2": country_data["iso2"]},
                {"$setOnInsert": country_doc},
                upsert=True
            )
            
            if result.upserted_id:
                seeded_count += 1
                logger.info(f"✓ Added country: {country_data['name']} ({country_data['iso2']})")
            else:
                updated_count += 1
                
        except Exception as e:
            logger.error(f"✗ Failed to seed country {country_data['name']}: {e}")
    
    logger.info(f"Countries seeding completed: {seeded_count} added, {updated_count} existing")

async def seed_cities(db, reset=False):
    """Seed cities data"""  
    logger.info("Seeding cities data...")
    
    if reset:
        logger.info("Clearing existing cities...")
        await db.cities.delete_many({})
    
    # Create indexes
    await db.cities.create_index("country_iso2")
    await db.cities.create_index("name")
    await db.cities.create_index([("name", 1), ("country_iso2", 1)], unique=True)
    await db.cities.create_index("is_capital")
    
    seeded_count = 0 
    updated_count = 0
    
    for city_data in CITIES_DATA:
        city_doc = {
            "id": str(uuid.uuid4()),
            "name": city_data["name"],
            "country_iso2": city_data["country_iso2"],
            "admin1": city_data.get("admin1", ""),
            "lat": city_data.get("lat"),
            "lng": city_data.get("lng"),
            "population": city_data.get("population"),
            "is_capital": city_data.get("is_capital", False),
            "created_at": datetime.utcnow()
        }
        
        try:
            # Upsert by name + country_iso2 combination
            result = await db.cities.update_one(
                {
                    "name": city_data["name"],
                    "country_iso2": city_data["country_iso2"]
                },
                {"$setOnInsert": city_doc},
                upsert=True
            )
            
            if result.upserted_id:
                seeded_count += 1
                logger.info(f"✓ Added city: {city_data['name']}, {city_data['country_iso2']}")
            else:
                updated_count += 1
                
        except Exception as e:
            logger.error(f"✗ Failed to seed city {city_data['name']}: {e}")
    
    logger.info(f"Cities seeding completed: {seeded_count} added, {updated_count} existing")

async def main():
    parser = argparse.ArgumentParser(description='Seed geographic data into MongoDB')
    parser.add_argument('--reset', action='store_true', help='Clear and reseed all data')
    parser.add_argument('--update', action='store_true', help='Update existing data (upsert)')
    parser.add_argument('--countries-only', action='store_true', help='Seed only countries')
    parser.add_argument('--cities-only', action='store_true', help='Seed only cities')
    
    args = parser.parse_args()
    
    # Default to update mode if no specific action
    if not any([args.reset, args.update, args.countries_only, args.cities_only]):
        args.update = True
    
    db = await connect_to_mongo()
    
    try:
        if args.countries_only:
            await seed_countries(db, reset=args.reset)
        elif args.cities_only:
            await seed_cities(db, reset=args.reset)
        else:
            # Seed both countries and cities
            await seed_countries(db, reset=args.reset)
            await seed_cities(db, reset=args.reset)
        
        logger.info("🎉 Geographic data seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())