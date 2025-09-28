#!/usr/bin/env python3
"""Comprehensive geo data seeder for Vitingo CRM"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Get database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Comprehensive countries data (195 countries)
COMPREHENSIVE_COUNTRIES = [
    {"name": "Afghanistan", "tr_name": "Afganistan", "iso2": "AF", "iso3": "AFG"},
    {"name": "Albania", "tr_name": "Arnavutluk", "iso2": "AL", "iso3": "ALB"},
    {"name": "Algeria", "tr_name": "Cezayir", "iso2": "DZ", "iso3": "DZA"},
    {"name": "Andorra", "tr_name": "Andorra", "iso2": "AD", "iso3": "AND"},
    {"name": "Angola", "tr_name": "Angola", "iso2": "AO", "iso3": "AGO"},
    {"name": "Argentina", "tr_name": "Arjantin", "iso2": "AR", "iso3": "ARG"},
    {"name": "Armenia", "tr_name": "Ermenistan", "iso2": "AM", "iso3": "ARM"},
    {"name": "Australia", "tr_name": "Avustralya", "iso2": "AU", "iso3": "AUS"},
    {"name": "Austria", "tr_name": "Avusturya", "iso2": "AT", "iso3": "AUT"},
    {"name": "Azerbaijan", "tr_name": "Azerbaycan", "iso2": "AZ", "iso3": "AZE"},
    {"name": "Bahamas", "tr_name": "Bahamalar", "iso2": "BS", "iso3": "BHS"},
    {"name": "Bahrain", "tr_name": "Bahreyn", "iso2": "BH", "iso3": "BHR"},
    {"name": "Bangladesh", "tr_name": "Bangladeş", "iso2": "BD", "iso3": "BGD"},
    {"name": "Barbados", "tr_name": "Barbados", "iso2": "BB", "iso3": "BRB"},
    {"name": "Belarus", "tr_name": "Belarus", "iso2": "BY", "iso3": "BLR"},
    {"name": "Belgium", "tr_name": "Belçika", "iso2": "BE", "iso3": "BEL"},
    {"name": "Belize", "tr_name": "Belize", "iso2": "BZ", "iso3": "BLZ"},
    {"name": "Benin", "tr_name": "Benin", "iso2": "BJ", "iso3": "BEN"},
    {"name": "Bhutan", "tr_name": "Bhutan", "iso2": "BT", "iso3": "BTN"},
    {"name": "Bolivia", "tr_name": "Bolivya", "iso2": "BO", "iso3": "BOL"},
    {"name": "Bosnia and Herzegovina", "tr_name": "Bosna Hersek", "iso2": "BA", "iso3": "BIH"},
    {"name": "Botswana", "tr_name": "Botsvana", "iso2": "BW", "iso3": "BWA"},
    {"name": "Brazil", "tr_name": "Brezilya", "iso2": "BR", "iso3": "BRA"},
    {"name": "Brunei", "tr_name": "Brunei", "iso2": "BN", "iso3": "BRN"},
    {"name": "Bulgaria", "tr_name": "Bulgaristan", "iso2": "BG", "iso3": "BGR"},
    {"name": "Burkina Faso", "tr_name": "Burkina Faso", "iso2": "BF", "iso3": "BFA"},
    {"name": "Burundi", "tr_name": "Burundi", "iso2": "BI", "iso3": "BDI"},
    {"name": "Cambodia", "tr_name": "Kamboçya", "iso2": "KH", "iso3": "KHM"},
    {"name": "Cameroon", "tr_name": "Kamerun", "iso2": "CM", "iso3": "CMR"},
    {"name": "Canada", "tr_name": "Kanada", "iso2": "CA", "iso3": "CAN"},
    {"name": "Cape Verde", "tr_name": "Yeşil Burun Adaları", "iso2": "CV", "iso3": "CPV"},
    {"name": "Central African Republic", "tr_name": "Orta Afrika Cumhuriyeti", "iso2": "CF", "iso3": "CAF"},
    {"name": "Chad", "tr_name": "Çad", "iso2": "TD", "iso3": "TCD"},
    {"name": "Chile", "tr_name": "Şili", "iso2": "CL", "iso3": "CHL"},
    {"name": "China", "tr_name": "Çin", "iso2": "CN", "iso3": "CHN"},
    {"name": "Colombia", "tr_name": "Kolombiya", "iso2": "CO", "iso3": "COL"},
    {"name": "Comoros", "tr_name": "Komorlar", "iso2": "KM", "iso3": "COM"},
    {"name": "Congo", "tr_name": "Kongo", "iso2": "CG", "iso3": "COG"},
    {"name": "Costa Rica", "tr_name": "Kosta Rika", "iso2": "CR", "iso3": "CRI"},
    {"name": "Croatia", "tr_name": "Hırvatistan", "iso2": "HR", "iso3": "HRV"},
    {"name": "Cuba", "tr_name": "Küba", "iso2": "CU", "iso3": "CUB"},
    {"name": "Cyprus", "tr_name": "Kıbrıs", "iso2": "CY", "iso3": "CYP"},
    {"name": "Czech Republic", "tr_name": "Çek Cumhuriyeti", "iso2": "CZ", "iso3": "CZE"},
    {"name": "Democratic Republic of the Congo", "tr_name": "Kongo Demokratik Cumhuriyeti", "iso2": "CD", "iso3": "COD"},
    {"name": "Denmark", "tr_name": "Danimarka", "iso2": "DK", "iso3": "DNK"},
    {"name": "Djibouti", "tr_name": "Cibuti", "iso2": "DJ", "iso3": "DJI"},
    {"name": "Dominica", "tr_name": "Dominika", "iso2": "DM", "iso3": "DMA"},
    {"name": "Dominican Republic", "tr_name": "Dominik Cumhuriyeti", "iso2": "DO", "iso3": "DOM"},
    {"name": "Ecuador", "tr_name": "Ekvador", "iso2": "EC", "iso3": "ECU"},
    {"name": "Egypt", "tr_name": "Mısır", "iso2": "EG", "iso3": "EGY"},
    {"name": "El Salvador", "tr_name": "El Salvador", "iso2": "SV", "iso3": "SLV"},
    {"name": "Equatorial Guinea", "tr_name": "Ekvator Ginesi", "iso2": "GQ", "iso3": "GNQ"},
    {"name": "Eritrea", "tr_name": "Eritre", "iso2": "ER", "iso3": "ERI"},
    {"name": "Estonia", "tr_name": "Estonya", "iso2": "EE", "iso3": "EST"},
    {"name": "Ethiopia", "tr_name": "Etiyopya", "iso2": "ET", "iso3": "ETH"},
    {"name": "Fiji", "tr_name": "Fiji", "iso2": "FJ", "iso3": "FJI"},
    {"name": "Finland", "tr_name": "Finlandiya", "iso2": "FI", "iso3": "FIN"},
    {"name": "France", "tr_name": "Fransa", "iso2": "FR", "iso3": "FRA"},
    {"name": "Gabon", "tr_name": "Gabon", "iso2": "GA", "iso3": "GAB"},
    {"name": "Gambia", "tr_name": "Gambiya", "iso2": "GM", "iso3": "GMB"},
    {"name": "Georgia", "tr_name": "Gürcistan", "iso2": "GE", "iso3": "GEO"},
    {"name": "Germany", "tr_name": "Almanya", "iso2": "DE", "iso3": "DEU"},
    {"name": "Ghana", "tr_name": "Gana", "iso2": "GH", "iso3": "GHA"},
    {"name": "Greece", "tr_name": "Yunanistan", "iso2": "GR", "iso3": "GRC"},
    {"name": "Grenada", "tr_name": "Grenada", "iso2": "GD", "iso3": "GRD"},
    {"name": "Guatemala", "tr_name": "Guatemala", "iso2": "GT", "iso3": "GTM"},
    {"name": "Guinea", "tr_name": "Gine", "iso2": "GN", "iso3": "GIN"},
    {"name": "Guinea-Bissau", "tr_name": "Gine-Bissau", "iso2": "GW", "iso3": "GNB"},
    {"name": "Guyana", "tr_name": "Guyana", "iso2": "GY", "iso3": "GUY"},
    {"name": "Haiti", "tr_name": "Haiti", "iso2": "HT", "iso3": "HTI"},
    {"name": "Honduras", "tr_name": "Honduras", "iso2": "HN", "iso3": "HND"},
    {"name": "Hungary", "tr_name": "Macaristan", "iso2": "HU", "iso3": "HUN"},
    {"name": "Iceland", "tr_name": "İzlanda", "iso2": "IS", "iso3": "ISL"},
    {"name": "India", "tr_name": "Hindistan", "iso2": "IN", "iso3": "IND"},
    {"name": "Indonesia", "tr_name": "Endonezya", "iso2": "ID", "iso3": "IDN"},
    {"name": "Iran", "tr_name": "İran", "iso2": "IR", "iso3": "IRN"},
    {"name": "Iraq", "tr_name": "Irak", "iso2": "IQ", "iso3": "IRQ"},
    {"name": "Ireland", "tr_name": "İrlanda", "iso2": "IE", "iso3": "IRL"},
    {"name": "Israel", "tr_name": "İsrail", "iso2": "IL", "iso3": "ISR"},
    {"name": "Italy", "tr_name": "İtalya", "iso2": "IT", "iso3": "ITA"},
    {"name": "Jamaica", "tr_name": "Jamaika", "iso2": "JM", "iso3": "JAM"},
    {"name": "Japan", "tr_name": "Japonya", "iso2": "JP", "iso3": "JPN"},
    {"name": "Jordan", "tr_name": "Ürdün", "iso2": "JO", "iso3": "JOR"},
    {"name": "Kazakhstan", "tr_name": "Kazakistan", "iso2": "KZ", "iso3": "KAZ"},
    {"name": "Kenya", "tr_name": "Kenya", "iso2": "KE", "iso3": "KEN"},
    {"name": "Kiribati", "tr_name": "Kiribati", "iso2": "KI", "iso3": "KIR"},
    {"name": "Kuwait", "tr_name": "Kuveyt", "iso2": "KW", "iso3": "KWT"},
    {"name": "Kyrgyzstan", "tr_name": "Kırgızistan", "iso2": "KG", "iso3": "KGZ"},
    {"name": "Laos", "tr_name": "Laos", "iso2": "LA", "iso3": "LAO"},
    {"name": "Latvia", "tr_name": "Letonya", "iso2": "LV", "iso3": "LVA"},
    {"name": "Lebanon", "tr_name": "Lübnan", "iso2": "LB", "iso3": "LBN"},
    {"name": "Lesotho", "tr_name": "Lesotho", "iso2": "LS", "iso3": "LSO"},
    {"name": "Liberia", "tr_name": "Liberya", "iso2": "LR", "iso3": "LBR"},
    {"name": "Libya", "tr_name": "Libya", "iso2": "LY", "iso3": "LBY"},
    {"name": "Liechtenstein", "tr_name": "Liechtenstein", "iso2": "LI", "iso3": "LIE"},
    {"name": "Lithuania", "tr_name": "Litvanya", "iso2": "LT", "iso3": "LTU"},
    {"name": "Luxembourg", "tr_name": "Lüksemburg", "iso2": "LU", "iso3": "LUX"},
    {"name": "Macedonia", "tr_name": "Kuzey Makedonya", "iso2": "MK", "iso3": "MKD"},
    {"name": "Madagascar", "tr_name": "Madagaskar", "iso2": "MG", "iso3": "MDG"},
    {"name": "Malawi", "tr_name": "Malavi", "iso2": "MW", "iso3": "MWI"},
    {"name": "Malaysia", "tr_name": "Malezya", "iso2": "MY", "iso3": "MYS"},
    {"name": "Maldives", "tr_name": "Maldivler", "iso2": "MV", "iso3": "MDV"},
    {"name": "Mali", "tr_name": "Mali", "iso2": "ML", "iso3": "MLI"},
    {"name": "Malta", "tr_name": "Malta", "iso2": "MT", "iso3": "MLT"},
    {"name": "Marshall Islands", "tr_name": "Marshall Adaları", "iso2": "MH", "iso3": "MHL"},
    {"name": "Mauritania", "tr_name": "Moritanya", "iso2": "MR", "iso3": "MRT"},
    {"name": "Mauritius", "tr_name": "Mauritius", "iso2": "MU", "iso3": "MUS"},
    {"name": "Mexico", "tr_name": "Meksika", "iso2": "MX", "iso3": "MEX"},
    {"name": "Micronesia", "tr_name": "Mikronezya", "iso2": "FM", "iso3": "FSM"},
    {"name": "Moldova", "tr_name": "Moldova", "iso2": "MD", "iso3": "MDA"},
    {"name": "Monaco", "tr_name": "Monako", "iso2": "MC", "iso3": "MCO"},
    {"name": "Mongolia", "tr_name": "Moğolistan", "iso2": "MN", "iso3": "MNG"},
    {"name": "Montenegro", "tr_name": "Karadağ", "iso2": "ME", "iso3": "MNE"},
    {"name": "Morocco", "tr_name": "Fas", "iso2": "MA", "iso3": "MAR"},
    {"name": "Mozambique", "tr_name": "Mozambik", "iso2": "MZ", "iso3": "MOZ"},
    {"name": "Myanmar", "tr_name": "Myanmar", "iso2": "MM", "iso3": "MMR"},
    {"name": "Namibia", "tr_name": "Namibya", "iso2": "NA", "iso3": "NAM"},
    {"name": "Nauru", "tr_name": "Nauru", "iso2": "NR", "iso3": "NRU"},
    {"name": "Nepal", "tr_name": "Nepal", "iso2": "NP", "iso3": "NPL"},
    {"name": "Netherlands", "tr_name": "Hollanda", "iso2": "NL", "iso3": "NLD"},
    {"name": "New Zealand", "tr_name": "Yeni Zelanda", "iso2": "NZ", "iso3": "NZL"},
    {"name": "Nicaragua", "tr_name": "Nikaragua", "iso2": "NI", "iso3": "NIC"},
    {"name": "Niger", "tr_name": "Nijer", "iso2": "NE", "iso3": "NER"},
    {"name": "Nigeria", "tr_name": "Nijerya", "iso2": "NG", "iso3": "NGA"},
    {"name": "North Korea", "tr_name": "Kuzey Kore", "iso2": "KP", "iso3": "PRK"},
    {"name": "Norway", "tr_name": "Norveç", "iso2": "NO", "iso3": "NOR"},
    {"name": "Oman", "tr_name": "Umman", "iso2": "OM", "iso3": "OMN"},
    {"name": "Pakistan", "tr_name": "Pakistan", "iso2": "PK", "iso3": "PAK"},
    {"name": "Palau", "tr_name": "Palau", "iso2": "PW", "iso3": "PLW"},
    {"name": "Panama", "tr_name": "Panama", "iso2": "PA", "iso3": "PAN"},
    {"name": "Papua New Guinea", "tr_name": "Papua Yeni Gine", "iso2": "PG", "iso3": "PNG"},
    {"name": "Paraguay", "tr_name": "Paraguay", "iso2": "PY", "iso3": "PRY"},
    {"name": "Peru", "tr_name": "Peru", "iso2": "PE", "iso3": "PER"},
    {"name": "Philippines", "tr_name": "Filipinler", "iso2": "PH", "iso3": "PHL"},
    {"name": "Poland", "tr_name": "Polonya", "iso2": "PL", "iso3": "POL"},
    {"name": "Portugal", "tr_name": "Portekiz", "iso2": "PT", "iso3": "PRT"},
    {"name": "Qatar", "tr_name": "Katar", "iso2": "QA", "iso3": "QAT"},
    {"name": "Romania", "tr_name": "Romanya", "iso2": "RO", "iso3": "ROU"},
    {"name": "Russia", "tr_name": "Rusya", "iso2": "RU", "iso3": "RUS"},
    {"name": "Rwanda", "tr_name": "Ruanda", "iso2": "RW", "iso3": "RWA"},
    {"name": "Saint Kitts and Nevis", "tr_name": "Saint Kitts ve Nevis", "iso2": "KN", "iso3": "KNA"},
    {"name": "Saint Lucia", "tr_name": "Saint Lucia", "iso2": "LC", "iso3": "LCA"},
    {"name": "Saint Vincent and the Grenadines", "tr_name": "Saint Vincent ve Grenadinler", "iso2": "VC", "iso3": "VCT"},
    {"name": "Samoa", "tr_name": "Samoa", "iso2": "WS", "iso3": "WSM"},
    {"name": "San Marino", "tr_name": "San Marino", "iso2": "SM", "iso3": "SMR"},
    {"name": "Sao Tome and Principe", "tr_name": "São Tomé ve Príncipe", "iso2": "ST", "iso3": "STP"},
    {"name": "Saudi Arabia", "tr_name": "Suudi Arabistan", "iso2": "SA", "iso3": "SAU"},
    {"name": "Senegal", "tr_name": "Senegal", "iso2": "SN", "iso3": "SEN"},
    {"name": "Serbia", "tr_name": "Sırbistan", "iso2": "RS", "iso3": "SRB"},
    {"name": "Seychelles", "tr_name": "Seyşeller", "iso2": "SC", "iso3": "SYC"},
    {"name": "Sierra Leone", "tr_name": "Sierra Leone", "iso2": "SL", "iso3": "SLE"},
    {"name": "Singapore", "tr_name": "Singapur", "iso2": "SG", "iso3": "SGP"},
    {"name": "Slovakia", "tr_name": "Slovakya", "iso2": "SK", "iso3": "SVK"},
    {"name": "Slovenia", "tr_name": "Slovenya", "iso2": "SI", "iso3": "SVN"},
    {"name": "Solomon Islands", "tr_name": "Solomon Adaları", "iso2": "SB", "iso3": "SLB"},
    {"name": "Somalia", "tr_name": "Somali", "iso2": "SO", "iso3": "SOM"},
    {"name": "South Africa", "tr_name": "Güney Afrika", "iso2": "ZA", "iso3": "ZAF"},
    {"name": "South Korea", "tr_name": "Güney Kore", "iso2": "KR", "iso3": "KOR"},
    {"name": "South Sudan", "tr_name": "Güney Sudan", "iso2": "SS", "iso3": "SSD"},
    {"name": "Spain", "tr_name": "İspanya", "iso2": "ES", "iso3": "ESP"},
    {"name": "Sri Lanka", "tr_name": "Sri Lanka", "iso2": "LK", "iso3": "LKA"},
    {"name": "Sudan", "tr_name": "Sudan", "iso2": "SD", "iso3": "SDN"},
    {"name": "Suriname", "tr_name": "Surinam", "iso2": "SR", "iso3": "SUR"},
    {"name": "Swaziland", "tr_name": "Eswatini", "iso2": "SZ", "iso3": "SWZ"},
    {"name": "Sweden", "tr_name": "İsveç", "iso2": "SE", "iso3": "SWE"},
    {"name": "Switzerland", "tr_name": "İsviçre", "iso2": "CH", "iso3": "CHE"},
    {"name": "Syria", "tr_name": "Suriye", "iso2": "SY", "iso3": "SYR"},
    {"name": "Taiwan", "tr_name": "Tayvan", "iso2": "TW", "iso3": "TWN"},
    {"name": "Tajikistan", "tr_name": "Tacikistan", "iso2": "TJ", "iso3": "TJK"},
    {"name": "Tanzania", "tr_name": "Tanzanya", "iso2": "TZ", "iso3": "TZA"},
    {"name": "Thailand", "tr_name": "Tayland", "iso2": "TH", "iso3": "THA"},
    {"name": "Togo", "tr_name": "Togo", "iso2": "TG", "iso3": "TGO"},
    {"name": "Tonga", "tr_name": "Tonga", "iso2": "TO", "iso3": "TON"},
    {"name": "Trinidad and Tobago", "tr_name": "Trinidad ve Tobago", "iso2": "TT", "iso3": "TTO"},
    {"name": "Tunisia", "tr_name": "Tunus", "iso2": "TN", "iso3": "TUN"},
    {"name": "Turkey", "tr_name": "Türkiye", "iso2": "TR", "iso3": "TUR"},
    {"name": "Turkmenistan", "tr_name": "Türkmenistan", "iso2": "TM", "iso3": "TKM"},
    {"name": "Tuvalu", "tr_name": "Tuvalu", "iso2": "TV", "iso3": "TUV"},
    {"name": "Uganda", "tr_name": "Uganda", "iso2": "UG", "iso3": "UGA"},
    {"name": "Ukraine", "tr_name": "Ukrayna", "iso2": "UA", "iso3": "UKR"},
    {"name": "United Arab Emirates", "tr_name": "Birleşik Arap Emirlikleri", "iso2": "AE", "iso3": "ARE"},
    {"name": "United Kingdom", "tr_name": "Birleşik Krallık", "iso2": "GB", "iso3": "GBR"},
    {"name": "United States", "tr_name": "Amerika Birleşik Devletleri", "iso2": "US", "iso3": "USA"},
    {"name": "Uruguay", "tr_name": "Uruguay", "iso2": "UY", "iso3": "URY"},
    {"name": "Uzbekistan", "tr_name": "Özbekistan", "iso2": "UZ", "iso3": "UZB"},
    {"name": "Vanuatu", "tr_name": "Vanuatu", "iso2": "VU", "iso3": "VUT"},
    {"name": "Vatican", "tr_name": "Vatikan", "iso2": "VA", "iso3": "VAT"},
    {"name": "Venezuela", "tr_name": "Venezuela", "iso2": "VE", "iso3": "VEN"},
    {"name": "Vietnam", "tr_name": "Vietnam", "iso2": "VN", "iso3": "VNM"},
    {"name": "Yemen", "tr_name": "Yemen", "iso2": "YE", "iso3": "YEM"},
    {"name": "Zambia", "tr_name": "Zambiya", "iso2": "ZM", "iso3": "ZMB"},
    {"name": "Zimbabwe", "tr_name": "Zimbabve", "iso2": "ZW", "iso3": "ZWE"}
]

# Major cities data
MAJOR_CITIES = [
    # Turkey - 81 provinces
    {"name": "İstanbul", "country": "TR", "tr_name": "İstanbul"},
    {"name": "Ankara", "country": "TR", "tr_name": "Ankara"},
    {"name": "İzmir", "country": "TR", "tr_name": "İzmir"},
    {"name": "Bursa", "country": "TR", "tr_name": "Bursa"},
    {"name": "Antalya", "country": "TR", "tr_name": "Antalya"},
    {"name": "Adana", "country": "TR", "tr_name": "Adana"},
    {"name": "Konya", "country": "TR", "tr_name": "Konya"},
    {"name": "Gaziantep", "country": "TR", "tr_name": "Gaziantep"},
    {"name": "Kayseri", "country": "TR", "tr_name": "Kayseri"},
    {"name": "Mersin", "country": "TR", "tr_name": "Mersin"},
    
    # United States
    {"name": "New York", "country": "US", "tr_name": "New York"},
    {"name": "Los Angeles", "country": "US", "tr_name": "Los Angeles"},
    {"name": "Chicago", "country": "US", "tr_name": "Chicago"},
    {"name": "Houston", "country": "US", "tr_name": "Houston"},
    {"name": "Miami", "country": "US", "tr_name": "Miami"},
    {"name": "San Francisco", "country": "US", "tr_name": "San Francisco"},
    {"name": "Las Vegas", "country": "US", "tr_name": "Las Vegas"},
    {"name": "Boston", "country": "US", "tr_name": "Boston"},
    {"name": "Seattle", "country": "US", "tr_name": "Seattle"},
    {"name": "Denver", "country": "US", "tr_name": "Denver"},
    
    # Germany
    {"name": "Berlin", "country": "DE", "tr_name": "Berlin"},
    {"name": "Munich", "country": "DE", "tr_name": "Münih"},
    {"name": "Hamburg", "country": "DE", "tr_name": "Hamburg"},
    {"name": "Frankfurt", "country": "DE", "tr_name": "Frankfurt"},
    {"name": "Cologne", "country": "DE", "tr_name": "Köln"},
    {"name": "Stuttgart", "country": "DE", "tr_name": "Stuttgart"},
    {"name": "Düsseldorf", "country": "DE", "tr_name": "Düsseldorf"},
    {"name": "Dortmund", "country": "DE", "tr_name": "Dortmund"},
    
    # United Kingdom
    {"name": "London", "country": "GB", "tr_name": "Londra"},
    {"name": "Manchester", "country": "GB", "tr_name": "Manchester"},
    {"name": "Birmingham", "country": "GB", "tr_name": "Birmingham"},
    {"name": "Glasgow", "country": "GB", "tr_name": "Glasgow"},
    {"name": "Liverpool", "country": "GB", "tr_name": "Liverpool"},
    {"name": "Edinburgh", "country": "GB", "tr_name": "Edinburgh"},
    
    # France
    {"name": "Paris", "country": "FR", "tr_name": "Paris"},
    {"name": "Marseille", "country": "FR", "tr_name": "Marsilya"},
    {"name": "Lyon", "country": "FR", "tr_name": "Lyon"},
    {"name": "Toulouse", "country": "FR", "tr_name": "Toulouse"},
    {"name": "Nice", "country": "FR", "tr_name": "Nice"},
    {"name": "Strasbourg", "country": "FR", "tr_name": "Strasbourg"},
    
    # UAE
    {"name": "Dubai", "country": "AE", "tr_name": "Dubai"},
    {"name": "Abu Dhabi", "country": "AE", "tr_name": "Abu Dabi"},
    {"name": "Sharjah", "country": "AE", "tr_name": "Şarja"},
    {"name": "Al Ain", "country": "AE", "tr_name": "Al Ain"},
    
    # China
    {"name": "Beijing", "country": "CN", "tr_name": "Pekin"},
    {"name": "Shanghai", "country": "CN", "tr_name": "Şanghay"},
    {"name": "Guangzhou", "country": "CN", "tr_name": "Guangzhou"},
    {"name": "Shenzhen", "country": "CN", "tr_name": "Shenzhen"},
    
    # Japan
    {"name": "Tokyo", "country": "JP", "tr_name": "Tokyo"},
    {"name": "Osaka", "country": "JP", "tr_name": "Osaka"},
    {"name": "Kyoto", "country": "JP", "tr_name": "Kyoto"},
    {"name": "Yokohama", "country": "JP", "tr_name": "Yokohama"},
    
    # Italy
    {"name": "Rome", "country": "IT", "tr_name": "Roma"},
    {"name": "Milan", "country": "IT", "tr_name": "Milano"},
    {"name": "Naples", "country": "IT", "tr_name": "Napoli"},
    {"name": "Florence", "country": "IT", "tr_name": "Floransa"},
    
    # Spain
    {"name": "Madrid", "country": "ES", "tr_name": "Madrid"},
    {"name": "Barcelona", "country": "ES", "tr_name": "Barselona"},
    {"name": "Valencia", "country": "ES", "tr_name": "Valencia"},
    {"name": "Seville", "country": "ES", "tr_name": "Sevilla"},
    
    # Canada
    {"name": "Toronto", "country": "CA", "tr_name": "Toronto"},
    {"name": "Vancouver", "country": "CA", "tr_name": "Vancouver"},
    {"name": "Montreal", "country": "CA", "tr_name": "Montreal"},
    {"name": "Calgary", "country": "CA", "tr_name": "Calgary"},
    
    # Russia
    {"name": "Moscow", "country": "RU", "tr_name": "Moskova"},
    {"name": "Saint Petersburg", "country": "RU", "tr_name": "Sankt Petersburg"},
    {"name": "Novosibirsk", "country": "RU", "tr_name": "Novosibirsk"},
    
    # Brazil
    {"name": "São Paulo", "country": "BR", "tr_name": "São Paulo"},
    {"name": "Rio de Janeiro", "country": "BR", "tr_name": "Rio de Janeiro"},
    {"name": "Salvador", "country": "BR", "tr_name": "Salvador"},
    
    # Australia
    {"name": "Sydney", "country": "AU", "tr_name": "Sidney"},
    {"name": "Melbourne", "country": "AU", "tr_name": "Melbourne"},
    {"name": "Brisbane", "country": "AU", "tr_name": "Brisbane"},
    
    # Saudi Arabia
    {"name": "Riyadh", "country": "SA", "tr_name": "Riyad"},
    {"name": "Jeddah", "country": "SA", "tr_name": "Cidde"},
    {"name": "Mecca", "country": "SA", "tr_name": "Mekke"},
    
    # India
    {"name": "Mumbai", "country": "IN", "tr_name": "Mumbai"},
    {"name": "Delhi", "country": "IN", "tr_name": "Delhi"},
    {"name": "Bangalore", "country": "IN", "tr_name": "Bangalore"},
]

async def seed_comprehensive_geo_data():
    """Seed comprehensive country and city data"""
    try:
        print("Starting comprehensive geo data seeding...")
        
        # Seed countries
        countries_added = 0
        for country_data in COMPREHENSIVE_COUNTRIES:
            existing = await db.countries.find_one({"iso2": country_data["iso2"]})
            if not existing:
                await db.countries.insert_one(country_data)
                countries_added += 1
            else:
                # Update existing country with new fields
                await db.countries.update_one(
                    {"iso2": country_data["iso2"]}, 
                    {"$set": country_data}
                )
        
        print(f"✅ Seeded {countries_added} new countries")
        print(f"✅ Updated existing countries with new fields")
        
        # Seed cities
        cities_added = 0
        for city_data in MAJOR_CITIES:
            existing = await db.cities.find_one({
                "name": city_data["name"], 
                "country": city_data["country"]
            })
            if not existing:
                await db.cities.insert_one(city_data)
                cities_added += 1
        
        print(f"✅ Seeded {cities_added} new cities")
        
        # Check final counts
        total_countries = await db.countries.count_documents({})
        total_cities = await db.cities.count_documents({})
        
        print(f"📊 Final counts:")
        print(f"   - Countries: {total_countries}")
        print(f"   - Cities: {total_cities}")
        
        print("🎉 Comprehensive geo data seeding completed!")
        
    except Exception as e:
        print(f"❌ Error seeding geo data: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(seed_comprehensive_geo_data())