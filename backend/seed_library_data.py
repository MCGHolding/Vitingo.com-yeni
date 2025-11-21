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
    
    # 3. Currencies - Complete list with flags
    currencies = [
        {"code": "AED", "name": "BAE Dirhemi", "symbol": "د.إ", "flag": "🇦🇪"},
        {"code": "AFN", "name": "Afgan Afganisi", "symbol": "؋", "flag": "🇦🇫"},
        {"code": "ALL", "name": "Arnavut Leki", "symbol": "L", "flag": "🇦🇱"},
        {"code": "AMD", "name": "Ermeni Dramı", "symbol": "֏", "flag": "🇦🇲"},
        {"code": "ANG", "name": "Hollanda Antilleri Guldeni", "symbol": "ƒ", "flag": "🇨🇼"},
        {"code": "AOA", "name": "Angola Kwanzası", "symbol": "Kz", "flag": "🇦🇴"},
        {"code": "ARS", "name": "Arjantin Pesosu", "symbol": "$", "flag": "🇦🇷"},
        {"code": "AUD", "name": "Avustralya Doları", "symbol": "A$", "flag": "🇦🇺"},
        {"code": "AWG", "name": "Aruba Florini", "symbol": "ƒ", "flag": "🇦🇼"},
        {"code": "AZN", "name": "Azerbaycan Manatı", "symbol": "₼", "flag": "🇦🇿"},
        {"code": "BAM", "name": "Bosna-Hersek Markı", "symbol": "KM", "flag": "🇧🇦"},
        {"code": "BBD", "name": "Barbados Doları", "symbol": "$", "flag": "🇧🇧"},
        {"code": "BDT", "name": "Bangladeş Takası", "symbol": "৳", "flag": "🇧🇩"},
        {"code": "BGN", "name": "Bulgar Levası", "symbol": "лв", "flag": "🇧🇬"},
        {"code": "BHD", "name": "Bahreyn Dinarı", "symbol": ".د.ب", "flag": "🇧🇭"},
        {"code": "BIF", "name": "Burundi Frangı", "symbol": "Fr", "flag": "🇧🇮"},
        {"code": "BMD", "name": "Bermuda Doları", "symbol": "$", "flag": "🇧🇲"},
        {"code": "BND", "name": "Brunei Doları", "symbol": "$", "flag": "🇧🇳"},
        {"code": "BOB", "name": "Bolivya Bolivyanosu", "symbol": "Bs.", "flag": "🇧🇴"},
        {"code": "BRL", "name": "Brezilya Reali", "symbol": "R$", "flag": "🇧🇷"},
        {"code": "BSD", "name": "Bahamalar Doları", "symbol": "$", "flag": "🇧🇸"},
        {"code": "BTN", "name": "Bhutan Ngultrumu", "symbol": "Nu.", "flag": "🇧🇹"},
        {"code": "BWP", "name": "Botsvana Pulası", "symbol": "P", "flag": "🇧🇼"},
        {"code": "BYN", "name": "Belarus Rublesi", "symbol": "Br", "flag": "🇧🇾"},
        {"code": "BZD", "name": "Belize Doları", "symbol": "$", "flag": "🇧🇿"},
        {"code": "CAD", "name": "Kanada Doları", "symbol": "C$", "flag": "🇨🇦"},
        {"code": "CDF", "name": "Kongo Frangı", "symbol": "Fr", "flag": "🇨🇩"},
        {"code": "CHF", "name": "İsviçre Frangı", "symbol": "Fr", "flag": "🇨🇭"},
        {"code": "CLP", "name": "Şili Pesosu", "symbol": "$", "flag": "🇨🇱"},
        {"code": "CNY", "name": "Çin Yuanı", "symbol": "¥", "flag": "🇨🇳"},
        {"code": "COP", "name": "Kolombiya Pesosu", "symbol": "$", "flag": "🇨🇴"},
        {"code": "CRC", "name": "Kosta Rika Kolonu", "symbol": "₡", "flag": "🇨🇷"},
        {"code": "CUP", "name": "Küba Pesosu", "symbol": "$", "flag": "🇨🇺"},
        {"code": "CVE", "name": "Cape Verde Escudosu", "symbol": "$", "flag": "🇨🇻"},
        {"code": "CZK", "name": "Çek Kronu", "symbol": "Kč", "flag": "🇨🇿"},
        {"code": "DJF", "name": "Cibuti Frangı", "symbol": "Fr", "flag": "🇩🇯"},
        {"code": "DKK", "name": "Danimarka Kronu", "symbol": "kr", "flag": "🇩🇰"},
        {"code": "DOP", "name": "Dominik Pesosu", "symbol": "$", "flag": "🇩🇴"},
        {"code": "DZD", "name": "Cezayir Dinarı", "symbol": "د.ج", "flag": "🇩🇿"},
        {"code": "EGP", "name": "Mısır Lirası", "symbol": "£", "flag": "🇪🇬"},
        {"code": "ERN", "name": "Eritre Nakfası", "symbol": "Nfk", "flag": "🇪🇷"},
        {"code": "ETB", "name": "Etiyopya Birri", "symbol": "Br", "flag": "🇪🇹"},
        {"code": "EUR", "name": "Euro", "symbol": "€", "flag": "🇪🇺"},
        {"code": "FJD", "name": "Fiji Doları", "symbol": "$", "flag": "🇫🇯"},
        {"code": "FKP", "name": "Falkland Lirası", "symbol": "£", "flag": "🇫🇰"},
        {"code": "GBP", "name": "İngiliz Sterlini", "symbol": "£", "flag": "🇬🇧"},
        {"code": "GEL", "name": "Gürcistan Larisi", "symbol": "₾", "flag": "🇬🇪"},
        {"code": "GHS", "name": "Gana Sedisi", "symbol": "₵", "flag": "🇬🇭"},
        {"code": "GIP", "name": "Cebelitarık Lirası", "symbol": "£", "flag": "🇬🇮"},
        {"code": "GMD", "name": "Gambiya Dalasisi", "symbol": "D", "flag": "🇬🇲"},
        {"code": "GNF", "name": "Gine Frangı", "symbol": "Fr", "flag": "🇬🇳"},
        {"code": "GTQ", "name": "Guatemala Quetzalı", "symbol": "Q", "flag": "🇬🇹"},
        {"code": "GYD", "name": "Guyana Doları", "symbol": "$", "flag": "🇬🇾"},
        {"code": "HKD", "name": "Hong Kong Doları", "symbol": "HK$", "flag": "🇭🇰"},
        {"code": "HNL", "name": "Honduras Lempirası", "symbol": "L", "flag": "🇭🇳"},
        {"code": "HRK", "name": "Hırvatistan Kunası", "symbol": "kn", "flag": "🇭🇷"},
        {"code": "HTG", "name": "Haiti Gourdesi", "symbol": "G", "flag": "🇭🇹"},
        {"code": "HUF", "name": "Macar Forinti", "symbol": "Ft", "flag": "🇭🇺"},
        {"code": "IDR", "name": "Endonezya Rupisi", "symbol": "Rp", "flag": "🇮🇩"},
        {"code": "ILS", "name": "İsrail Şekeli", "symbol": "₪", "flag": "🇮🇱"},
        {"code": "INR", "name": "Hint Rupisi", "symbol": "₹", "flag": "🇮🇳"},
        {"code": "IQD", "name": "Irak Dinarı", "symbol": "ع.د", "flag": "🇮🇶"},
        {"code": "IRR", "name": "İran Riyali", "symbol": "﷼", "flag": "🇮🇷"},
        {"code": "ISK", "name": "İzlanda Kronu", "symbol": "kr", "flag": "🇮🇸"},
        {"code": "JMD", "name": "Jamaika Doları", "symbol": "$", "flag": "🇯🇲"},
        {"code": "JOD", "name": "Ürdün Dinarı", "symbol": "د.ا", "flag": "🇯🇴"},
        {"code": "JPY", "name": "Japon Yeni", "symbol": "¥", "flag": "🇯🇵"},
        {"code": "KES", "name": "Kenya Şilini", "symbol": "Sh", "flag": "🇰🇪"},
        {"code": "KGS", "name": "Kırgızistan Somu", "symbol": "с", "flag": "🇰🇬"},
        {"code": "KHR", "name": "Kamboçya Rieli", "symbol": "៛", "flag": "🇰🇭"},
        {"code": "KMF", "name": "Komorlar Frangı", "symbol": "Fr", "flag": "🇰🇲"},
        {"code": "KPW", "name": "Kuzey Kore Wonu", "symbol": "₩", "flag": "🇰🇵"},
        {"code": "KRW", "name": "Güney Kore Wonu", "symbol": "₩", "flag": "🇰🇷"},
        {"code": "KWD", "name": "Kuveyt Dinarı", "symbol": "د.ك", "flag": "🇰🇼"},
        {"code": "KYD", "name": "Cayman Doları", "symbol": "$", "flag": "🇰🇾"},
        {"code": "KZT", "name": "Kazakistan Tengesi", "symbol": "₸", "flag": "🇰🇿"},
        {"code": "LAK", "name": "Laos Kipi", "symbol": "₭", "flag": "🇱🇦"},
        {"code": "LBP", "name": "Lübnan Lirası", "symbol": "ل.ل", "flag": "🇱🇧"},
        {"code": "LKR", "name": "Sri Lanka Rupisi", "symbol": "Rs", "flag": "🇱🇰"},
        {"code": "LRD", "name": "Liberya Doları", "symbol": "$", "flag": "🇱🇷"},
        {"code": "LSL", "name": "Lesotho Lotisi", "symbol": "L", "flag": "🇱🇸"},
        {"code": "LYD", "name": "Libya Dinarı", "symbol": "ل.د", "flag": "🇱🇾"},
        {"code": "MAD", "name": "Fas Dirhemi", "symbol": "د.م.", "flag": "🇲🇦"},
        {"code": "MDL", "name": "Moldova Leusu", "symbol": "L", "flag": "🇲🇩"},
        {"code": "MGA", "name": "Madagaskar Ariarisi", "symbol": "Ar", "flag": "🇲🇬"},
        {"code": "MKD", "name": "Makedonya Dinarı", "symbol": "ден", "flag": "🇲🇰"},
        {"code": "MMK", "name": "Myanmar Kyatı", "symbol": "K", "flag": "🇲🇲"},
        {"code": "MNT", "name": "Moğolistan Tugriki", "symbol": "₮", "flag": "🇲🇳"},
        {"code": "MOP", "name": "Makao Patakası", "symbol": "P", "flag": "🇲🇴"},
        {"code": "MRU", "name": "Moritanya Ouguiyası", "symbol": "UM", "flag": "🇲🇷"},
        {"code": "MUR", "name": "Mauritius Rupisi", "symbol": "₨", "flag": "🇲🇺"},
        {"code": "MVR", "name": "Maldiv Rufiyaası", "symbol": "ރ.", "flag": "🇲🇻"},
        {"code": "MWK", "name": "Malavi Kwaçası", "symbol": "MK", "flag": "🇲🇼"},
        {"code": "MXN", "name": "Meksika Pesosu", "symbol": "$", "flag": "🇲🇽"},
        {"code": "MYR", "name": "Malezya Ringgiti", "symbol": "RM", "flag": "🇲🇾"},
        {"code": "MZN", "name": "Mozambik Metikali", "symbol": "MT", "flag": "🇲🇿"},
        {"code": "NAD", "name": "Namibya Doları", "symbol": "$", "flag": "🇳🇦"},
        {"code": "NGN", "name": "Nijerya Nairası", "symbol": "₦", "flag": "🇳🇬"},
        {"code": "NIO", "name": "Nikaragua Cordobası", "symbol": "C$", "flag": "🇳🇮"},
        {"code": "NOK", "name": "Norveç Kronu", "symbol": "kr", "flag": "🇳🇴"},
        {"code": "NPR", "name": "Nepal Rupisi", "symbol": "₨", "flag": "🇳🇵"},
        {"code": "NZD", "name": "Yeni Zelanda Doları", "symbol": "$", "flag": "🇳🇿"},
        {"code": "OMR", "name": "Umman Riyali", "symbol": "ر.ع.", "flag": "🇴🇲"},
        {"code": "PAB", "name": "Panama Balboası", "symbol": "B/.", "flag": "🇵🇦"},
        {"code": "PEN", "name": "Peru Solu", "symbol": "S/", "flag": "🇵🇪"},
        {"code": "PGK", "name": "Papua Yeni Gine Kinası", "symbol": "K", "flag": "🇵🇬"},
        {"code": "PHP", "name": "Filipin Pesosu", "symbol": "₱", "flag": "🇵🇭"},
        {"code": "PKR", "name": "Pakistan Rupisi", "symbol": "₨", "flag": "🇵🇰"},
        {"code": "PLN", "name": "Polonya Zlotisi", "symbol": "zł", "flag": "🇵🇱"},
        {"code": "PYG", "name": "Paraguay Guaranisi", "symbol": "₲", "flag": "🇵🇾"},
        {"code": "QAR", "name": "Katar Riyali", "symbol": "ر.ق", "flag": "🇶🇦"},
        {"code": "RON", "name": "Romanya Leyi", "symbol": "lei", "flag": "🇷🇴"},
        {"code": "RSD", "name": "Sırbistan Dinarı", "symbol": "дин", "flag": "🇷🇸"},
        {"code": "RUB", "name": "Rus Rublesi", "symbol": "₽", "flag": "🇷🇺"},
        {"code": "RWF", "name": "Ruanda Frangı", "symbol": "Fr", "flag": "🇷🇼"},
        {"code": "SAR", "name": "Suudi Riyali", "symbol": "ر.س", "flag": "🇸🇦"},
        {"code": "SBD", "name": "Solomon Doları", "symbol": "$", "flag": "🇸🇧"},
        {"code": "SCR", "name": "Seyşeller Rupisi", "symbol": "₨", "flag": "🇸🇨"},
        {"code": "SDG", "name": "Sudan Lirası", "symbol": "£", "flag": "🇸🇩"},
        {"code": "SEK", "name": "İsveç Kronu", "symbol": "kr", "flag": "🇸🇪"},
        {"code": "SGD", "name": "Singapur Doları", "symbol": "S$", "flag": "🇸🇬"},
        {"code": "SHP", "name": "Saint Helena Lirası", "symbol": "£", "flag": "🇸🇭"},
        {"code": "SLL", "name": "Sierra Leone Leonesi", "symbol": "Le", "flag": "🇸🇱"},
        {"code": "SOS", "name": "Somali Şilini", "symbol": "Sh", "flag": "🇸🇴"},
        {"code": "SRD", "name": "Surinam Doları", "symbol": "$", "flag": "🇸🇷"},
        {"code": "SSP", "name": "Güney Sudan Lirası", "symbol": "£", "flag": "🇸🇸"},
        {"code": "STN", "name": "São Tomé Dobrası", "symbol": "Db", "flag": "🇸🇹"},
        {"code": "SYP", "name": "Suriye Lirası", "symbol": "£", "flag": "🇸🇾"},
        {"code": "SZL", "name": "Svaziland Lilangenisi", "symbol": "L", "flag": "🇸🇿"},
        {"code": "THB", "name": "Tayland Bahtı", "symbol": "฿", "flag": "🇹🇭"},
        {"code": "TJS", "name": "Tacikistan Somonisi", "symbol": "ЅМ", "flag": "🇹🇯"},
        {"code": "TMT", "name": "Türkmenistan Manatı", "symbol": "m", "flag": "🇹🇲"},
        {"code": "TND", "name": "Tunus Dinarı", "symbol": "د.ت", "flag": "🇹🇳"},
        {"code": "TOP", "name": "Tonga Paʻangası", "symbol": "T$", "flag": "🇹🇴"},
        {"code": "TRY", "name": "Türk Lirası", "symbol": "₺", "flag": "🇹🇷"},
        {"code": "TTD", "name": "Trinidad Doları", "symbol": "$", "flag": "🇹🇹"},
        {"code": "TWD", "name": "Tayvan Doları", "symbol": "NT$", "flag": "🇹🇼"},
        {"code": "TZS", "name": "Tanzanya Şilini", "symbol": "Sh", "flag": "🇹🇿"},
        {"code": "UAH", "name": "Ukrayna Grivnası", "symbol": "₴", "flag": "🇺🇦"},
        {"code": "UGX", "name": "Uganda Şilini", "symbol": "Sh", "flag": "🇺🇬"},
        {"code": "USD", "name": "ABD Doları", "symbol": "$", "flag": "🇺🇸"},
        {"code": "UYU", "name": "Uruguay Pesosu", "symbol": "$", "flag": "🇺🇾"},
        {"code": "UZS", "name": "Özbekistan Somu", "symbol": "so'm", "flag": "🇺🇿"},
        {"code": "VES", "name": "Venezuela Bolívarı", "symbol": "Bs.", "flag": "🇻🇪"},
        {"code": "VND", "name": "Vietnam Dongu", "symbol": "₫", "flag": "🇻🇳"},
        {"code": "VUV", "name": "Vanuatu Vatusu", "symbol": "Vt", "flag": "🇻🇺"},
        {"code": "WST", "name": "Samoa Talası", "symbol": "T", "flag": "🇼🇸"},
        {"code": "XAF", "name": "Orta Afrika CFA Frangı", "symbol": "Fr", "flag": "🇨🇲"},
        {"code": "XCD", "name": "Doğu Karayip Doları", "symbol": "$", "flag": "🇦🇬"},
        {"code": "XOF", "name": "Batı Afrika CFA Frangı", "symbol": "Fr", "flag": "🇧🇯"},
        {"code": "XPF", "name": "CFP Frangı", "symbol": "Fr", "flag": "🇵🇫"},
        {"code": "YER", "name": "Yemen Riyali", "symbol": "﷼", "flag": "🇾🇪"},
        {"code": "ZAR", "name": "Güney Afrika Randı", "symbol": "R", "flag": "🇿🇦"},
        {"code": "ZMW", "name": "Zambiya Kvaçası", "symbol": "ZK", "flag": "🇿🇲"},
        {"code": "ZWL", "name": "Zimbabve Doları", "symbol": "$", "flag": "🇿🇼"},
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
