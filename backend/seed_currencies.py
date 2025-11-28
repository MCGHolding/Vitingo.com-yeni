"""
Seed currencies database with popular currencies
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

# Load environment variables
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'crm_db')]

# Popular currencies with approximate exchange rates to USD
CURRENCIES = [
    # Most Popular
    {"code": "USD", "name": "US Dollar", "symbol": "$", "exchange_rate_to_usd": 1.0, "is_popular": True, "display_order": 1},
    {"code": "EUR", "name": "Euro", "symbol": "€", "exchange_rate_to_usd": 1.09, "is_popular": True, "display_order": 2},
    {"code": "GBP", "name": "British Pound", "symbol": "£", "exchange_rate_to_usd": 1.27, "is_popular": True, "display_order": 3},
    {"code": "TRY", "name": "Turkish Lira", "symbol": "₺", "exchange_rate_to_usd": 0.031, "is_popular": True, "display_order": 4},
    {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "exchange_rate_to_usd": 0.0067, "is_popular": True, "display_order": 5},
    {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥", "exchange_rate_to_usd": 0.14, "is_popular": True, "display_order": 6},
    
    # Major Currencies
    {"code": "CHF", "name": "Swiss Franc", "symbol": "CHF", "exchange_rate_to_usd": 1.13, "is_popular": True, "display_order": 7},
    {"code": "CAD", "name": "Canadian Dollar", "symbol": "CA$", "exchange_rate_to_usd": 0.72, "is_popular": True, "display_order": 8},
    {"code": "AUD", "name": "Australian Dollar", "symbol": "A$", "exchange_rate_to_usd": 0.65, "is_popular": True, "display_order": 9},
    {"code": "NZD", "name": "New Zealand Dollar", "symbol": "NZ$", "exchange_rate_to_usd": 0.60, "is_popular": True, "display_order": 10},
    
    # European
    {"code": "SEK", "name": "Swedish Krona", "symbol": "kr", "exchange_rate_to_usd": 0.095, "is_popular": False, "display_order": 11},
    {"code": "NOK", "name": "Norwegian Krone", "symbol": "kr", "exchange_rate_to_usd": 0.093, "is_popular": False, "display_order": 12},
    {"code": "DKK", "name": "Danish Krone", "symbol": "kr", "exchange_rate_to_usd": 0.15, "is_popular": False, "display_order": 13},
    {"code": "PLN", "name": "Polish Zloty", "symbol": "zł", "exchange_rate_to_usd": 0.25, "is_popular": False, "display_order": 14},
    {"code": "CZK", "name": "Czech Koruna", "symbol": "Kč", "exchange_rate_to_usd": 0.044, "is_popular": False, "display_order": 15},
    {"code": "HUF", "name": "Hungarian Forint", "symbol": "Ft", "exchange_rate_to_usd": 0.0028, "is_popular": False, "display_order": 16},
    {"code": "RON", "name": "Romanian Leu", "symbol": "lei", "exchange_rate_to_usd": 0.22, "is_popular": False, "display_order": 17},
    {"code": "BGN", "name": "Bulgarian Lev", "symbol": "лв", "exchange_rate_to_usd": 0.56, "is_popular": False, "display_order": 18},
    
    # Middle East
    {"code": "AED", "name": "UAE Dirham", "symbol": "د.إ", "exchange_rate_to_usd": 0.27, "is_popular": True, "display_order": 19},
    {"code": "SAR", "name": "Saudi Riyal", "symbol": "﷼", "exchange_rate_to_usd": 0.27, "is_popular": True, "display_order": 20},
    {"code": "QAR", "name": "Qatari Riyal", "symbol": "﷼", "exchange_rate_to_usd": 0.27, "is_popular": False, "display_order": 21},
    {"code": "KWD", "name": "Kuwaiti Dinar", "symbol": "د.ك", "exchange_rate_to_usd": 3.25, "is_popular": False, "display_order": 22},
    {"code": "BHD", "name": "Bahraini Dinar", "symbol": "د.ب", "exchange_rate_to_usd": 2.65, "is_popular": False, "display_order": 23},
    {"code": "OMR", "name": "Omani Rial", "symbol": "﷼", "exchange_rate_to_usd": 2.60, "is_popular": False, "display_order": 24},
    {"code": "ILS", "name": "Israeli Shekel", "symbol": "₪", "exchange_rate_to_usd": 0.28, "is_popular": False, "display_order": 25},
    
    # Asia Pacific
    {"code": "SGD", "name": "Singapore Dollar", "symbol": "S$", "exchange_rate_to_usd": 0.74, "is_popular": True, "display_order": 26},
    {"code": "HKD", "name": "Hong Kong Dollar", "symbol": "HK$", "exchange_rate_to_usd": 0.13, "is_popular": True, "display_order": 27},
    {"code": "KRW", "name": "South Korean Won", "symbol": "₩", "exchange_rate_to_usd": 0.00076, "is_popular": False, "display_order": 28},
    {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "exchange_rate_to_usd": 0.012, "is_popular": True, "display_order": 29},
    {"code": "THB", "name": "Thai Baht", "symbol": "฿", "exchange_rate_to_usd": 0.029, "is_popular": False, "display_order": 30},
    {"code": "MYR", "name": "Malaysian Ringgit", "symbol": "RM", "exchange_rate_to_usd": 0.22, "is_popular": False, "display_order": 31},
    {"code": "IDR", "name": "Indonesian Rupiah", "symbol": "Rp", "exchange_rate_to_usd": 0.000063, "is_popular": False, "display_order": 32},
    {"code": "PHP", "name": "Philippine Peso", "symbol": "₱", "exchange_rate_to_usd": 0.018, "is_popular": False, "display_order": 33},
    {"code": "VND", "name": "Vietnamese Dong", "symbol": "₫", "exchange_rate_to_usd": 0.000040, "is_popular": False, "display_order": 34},
    {"code": "PKR", "name": "Pakistani Rupee", "symbol": "₨", "exchange_rate_to_usd": 0.0036, "is_popular": False, "display_order": 35},
    {"code": "BDT", "name": "Bangladeshi Taka", "symbol": "৳", "exchange_rate_to_usd": 0.0091, "is_popular": False, "display_order": 36},
    
    # Americas
    {"code": "MXN", "name": "Mexican Peso", "symbol": "MX$", "exchange_rate_to_usd": 0.059, "is_popular": True, "display_order": 37},
    {"code": "BRL", "name": "Brazilian Real", "symbol": "R$", "exchange_rate_to_usd": 0.20, "is_popular": True, "display_order": 38},
    {"code": "ARS", "name": "Argentine Peso", "symbol": "$", "exchange_rate_to_usd": 0.0011, "is_popular": False, "display_order": 39},
    {"code": "CLP", "name": "Chilean Peso", "symbol": "$", "exchange_rate_to_usd": 0.0011, "is_popular": False, "display_order": 40},
    {"code": "COP", "name": "Colombian Peso", "symbol": "$", "exchange_rate_to_usd": 0.00025, "is_popular": False, "display_order": 41},
    {"code": "PEN", "name": "Peruvian Sol", "symbol": "S/", "exchange_rate_to_usd": 0.27, "is_popular": False, "display_order": 42},
    
    # Africa
    {"code": "ZAR", "name": "South African Rand", "symbol": "R", "exchange_rate_to_usd": 0.055, "is_popular": True, "display_order": 43},
    {"code": "EGP", "name": "Egyptian Pound", "symbol": "E£", "exchange_rate_to_usd": 0.020, "is_popular": False, "display_order": 44},
    {"code": "NGN", "name": "Nigerian Naira", "symbol": "₦", "exchange_rate_to_usd": 0.00066, "is_popular": False, "display_order": 45},
    {"code": "KES", "name": "Kenyan Shilling", "symbol": "KSh", "exchange_rate_to_usd": 0.0078, "is_popular": False, "display_order": 46},
    {"code": "MAD", "name": "Moroccan Dirham", "symbol": "د.م.", "exchange_rate_to_usd": 0.10, "is_popular": False, "display_order": 47},
    
    # Others
    {"code": "RUB", "name": "Russian Ruble", "symbol": "₽", "exchange_rate_to_usd": 0.011, "is_popular": True, "display_order": 48},
    {"code": "UAH", "name": "Ukrainian Hryvnia", "symbol": "₴", "exchange_rate_to_usd": 0.027, "is_popular": False, "display_order": 49},
    {"code": "AZN", "name": "Azerbaijani Manat", "symbol": "₼", "exchange_rate_to_usd": 0.59, "is_popular": False, "display_order": 50},
]

async def seed_currencies():
    """Seed currencies into database"""
    try:
        # Check if already seeded
        count = await db.currencies.count_documents({})
        if count > 0:
            print(f"✓ Currencies already seeded ({count} currencies)")
            return
        
        # Add timestamps and IDs
        now = datetime.now(timezone.utc)
        for curr in CURRENCIES:
            import uuid
            curr["id"] = str(uuid.uuid4())
            curr["last_updated"] = now
            curr["is_active"] = True
        
        # Insert all currencies
        result = await db.currencies.insert_many(CURRENCIES)
        print(f"✓ Seeded {len(result.inserted_ids)} currencies successfully")
        
    except Exception as e:
        print(f"✗ Error seeding currencies: {str(e)}")

if __name__ == "__main__":
    asyncio.run(seed_currencies())
