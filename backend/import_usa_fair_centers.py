"""
Import USA fair centers to MongoDB
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
    
    print(f"🏢 Importing USA fair centers to: {db_name}")
    
    # Fair centers data
    fair_centers = [
        {"city": "New York", "name": "Jacob K. Javits Convention Center"},
        {"city": "New York", "name": "Brooklyn Expo Center"},
        {"city": "New York", "name": "Pier 94 (Manhattan Cruise Terminal)"},
        {"city": "Los Angeles", "name": "Los Angeles Convention Center"},
        {"city": "Los Angeles", "name": "Long Beach Convention & Entertainment Center"},
        {"city": "Los Angeles", "name": "Anaheim Convention Center"},
        {"city": "Los Angeles", "name": "Pasadena Convention Center"},
        {"city": "Chicago", "name": "McCormick Place"},
        {"city": "Chicago", "name": "Donald E. Stephens Convention Center (Rosemont)"},
        {"city": "Chicago", "name": "Navy Pier"},
        {"city": "Houston", "name": "George R. Brown Convention Center"},
        {"city": "Houston", "name": "NRG Center"},
        {"city": "Houston", "name": "NRG Arena"},
        {"city": "Phoenix", "name": "Phoenix Convention Center"},
        {"city": "Phoenix", "name": "Arizona State Fairgrounds"},
        {"city": "Philadelphia", "name": "Pennsylvania Convention Center"},
        {"city": "Philadelphia", "name": "Philadelphia Expo Center (Oaks)"},
        {"city": "San Antonio", "name": "Henry B. González Convention Center"},
        {"city": "San Antonio", "name": "Freeman Coliseum Expo Hall"},
        {"city": "San Diego", "name": "San Diego Convention Center"},
        {"city": "San Diego", "name": "Del Mar Fairgrounds"},
        {"city": "Dallas", "name": "Kay Bailey Hutchison Convention Center"},
        {"city": "Dallas", "name": "Market Hall"},
        {"city": "Dallas", "name": "Dallas Market Center"},
        {"city": "San Jose", "name": "San Jose McEnery Convention Center"},
        {"city": "San Jose", "name": "Santa Clara Convention Center"},
        {"city": "Austin", "name": "Austin Convention Center"},
        {"city": "Austin", "name": "Palmer Events Center"},
        {"city": "Jacksonville", "name": "Prime F. Osborn III Convention Center"},
        {"city": "Jacksonville", "name": "Jacksonville Fairgrounds"},
        {"city": "Fort Worth", "name": "Fort Worth Convention Center"},
        {"city": "Fort Worth", "name": "Will Rogers Memorial Center"},
        {"city": "Columbus", "name": "Greater Columbus Convention Center"},
        {"city": "Columbus", "name": "Ohio Expo Center & State Fair"},
        {"city": "Charlotte", "name": "Charlotte Convention Center"},
        {"city": "Charlotte", "name": "Park Expo and Conference Center"},
        {"city": "San Francisco", "name": "Moscone Center"},
        {"city": "San Francisco", "name": "Fort Mason Center"},
        {"city": "Indianapolis", "name": "Indiana Convention Center"},
        {"city": "Indianapolis", "name": "Indiana State Fairgrounds"},
        {"city": "Seattle", "name": "Washington State Convention Center"},
        {"city": "Seattle", "name": "Seattle Center Exhibition Hall"},
        {"city": "Seattle", "name": "CenturyLink Field Event Center"},
        {"city": "Denver", "name": "Colorado Convention Center"},
        {"city": "Denver", "name": "National Western Complex"},
        {"city": "Washington DC", "name": "Walter E. Washington Convention Center"},
        {"city": "Washington DC", "name": "Dulles Expo Center (Virginia)"},
        {"city": "Boston", "name": "Boston Convention & Exhibition Center"},
        {"city": "Boston", "name": "Hynes Convention Center"},
        {"city": "Boston", "name": "Seaport World Trade Center"},
        {"city": "Nashville", "name": "Music City Center"},
        {"city": "Nashville", "name": "Nashville Fairgrounds"},
        {"city": "Detroit", "name": "Huntington Place (formerly TCF Center/Cobo Center)"},
        {"city": "Detroit", "name": "Suburban Collection Showplace (Novi)"},
        {"city": "Portland", "name": "Oregon Convention Center"},
        {"city": "Portland", "name": "Portland Expo Center"},
        {"city": "Las Vegas", "name": "Las Vegas Convention Center"},
        {"city": "Las Vegas", "name": "Mandalay Bay Convention Center"},
        {"city": "Las Vegas", "name": "Sands Expo Convention Center"},
        {"city": "Las Vegas", "name": "The Venetian Expo"},
        {"city": "Las Vegas", "name": "Caesars Forum"},
        {"city": "Las Vegas", "name": "MGM Grand Conference Center"},
        {"city": "Louisville", "name": "Kentucky International Convention Center"},
        {"city": "Louisville", "name": "Kentucky Exposition Center"},
        {"city": "Memphis", "name": "Memphis Cook Convention Center"},
        {"city": "Memphis", "name": "Landers Center (Southaven)"},
        {"city": "Baltimore", "name": "Baltimore Convention Center"},
        {"city": "Baltimore", "name": "Maryland State Fairgrounds"},
        {"city": "Milwaukee", "name": "Wisconsin Center"},
        {"city": "Milwaukee", "name": "State Fair Park Exposition Center"},
        {"city": "Albuquerque", "name": "Albuquerque Convention Center"},
        {"city": "Albuquerque", "name": "Expo New Mexico"},
        {"city": "Tucson", "name": "Tucson Convention Center"},
        {"city": "Tucson", "name": "Desert Diamond Arena"},
        {"city": "Fresno", "name": "Fresno Convention & Entertainment Center"},
        {"city": "Fresno", "name": "Big Fresno Fair"},
        {"city": "Sacramento", "name": "Sacramento Convention Center"},
        {"city": "Sacramento", "name": "Cal Expo"},
        {"city": "Kansas City", "name": "Kansas City Convention Center"},
        {"city": "Kansas City", "name": "Bartle Hall"},
        {"city": "Mesa", "name": "Mesa Convention Center"},
        {"city": "Atlanta", "name": "Georgia World Congress Center"},
        {"city": "Atlanta", "name": "Cobb Galleria Centre (Smyrna)"},
        {"city": "Atlanta", "name": "Gas South Convention Center (Duluth)"},
        {"city": "Miami", "name": "Miami Beach Convention Center"},
        {"city": "Miami", "name": "Miami Airport Convention Center"},
        {"city": "Raleigh", "name": "Raleigh Convention Center"},
        {"city": "Raleigh", "name": "North Carolina State Fairgrounds"},
        {"city": "Omaha", "name": "CHI Health Center Omaha"},
        {"city": "Omaha", "name": "Baxter Arena"},
        {"city": "Minneapolis", "name": "Minneapolis Convention Center"},
        {"city": "Minneapolis", "name": "Minnesota State Fairgrounds"},
        {"city": "Cleveland", "name": "Huntington Convention Center of Cleveland"},
        {"city": "Cleveland", "name": "I-X Center"},
        {"city": "Wichita", "name": "Century II Performing Arts & Convention Center"},
        {"city": "Arlington", "name": "Arlington Convention Center"},
        {"city": "Arlington", "name": "AT&T Stadium (event space)"},
        {"city": "Tampa", "name": "Tampa Convention Center"},
        {"city": "Tampa", "name": "Florida State Fairgrounds"},
        {"city": "New Orleans", "name": "Ernest N. Morial Convention Center"},
        {"city": "New Orleans", "name": "Pontchartrain Center (Kenner)"},
        {"city": "Bakersfield", "name": "Kern County Fairgrounds"},
        {"city": "Aurora", "name": "Gaylord Rockies Resort & Convention Center"},
        {"city": "Anaheim", "name": "Anaheim Convention Center"},
        {"city": "Anaheim", "name": "Honda Center (event space)"},
        {"city": "Honolulu", "name": "Hawaii Convention Center"},
        {"city": "Santa Ana", "name": "OC Fair & Event Center"},
        {"city": "St. Louis", "name": "America's Center Convention Complex"},
        {"city": "St. Louis", "name": "The Dome at America's Center"},
        {"city": "Riverside", "name": "Riverside Convention Center"},
        {"city": "Corpus Christi", "name": "American Bank Center"},
        {"city": "Lexington", "name": "Central Bank Center (formerly Rupp Arena)"},
        {"city": "Pittsburgh", "name": "David L. Lawrence Convention Center"},
        {"city": "Anchorage", "name": "Dena'ina Civic and Convention Center"},
        {"city": "Stockton", "name": "San Joaquin County Fairgrounds"},
        {"city": "Cincinnati", "name": "Duke Energy Convention Center"},
        {"city": "St. Paul", "name": "Roy Wilkins Auditorium"},
        {"city": "Toledo", "name": "Huntington Center"},
        {"city": "Greensboro", "name": "Greensboro Coliseum Complex"},
        {"city": "Newark", "name": "New Jersey Convention & Expo Center"},
        {"city": "Plano", "name": "Plano Event Center"},
        {"city": "Henderson", "name": "Henderson Convention Center"},
        {"city": "Lincoln", "name": "Pinnacle Bank Arena"},
        {"city": "Buffalo", "name": "Buffalo Niagara Convention Center"},
        {"city": "Jersey City", "name": "Liberty State Park (event space)"},
        {"city": "Chula Vista", "name": "Mattress Firm Amphitheatre (event space)"},
        {"city": "Fort Wayne", "name": "Allen County War Memorial Coliseum"},
        {"city": "Orlando", "name": "Orange County Convention Center"},
        {"city": "Orlando", "name": "Central Florida Fairgrounds"},
        {"city": "Orlando", "name": "Orange County Convention Center West"},
        {"city": "Irvine", "name": "Irvine Spectrum Center"},
        {"city": "Chandler", "name": "Chandler Fashion Center (event space)"},
        {"city": "Laredo", "name": "Sames Auto Arena"},
        {"city": "Norfolk", "name": "Norfolk Scope"},
        {"city": "Norfolk", "name": "Hampton Roads Convention Center"},
        {"city": "Lubbock", "name": "Lubbock Memorial Civic Center"},
        {"city": "Winston-Salem", "name": "Lawrence Joel Veterans Memorial Coliseum"},
        {"city": "Scottsdale", "name": "Scottsdale Resort & Conference Center"},
        {"city": "Glendale", "name": "State Farm Stadium (event space)"},
        {"city": "Glendale", "name": "Desert Diamond Arena"},
        {"city": "Garland", "name": "Garland Special Events Center"},
        {"city": "Reno", "name": "Reno-Sparks Convention Center"},
        {"city": "Reno", "name": "Grand Sierra Resort & Casino"},
    ]
    
    # Add id, country, and address to each
    fair_centers_docs = []
    for center in fair_centers:
        fair_centers_docs.append({
            "id": str(uuid.uuid4()),
            "name": center["name"],
            "country": "ABD",
            "city": center["city"],
            "address": ""
        })
    
    # Insert to database
    if fair_centers_docs:
        result = await db.fair_centers.insert_many(fair_centers_docs)
        print(f"✅ {len(result.inserted_ids)} fuar merkezi eklendi")
    
    # Show summary by city
    print("\n📊 Şehirlere Göre Dağılım (Top 15):")
    from collections import Counter
    city_counts = Counter([c["city"] for c in fair_centers])
    for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {city}: {count} fuar merkezi")
    
    print(f"\n✅ Import tamamlandı!")
    print(f"Toplam: {len(fair_centers)} fuar merkezi")
    print(f"Farklı Şehir: {len(city_counts)} ABD şehri")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_fair_centers())
