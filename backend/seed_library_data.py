"""
Seed library data: Countries, Cities, Currencies, Fair Centers
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

async def seed_library_data():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"🌱 Seeding library data to database: {db_name}")
    
    # 1. Countries - 195 UN member states with common abbreviations
    countries = [
        "ABD", "Afganistan", "Almanya", "Andorra", "Angola", "Antigua ve Barbuda",
        "Arjantin", "Arnavutluk", "Avustralya", "Avusturya", "Azerbaycan", "BAE",
        "Bahama", "Bahreyn", "Bangladeş", "Barbados", "Beyaz Rusya", "Belçika",
        "Belize", "Benin", "Bhutan", "Bolivya", "Bosna-Hersek", "Botsvana",
        "Brezilya", "Brunei", "Bulgaristan", "Burkina Faso", "Burundi", "Çad",
        "Cezayir", "Cibuti", "Çin", "Danimarka", "Dominik", "Dominik Cumhuriyeti",
        "Doğu Timor", "Ekvador", "Ekvator Ginesi", "El Salvador", "Endonezya",
        "Eritre", "Ermenistan", "Estonya", "Etiyopya", "Fas", "Fiji", "Fildişi Sahili",
        "Filipinler", "Filistin", "Finlandiya", "Fransa", "Gabon", "Gambiya",
        "Gana", "Grenada", "Guatemala", "Gine", "Gine-Bissau", "Guyana",
        "Güney Afrika", "Güney Kore", "Güney Sudan", "Gürcistan", "Haiti",
        "Hırvatistan", "Hindistan", "Hollanda", "Honduras", "Irak", "İran",
        "İrlanda", "İspanya", "İsrail", "İsveç", "İsviçre", "İtalya",
        "İzlanda", "Jamaika", "Japonya", "Kamboçya", "Kamerun", "Kanada",
        "Karadağ", "Katar", "Kazakistan", "Kenya", "Kıbrıs", "Kırgızistan",
        "Kiribati", "Kolombiya", "Kongo", "Kosta Rika", "Kuveyt", "Kuzey Kore",
        "Kuzey Makedonya", "Küba", "Laos", "Lesotho", "Letonya", "Liberya",
        "Libya", "Liechtenstein", "Litvanya", "Lübnan", "Lüksemburg", "Macaristan",
        "Madagaskar", "Malavi", "Maldivler", "Malezya", "Mali", "Malta",
        "Marshall Adaları", "Mauritius", "Meksika", "Mısır", "Mikronezya",
        "Moğolistan", "Moldova", "Monako", "Mozambik", "Myanmar", "Namibya",
        "Nauru", "Nepal", "Nijer", "Nijerya", "Nikaragua", "Norveç",
        "Orta Afrika Cumhuriyeti", "Özbekistan", "Pakistan", "Palau", "Panama",
        "Papua Yeni Gine", "Paraguay", "Peru", "Polonya", "Portekiz",
        "Romanya", "Ruanda", "Rusya", "Saint Kitts ve Nevis", "Saint Lucia",
        "Saint Vincent ve Grenadinler", "Samoa", "San Marino", "São Tomé ve Príncipe",
        "Senegal", "Seyşeller", "Sırbistan", "Sierra Leone", "Singapur",
        "Slovakya", "Slovenya", "Solomon Adaları", "Somali", "Sri Lanka",
        "Sudan", "Surinam", "Suriye", "Suudi Arabistan", "Şili", "Tacikistan",
        "Tanzanya", "Tayland", "Togo", "Tonga", "Trinidad ve Tobago", "Tunus",
        "Tuvalu", "Türkiye", "Türkmenistan", "Uganda", "Ukrayna", "Umman",
        "Uruguay", "Ürdün", "Vanuatu", "Vatikan", "Venezuela", "Vietnam",
        "Yemen", "Yeni Zelanda", "Yeşil Burun Adaları", "Yunanistan", "Zambiya", "Zimbabve"
    ]
    
    country_docs = [{"id": str(uuid.uuid4()), "name": country, "code": ""} for country in countries]
    
    await db.countries.delete_many({})
    if country_docs:
        await db.countries.insert_many(country_docs)
    print(f"✅ {len(country_docs)} ülke eklendi")
    
    # 2. Cities - Turkish cities (25) + Las Vegas
    cities = [
        {"name": "İstanbul", "country": "Türkiye"},
        {"name": "Ankara", "country": "Türkiye"},
        {"name": "İzmir", "country": "Türkiye"},
        {"name": "Bursa", "country": "Türkiye"},
        {"name": "Antalya", "country": "Türkiye"},
        {"name": "Adana", "country": "Türkiye"},
        {"name": "Konya", "country": "Türkiye"},
        {"name": "Gaziantep", "country": "Türkiye"},
        {"name": "Şanlıurfa", "country": "Türkiye"},
        {"name": "Kocaeli", "country": "Türkiye"},
        {"name": "Mersin", "country": "Türkiye"},
        {"name": "Diyarbakır", "country": "Türkiye"},
        {"name": "Hatay", "country": "Türkiye"},
        {"name": "Manisa", "country": "Türkiye"},
        {"name": "Kayseri", "country": "Türkiye"},
        {"name": "Samsun", "country": "Türkiye"},
        {"name": "Balıkesir", "country": "Türkiye"},
        {"name": "Kahramanmaraş", "country": "Türkiye"},
        {"name": "Van", "country": "Türkiye"},
        {"name": "Aydın", "country": "Türkiye"},
        {"name": "Denizli", "country": "Türkiye"},
        {"name": "Sakarya", "country": "Türkiye"},
        {"name": "Tekirdağ", "country": "Türkiye"},
        {"name": "Muğla", "country": "Türkiye"},
        {"name": "Eskişehir", "country": "Türkiye"},
        {"name": "Las Vegas", "country": "ABD"},
    ]
    
    city_docs = [{"id": str(uuid.uuid4()), **city} for city in cities]
    
    await db.cities.delete_many({})
    if city_docs:
        await db.cities.insert_many(city_docs)
    print(f"✅ {len(city_docs)} şehir eklendi")
    
    # 3. Currencies - Major world currencies
    currencies = [
        {"code": "TRY", "name": "Türk Lirası", "symbol": "₺"},
        {"code": "USD", "name": "ABD Doları", "symbol": "$"},
        {"code": "EUR", "name": "Euro", "symbol": "€"},
        {"code": "GBP", "name": "İngiliz Sterlini", "symbol": "£"},
        {"code": "JPY", "name": "Japon Yeni", "symbol": "¥"},
        {"code": "CHF", "name": "İsviçre Frangı", "symbol": "Fr"},
        {"code": "CNY", "name": "Çin Yuanı", "symbol": "¥"},
        {"code": "AUD", "name": "Avustralya Doları", "symbol": "A$"},
        {"code": "CAD", "name": "Kanada Doları", "symbol": "C$"},
        {"code": "AED", "name": "BAE Dirhemi", "symbol": "د.إ"},
        {"code": "SAR", "name": "Suudi Riyali", "symbol": "﷼"},
        {"code": "RUB", "name": "Rus Rublesi", "symbol": "₽"},
        {"code": "INR", "name": "Hint Rupisi", "symbol": "₹"},
        {"code": "BRL", "name": "Brezilya Reali", "symbol": "R$"},
        {"code": "MXN", "name": "Meksika Pesosu", "symbol": "$"},
        {"code": "ZAR", "name": "Güney Afrika Randı", "symbol": "R"},
        {"code": "KRW", "name": "Güney Kore Wonu", "symbol": "₩"},
        {"code": "SGD", "name": "Singapur Doları", "symbol": "S$"},
        {"code": "HKD", "name": "Hong Kong Doları", "symbol": "HK$"},
        {"code": "NOK", "name": "Norveç Kronu", "symbol": "kr"},
        {"code": "SEK", "name": "İsveç Kronu", "symbol": "kr"},
        {"code": "DKK", "name": "Danimarka Kronu", "symbol": "kr"},
        {"code": "PLN", "name": "Polonya Zlotisi", "symbol": "zł"},
        {"code": "THB", "name": "Tayland Bahtı", "symbol": "฿"},
        {"code": "MYR", "name": "Malezya Ringgiti", "symbol": "RM"},
    ]
    
    currency_docs = [{"id": str(uuid.uuid4()), **currency} for currency in currencies]
    
    await db.currencies.delete_many({})
    if currency_docs:
        await db.currencies.insert_many(currency_docs)
    print(f"✅ {len(currency_docs)} para birimi eklendi")
    
    # 4. Fair Centers - Start with LVCC
    fair_centers = [
        {
            "name": "LVCC (Las Vegas Convention Center)",
            "city": "Las Vegas",
            "country": "ABD",
            "address": "3150 Paradise Rd, Las Vegas, NV 89109, USA"
        }
    ]
    
    center_docs = [{"id": str(uuid.uuid4()), **center} for center in fair_centers]
    
    await db.fair_centers.delete_many({})
    if center_docs:
        await db.fair_centers.insert_many(center_docs)
    print(f"✅ {len(center_docs)} fuar merkezi eklendi")
    
    # 5. Phone Codes - Major countries
    phone_codes = [
        {"country": "Türkiye", "code": "+90"},
        {"country": "ABD", "code": "+1"},
        {"country": "Almanya", "code": "+49"},
        {"country": "Fransa", "code": "+33"},
        {"country": "İngiltere", "code": "+44"},
        {"country": "İtalya", "code": "+39"},
        {"country": "İspanya", "code": "+34"},
        {"country": "Hollanda", "code": "+31"},
        {"country": "Belçika", "code": "+32"},
        {"country": "İsviçre", "code": "+41"},
        {"country": "Avusturya", "code": "+43"},
        {"country": "Yunanistan", "code": "+30"},
        {"country": "Polonya", "code": "+48"},
        {"country": "Çekya", "code": "+420"},
        {"country": "Macaristan", "code": "+36"},
        {"country": "Romanya", "code": "+40"},
        {"country": "Bulgaristan", "code": "+359"},
        {"country": "Portekiz", "code": "+351"},
        {"country": "İsveç", "code": "+46"},
        {"country": "Norveç", "code": "+47"},
        {"country": "Finlandiya", "code": "+358"},
        {"country": "Danimarka", "code": "+45"},
        {"country": "İrlanda", "code": "+353"},
        {"country": "Rusya", "code": "+7"},
        {"country": "Ukrayna", "code": "+380"},
        {"country": "Çin", "code": "+86"},
        {"country": "Japonya", "code": "+81"},
        {"country": "Güney Kore", "code": "+82"},
        {"country": "Hindistan", "code": "+91"},
        {"country": "Pakistan", "code": "+92"},
        {"country": "Bangladeş", "code": "+880"},
        {"country": "Endonezya", "code": "+62"},
        {"country": "Tayland", "code": "+66"},
        {"country": "Malezya", "code": "+60"},
        {"country": "Singapur", "code": "+65"},
        {"country": "Filipinler", "code": "+63"},
        {"country": "Vietnam", "code": "+84"},
        {"country": "Avustralya", "code": "+61"},
        {"country": "Yeni Zelanda", "code": "+64"},
        {"country": "Meksika", "code": "+52"},
        {"country": "Brezilya", "code": "+55"},
        {"country": "Arjantin", "code": "+54"},
        {"country": "Şili", "code": "+56"},
        {"country": "Kolombiya", "code": "+57"},
        {"country": "Peru", "code": "+51"},
        {"country": "Mısır", "code": "+20"},
        {"country": "Güney Afrika", "code": "+27"},
        {"country": "Nijerya", "code": "+234"},
        {"country": "Kenya", "code": "+254"},
        {"country": "BAE", "code": "+971"},
        {"country": "Suudi Arabistan", "code": "+966"},
        {"country": "Katar", "code": "+974"},
        {"country": "Kuveyt", "code": "+965"},
        {"country": "İsrail", "code": "+972"},
        {"country": "Lübnan", "code": "+961"},
        {"country": "Ürdün", "code": "+962"},
        {"country": "Azerbaycan", "code": "+994"},
        {"country": "Gürcistan", "code": "+995"},
        {"country": "Kazakistan", "code": "+7"},
        {"country": "Özbekistan", "code": "+998"},
        {"country": "Ermenistan", "code": "+374"},
        {"country": "Beyaz Rusya", "code": "+375"},
        {"country": "İran", "code": "+98"},
        {"country": "Irak", "code": "+964"},
        {"country": "Kanada", "code": "+1"},
        {"country": "Küba", "code": "+53"},
    ]
    
    phone_code_docs = [{"id": str(uuid.uuid4()), **code} for code in phone_codes]
    
    await db.phone_codes.delete_many({})
    if phone_code_docs:
        await db.phone_codes.insert_many(phone_code_docs)
    print(f"✅ {len(phone_code_docs)} telefon kodu eklendi")
    
    client.close()
    print("🎉 Library data seeding tamamlandı!")

if __name__ == "__main__":
    asyncio.run(seed_library_data())
