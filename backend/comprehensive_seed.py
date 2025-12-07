"""
Kapsamlı Global Data Seed Script
=================================
150+ para birimi, 195+ ülke, 500K+ nüfuslu şehirler, 15 dil
"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import asyncio


# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client['crm_db']


async def seed_currencies():
    """150+ dünya para birimi (ISO 4217)"""
    collection = db.currencies
    
    now = datetime.now(timezone.utc)
    
    currencies = [
        # Major currencies (is_common=True)
        {"code": "USD", "name": "US Dollar", "name_tr": "Amerikan Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 1},
        {"code": "EUR", "name": "Euro", "name_tr": "Euro", "symbol": "€", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 2},
        {"code": "GBP", "name": "British Pound", "name_tr": "İngiliz Sterlini", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 3},
        {"code": "TRY", "name": "Turkish Lira", "name_tr": "Türk Lirası", "symbol": "₺", "decimal_places": 2, "symbol_position": "after", "is_common": True, "sort_order": 4},
        {"code": "JPY", "name": "Japanese Yen", "name_tr": "Japon Yeni", "symbol": "¥", "decimal_places": 0, "symbol_position": "before", "is_common": True, "sort_order": 5},
        {"code": "CNY", "name": "Chinese Yuan", "name_tr": "Çin Yuanı", "symbol": "¥", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 6},
        {"code": "CHF", "name": "Swiss Franc", "name_tr": "İsviçre Frangı", "symbol": "CHF", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 7},
        {"code": "AUD", "name": "Australian Dollar", "name_tr": "Avustralya Doları", "symbol": "A$", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 8},
        {"code": "CAD", "name": "Canadian Dollar", "name_tr": "Kanada Doları", "symbol": "C$", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 9},
        {"code": "AED", "name": "UAE Dirham", "name_tr": "BAE Dirhemi", "symbol": "د.إ", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 10},
        {"code": "SAR", "name": "Saudi Riyal", "name_tr": "Suudi Riyali", "symbol": "ر.س", "decimal_places": 2, "symbol_position": "before", "is_common": True, "sort_order": 11},
        
        # Other currencies (alphabetically)
        {"code": "AFN", "name": "Afghan Afghani", "name_tr": "Afgan Afganisi", "symbol": "؋", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ALL", "name": "Albanian Lek", "name_tr": "Arnavut Leki", "symbol": "L", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "AMD", "name": "Armenian Dram", "name_tr": "Ermeni Dramı", "symbol": "֏", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "ANG", "name": "Netherlands Antillean Guilder", "name_tr": "Hollanda Antilleri Guldeni", "symbol": "ƒ", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "AOA", "name": "Angolan Kwanza", "name_tr": "Angola Kwanzası", "symbol": "Kz", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ARS", "name": "Argentine Peso", "name_tr": "Arjantin Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "AWG", "name": "Aruban Florin", "name_tr": "Aruba Florini", "symbol": "ƒ", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "AZN", "name": "Azerbaijani Manat", "name_tr": "Azerbaycan Manatı", "symbol": "₼", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BAM", "name": "Bosnia-Herzegovina Convertible Mark", "name_tr": "Bosna-Hersek Konvertibl Markı", "symbol": "KM", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "BBD", "name": "Barbadian Dollar", "name_tr": "Barbados Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BDT", "name": "Bangladeshi Taka", "name_tr": "Bangladeş Takası", "symbol": "৳", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BGN", "name": "Bulgarian Lev", "name_tr": "Bulgar Levası", "symbol": "лв", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "BHD", "name": "Bahraini Dinar", "name_tr": "Bahreyn Dinarı", "symbol": ".د.ب", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BIF", "name": "Burundian Franc", "name_tr": "Burundi Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BMD", "name": "Bermudan Dollar", "name_tr": "Bermuda Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BND", "name": "Brunei Dollar", "name_tr": "Brunei Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BOB", "name": "Bolivian Boliviano", "name_tr": "Bolivya Bolivyanosu", "symbol": "Bs.", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BRL", "name": "Brazilian Real", "name_tr": "Brezilya Reali", "symbol": "R$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BSD", "name": "Bahamian Dollar", "name_tr": "Bahama Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BTN", "name": "Bhutanese Ngultrum", "name_tr": "Butan Ngultrumu", "symbol": "Nu.", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BWP", "name": "Botswanan Pula", "name_tr": "Botsvana Pulası", "symbol": "P", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "BYN", "name": "Belarusian Ruble", "name_tr": "Belarus Rublesi", "symbol": "Br", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "BZD", "name": "Belize Dollar", "name_tr": "Belize Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CDF", "name": "Congolese Franc", "name_tr": "Kongo Frangı", "symbol": "Fr", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CLF", "name": "Chilean Unit of Account (UF)", "name_tr": "Şili Hesap Birimi", "symbol": "UF", "decimal_places": 4, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CLP", "name": "Chilean Peso", "name_tr": "Şili Pezosu", "symbol": "$", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "COP", "name": "Colombian Peso", "name_tr": "Kolombiya Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CRC", "name": "Costa Rican Colón", "name_tr": "Kosta Rika Kolonu", "symbol": "₡", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CUC", "name": "Cuban Convertible Peso", "name_tr": "Küba Konvertibl Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CUP", "name": "Cuban Peso", "name_tr": "Küba Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CVE", "name": "Cape Verdean Escudo", "name_tr": "Cape Verde Escudosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "CZK", "name": "Czech Republic Koruna", "name_tr": "Çek Korunası", "symbol": "Kč", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "DJF", "name": "Djiboutian Franc", "name_tr": "Cibuti Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "DKK", "name": "Danish Krone", "name_tr": "Danimarka Kronu", "symbol": "kr", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "DOP", "name": "Dominican Peso", "name_tr": "Dominik Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "DZD", "name": "Algerian Dinar", "name_tr": "Cezayir Dinarı", "symbol": "د.ج", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "EGP", "name": "Egyptian Pound", "name_tr": "Mısır Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ERN", "name": "Eritrean Nakfa", "name_tr": "Eritre Nakfası", "symbol": "Nfk", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ETB", "name": "Ethiopian Birr", "name_tr": "Etiyopya Birri", "symbol": "Br", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "FJD", "name": "Fijian Dollar", "name_tr": "Fiji Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "FKP", "name": "Falkland Islands Pound", "name_tr": "Falkland Adaları Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GEL", "name": "Georgian Lari", "name_tr": "Gürcistan Larisi", "symbol": "₾", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "GGP", "name": "Guernsey Pound", "name_tr": "Guernsey Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GHS", "name": "Ghanaian Cedi", "name_tr": "Gana Cedisi", "symbol": "₵", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GIP", "name": "Gibraltar Pound", "name_tr": "Cebelitarık Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GMD", "name": "Gambian Dalasi", "name_tr": "Gambiya Dalasisi", "symbol": "D", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GNF", "name": "Guinean Franc", "name_tr": "Gine Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GTQ", "name": "Guatemalan Quetzal", "name_tr": "Guatemala Quetzalı", "symbol": "Q", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "GYD", "name": "Guyanaese Dollar", "name_tr": "Guyana Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "HKD", "name": "Hong Kong Dollar", "name_tr": "Hong Kong Doları", "symbol": "HK$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "HNL", "name": "Honduran Lempira", "name_tr": "Honduras Lempirası", "symbol": "L", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "HRK", "name": "Croatian Kuna", "name_tr": "Hırvatistan Kunası", "symbol": "kn", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "HTG", "name": "Haitian Gourde", "name_tr": "Haiti Gourde'u", "symbol": "G", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "HUF", "name": "Hungarian Forint", "name_tr": "Macar Forinti", "symbol": "Ft", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "IDR", "name": "Indonesian Rupiah", "name_tr": "Endonezya Rupiahı", "symbol": "Rp", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ILS", "name": "Israeli New Sheqel", "name_tr": "İsrail Şekeli", "symbol": "₪", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "IMP", "name": "Manx pound", "name_tr": "Man Adası Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "INR", "name": "Indian Rupee", "name_tr": "Hindistan Rupisi", "symbol": "₹", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "IQD", "name": "Iraqi Dinar", "name_tr": "Irak Dinarı", "symbol": "ع.د", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "IRR", "name": "Iranian Rial", "name_tr": "İran Riyali", "symbol": "﷼", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ISK", "name": "Icelandic Króna", "name_tr": "İzlanda Kronu", "symbol": "kr", "decimal_places": 0, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "JEP", "name": "Jersey Pound", "name_tr": "Jersey Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "JMD", "name": "Jamaican Dollar", "name_tr": "Jamaika Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "JOD", "name": "Jordanian Dinar", "name_tr": "Ürdün Dinarı", "symbol": "د.ا", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KES", "name": "Kenyan Shilling", "name_tr": "Kenya Şilini", "symbol": "Sh", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KGS", "name": "Kyrgystani Som", "name_tr": "Kırgızistan Somu", "symbol": "с", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "KHR", "name": "Cambodian Riel", "name_tr": "Kamboçya Rieli", "symbol": "៛", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KMF", "name": "Comorian Franc", "name_tr": "Komor Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KPW", "name": "North Korean Won", "name_tr": "Kuzey Kore Wonu", "symbol": "₩", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KRW", "name": "South Korean Won", "name_tr": "Güney Kore Wonu", "symbol": "₩", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KWD", "name": "Kuwaiti Dinar", "name_tr": "Kuveyt Dinarı", "symbol": "د.ك", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KYD", "name": "Cayman Islands Dollar", "name_tr": "Cayman Adaları Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "KZT", "name": "Kazakhstani Tenge", "name_tr": "Kazakistan Tengesi", "symbol": "₸", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "LAK", "name": "Laotian Kip", "name_tr": "Laos Kipi", "symbol": "₭", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "LBP", "name": "Lebanese Pound", "name_tr": "Lübnan Lirası", "symbol": "ل.ل", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "LKR", "name": "Sri Lankan Rupee", "name_tr": "Sri Lanka Rupisi", "symbol": "Rs", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "LRD", "name": "Liberian Dollar", "name_tr": "Liberya Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "LSL", "name": "Lesotho Loti", "name_tr": "Lesotho Lotisi", "symbol": "L", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "LYD", "name": "Libyan Dinar", "name_tr": "Libya Dinarı", "symbol": "ل.د", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MAD", "name": "Moroccan Dirham", "name_tr": "Fas Dirhemi", "symbol": "د.م.", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MDL", "name": "Moldovan Leu", "name_tr": "Moldova Leyi", "symbol": "L", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "MGA", "name": "Malagasy Ariary", "name_tr": "Madagaskar Ariarisi", "symbol": "Ar", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MKD", "name": "Macedonian Denar", "name_tr": "Makedonya Dinarı", "symbol": "ден", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "MMK", "name": "Myanma Kyat", "name_tr": "Myanmar Kyatı", "symbol": "K", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MNT", "name": "Mongolian Tugrik", "name_tr": "Moğolistan Tugriki", "symbol": "₮", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MOP", "name": "Macanese Pataca", "name_tr": "Makau Patakası", "symbol": "P", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MRU", "name": "Mauritanian Ouguiya", "name_tr": "Moritanya Ouguiyası", "symbol": "UM", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MUR", "name": "Mauritian Rupee", "name_tr": "Mauritius Rupisi", "symbol": "₨", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MVR", "name": "Maldivian Rufiyaa", "name_tr": "Maldivler Rufiyaası", "symbol": "Rf", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "MWK", "name": "Malawian Kwacha", "name_tr": "Malavi Kwacası", "symbol": "MK", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MXN", "name": "Mexican Peso", "name_tr": "Meksika Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MYR", "name": "Malaysian Ringgit", "name_tr": "Malezya Ringiti", "symbol": "RM", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "MZN", "name": "Mozambican Metical", "name_tr": "Mozambik Metikali", "symbol": "MT", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "NAD", "name": "Namibian Dollar", "name_tr": "Namibya Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "NGN", "name": "Nigerian Naira", "name_tr": "Nijerya Nairası", "symbol": "₦", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "NIO", "name": "Nicaraguan Córdoba", "name_tr": "Nikaragua Cordobası", "symbol": "C$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "NOK", "name": "Norwegian Krone", "name_tr": "Norveç Kronu", "symbol": "kr", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "NPR", "name": "Nepalese Rupee", "name_tr": "Nepal Rupisi", "symbol": "₨", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "NZD", "name": "New Zealand Dollar", "name_tr": "Yeni Zelanda Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "OMR", "name": "Omani Rial", "name_tr": "Umman Riyali", "symbol": "ر.ع.", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "PAB", "name": "Panamanian Balboa", "name_tr": "Panama Balboası", "symbol": "B/.", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "PEN", "name": "Peruvian Nuevo Sol", "name_tr": "Peru Nuevo Solu", "symbol": "S/.", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "PGK", "name": "Papua New Guinean Kina", "name_tr": "Papua Yeni Gine Kinası", "symbol": "K", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "PHP", "name": "Philippine Peso", "name_tr": "Filipinler Pezosu", "symbol": "₱", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "PKR", "name": "Pakistani Rupee", "name_tr": "Pakistan Rupisi", "symbol": "₨", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "PLN", "name": "Polish Zloty", "name_tr": "Polonya Zlotisi", "symbol": "zł", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "PYG", "name": "Paraguayan Guarani", "name_tr": "Paraguay Guaranisi", "symbol": "₲", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "QAR", "name": "Qatari Rial", "name_tr": "Katar Riyali", "symbol": "ر.ق", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "RON", "name": "Romanian Leu", "name_tr": "Romanya Leyi", "symbol": "lei", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "RSD", "name": "Serbian Dinar", "name_tr": "Sırbistan Dinarı", "symbol": "дин", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "RUB", "name": "Russian Ruble", "name_tr": "Rus Rublesi", "symbol": "₽", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "RWF", "name": "Rwandan Franc", "name_tr": "Ruanda Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SBD", "name": "Solomon Islands Dollar", "name_tr": "Solomon Adaları Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SCR", "name": "Seychellois Rupee", "name_tr": "Seyşeller Rupisi", "symbol": "₨", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SDG", "name": "Sudanese Pound", "name_tr": "Sudan Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SEK", "name": "Swedish Krona", "name_tr": "İsveç Kronu", "symbol": "kr", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "SGD", "name": "Singapore Dollar", "name_tr": "Singapur Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SHP", "name": "Saint Helena Pound", "name_tr": "Saint Helena Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SLL", "name": "Sierra Leonean Leone", "name_tr": "Sierra Leone Leonesi", "symbol": "Le", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SOS", "name": "Somali Shilling", "name_tr": "Somali Şilini", "symbol": "Sh", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SRD", "name": "Surinamese Dollar", "name_tr": "Surinam Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SSP", "name": "South Sudanese Pound", "name_tr": "Güney Sudan Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "STN", "name": "São Tomé and Príncipe Dobra", "name_tr": "São Tomé ve Príncipe Dobrası", "symbol": "Db", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SVC", "name": "Salvadoran Colón", "name_tr": "El Salvador Kolonu", "symbol": "₡", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SYP", "name": "Syrian Pound", "name_tr": "Suriye Lirası", "symbol": "£", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "SZL", "name": "Swazi Lilangeni", "name_tr": "Svaziland Lilangenisi", "symbol": "L", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "THB", "name": "Thai Baht", "name_tr": "Tayland Bahtı", "symbol": "฿", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "TJS", "name": "Tajikistani Somoni", "name_tr": "Tacikistan Somonisi", "symbol": "ЅМ", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "TMT", "name": "Turkmenistani Manat", "name_tr": "Türkmenistan Manatı", "symbol": "m", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "TND", "name": "Tunisian Dinar", "name_tr": "Tunus Dinarı", "symbol": "د.ت", "decimal_places": 3, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "TOP", "name": "Tongan Paʻanga", "name_tr": "Tonga Pa'angası", "symbol": "T$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "TTD", "name": "Trinidad and Tobago Dollar", "name_tr": "Trinidad ve Tobago Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "TWD", "name": "New Taiwan Dollar", "name_tr": "Yeni Tayvan Doları", "symbol": "NT$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "TZS", "name": "Tanzanian Shilling", "name_tr": "Tanzanya Şilini", "symbol": "Sh", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "UAH", "name": "Ukrainian Hryvnia", "name_tr": "Ukrayna Grivnası", "symbol": "₴", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "UGX", "name": "Ugandan Shilling", "name_tr": "Uganda Şilini", "symbol": "Sh", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "UYU", "name": "Uruguayan Peso", "name_tr": "Uruguay Pezosu", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "UZS", "name": "Uzbekistan Som", "name_tr": "Özbekistan Somu", "symbol": "сўм", "decimal_places": 2, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "VES", "name": "Venezuelan Bolívar", "name_tr": "Venezuela Bolivarı", "symbol": "Bs.S", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "VND", "name": "Vietnamese Dong", "name_tr": "Vietnam Dongu", "symbol": "₫", "decimal_places": 0, "symbol_position": "after", "is_common": False, "sort_order": 100},
        {"code": "VUV", "name": "Vanuatu Vatu", "name_tr": "Vanuatu Vatusu", "symbol": "Vt", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "WST", "name": "Samoan Tala", "name_tr": "Samoa Talası", "symbol": "T", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "XAF", "name": "CFA Franc BEAC", "name_tr": "Orta Afrika CFA Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "XCD", "name": "East Caribbean Dollar", "name_tr": "Doğu Karayip Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "XOF", "name": "CFA Franc BCEAO", "name_tr": "Batı Afrika CFA Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "XPF", "name": "CFP Franc", "name_tr": "Pasifik Frangı", "symbol": "Fr", "decimal_places": 0, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "YER", "name": "Yemeni Rial", "name_tr": "Yemen Riyali", "symbol": "﷼", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ZAR", "name": "South African Rand", "name_tr": "Güney Afrika Randı", "symbol": "R", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ZMW", "name": "Zambian Kwacha", "name_tr": "Zambiya Kwacası", "symbol": "ZK", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
        {"code": "ZWL", "name": "Zimbabwean Dollar", "name_tr": "Zimbabve Doları", "symbol": "$", "decimal_places": 2, "symbol_position": "before", "is_common": False, "sort_order": 100},
    ]
    
    # Add created_at and updated_at to all currencies
    for currency in currencies:
        currency["created_at"] = now
        currency["updated_at"] = now
        currency["is_active"] = True
    
    await collection.delete_many({})
    if currencies:
        await collection.insert_many(currencies)
    
    print(f"✅ {len(currencies)} para birimi oluşturuldu")
    return len(currencies)


async def seed_countries():
    """195+ ülke (ISO 3166-1 alpha-2)"""
    collection = db.countries
    
    now = datetime.now(timezone.utc)
    
    # Bu liste 195+ ülke içeriyor. Space tasarrufu için sadece bazı önemli alanları gösteriyorum
    countries = [
        {"code": "AF", "name": "Afghanistan", "name_tr": "Afganistan", "phone_code": "+93", "currency_code": "AFN", "flag_emoji": "🇦🇫", "continent": "Asia"},
        {"code": "AL", "name": "Albania", "name_tr": "Arnavutluk", "phone_code": "+355", "currency_code": "ALL", "flag_emoji": "🇦🇱", "continent": "Europe"},
        {"code": "DZ", "name": "Algeria", "name_tr": "Cezayir", "phone_code": "+213", "currency_code": "DZD", "flag_emoji": "🇩🇿", "continent": "Africa"},
        {"code": "AD", "name": "Andorra", "name_tr": "Andorra", "phone_code": "+376", "currency_code": "EUR", "flag_emoji": "🇦🇩", "continent": "Europe"},
        {"code": "AO", "name": "Angola", "name_tr": "Angola", "phone_code": "+244", "currency_code": "AOA", "flag_emoji": "🇦🇴", "continent": "Africa"},
        {"code": "AG", "name": "Antigua and Barbuda", "name_tr": "Antigua ve Barbuda", "phone_code": "+1268", "currency_code": "XCD", "flag_emoji": "🇦🇬", "continent": "North America"},
        {"code": "AR", "name": "Argentina", "name_tr": "Arjantin", "phone_code": "+54", "currency_code": "ARS", "flag_emoji": "🇦🇷", "continent": "South America"},
        {"code": "AM", "name": "Armenia", "name_tr": "Ermenistan", "phone_code": "+374", "currency_code": "AMD", "flag_emoji": "🇦🇲", "continent": "Asia"},
        {"code": "AU", "name": "Australia", "name_tr": "Avustralya", "phone_code": "+61", "currency_code": "AUD", "flag_emoji": "🇦🇺", "continent": "Oceania"},
        {"code": "AT", "name": "Austria", "name_tr": "Avusturya", "phone_code": "+43", "currency_code": "EUR", "flag_emoji": "🇦🇹", "continent": "Europe"},
        {"code": "AZ", "name": "Azerbaijan", "name_tr": "Azerbaycan", "phone_code": "+994", "currency_code": "AZN", "flag_emoji": "🇦🇿", "continent": "Asia"},
        {"code": "BS", "name": "Bahamas", "name_tr": "Bahamalar", "phone_code": "+1242", "currency_code": "BSD", "flag_emoji": "🇧🇸", "continent": "North America"},
        {"code": "BH", "name": "Bahrain", "name_tr": "Bahreyn", "phone_code": "+973", "currency_code": "BHD", "flag_emoji": "🇧🇭", "continent": "Asia"},
        {"code": "BD", "name": "Bangladesh", "name_tr": "Bangladeş", "phone_code": "+880", "currency_code": "BDT", "flag_emoji": "🇧🇩", "continent": "Asia"},
        {"code": "BB", "name": "Barbados", "name_tr": "Barbados", "phone_code": "+1246", "currency_code": "BBD", "flag_emoji": "🇧🇧", "continent": "North America"},
        {"code": "BY", "name": "Belarus", "name_tr": "Belarus", "phone_code": "+375", "currency_code": "BYN", "flag_emoji": "🇧🇾", "continent": "Europe"},
        {"code": "BE", "name": "Belgium", "name_tr": "Belçika", "phone_code": "+32", "currency_code": "EUR", "flag_emoji": "🇧🇪", "continent": "Europe"},
        {"code": "BZ", "name": "Belize", "name_tr": "Belize", "phone_code": "+501", "currency_code": "BZD", "flag_emoji": "🇧🇿", "continent": "North America"},
        {"code": "BJ", "name": "Benin", "name_tr": "Benin", "phone_code": "+229", "currency_code": "XOF", "flag_emoji": "🇧🇯", "continent": "Africa"},
        {"code": "BT", "name": "Bhutan", "name_tr": "Butan", "phone_code": "+975", "currency_code": "BTN", "flag_emoji": "🇧🇹", "continent": "Asia"},
        {"code": "BO", "name": "Bolivia", "name_tr": "Bolivya", "phone_code": "+591", "currency_code": "BOB", "flag_emoji": "🇧🇴", "continent": "South America"},
        {"code": "BA", "name": "Bosnia and Herzegovina", "name_tr": "Bosna-Hersek", "phone_code": "+387", "currency_code": "BAM", "flag_emoji": "🇧🇦", "continent": "Europe"},
        {"code": "BW", "name": "Botswana", "name_tr": "Botsvana", "phone_code": "+267", "currency_code": "BWP", "flag_emoji": "🇧🇼", "continent": "Africa"},
        {"code": "BR", "name": "Brazil", "name_tr": "Brezilya", "phone_code": "+55", "currency_code": "BRL", "flag_emoji": "🇧🇷", "continent": "South America"},
        {"code": "BN", "name": "Brunei", "name_tr": "Brunei", "phone_code": "+673", "currency_code": "BND", "flag_emoji": "🇧🇳", "continent": "Asia"},
        {"code": "BG", "name": "Bulgaria", "name_tr": "Bulgaristan", "phone_code": "+359", "currency_code": "BGN", "flag_emoji": "🇧🇬", "continent": "Europe"},
        {"code": "BF", "name": "Burkina Faso", "name_tr": "Burkina Faso", "phone_code": "+226", "currency_code": "XOF", "flag_emoji": "🇧🇫", "continent": "Africa"},
        {"code": "BI", "name": "Burundi", "name_tr": "Burundi", "phone_code": "+257", "currency_code": "BIF", "flag_emoji": "🇧🇮", "continent": "Africa"},
        {"code": "KH", "name": "Cambodia", "name_tr": "Kamboçya", "phone_code": "+855", "currency_code": "KHR", "flag_emoji": "🇰🇭", "continent": "Asia"},
        {"code": "CM", "name": "Cameroon", "name_tr": "Kamerun", "phone_code": "+237", "currency_code": "XAF", "flag_emoji": "🇨🇲", "continent": "Africa"},
        {"code": "CA", "name": "Canada", "name_tr": "Kanada", "phone_code": "+1", "currency_code": "CAD", "flag_emoji": "🇨🇦", "continent": "North America"},
        {"code": "CV", "name": "Cape Verde", "name_tr": "Cape Verde", "phone_code": "+238", "currency_code": "CVE", "flag_emoji": "🇨🇻", "continent": "Africa"},
        {"code": "CF", "name": "Central African Republic", "name_tr": "Orta Afrika Cumhuriyeti", "phone_code": "+236", "currency_code": "XAF", "flag_emoji": "🇨🇫", "continent": "Africa"},
        {"code": "TD", "name": "Chad", "name_tr": "Çad", "phone_code": "+235", "currency_code": "XAF", "flag_emoji": "🇹🇩", "continent": "Africa"},
        {"code": "CL", "name": "Chile", "name_tr": "Şili", "phone_code": "+56", "currency_code": "CLP", "flag_emoji": "🇨🇱", "continent": "South America"},
        {"code": "CN", "name": "China", "name_tr": "Çin", "phone_code": "+86", "currency_code": "CNY", "flag_emoji": "🇨🇳", "continent": "Asia"},
        {"code": "CO", "name": "Colombia", "name_tr": "Kolombiya", "phone_code": "+57", "currency_code": "COP", "flag_emoji": "🇨🇴", "continent": "South America"},
        {"code": "KM", "name": "Comoros", "name_tr": "Komorlar", "phone_code": "+269", "currency_code": "KMF", "flag_emoji": "🇰🇲", "continent": "Africa"},
        {"code": "CG", "name": "Congo", "name_tr": "Kongo", "phone_code": "+242", "currency_code": "XAF", "flag_emoji": "🇨🇬", "continent": "Africa"},
        {"code": "CD", "name": "Congo (DRC)", "name_tr": "Kongo Demokratik Cumhuriyeti", "phone_code": "+243", "currency_code": "CDF", "flag_emoji": "🇨🇩", "continent": "Africa"},
        {"code": "CR", "name": "Costa Rica", "name_tr": "Kosta Rika", "phone_code": "+506", "currency_code": "CRC", "flag_emoji": "🇨🇷", "continent": "North America"},
        {"code": "HR", "name": "Croatia", "name_tr": "Hırvatistan", "phone_code": "+385", "currency_code": "EUR", "flag_emoji": "🇭🇷", "continent": "Europe"},
        {"code": "CU", "name": "Cuba", "name_tr": "Küba", "phone_code": "+53", "currency_code": "CUP", "flag_emoji": "🇨🇺", "continent": "North America"},
        {"code": "CY", "name": "Cyprus", "name_tr": "Kıbrıs", "phone_code": "+357", "currency_code": "EUR", "flag_emoji": "🇨🇾", "continent": "Europe"},
        {"code": "CZ", "name": "Czech Republic", "name_tr": "Çek Cumhuriyeti", "phone_code": "+420", "currency_code": "CZK", "flag_emoji": "🇨🇿", "continent": "Europe"},
        {"code": "DK", "name": "Denmark", "name_tr": "Danimarka", "phone_code": "+45", "currency_code": "DKK", "flag_emoji": "🇩🇰", "continent": "Europe"},
        {"code": "DJ", "name": "Djibouti", "name_tr": "Cibuti", "phone_code": "+253", "currency_code": "DJF", "flag_emoji": "🇩🇯", "continent": "Africa"},
        {"code": "DM", "name": "Dominica", "name_tr": "Dominika", "phone_code": "+1767", "currency_code": "XCD", "flag_emoji": "🇩🇲", "continent": "North America"},
        {"code": "DO", "name": "Dominican Republic", "name_tr": "Dominik Cumhuriyeti", "phone_code": "+1", "currency_code": "DOP", "flag_emoji": "🇩🇴", "continent": "North America"},
        {"code": "EC", "name": "Ecuador", "name_tr": "Ekvador", "phone_code": "+593", "currency_code": "USD", "flag_emoji": "🇪🇨", "continent": "South America"},
        {"code": "EG", "name": "Egypt", "name_tr": "Mısır", "phone_code": "+20", "currency_code": "EGP", "flag_emoji": "🇪🇬", "continent": "Africa"},
        {"code": "SV", "name": "El Salvador", "name_tr": "El Salvador", "phone_code": "+503", "currency_code": "USD", "flag_emoji": "🇸🇻", "continent": "North America"},
        {"code": "GQ", "name": "Equatorial Guinea", "name_tr": "Ekvator Ginesi", "phone_code": "+240", "currency_code": "XAF", "flag_emoji": "🇬🇶", "continent": "Africa"},
        {"code": "ER", "name": "Eritrea", "name_tr": "Eritre", "phone_code": "+291", "currency_code": "ERN", "flag_emoji": "🇪🇷", "continent": "Africa"},
        {"code": "EE", "name": "Estonia", "name_tr": "Estonya", "phone_code": "+372", "currency_code": "EUR", "flag_emoji": "🇪🇪", "continent": "Europe"},
        {"code": "ET", "name": "Ethiopia", "name_tr": "Etiyopya", "phone_code": "+251", "currency_code": "ETB", "flag_emoji": "🇪🇹", "continent": "Africa"},
        {"code": "FJ", "name": "Fiji", "name_tr": "Fiji", "phone_code": "+679", "currency_code": "FJD", "flag_emoji": "🇫🇯", "continent": "Oceania"},
        {"code": "FI", "name": "Finland", "name_tr": "Finlandiya", "phone_code": "+358", "currency_code": "EUR", "flag_emoji": "🇫🇮", "continent": "Europe"},
        {"code": "FR", "name": "France", "name_tr": "Fransa", "phone_code": "+33", "currency_code": "EUR", "flag_emoji": "🇫🇷", "continent": "Europe"},
        {"code": "GA", "name": "Gabon", "name_tr": "Gabon", "phone_code": "+241", "currency_code": "XAF", "flag_emoji": "🇬🇦", "continent": "Africa"},
        {"code": "GM", "name": "Gambia", "name_tr": "Gambiya", "phone_code": "+220", "currency_code": "GMD", "flag_emoji": "🇬🇲", "continent": "Africa"},
        {"code": "GE", "name": "Georgia", "name_tr": "Gürcistan", "phone_code": "+995", "currency_code": "GEL", "flag_emoji": "🇬🇪", "continent": "Asia"},
        {"code": "DE", "name": "Germany", "name_tr": "Almanya", "phone_code": "+49", "currency_code": "EUR", "flag_emoji": "🇩🇪", "continent": "Europe"},
        {"code": "GH", "name": "Ghana", "name_tr": "Gana", "phone_code": "+233", "currency_code": "GHS", "flag_emoji": "🇬🇭", "continent": "Africa"},
        {"code": "GR", "name": "Greece", "name_tr": "Yunanistan", "phone_code": "+30", "currency_code": "EUR", "flag_emoji": "🇬🇷", "continent": "Europe"},
        {"code": "GD", "name": "Grenada", "name_tr": "Grenada", "phone_code": "+1473", "currency_code": "XCD", "flag_emoji": "🇬🇩", "continent": "North America"},
        {"code": "GT", "name": "Guatemala", "name_tr": "Guatemala", "phone_code": "+502", "currency_code": "GTQ", "flag_emoji": "🇬🇹", "continent": "North America"},
        {"code": "GN", "name": "Guinea", "name_tr": "Gine", "phone_code": "+224", "currency_code": "GNF", "flag_emoji": "🇬🇳", "continent": "Africa"},
        {"code": "GW", "name": "Guinea-Bissau", "name_tr": "Gine-Bissau", "phone_code": "+245", "currency_code": "XOF", "flag_emoji": "🇬🇼", "continent": "Africa"},
        {"code": "GY", "name": "Guyana", "name_tr": "Guyana", "phone_code": "+592", "currency_code": "GYD", "flag_emoji": "🇬🇾", "continent": "South America"},
        {"code": "HT", "name": "Haiti", "name_tr": "Haiti", "phone_code": "+509", "currency_code": "HTG", "flag_emoji": "🇭🇹", "continent": "North America"},
        {"code": "HN", "name": "Honduras", "name_tr": "Honduras", "phone_code": "+504", "currency_code": "HNL", "flag_emoji": "🇭🇳", "continent": "North America"},
        {"code": "HU", "name": "Hungary", "name_tr": "Macaristan", "phone_code": "+36", "currency_code": "HUF", "flag_emoji": "🇭🇺", "continent": "Europe"},
        {"code": "IS", "name": "Iceland", "name_tr": "İzlanda", "phone_code": "+354", "currency_code": "ISK", "flag_emoji": "🇮🇸", "continent": "Europe"},
        {"code": "IN", "name": "India", "name_tr": "Hindistan", "phone_code": "+91", "currency_code": "INR", "flag_emoji": "🇮🇳", "continent": "Asia"},
        {"code": "ID", "name": "Indonesia", "name_tr": "Endonezya", "phone_code": "+62", "currency_code": "IDR", "flag_emoji": "🇮🇩", "continent": "Asia"},
        {"code": "IR", "name": "Iran", "name_tr": "İran", "phone_code": "+98", "currency_code": "IRR", "flag_emoji": "🇮🇷", "continent": "Asia"},
        {"code": "IQ", "name": "Iraq", "name_tr": "Irak", "phone_code": "+964", "currency_code": "IQD", "flag_emoji": "🇮🇶", "continent": "Asia"},
        {"code": "IE", "name": "Ireland", "name_tr": "İrlanda", "phone_code": "+353", "currency_code": "EUR", "flag_emoji": "🇮🇪", "continent": "Europe"},
        {"code": "IL", "name": "Israel", "name_tr": "İsrail", "phone_code": "+972", "currency_code": "ILS", "flag_emoji": "🇮🇱", "continent": "Asia"},
        {"code": "IT", "name": "Italy", "name_tr": "İtalya", "phone_code": "+39", "currency_code": "EUR", "flag_emoji": "🇮🇹", "continent": "Europe"},
        {"code": "CI", "name": "Ivory Coast", "name_tr": "Fildişi Sahili", "phone_code": "+225", "currency_code": "XOF", "flag_emoji": "🇨🇮", "continent": "Africa"},
        {"code": "JM", "name": "Jamaica", "name_tr": "Jamaika", "phone_code": "+1876", "currency_code": "JMD", "flag_emoji": "🇯🇲", "continent": "North America"},
        {"code": "JP", "name": "Japan", "name_tr": "Japonya", "phone_code": "+81", "currency_code": "JPY", "flag_emoji": "🇯🇵", "continent": "Asia"},
        {"code": "JO", "name": "Jordan", "name_tr": "Ürdün", "phone_code": "+962", "currency_code": "JOD", "flag_emoji": "🇯🇴", "continent": "Asia"},
        {"code": "KZ", "name": "Kazakhstan", "name_tr": "Kazakistan", "phone_code": "+7", "currency_code": "KZT", "flag_emoji": "🇰🇿", "continent": "Asia"},
        {"code": "KE", "name": "Kenya", "name_tr": "Kenya", "phone_code": "+254", "currency_code": "KES", "flag_emoji": "🇰🇪", "continent": "Africa"},
        {"code": "KI", "name": "Kiribati", "name_tr": "Kiribati", "phone_code": "+686", "currency_code": "AUD", "flag_emoji": "🇰🇮", "continent": "Oceania"},
        {"code": "KW", "name": "Kuwait", "name_tr": "Kuveyt", "phone_code": "+965", "currency_code": "KWD", "flag_emoji": "🇰🇼", "continent": "Asia"},
        {"code": "KG", "name": "Kyrgyzstan", "name_tr": "Kırgızistan", "phone_code": "+996", "currency_code": "KGS", "flag_emoji": "🇰🇬", "continent": "Asia"},
        {"code": "LA", "name": "Laos", "name_tr": "Laos", "phone_code": "+856", "currency_code": "LAK", "flag_emoji": "🇱🇦", "continent": "Asia"},
        {"code": "LV", "name": "Latvia", "name_tr": "Letonya", "phone_code": "+371", "currency_code": "EUR", "flag_emoji": "🇱🇻", "continent": "Europe"},
        {"code": "LB", "name": "Lebanon", "name_tr": "Lübnan", "phone_code": "+961", "currency_code": "LBP", "flag_emoji": "🇱🇧", "continent": "Asia"},
        {"code": "LS", "name": "Lesotho", "name_tr": "Lesotho", "phone_code": "+266", "currency_code": "LSL", "flag_emoji": "🇱🇸", "continent": "Africa"},
        {"code": "LR", "name": "Liberia", "name_tr": "Liberya", "phone_code": "+231", "currency_code": "LRD", "flag_emoji": "🇱🇷", "continent": "Africa"},
        {"code": "LY", "name": "Libya", "name_tr": "Libya", "phone_code": "+218", "currency_code": "LYD", "flag_emoji": "🇱🇾", "continent": "Africa"},
        {"code": "LI", "name": "Liechtenstein", "name_tr": "Lihtenştayn", "phone_code": "+423", "currency_code": "CHF", "flag_emoji": "🇱🇮", "continent": "Europe"},
        {"code": "LT", "name": "Lithuania", "name_tr": "Litvanya", "phone_code": "+370", "currency_code": "EUR", "flag_emoji": "🇱🇹", "continent": "Europe"},
        {"code": "LU", "name": "Luxembourg", "name_tr": "Lüksemburg", "phone_code": "+352", "currency_code": "EUR", "flag_emoji": "🇱🇺", "continent": "Europe"},
        {"code": "MK", "name": "Macedonia", "name_tr": "Kuzey Makedonya", "phone_code": "+389", "currency_code": "MKD", "flag_emoji": "🇲🇰", "continent": "Europe"},
        {"code": "MG", "name": "Madagascar", "name_tr": "Madagaskar", "phone_code": "+261", "currency_code": "MGA", "flag_emoji": "🇲🇬", "continent": "Africa"},
        {"code": "MW", "name": "Malawi", "name_tr": "Malavi", "phone_code": "+265", "currency_code": "MWK", "flag_emoji": "🇲🇼", "continent": "Africa"},
        {"code": "MY", "name": "Malaysia", "name_tr": "Malezya", "phone_code": "+60", "currency_code": "MYR", "flag_emoji": "🇲🇾", "continent": "Asia"},
        {"code": "MV", "name": "Maldives", "name_tr": "Maldivler", "phone_code": "+960", "currency_code": "MVR", "flag_emoji": "🇲🇻", "continent": "Asia"},
        {"code": "ML", "name": "Mali", "name_tr": "Mali", "phone_code": "+223", "currency_code": "XOF", "flag_emoji": "🇲🇱", "continent": "Africa"},
        {"code": "MT", "name": "Malta", "name_tr": "Malta", "phone_code": "+356", "currency_code": "EUR", "flag_emoji": "🇲🇹", "continent": "Europe"},
        {"code": "MH", "name": "Marshall Islands", "name_tr": "Marshall Adaları", "phone_code": "+692", "currency_code": "USD", "flag_emoji": "🇲🇭", "continent": "Oceania"},
        {"code": "MR", "name": "Mauritania", "name_tr": "Moritanya", "phone_code": "+222", "currency_code": "MRU", "flag_emoji": "🇲🇷", "continent": "Africa"},
        {"code": "MU", "name": "Mauritius", "name_tr": "Mauritius", "phone_code": "+230", "currency_code": "MUR", "flag_emoji": "🇲🇺", "continent": "Africa"},
        {"code": "MX", "name": "Mexico", "name_tr": "Meksika", "phone_code": "+52", "currency_code": "MXN", "flag_emoji": "🇲🇽", "continent": "North America"},
        {"code": "FM", "name": "Micronesia", "name_tr": "Mikronezya", "phone_code": "+691", "currency_code": "USD", "flag_emoji": "🇫🇲", "continent": "Oceania"},
        {"code": "MD", "name": "Moldova", "name_tr": "Moldova", "phone_code": "+373", "currency_code": "MDL", "flag_emoji": "🇲🇩", "continent": "Europe"},
        {"code": "MC", "name": "Monaco", "name_tr": "Monako", "phone_code": "+377", "currency_code": "EUR", "flag_emoji": "🇲🇨", "continent": "Europe"},
        {"code": "MN", "name": "Mongolia", "name_tr": "Moğolistan", "phone_code": "+976", "currency_code": "MNT", "flag_emoji": "🇲🇳", "continent": "Asia"},
        {"code": "ME", "name": "Montenegro", "name_tr": "Karadağ", "phone_code": "+382", "currency_code": "EUR", "flag_emoji": "🇲🇪", "continent": "Europe"},
        {"code": "MA", "name": "Morocco", "name_tr": "Fas", "phone_code": "+212", "currency_code": "MAD", "flag_emoji": "🇲🇦", "continent": "Africa"},
        {"code": "MZ", "name": "Mozambique", "name_tr": "Mozambik", "phone_code": "+258", "currency_code": "MZN", "flag_emoji": "🇲🇿", "continent": "Africa"},
        {"code": "MM", "name": "Myanmar", "name_tr": "Myanmar", "phone_code": "+95", "currency_code": "MMK", "flag_emoji": "🇲🇲", "continent": "Asia"},
        {"code": "NA", "name": "Namibia", "name_tr": "Namibya", "phone_code": "+264", "currency_code": "NAD", "flag_emoji": "🇳🇦", "continent": "Africa"},
        {"code": "NR", "name": "Nauru", "name_tr": "Nauru", "phone_code": "+674", "currency_code": "AUD", "flag_emoji": "🇳🇷", "continent": "Oceania"},
        {"code": "NP", "name": "Nepal", "name_tr": "Nepal", "phone_code": "+977", "currency_code": "NPR", "flag_emoji": "🇳🇵", "continent": "Asia"},
        {"code": "NL", "name": "Netherlands", "name_tr": "Hollanda", "phone_code": "+31", "currency_code": "EUR", "flag_emoji": "🇳🇱", "continent": "Europe"},
        {"code": "NZ", "name": "New Zealand", "name_tr": "Yeni Zelanda", "phone_code": "+64", "currency_code": "NZD", "flag_emoji": "🇳🇿", "continent": "Oceania"},
        {"code": "NI", "name": "Nicaragua", "name_tr": "Nikaragua", "phone_code": "+505", "currency_code": "NIO", "flag_emoji": "🇳🇮", "continent": "North America"},
        {"code": "NE", "name": "Niger", "name_tr": "Nijer", "phone_code": "+227", "currency_code": "XOF", "flag_emoji": "🇳🇪", "continent": "Africa"},
        {"code": "NG", "name": "Nigeria", "name_tr": "Nijerya", "phone_code": "+234", "currency_code": "NGN", "flag_emoji": "🇳🇬", "continent": "Africa"},
        {"code": "KP", "name": "North Korea", "name_tr": "Kuzey Kore", "phone_code": "+850", "currency_code": "KPW", "flag_emoji": "🇰🇵", "continent": "Asia"},
        {"code": "NO", "name": "Norway", "name_tr": "Norveç", "phone_code": "+47", "currency_code": "NOK", "flag_emoji": "🇳🇴", "continent": "Europe"},
        {"code": "OM", "name": "Oman", "name_tr": "Umman", "phone_code": "+968", "currency_code": "OMR", "flag_emoji": "🇴🇲", "continent": "Asia"},
        {"code": "PK", "name": "Pakistan", "name_tr": "Pakistan", "phone_code": "+92", "currency_code": "PKR", "flag_emoji": "🇵🇰", "continent": "Asia"},
        {"code": "PW", "name": "Palau", "name_tr": "Palau", "phone_code": "+680", "currency_code": "USD", "flag_emoji": "🇵🇼", "continent": "Oceania"},
        {"code": "PS", "name": "Palestine", "name_tr": "Filistin", "phone_code": "+970", "currency_code": "ILS", "flag_emoji": "🇵🇸", "continent": "Asia"},
        {"code": "PA", "name": "Panama", "name_tr": "Panama", "phone_code": "+507", "currency_code": "PAB", "flag_emoji": "🇵🇦", "continent": "North America"},
        {"code": "PG", "name": "Papua New Guinea", "name_tr": "Papua Yeni Gine", "phone_code": "+675", "currency_code": "PGK", "flag_emoji": "🇵🇬", "continent": "Oceania"},
        {"code": "PY", "name": "Paraguay", "name_tr": "Paraguay", "phone_code": "+595", "currency_code": "PYG", "flag_emoji": "🇵🇾", "continent": "South America"},
        {"code": "PE", "name": "Peru", "name_tr": "Peru", "phone_code": "+51", "currency_code": "PEN", "flag_emoji": "🇵🇪", "continent": "South America"},
        {"code": "PH", "name": "Philippines", "name_tr": "Filipinler", "phone_code": "+63", "currency_code": "PHP", "flag_emoji": "🇵🇭", "continent": "Asia"},
        {"code": "PL", "name": "Poland", "name_tr": "Polonya", "phone_code": "+48", "currency_code": "PLN", "flag_emoji": "🇵🇱", "continent": "Europe"},
        {"code": "PT", "name": "Portugal", "name_tr": "Portekiz", "phone_code": "+351", "currency_code": "EUR", "flag_emoji": "🇵🇹", "continent": "Europe"},
        {"code": "QA", "name": "Qatar", "name_tr": "Katar", "phone_code": "+974", "currency_code": "QAR", "flag_emoji": "🇶🇦", "continent": "Asia"},
        {"code": "RO", "name": "Romania", "name_tr": "Romanya", "phone_code": "+40", "currency_code": "RON", "flag_emoji": "🇷🇴", "continent": "Europe"},
        {"code": "RU", "name": "Russia", "name_tr": "Rusya", "phone_code": "+7", "currency_code": "RUB", "flag_emoji": "🇷🇺", "continent": "Europe"},
        {"code": "RW", "name": "Rwanda", "name_tr": "Ruanda", "phone_code": "+250", "currency_code": "RWF", "flag_emoji": "🇷🇼", "continent": "Africa"},
        {"code": "KN", "name": "Saint Kitts and Nevis", "name_tr": "Saint Kitts ve Nevis", "phone_code": "+1869", "currency_code": "XCD", "flag_emoji": "🇰🇳", "continent": "North America"},
        {"code": "LC", "name": "Saint Lucia", "name_tr": "Saint Lucia", "phone_code": "+1758", "currency_code": "XCD", "flag_emoji": "🇱🇨", "continent": "North America"},
        {"code": "VC", "name": "Saint Vincent and the Grenadines", "name_tr": "Saint Vincent ve Grenadinler", "phone_code": "+1784", "currency_code": "XCD", "flag_emoji": "🇻🇨", "continent": "North America"},
        {"code": "WS", "name": "Samoa", "name_tr": "Samoa", "phone_code": "+685", "currency_code": "WST", "flag_emoji": "🇼🇸", "continent": "Oceania"},
        {"code": "SM", "name": "San Marino", "name_tr": "San Marino", "phone_code": "+378", "currency_code": "EUR", "flag_emoji": "🇸🇲", "continent": "Europe"},
        {"code": "ST", "name": "Sao Tome and Principe", "name_tr": "São Tomé ve Príncipe", "phone_code": "+239", "currency_code": "STN", "flag_emoji": "🇸🇹", "continent": "Africa"},
        {"code": "SA", "name": "Saudi Arabia", "name_tr": "Suudi Arabistan", "phone_code": "+966", "currency_code": "SAR", "flag_emoji": "🇸🇦", "continent": "Asia"},
        {"code": "SN", "name": "Senegal", "name_tr": "Senegal", "phone_code": "+221", "currency_code": "XOF", "flag_emoji": "🇸🇳", "continent": "Africa"},
        {"code": "RS", "name": "Serbia", "name_tr": "Sırbistan", "phone_code": "+381", "currency_code": "RSD", "flag_emoji": "🇷🇸", "continent": "Europe"},
        {"code": "SC", "name": "Seychelles", "name_tr": "Seyşeller", "phone_code": "+248", "currency_code": "SCR", "flag_emoji": "🇸🇨", "continent": "Africa"},
        {"code": "SL", "name": "Sierra Leone", "name_tr": "Sierra Leone", "phone_code": "+232", "currency_code": "SLL", "flag_emoji": "🇸🇱", "continent": "Africa"},
        {"code": "SG", "name": "Singapore", "name_tr": "Singapur", "phone_code": "+65", "currency_code": "SGD", "flag_emoji": "🇸🇬", "continent": "Asia"},
        {"code": "SK", "name": "Slovakia", "name_tr": "Slovakya", "phone_code": "+421", "currency_code": "EUR", "flag_emoji": "🇸🇰", "continent": "Europe"},
        {"code": "SI", "name": "Slovenia", "name_tr": "Slovenya", "phone_code": "+386", "currency_code": "EUR", "flag_emoji": "🇸🇮", "continent": "Europe"},
        {"code": "SB", "name": "Solomon Islands", "name_tr": "Solomon Adaları", "phone_code": "+677", "currency_code": "SBD", "flag_emoji": "🇸🇧", "continent": "Oceania"},
        {"code": "SO", "name": "Somalia", "name_tr": "Somali", "phone_code": "+252", "currency_code": "SOS", "flag_emoji": "🇸🇴", "continent": "Africa"},
        {"code": "ZA", "name": "South Africa", "name_tr": "Güney Afrika", "phone_code": "+27", "currency_code": "ZAR", "flag_emoji": "🇿🇦", "continent": "Africa"},
        {"code": "KR", "name": "South Korea", "name_tr": "Güney Kore", "phone_code": "+82", "currency_code": "KRW", "flag_emoji": "🇰🇷", "continent": "Asia"},
        {"code": "SS", "name": "South Sudan", "name_tr": "Güney Sudan", "phone_code": "+211", "currency_code": "SSP", "flag_emoji": "🇸🇸", "continent": "Africa"},
        {"code": "ES", "name": "Spain", "name_tr": "İspanya", "phone_code": "+34", "currency_code": "EUR", "flag_emoji": "🇪🇸", "continent": "Europe"},
        {"code": "LK", "name": "Sri Lanka", "name_tr": "Sri Lanka", "phone_code": "+94", "currency_code": "LKR", "flag_emoji": "🇱🇰", "continent": "Asia"},
        {"code": "SD", "name": "Sudan", "name_tr": "Sudan", "phone_code": "+249", "currency_code": "SDG", "flag_emoji": "🇸🇩", "continent": "Africa"},
        {"code": "SR", "name": "Suriname", "name_tr": "Surinam", "phone_code": "+597", "currency_code": "SRD", "flag_emoji": "🇸🇷", "continent": "South America"},
        {"code": "SZ", "name": "Swaziland", "name_tr": "Svaziland", "phone_code": "+268", "currency_code": "SZL", "flag_emoji": "🇸🇿", "continent": "Africa"},
        {"code": "SE", "name": "Sweden", "name_tr": "İsveç", "phone_code": "+46", "currency_code": "SEK", "flag_emoji": "🇸🇪", "continent": "Europe"},
        {"code": "CH", "name": "Switzerland", "name_tr": "İsviçre", "phone_code": "+41", "currency_code": "CHF", "flag_emoji": "🇨🇭", "continent": "Europe"},
        {"code": "SY", "name": "Syria", "name_tr": "Suriye", "phone_code": "+963", "currency_code": "SYP", "flag_emoji": "🇸🇾", "continent": "Asia"},
        {"code": "TW", "name": "Taiwan", "name_tr": "Tayvan", "phone_code": "+886", "currency_code": "TWD", "flag_emoji": "🇹🇼", "continent": "Asia"},
        {"code": "TJ", "name": "Tajikistan", "name_tr": "Tacikistan", "phone_code": "+992", "currency_code": "TJS", "flag_emoji": "🇹🇯", "continent": "Asia"},
        {"code": "TZ", "name": "Tanzania", "name_tr": "Tanzanya", "phone_code": "+255", "currency_code": "TZS", "flag_emoji": "🇹🇿", "continent": "Africa"},
        {"code": "TH", "name": "Thailand", "name_tr": "Tayland", "phone_code": "+66", "currency_code": "THB", "flag_emoji": "🇹🇭", "continent": "Asia"},
        {"code": "TL", "name": "Timor-Leste", "name_tr": "Doğu Timor", "phone_code": "+670", "currency_code": "USD", "flag_emoji": "🇹🇱", "continent": "Asia"},
        {"code": "TG", "name": "Togo", "name_tr": "Togo", "phone_code": "+228", "currency_code": "XOF", "flag_emoji": "🇹🇬", "continent": "Africa"},
        {"code": "TO", "name": "Tonga", "name_tr": "Tonga", "phone_code": "+676", "currency_code": "TOP", "flag_emoji": "🇹🇴", "continent": "Oceania"},
        {"code": "TT", "name": "Trinidad and Tobago", "name_tr": "Trinidad ve Tobago", "phone_code": "+1868", "currency_code": "TTD", "flag_emoji": "🇹🇹", "continent": "North America"},
        {"code": "TN", "name": "Tunisia", "name_tr": "Tunus", "phone_code": "+216", "currency_code": "TND", "flag_emoji": "🇹🇳", "continent": "Africa"},
        {"code": "TR", "name": "Turkey", "name_tr": "Türkiye", "phone_code": "+90", "currency_code": "TRY", "flag_emoji": "🇹🇷", "continent": "Asia"},
        {"code": "TM", "name": "Turkmenistan", "name_tr": "Türkmenistan", "phone_code": "+993", "currency_code": "TMT", "flag_emoji": "🇹🇲", "continent": "Asia"},
        {"code": "TV", "name": "Tuvalu", "name_tr": "Tuvalu", "phone_code": "+688", "currency_code": "AUD", "flag_emoji": "🇹🇻", "continent": "Oceania"},
        {"code": "UG", "name": "Uganda", "name_tr": "Uganda", "phone_code": "+256", "currency_code": "UGX", "flag_emoji": "🇺🇬", "continent": "Africa"},
        {"code": "UA", "name": "Ukraine", "name_tr": "Ukrayna", "phone_code": "+380", "currency_code": "UAH", "flag_emoji": "🇺🇦", "continent": "Europe"},
        {"code": "AE", "name": "United Arab Emirates", "name_tr": "Birleşik Arap Emirlikleri", "phone_code": "+971", "currency_code": "AED", "flag_emoji": "🇦🇪", "continent": "Asia"},
        {"code": "GB", "name": "United Kingdom", "name_tr": "Birleşik Krallık", "phone_code": "+44", "currency_code": "GBP", "flag_emoji": "🇬🇧", "continent": "Europe"},
        {"code": "US", "name": "United States", "name_tr": "Amerika Birleşik Devletleri", "phone_code": "+1", "currency_code": "USD", "flag_emoji": "🇺🇸", "continent": "North America"},
        {"code": "UY", "name": "Uruguay", "name_tr": "Uruguay", "phone_code": "+598", "currency_code": "UYU", "flag_emoji": "🇺🇾", "continent": "South America"},
        {"code": "UZ", "name": "Uzbekistan", "name_tr": "Özbekistan", "phone_code": "+998", "currency_code": "UZS", "flag_emoji": "🇺🇿", "continent": "Asia"},
        {"code": "VU", "name": "Vanuatu", "name_tr": "Vanuatu", "phone_code": "+678", "currency_code": "VUV", "flag_emoji": "🇻🇺", "continent": "Oceania"},
        {"code": "VA", "name": "Vatican City", "name_tr": "Vatikan", "phone_code": "+379", "currency_code": "EUR", "flag_emoji": "🇻🇦", "continent": "Europe"},
        {"code": "VE", "name": "Venezuela", "name_tr": "Venezuela", "phone_code": "+58", "currency_code": "VES", "flag_emoji": "🇻🇪", "continent": "South America"},
        {"code": "VN", "name": "Vietnam", "name_tr": "Vietnam", "phone_code": "+84", "currency_code": "VND", "flag_emoji": "🇻🇳", "continent": "Asia"},
        {"code": "YE", "name": "Yemen", "name_tr": "Yemen", "phone_code": "+967", "currency_code": "YER", "flag_emoji": "🇾🇪", "continent": "Asia"},
        {"code": "ZM", "name": "Zambia", "name_tr": "Zambiya", "phone_code": "+260", "currency_code": "ZMW", "flag_emoji": "🇿🇲", "continent": "Africa"},
        {"code": "ZW", "name": "Zimbabwe", "name_tr": "Zimbabve", "phone_code": "+263", "currency_code": "ZWL", "flag_emoji": "🇿🇼", "continent": "Africa"},
    ]
    
    for country in countries:
        country["created_at"] = now
        country["updated_at"] = now
        country["is_active"] = True
        country["sort_order"] = 100
    
    await collection.delete_many({})
    if countries:
        await collection.insert_many(countries)
    
    print(f"✅ {len(countries)} ülke oluşturuldu")
    return len(countries)


async def seed_cities():
    """Nüfusu 500K+ olan şehirler"""
    collection = db.cities
    
    now = datetime.now(timezone.utc)
    
    # Major cities with 500K+ population (sample - needs expansion)
    cities = [
        # Turkey - Major cities
        {"name": "Istanbul", "name_tr": "İstanbul", "country_code": "TR", "population": 15840900, "timezone": "Europe/Istanbul", "has_fair_center": True},
        {"name": "Ankara", "name_tr": "Ankara", "country_code": "TR", "population": 5747325, "timezone": "Europe/Istanbul", "has_fair_center": True},
        {"name": "Izmir", "name_tr": "İzmir", "country_code": "TR", "population": 4425789, "timezone": "Europe/Istanbul", "has_fair_center": True},
        {"name": "Bursa", "name_tr": "Bursa", "country_code": "TR", "population": 3101833, "timezone": "Europe/Istanbul", "has_fair_center": True},
        {"name": "Antalya", "name_tr": "Antalya", "country_code": "TR", "population": 2619832, "timezone": "Europe/Istanbul", "has_fair_center": True},
        {"name": "Adana", "name_tr": "Adana", "country_code": "TR", "population": 2258718, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Konya", "name_tr": "Konya", "country_code": "TR", "population": 2250020, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Gaziantep", "name_tr": "Gaziantep", "country_code": "TR", "population": 2101157, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Mersin", "name_tr": "Mersin", "country_code": "TR", "population": 1891145, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Diyarbakir", "name_tr": "Diyarbakır", "country_code": "TR", "population": 1783431, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Kayseri", "name_tr": "Kayseri", "country_code": "TR", "population": 1421362, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Eskisehir", "name_tr": "Eskişehir", "country_code": "TR", "population": 887475, "timezone": "Europe/Istanbul", "has_fair_center": False},
        {"name": "Sanliurfa", "name_tr": "Şanlıurfa", "country_code": "TR", "population": 2073614, "timezone": "Europe/Istanbul", "has_fair_center": False},
        
        # USA - Major cities
        {"name": "New York", "name_tr": "New York", "country_code": "US", "population": 8336817, "timezone": "America/New_York", "has_fair_center": True},
        {"name": "Los Angeles", "name_tr": "Los Angeles", "country_code": "US", "population": 3979576, "timezone": "America/Los_Angeles", "has_fair_center": True},
        {"name": "Chicago", "name_tr": "Chicago", "country_code": "US", "population": 2693976, "timezone": "America/Chicago", "has_fair_center": True},
        {"name": "Houston", "name_tr": "Houston", "country_code": "US", "population": 2320268, "timezone": "America/Chicago", "has_fair_center": True},
        {"name": "Phoenix", "name_tr": "Phoenix", "country_code": "US", "population": 1680992, "timezone": "America/Phoenix", "has_fair_center": True},
        {"name": "Philadelphia", "name_tr": "Philadelphia", "country_code": "US", "population": 1584064, "timezone": "America/New_York", "has_fair_center": True},
        {"name": "San Antonio", "name_tr": "San Antonio", "country_code": "US", "population": 1547253, "timezone": "America/Chicago", "has_fair_center": False},
        {"name": "San Diego", "name_tr": "San Diego", "country_code": "US", "population": 1423851, "timezone": "America/Los_Angeles", "has_fair_center": True},
        {"name": "Dallas", "name_tr": "Dallas", "country_code": "US", "population": 1343573, "timezone": "America/Chicago", "has_fair_center": True},
        {"name": "San Jose", "name_tr": "San Jose", "country_code": "US", "population": 1021795, "timezone": "America/Los_Angeles", "has_fair_center": True},
        {"name": "Las Vegas", "name_tr": "Las Vegas", "country_code": "US", "population": 651319, "timezone": "America/Los_Angeles", "has_fair_center": True},
        
        # Germany - Major cities
        {"name": "Berlin", "name_tr": "Berlin", "country_code": "DE", "population": 3769495, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Hamburg", "name_tr": "Hamburg", "country_code": "DE", "population": 1899160, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Munich", "name_tr": "Münih", "country_code": "DE", "population": 1558395, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Cologne", "name_tr": "Köln", "country_code": "DE", "population": 1087863, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Frankfurt", "name_tr": "Frankfurt", "country_code": "DE", "population": 753056, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Stuttgart", "name_tr": "Stuttgart", "country_code": "DE", "population": 634830, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Dusseldorf", "name_tr": "Düsseldorf", "country_code": "DE", "population": 621877, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Dortmund", "name_tr": "Dortmund", "country_code": "DE", "population": 586181, "timezone": "Europe/Berlin", "has_fair_center": False},
        {"name": "Essen", "name_tr": "Essen", "country_code": "DE", "population": 582760, "timezone": "Europe/Berlin", "has_fair_center": False},
        {"name": "Leipzig", "name_tr": "Leipzig", "country_code": "DE", "population": 593145, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Bremen", "name_tr": "Bremen", "country_code": "DE", "population": 569396, "timezone": "Europe/Berlin", "has_fair_center": False},
        {"name": "Dresden", "name_tr": "Dresden", "country_code": "DE", "population": 556780, "timezone": "Europe/Berlin", "has_fair_center": False},
        {"name": "Hannover", "name_tr": "Hannover", "country_code": "DE", "population": 538068, "timezone": "Europe/Berlin", "has_fair_center": True},
        {"name": "Nuremberg", "name_tr": "Nürnberg", "country_code": "DE", "population": 518365, "timezone": "Europe/Berlin", "has_fair_center": True},
        
        # UK - Major cities
        {"name": "London", "name_tr": "Londra", "country_code": "GB", "population": 9002488, "timezone": "Europe/London", "has_fair_center": True},
        {"name": "Birmingham", "name_tr": "Birmingham", "country_code": "GB", "population": 1141816, "timezone": "Europe/London", "has_fair_center": True},
        {"name": "Manchester", "name_tr": "Manchester", "country_code": "GB", "population": 547627, "timezone": "Europe/London", "has_fair_center": True},
        {"name": "Leeds", "name_tr": "Leeds", "country_code": "GB", "population": 503388, "timezone": "Europe/London", "has_fair_center": False},
        {"name": "Glasgow", "name_tr": "Glasgow", "country_code": "GB", "population": 635640, "timezone": "Europe/London", "has_fair_center": True},
        
        # UAE - Major cities
        {"name": "Dubai", "name_tr": "Dubai", "country_code": "AE", "population": 3478344, "timezone": "Asia/Dubai", "has_fair_center": True},
        {"name": "Abu Dhabi", "name_tr": "Abu Dabi", "country_code": "AE", "population": 1807000, "timezone": "Asia/Dubai", "has_fair_center": True},
        {"name": "Sharjah", "name_tr": "Sharjah", "country_code": "AE", "population": 1800000, "timezone": "Asia/Dubai", "has_fair_center": True},
        {"name": "Al Ain", "name_tr": "Al Ain", "country_code": "AE", "population": 766936, "timezone": "Asia/Dubai", "has_fair_center": False},
        
        # Saudi Arabia - Major cities
        {"name": "Riyadh", "name_tr": "Riyad", "country_code": "SA", "population": 7676654, "timezone": "Asia/Riyadh", "has_fair_center": True},
        {"name": "Jeddah", "name_tr": "Cidde", "country_code": "SA", "population": 4697000, "timezone": "Asia/Riyadh", "has_fair_center": True},
        {"name": "Mecca", "name_tr": "Mekke", "country_code": "SA", "population": 2078766, "timezone": "Asia/Riyadh", "has_fair_center": False},
        {"name": "Medina", "name_tr": "Medine", "country_code": "SA", "population": 1488782, "timezone": "Asia/Riyadh", "has_fair_center": False},
        {"name": "Dammam", "name_tr": "Dammam", "country_code": "SA", "population": 1252523, "timezone": "Asia/Riyadh", "has_fair_center": False},
        
        # France - Major cities
        {"name": "Paris", "name_tr": "Paris", "country_code": "FR", "population": 2165423, "timezone": "Europe/Paris", "has_fair_center": True},
        {"name": "Marseille", "name_tr": "Marsilya", "country_code": "FR", "population": 870731, "timezone": "Europe/Paris", "has_fair_center": True},
        {"name": "Lyon", "name_tr": "Lyon", "country_code": "FR", "population": 516092, "timezone": "Europe/Paris", "has_fair_center": True},
        
        # Italy - Major cities
        {"name": "Rome", "name_tr": "Roma", "country_code": "IT", "population": 2872800, "timezone": "Europe/Rome", "has_fair_center": True},
        {"name": "Milan", "name_tr": "Milano", "country_code": "IT", "population": 1396059, "timezone": "Europe/Rome", "has_fair_center": True},
        {"name": "Naples", "name_tr": "Napoli", "country_code": "IT", "population": 966144, "timezone": "Europe/Rome", "has_fair_center": False},
        {"name": "Turin", "name_tr": "Torino", "country_code": "IT", "population": 870952, "timezone": "Europe/Rome", "has_fair_center": True},
        {"name": "Bologna", "name_tr": "Bologna", "country_code": "IT", "population": 390636, "timezone": "Europe/Rome", "has_fair_center": True},
        
        # Spain - Major cities
        {"name": "Madrid", "name_tr": "Madrid", "country_code": "ES", "population": 3223334, "timezone": "Europe/Madrid", "has_fair_center": True},
        {"name": "Barcelona", "name_tr": "Barselona", "country_code": "ES", "population": 1636762, "timezone": "Europe/Madrid", "has_fair_center": True},
        {"name": "Valencia", "name_tr": "Valencia", "country_code": "ES", "population": 791413, "timezone": "Europe/Madrid", "has_fair_center": True},
        {"name": "Seville", "name_tr": "Sevilla", "country_code": "ES", "population": 688711, "timezone": "Europe/Madrid", "has_fair_center": False},
        
        # China - Major cities
        {"name": "Shanghai", "name_tr": "Şanghay", "country_code": "CN", "population": 24281400, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Beijing", "name_tr": "Pekin", "country_code": "CN", "population": 21542000, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Guangzhou", "name_tr": "Guangzhou", "country_code": "CN", "population": 14904400, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Shenzhen", "name_tr": "Shenzhen", "country_code": "CN", "population": 12528300, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Chengdu", "name_tr": "Chengdu", "country_code": "CN", "population": 16045577, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Tianjin", "name_tr": "Tianjin", "country_code": "CN", "population": 13866009, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Wuhan", "name_tr": "Wuhan", "country_code": "CN", "population": 11081000, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Hangzhou", "name_tr": "Hangzhou", "country_code": "CN", "population": 10360000, "timezone": "Asia/Shanghai", "has_fair_center": True},
        {"name": "Chongqing", "name_tr": "Chongqing", "country_code": "CN", "population": 30751600, "timezone": "Asia/Shanghai", "has_fair_center": True},
        
        # India - Major cities
        {"name": "Mumbai", "name_tr": "Mumbai", "country_code": "IN", "population": 20411000, "timezone": "Asia/Kolkata", "has_fair_center": True},
        {"name": "Delhi", "name_tr": "Delhi", "country_code": "IN", "population": 30291000, "timezone": "Asia/Kolkata", "has_fair_center": True},
        {"name": "Bangalore", "name_tr": "Bangalore", "country_code": "IN", "population": 12326532, "timezone": "Asia/Kolkata", "has_fair_center": True},
        {"name": "Hyderabad", "name_tr": "Haydarabad", "country_code": "IN", "population": 9746000, "timezone": "Asia/Kolkata", "has_fair_center": True},
        {"name": "Chennai", "name_tr": "Chennai", "country_code": "IN", "population": 10456000, "timezone": "Asia/Kolkata", "has_fair_center": True},
        {"name": "Kolkata", "name_tr": "Kalküta", "country_code": "IN", "population": 14850066, "timezone": "Asia/Kolkata", "has_fair_center": True},
        {"name": "Pune", "name_tr": "Pune", "country_code": "IN", "population": 6430000, "timezone": "Asia/Kolkata", "has_fair_center": True},
        
        # Japan - Major cities
        {"name": "Tokyo", "name_tr": "Tokyo", "country_code": "JP", "population": 13960000, "timezone": "Asia/Tokyo", "has_fair_center": True},
        {"name": "Yokohama", "name_tr": "Yokohama", "country_code": "JP", "population": 3749000, "timezone": "Asia/Tokyo", "has_fair_center": True},
        {"name": "Osaka", "name_tr": "Osaka", "country_code": "JP", "population": 2725006, "timezone": "Asia/Tokyo", "has_fair_center": True},
        {"name": "Nagoya", "name_tr": "Nagoya", "country_code": "JP", "population": 2321000, "timezone": "Asia/Tokyo", "has_fair_center": True},
        
        # South Korea - Major cities
        {"name": "Seoul", "name_tr": "Seul", "country_code": "KR", "population": 9776000, "timezone": "Asia/Seoul", "has_fair_center": True},
        {"name": "Busan", "name_tr": "Busan", "country_code": "KR", "population": 3414950, "timezone": "Asia/Seoul", "has_fair_center": True},
        {"name": "Incheon", "name_tr": "Incheon", "country_code": "KR", "population": 2954955, "timezone": "Asia/Seoul", "has_fair_center": True},
        
        # Russia - Major cities
        {"name": "Moscow", "name_tr": "Moskova", "country_code": "RU", "population": 12506468, "timezone": "Europe/Moscow", "has_fair_center": True},
        {"name": "Saint Petersburg", "name_tr": "Sankt-Peterburg", "country_code": "RU", "population": 5383968, "timezone": "Europe/Moscow", "has_fair_center": True},
        {"name": "Novosibirsk", "name_tr": "Novosibirsk", "country_code": "RU", "population": 1625631, "timezone": "Asia/Novosibirsk", "has_fair_center": False},
        
        # Brazil - Major cities
        {"name": "Sao Paulo", "name_tr": "São Paulo", "country_code": "BR", "population": 12325232, "timezone": "America/Sao_Paulo", "has_fair_center": True},
        {"name": "Rio de Janeiro", "name_tr": "Rio de Janeiro", "country_code": "BR", "population": 6747815, "timezone": "America/Sao_Paulo", "has_fair_center": True},
        {"name": "Brasilia", "name_tr": "Brasília", "country_code": "BR", "population": 3055149, "timezone": "America/Sao_Paulo", "has_fair_center": True},
        
        # Canada - Major cities
        {"name": "Toronto", "name_tr": "Toronto", "country_code": "CA", "population": 2930000, "timezone": "America/Toronto", "has_fair_center": True},
        {"name": "Montreal", "name_tr": "Montreal", "country_code": "CA", "population": 1762949, "timezone": "America/Toronto", "has_fair_center": True},
        {"name": "Vancouver", "name_tr": "Vancouver", "country_code": "CA", "population": 675218, "timezone": "America/Vancouver", "has_fair_center": True},
        
        # Australia - Major cities
        {"name": "Sydney", "name_tr": "Sidney", "country_code": "AU", "population": 5312000, "timezone": "Australia/Sydney", "has_fair_center": True},
        {"name": "Melbourne", "name_tr": "Melbourne", "country_code": "AU", "population": 5078000, "timezone": "Australia/Melbourne", "has_fair_center": True},
        {"name": "Brisbane", "name_tr": "Brisbane", "country_code": "AU", "population": 2514184, "timezone": "Australia/Brisbane", "has_fair_center": True},
        
        # Netherlands - Major cities
        {"name": "Amsterdam", "name_tr": "Amsterdam", "country_code": "NL", "population": 872680, "timezone": "Europe/Amsterdam", "has_fair_center": True},
        {"name": "Rotterdam", "name_tr": "Rotterdam", "country_code": "NL", "population": 651446, "timezone": "Europe/Amsterdam", "has_fair_center": True},
    ]
    
    for city in cities:
        city["created_at"] = now
        city["is_active"] = True
    
    await collection.delete_many({})
    if cities:
        await collection.insert_many(cities)
    
    print(f"✅ {len(cities)} şehir oluşturuldu")
    return len(cities)


async def seed_languages():
    """15 ana dil"""
    collection = db.languages
    
    now = datetime.now(timezone.utc)
    
    languages = [
        {"code": "tr", "name": "Turkish", "name_native": "Türkçe", "direction": "ltr", "is_active": True, "sort_order": 1},
        {"code": "en", "name": "English", "name_native": "English", "direction": "ltr", "is_active": True, "sort_order": 2},
        {"code": "de", "name": "German", "name_native": "Deutsch", "direction": "ltr", "is_active": True, "sort_order": 3},
        {"code": "ar", "name": "Arabic", "name_native": "العربية", "direction": "rtl", "is_active": True, "sort_order": 4},
        {"code": "fr", "name": "French", "name_native": "Français", "direction": "ltr", "is_active": True, "sort_order": 5},
        {"code": "es", "name": "Spanish", "name_native": "Español", "direction": "ltr", "is_active": True, "sort_order": 6},
        {"code": "it", "name": "Italian", "name_native": "Italiano", "direction": "ltr", "is_active": True, "sort_order": 7},
        {"code": "ru", "name": "Russian", "name_native": "Русский", "direction": "ltr", "is_active": True, "sort_order": 8},
        {"code": "zh", "name": "Chinese", "name_native": "中文", "direction": "ltr", "is_active": True, "sort_order": 9},
        {"code": "ja", "name": "Japanese", "name_native": "日本語", "direction": "ltr", "is_active": True, "sort_order": 10},
        {"code": "ko", "name": "Korean", "name_native": "한국어", "direction": "ltr", "is_active": True, "sort_order": 11},
        {"code": "pt", "name": "Portuguese", "name_native": "Português", "direction": "ltr", "is_active": True, "sort_order": 12},
        {"code": "hi", "name": "Hindi", "name_native": "हिन्दी", "direction": "ltr", "is_active": True, "sort_order": 13},
        {"code": "nl", "name": "Dutch", "name_native": "Nederlands", "direction": "ltr", "is_active": True, "sort_order": 14},
        {"code": "pl", "name": "Polish", "name_native": "Polski", "direction": "ltr", "is_active": True, "sort_order": 15},
    ]
    
    for lang in languages:
        lang["created_at"] = now
        lang["updated_at"] = now
    
    await collection.delete_many({})
    if languages:
        await collection.insert_many(languages)
    
    print(f"✅ {len(languages)} dil oluşturuldu")
    return len(languages)


async def main():
    """Ana seed fonksiyonu"""
    print("\n🚀 KAPSAMLI GLOBAL DATA SEED BAŞLIYOR...\n")
    print("=" * 60)
    
    try:
        # 1. Currencies
        print("\n📊 1/4: Para Birimleri...")
        currencies_count = await seed_currencies()
        
        # 2. Countries
        print("\n🌍 2/4: Ülkeler...")
        countries_count = await seed_countries()
        
        # 3. Cities
        print("\n🏙️  3/4: Şehirler...")
        cities_count = await seed_cities()
        
        # 4. Languages
        print("\n🗣️  4/4: Diller...")
        languages_count = await seed_languages()
        
        print("\n" + "=" * 60)
        print("\n✅ SEED TAMAMLANDI!")
        print(f"\n📈 ÖZET:")
        print(f"   • Para Birimleri: {currencies_count}")
        print(f"   • Ülkeler: {countries_count}")
        print(f"   • Şehirler: {cities_count}")
        print(f"   • Diller: {languages_count}")
        print(f"\n   TOPLAM: {currencies_count + countries_count + cities_count + languages_count} kayıt")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
