"""
Global Data Router
==================
Vitingo CRM - Global Veri Yönetimi

TEK KAYNAK PRENSİBİ:
Tüm para birimleri, ülkeler, şehirler ve diller bu API'den gelir.
Frontend'de her yerde aynı veri kullanılır.

Ultra Admin bu verileri yönetir.
Tenant'lar sadece okuyabilir.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/api/global", tags=["Global Data"])

# MongoDB connection - direkt bağlantı
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client['crm_db']

# Dependency to get database
async def get_db():
    return db


# ============================================================
# MODELS
# ============================================================

# --- Currency Models ---
class CurrencyCreate(BaseModel):
    code: str = Field(..., description="ISO 4217 kodu (USD, EUR, TRY)")
    name: str = Field(..., description="İngilizce ad")
    name_tr: str = Field(..., description="Türkçe ad")
    symbol: str = Field(..., description="Sembol ($, €, ₺)")
    decimal_places: int = Field(2, description="Ondalık basamak sayısı")
    thousand_separator: str = Field(",", description="Binlik ayracı")
    decimal_separator: str = Field(".", description="Ondalık ayracı")
    symbol_position: str = Field("before", description="before veya after")
    is_active: bool = Field(True)
    is_common: bool = Field(False, description="Sık kullanılan mı")
    sort_order: int = Field(100)


class CurrencyUpdate(BaseModel):
    name: Optional[str] = None
    name_tr: Optional[str] = None
    symbol: Optional[str] = None
    decimal_places: Optional[int] = None
    thousand_separator: Optional[str] = None
    decimal_separator: Optional[str] = None
    symbol_position: Optional[str] = None
    is_active: Optional[bool] = None
    is_common: Optional[bool] = None
    sort_order: Optional[int] = None


# --- Country Models ---
class CountryCreate(BaseModel):
    code: str = Field(..., description="ISO 3166-1 alpha-2 kodu (TR, DE, US)")
    name: str = Field(..., description="İngilizce ad")
    name_tr: str = Field(..., description="Türkçe ad")
    name_native: Optional[str] = Field(None, description="Yerel dildeki ad")
    phone_code: str = Field(..., description="Telefon kodu (+90, +49)")
    currency_code: str = Field(..., description="Varsayılan para birimi")
    flag_emoji: Optional[str] = Field(None, description="Bayrak emoji")
    is_active: bool = Field(True)
    tax_config: Optional[dict] = Field(None, description="Vergi ayarları")
    sort_order: int = Field(100)


class CountryUpdate(BaseModel):
    name: Optional[str] = None
    name_tr: Optional[str] = None
    name_native: Optional[str] = None
    phone_code: Optional[str] = None
    currency_code: Optional[str] = None
    flag_emoji: Optional[str] = None
    is_active: Optional[bool] = None
    tax_config: Optional[dict] = None
    sort_order: Optional[int] = None


# --- City Models ---
class CityCreate(BaseModel):
    country_code: str = Field(..., description="Ülke kodu")
    name: str = Field(..., description="İngilizce ad")
    name_tr: Optional[str] = Field(None, description="Türkçe ad")
    state: Optional[str] = Field(None, description="Eyalet/Bölge")
    population: Optional[int] = Field(None)
    lat: Optional[float] = Field(None)
    lng: Optional[float] = Field(None)
    timezone: Optional[str] = Field(None)
    is_active: bool = Field(True)
    has_fair_center: bool = Field(False, description="Fuar merkezi var mı")


# --- Language Models ---
class LanguageCreate(BaseModel):
    code: str = Field(..., description="ISO 639-1 kodu (tr, en, de)")
    name: str = Field(..., description="İngilizce ad")
    name_native: str = Field(..., description="Yerel ad")
    direction: str = Field("ltr", description="ltr veya rtl")
    is_active: bool = Field(True)
    is_default: bool = Field(False)
    sort_order: int = Field(100)


# ============================================================
# DATABASE HELPERS
# ============================================================

async def get_platform_db():
    """Platform database bağlantısı"""
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    return client.vitingo_platform


# ============================================================
# CURRENCIES ENDPOINTS
# ============================================================

@router.get("/currencies")
async def list_currencies(
    active_only: bool = Query(True, description="Sadece aktif olanlar"),
    common_only: bool = Query(False, description="Sadece sık kullanılanlar")
):
    """
    Para birimlerini listele
    
    Frontend'de tüm dropdown'larda bu endpoint kullanılır.
    """
    db = await get_platform_db()
    collection = db.global_currencies
    
    query = {}
    if active_only:
        query["is_active"] = True
    if common_only:
        query["is_common"] = True
    
    currencies = await collection.find(query).sort("sort_order", 1).to_list(200)
    
    for currency in currencies:
        currency["id"] = str(currency.pop("_id"))
    
    return currencies


@router.get("/currencies/{code}")
async def get_currency(code: str):
    """Tek para birimi getir"""
    db = await get_platform_db()
    collection = db.global_currencies
    
    currency = await collection.find_one({"code": code.upper()})
    
    if not currency:
        raise HTTPException(status_code=404, detail=f"Para birimi '{code}' bulunamadı")
    
    currency["id"] = str(currency.pop("_id"))
    return currency


@router.post("/currencies")
async def create_currency(currency: CurrencyCreate):
    """
    Yeni para birimi ekle (Ultra Admin)
    """
    db = await get_platform_db()
    collection = db.global_currencies
    
    # Benzersizlik kontrolü
    existing = await collection.find_one({"code": currency.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail=f"'{currency.code}' kodu zaten mevcut")
    
    doc = {
        **currency.dict(),
        "code": currency.code.upper(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc


@router.put("/currencies/{code}")
async def update_currency(code: str, update: CurrencyUpdate):
    """Para birimi güncelle (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.global_currencies
    
    existing = await collection.find_one({"code": code.upper()})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Para birimi '{code}' bulunamadı")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"code": code.upper()},
        {"$set": update_data}
    )
    
    updated = await collection.find_one({"code": code.upper()})
    updated["id"] = str(updated.pop("_id"))
    
    return updated


@router.delete("/currencies/{code}")
async def delete_currency(code: str):
    """Para birimi sil (Ultra Admin) - Dikkat: Kullanımda olabilir"""
    db = await get_platform_db()
    collection = db.global_currencies
    
    existing = await collection.find_one({"code": code.upper()})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Para birimi '{code}' bulunamadı")
    
    # Soft delete - is_active = False yap
    await collection.update_one(
        {"code": code.upper()},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": f"Para birimi '{code}' pasif yapıldı"}


# ============================================================
# COUNTRIES ENDPOINTS
# ============================================================

@router.get("/countries")
async def list_countries(
    active_only: bool = Query(True, description="Sadece aktif olanlar"),
    search: Optional[str] = Query(None, description="Ara (isim veya kod)")
):
    """
    Ülkeleri listele
    """
    db = await get_platform_db()
    collection = db.global_countries
    
    query = {}
    if active_only:
        query["is_active"] = True
    
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"name_tr": {"$regex": search, "$options": "i"}}
        ]
    
    countries = await collection.find(query).sort("sort_order", 1).to_list(300)
    
    for country in countries:
        country["id"] = str(country.pop("_id"))
    
    return countries


@router.get("/countries/{code}")
async def get_country(code: str):
    """Tek ülke getir"""
    db = await get_platform_db()
    collection = db.global_countries
    
    country = await collection.find_one({"code": code.upper()})
    
    if not country:
        raise HTTPException(status_code=404, detail=f"Ülke '{code}' bulunamadı")
    
    country["id"] = str(country.pop("_id"))
    return country


@router.post("/countries")
async def create_country(country: CountryCreate):
    """Yeni ülke ekle (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.global_countries
    
    existing = await collection.find_one({"code": country.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail=f"'{country.code}' kodu zaten mevcut")
    
    doc = {
        **country.dict(),
        "code": country.code.upper(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc


@router.put("/countries/{code}")
async def update_country(code: str, update: CountryUpdate):
    """Ülke güncelle (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.global_countries
    
    existing = await collection.find_one({"code": code.upper()})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Ülke '{code}' bulunamadı")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await collection.update_one(
        {"code": code.upper()},
        {"$set": update_data}
    )
    
    updated = await collection.find_one({"code": code.upper()})
    updated["id"] = str(updated.pop("_id"))
    
    return updated


# ============================================================
# CITIES ENDPOINTS
# ============================================================

@router.get("/cities")
async def list_cities(
    country_code: Optional[str] = Query(None, description="Ülke kodu ile filtrele"),
    has_fair_center: Optional[bool] = Query(None, description="Fuar merkezi olanlar"),
    search: Optional[str] = Query(None, description="Şehir adı ara"),
    limit: int = Query(100, le=500)
):
    """
    Şehirleri listele
    """
    db = await get_platform_db()
    collection = db.global_cities
    
    query = {"is_active": True}
    
    if country_code:
        query["country_code"] = country_code.upper()
    
    if has_fair_center is not None:
        query["has_fair_center"] = has_fair_center
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"name_tr": {"$regex": search, "$options": "i"}}
        ]
    
    cities = await collection.find(query).sort("population", -1).to_list(limit)
    
    for city in cities:
        city["id"] = str(city.pop("_id"))
    
    return cities


@router.get("/cities/{country_code}/{city_name}")
async def get_city(country_code: str, city_name: str):
    """Tek şehir getir"""
    db = await get_platform_db()
    collection = db.global_cities
    
    city = await collection.find_one({
        "country_code": country_code.upper(),
        "name": {"$regex": f"^{city_name}$", "$options": "i"}
    })
    
    if not city:
        raise HTTPException(status_code=404, detail=f"Şehir bulunamadı")
    
    city["id"] = str(city.pop("_id"))
    return city


@router.post("/cities")
async def create_city(city: CityCreate):
    """Yeni şehir ekle (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.global_cities
    
    doc = {
        **city.dict(),
        "country_code": city.country_code.upper(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc


# ============================================================
# LANGUAGES ENDPOINTS
# ============================================================

@router.get("/languages")
async def list_languages(active_only: bool = Query(True)):
    """
    Dilleri listele
    """
    db = await get_platform_db()
    collection = db.global_languages
    
    query = {}
    if active_only:
        query["is_active"] = True
    
    languages = await collection.find(query).sort("sort_order", 1).to_list(50)
    
    for lang in languages:
        lang["id"] = str(lang.pop("_id"))
    
    return languages


@router.post("/languages")
async def create_language(language: LanguageCreate):
    """Yeni dil ekle (Ultra Admin)"""
    db = await get_platform_db()
    collection = db.global_languages
    
    existing = await collection.find_one({"code": language.code.lower()})
    if existing:
        raise HTTPException(status_code=400, detail=f"'{language.code}' kodu zaten mevcut")
    
    doc = {
        **language.dict(),
        "code": language.code.lower(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    
    return doc


# ============================================================
# SEED DATA
# ============================================================

@router.post("/seed")
async def seed_global_data():
    """
    Varsayılan global verileri oluştur
    """
    db = await get_platform_db()
    
    results = {
        "currencies": await _seed_currencies(db),
        "countries": await _seed_countries(db),
        "cities": await _seed_cities(db),
        "languages": await _seed_languages(db)
    }
    
    return {
        "message": "Global data seed tamamlandı",
        "results": results
    }


async def _seed_currencies(db):
    """Para birimlerini seed et"""
    collection = db.global_currencies
    
    currencies = [
        {"code": "TRY", "name": "Turkish Lira", "name_tr": "Türk Lirası", "symbol": "₺", "decimal_places": 2, "thousand_separator": ".", "decimal_separator": ",", "symbol_position": "after", "is_active": True, "is_common": True, "sort_order": 1},
        {"code": "USD", "name": "US Dollar", "name_tr": "Amerikan Doları", "symbol": "$", "decimal_places": 2, "thousand_separator": ",", "decimal_separator": ".", "symbol_position": "before", "is_active": True, "is_common": True, "sort_order": 2},
        {"code": "EUR", "name": "Euro", "name_tr": "Euro", "symbol": "€", "decimal_places": 2, "thousand_separator": ".", "decimal_separator": ",", "symbol_position": "before", "is_active": True, "is_common": True, "sort_order": 3},
        {"code": "GBP", "name": "British Pound", "name_tr": "İngiliz Sterlini", "symbol": "£", "decimal_places": 2, "thousand_separator": ",", "decimal_separator": ".", "symbol_position": "before", "is_active": True, "is_common": True, "sort_order": 4},
        {"code": "AED", "name": "UAE Dirham", "name_tr": "BAE Dirhemi", "symbol": "د.إ", "decimal_places": 2, "thousand_separator": ",", "decimal_separator": ".", "symbol_position": "after", "is_active": True, "is_common": True, "sort_order": 5},
        {"code": "SAR", "name": "Saudi Riyal", "name_tr": "Suudi Riyali", "symbol": "﷼", "decimal_places": 2, "thousand_separator": ",", "decimal_separator": ".", "symbol_position": "after", "is_active": True, "is_common": False, "sort_order": 6},
        {"code": "CHF", "name": "Swiss Franc", "name_tr": "İsviçre Frangı", "symbol": "CHF", "decimal_places": 2, "thousand_separator": "'", "decimal_separator": ".", "symbol_position": "before", "is_active": True, "is_common": False, "sort_order": 7},
        {"code": "JPY", "name": "Japanese Yen", "name_tr": "Japon Yeni", "symbol": "¥", "decimal_places": 0, "thousand_separator": ",", "decimal_separator": ".", "symbol_position": "before", "is_active": True, "is_common": False, "sort_order": 8},
        {"code": "CNY", "name": "Chinese Yuan", "name_tr": "Çin Yuanı", "symbol": "¥", "decimal_places": 2, "thousand_separator": ",", "decimal_separator": ".", "symbol_position": "before", "is_active": True, "is_common": False, "sort_order": 9},
        {"code": "RUB", "name": "Russian Ruble", "name_tr": "Rus Rublesi", "symbol": "₽", "decimal_places": 2, "thousand_separator": " ", "decimal_separator": ",", "symbol_position": "after", "is_active": True, "is_common": False, "sort_order": 10},
    ]
    
    created = 0
    for currency in currencies:
        existing = await collection.find_one({"code": currency["code"]})
        if not existing:
            currency["created_at"] = datetime.utcnow()
            currency["updated_at"] = datetime.utcnow()
            await collection.insert_one(currency)
            created += 1
    
    return {"created": created, "total": len(currencies)}


async def _seed_countries(db):
    """Ülkeleri seed et"""
    collection = db.global_countries
    
    countries = [
        {"code": "TR", "name": "Turkey", "name_tr": "Türkiye", "name_native": "Türkiye", "phone_code": "+90", "currency_code": "TRY", "flag_emoji": "🇹🇷", "is_active": True, "sort_order": 1, "tax_config": {"tax_name": "KDV", "default_rate": 20}},
        {"code": "DE", "name": "Germany", "name_tr": "Almanya", "name_native": "Deutschland", "phone_code": "+49", "currency_code": "EUR", "flag_emoji": "🇩🇪", "is_active": True, "sort_order": 2, "tax_config": {"tax_name": "VAT", "default_rate": 19}},
        {"code": "US", "name": "United States", "name_tr": "Amerika Birleşik Devletleri", "name_native": "United States", "phone_code": "+1", "currency_code": "USD", "flag_emoji": "🇺🇸", "is_active": True, "sort_order": 3, "tax_config": {"tax_name": "Sales Tax", "default_rate": 0}},
        {"code": "GB", "name": "United Kingdom", "name_tr": "Birleşik Krallık", "name_native": "United Kingdom", "phone_code": "+44", "currency_code": "GBP", "flag_emoji": "🇬🇧", "is_active": True, "sort_order": 4, "tax_config": {"tax_name": "VAT", "default_rate": 20}},
        {"code": "AE", "name": "United Arab Emirates", "name_tr": "Birleşik Arap Emirlikleri", "name_native": "الإمارات العربية المتحدة", "phone_code": "+971", "currency_code": "AED", "flag_emoji": "🇦🇪", "is_active": True, "sort_order": 5, "tax_config": {"tax_name": "VAT", "default_rate": 5}},
        {"code": "SA", "name": "Saudi Arabia", "name_tr": "Suudi Arabistan", "name_native": "المملكة العربية السعودية", "phone_code": "+966", "currency_code": "SAR", "flag_emoji": "🇸🇦", "is_active": True, "sort_order": 6, "tax_config": {"tax_name": "VAT", "default_rate": 15}},
        {"code": "FR", "name": "France", "name_tr": "Fransa", "name_native": "France", "phone_code": "+33", "currency_code": "EUR", "flag_emoji": "🇫🇷", "is_active": True, "sort_order": 7, "tax_config": {"tax_name": "TVA", "default_rate": 20}},
        {"code": "IT", "name": "Italy", "name_tr": "İtalya", "name_native": "Italia", "phone_code": "+39", "currency_code": "EUR", "flag_emoji": "🇮🇹", "is_active": True, "sort_order": 8, "tax_config": {"tax_name": "IVA", "default_rate": 22}},
        {"code": "ES", "name": "Spain", "name_tr": "İspanya", "name_native": "España", "phone_code": "+34", "currency_code": "EUR", "flag_emoji": "🇪🇸", "is_active": True, "sort_order": 9, "tax_config": {"tax_name": "IVA", "default_rate": 21}},
        {"code": "NL", "name": "Netherlands", "name_tr": "Hollanda", "name_native": "Nederland", "phone_code": "+31", "currency_code": "EUR", "flag_emoji": "🇳🇱", "is_active": True, "sort_order": 10, "tax_config": {"tax_name": "BTW", "default_rate": 21}},
        {"code": "CH", "name": "Switzerland", "name_tr": "İsviçre", "name_native": "Schweiz", "phone_code": "+41", "currency_code": "CHF", "flag_emoji": "🇨🇭", "is_active": True, "sort_order": 11, "tax_config": {"tax_name": "MWST", "default_rate": 7.7}},
        {"code": "AT", "name": "Austria", "name_tr": "Avusturya", "name_native": "Österreich", "phone_code": "+43", "currency_code": "EUR", "flag_emoji": "🇦🇹", "is_active": True, "sort_order": 12, "tax_config": {"tax_name": "USt", "default_rate": 20}},
        {"code": "BE", "name": "Belgium", "name_tr": "Belçika", "name_native": "België", "phone_code": "+32", "currency_code": "EUR", "flag_emoji": "🇧🇪", "is_active": True, "sort_order": 13, "tax_config": {"tax_name": "BTW", "default_rate": 21}},
        {"code": "PL", "name": "Poland", "name_tr": "Polonya", "name_native": "Polska", "phone_code": "+48", "currency_code": "PLN", "flag_emoji": "🇵🇱", "is_active": True, "sort_order": 14, "tax_config": {"tax_name": "VAT", "default_rate": 23}},
        {"code": "RU", "name": "Russia", "name_tr": "Rusya", "name_native": "Россия", "phone_code": "+7", "currency_code": "RUB", "flag_emoji": "🇷🇺", "is_active": True, "sort_order": 15, "tax_config": {"tax_name": "НДС", "default_rate": 20}},
        {"code": "CN", "name": "China", "name_tr": "Çin", "name_native": "中国", "phone_code": "+86", "currency_code": "CNY", "flag_emoji": "🇨🇳", "is_active": True, "sort_order": 16, "tax_config": {"tax_name": "VAT", "default_rate": 13}},
        {"code": "JP", "name": "Japan", "name_tr": "Japonya", "name_native": "日本", "phone_code": "+81", "currency_code": "JPY", "flag_emoji": "🇯🇵", "is_active": True, "sort_order": 17, "tax_config": {"tax_name": "消費税", "default_rate": 10}},
        {"code": "KR", "name": "South Korea", "name_tr": "Güney Kore", "name_native": "대한민국", "phone_code": "+82", "currency_code": "KRW", "flag_emoji": "🇰🇷", "is_active": True, "sort_order": 18, "tax_config": {"tax_name": "VAT", "default_rate": 10}},
        {"code": "IN", "name": "India", "name_tr": "Hindistan", "name_native": "भारत", "phone_code": "+91", "currency_code": "INR", "flag_emoji": "🇮🇳", "is_active": True, "sort_order": 19, "tax_config": {"tax_name": "GST", "default_rate": 18}},
        {"code": "BR", "name": "Brazil", "name_tr": "Brezilya", "name_native": "Brasil", "phone_code": "+55", "currency_code": "BRL", "flag_emoji": "🇧🇷", "is_active": True, "sort_order": 20, "tax_config": {"tax_name": "ICMS", "default_rate": 17}},
    ]
    
    created = 0
    for country in countries:
        existing = await collection.find_one({"code": country["code"]})
        if not existing:
            country["created_at"] = datetime.utcnow()
            country["updated_at"] = datetime.utcnow()
            await collection.insert_one(country)
            created += 1
    
    return {"created": created, "total": len(countries)}


async def _seed_cities(db):
    """Şehirleri seed et (fuar merkezli şehirler öncelikli)"""
    collection = db.global_cities
    
    cities = [
        # Türkiye
        {"country_code": "TR", "name": "Istanbul", "name_tr": "İstanbul", "state": "İstanbul", "population": 15460000, "lat": 41.0082, "lng": 28.9784, "timezone": "Europe/Istanbul", "is_active": True, "has_fair_center": True},
        {"country_code": "TR", "name": "Ankara", "name_tr": "Ankara", "state": "Ankara", "population": 5663000, "lat": 39.9334, "lng": 32.8597, "timezone": "Europe/Istanbul", "is_active": True, "has_fair_center": True},
        {"country_code": "TR", "name": "Izmir", "name_tr": "İzmir", "state": "İzmir", "population": 4367000, "lat": 38.4237, "lng": 27.1428, "timezone": "Europe/Istanbul", "is_active": True, "has_fair_center": True},
        {"country_code": "TR", "name": "Antalya", "name_tr": "Antalya", "state": "Antalya", "population": 2548000, "lat": 36.8969, "lng": 30.7133, "timezone": "Europe/Istanbul", "is_active": True, "has_fair_center": True},
        # Almanya
        {"country_code": "DE", "name": "Frankfurt", "name_tr": "Frankfurt", "state": "Hesse", "population": 753056, "lat": 50.1109, "lng": 8.6821, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        {"country_code": "DE", "name": "Munich", "name_tr": "Münih", "state": "Bavaria", "population": 1484226, "lat": 48.1351, "lng": 11.5820, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        {"country_code": "DE", "name": "Düsseldorf", "name_tr": "Düsseldorf", "state": "North Rhine-Westphalia", "population": 619651, "lat": 51.2277, "lng": 6.7735, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        {"country_code": "DE", "name": "Cologne", "name_tr": "Köln", "state": "North Rhine-Westphalia", "population": 1085664, "lat": 50.9375, "lng": 6.9603, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        {"country_code": "DE", "name": "Hannover", "name_tr": "Hannover", "state": "Lower Saxony", "population": 538068, "lat": 52.3759, "lng": 9.7320, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        {"country_code": "DE", "name": "Berlin", "name_tr": "Berlin", "state": "Berlin", "population": 3644826, "lat": 52.5200, "lng": 13.4050, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        {"country_code": "DE", "name": "Nuremberg", "name_tr": "Nürnberg", "state": "Bavaria", "population": 518365, "lat": 49.4521, "lng": 11.0767, "timezone": "Europe/Berlin", "is_active": True, "has_fair_center": True},
        # ABD
        {"country_code": "US", "name": "Las Vegas", "name_tr": "Las Vegas", "state": "Nevada", "population": 651319, "lat": 36.1699, "lng": -115.1398, "timezone": "America/Los_Angeles", "is_active": True, "has_fair_center": True},
        {"country_code": "US", "name": "Chicago", "name_tr": "Chicago", "state": "Illinois", "population": 2693976, "lat": 41.8781, "lng": -87.6298, "timezone": "America/Chicago", "is_active": True, "has_fair_center": True},
        {"country_code": "US", "name": "New York", "name_tr": "New York", "state": "New York", "population": 8336817, "lat": 40.7128, "lng": -74.0060, "timezone": "America/New_York", "is_active": True, "has_fair_center": True},
        {"country_code": "US", "name": "Orlando", "name_tr": "Orlando", "state": "Florida", "population": 307573, "lat": 28.5383, "lng": -81.3792, "timezone": "America/New_York", "is_active": True, "has_fair_center": True},
        # BAE
        {"country_code": "AE", "name": "Dubai", "name_tr": "Dubai", "state": "Dubai", "population": 3331420, "lat": 25.2048, "lng": 55.2708, "timezone": "Asia/Dubai", "is_active": True, "has_fair_center": True},
        {"country_code": "AE", "name": "Abu Dhabi", "name_tr": "Abu Dabi", "state": "Abu Dhabi", "population": 1483000, "lat": 24.4539, "lng": 54.3773, "timezone": "Asia/Dubai", "is_active": True, "has_fair_center": True},
        # İngiltere
        {"country_code": "GB", "name": "London", "name_tr": "Londra", "state": "England", "population": 8982000, "lat": 51.5074, "lng": -0.1278, "timezone": "Europe/London", "is_active": True, "has_fair_center": True},
        {"country_code": "GB", "name": "Birmingham", "name_tr": "Birmingham", "state": "England", "population": 1141816, "lat": 52.4862, "lng": -1.8904, "timezone": "Europe/London", "is_active": True, "has_fair_center": True},
        # Fransa
        {"country_code": "FR", "name": "Paris", "name_tr": "Paris", "state": "Île-de-France", "population": 2161000, "lat": 48.8566, "lng": 2.3522, "timezone": "Europe/Paris", "is_active": True, "has_fair_center": True},
        {"country_code": "FR", "name": "Lyon", "name_tr": "Lyon", "state": "Auvergne-Rhône-Alpes", "population": 516092, "lat": 45.7640, "lng": 4.8357, "timezone": "Europe/Paris", "is_active": True, "has_fair_center": True},
        # İtalya
        {"country_code": "IT", "name": "Milan", "name_tr": "Milano", "state": "Lombardy", "population": 1396059, "lat": 45.4642, "lng": 9.1900, "timezone": "Europe/Rome", "is_active": True, "has_fair_center": True},
        {"country_code": "IT", "name": "Bologna", "name_tr": "Bologna", "state": "Emilia-Romagna", "population": 390636, "lat": 44.4949, "lng": 11.3426, "timezone": "Europe/Rome", "is_active": True, "has_fair_center": True},
        # İspanya
        {"country_code": "ES", "name": "Barcelona", "name_tr": "Barselona", "state": "Catalonia", "population": 1636762, "lat": 41.3851, "lng": 2.1734, "timezone": "Europe/Madrid", "is_active": True, "has_fair_center": True},
        {"country_code": "ES", "name": "Madrid", "name_tr": "Madrid", "state": "Madrid", "population": 3223334, "lat": 40.4168, "lng": -3.7038, "timezone": "Europe/Madrid", "is_active": True, "has_fair_center": True},
        # Hollanda
        {"country_code": "NL", "name": "Amsterdam", "name_tr": "Amsterdam", "state": "North Holland", "population": 872680, "lat": 52.3676, "lng": 4.9041, "timezone": "Europe/Amsterdam", "is_active": True, "has_fair_center": True},
        # Çin
        {"country_code": "CN", "name": "Shanghai", "name_tr": "Şanghay", "state": "Shanghai", "population": 24281400, "lat": 31.2304, "lng": 121.4737, "timezone": "Asia/Shanghai", "is_active": True, "has_fair_center": True},
        {"country_code": "CN", "name": "Guangzhou", "name_tr": "Guangzhou", "state": "Guangdong", "population": 14904400, "lat": 23.1291, "lng": 113.2644, "timezone": "Asia/Shanghai", "is_active": True, "has_fair_center": True},
        {"country_code": "CN", "name": "Beijing", "name_tr": "Pekin", "state": "Beijing", "population": 21542000, "lat": 39.9042, "lng": 116.4074, "timezone": "Asia/Shanghai", "is_active": True, "has_fair_center": True},
    ]
    
    created = 0
    for city in cities:
        existing = await collection.find_one({
            "country_code": city["country_code"],
            "name": city["name"]
        })
        if not existing:
            city["created_at"] = datetime.utcnow()
            city["updated_at"] = datetime.utcnow()
            await collection.insert_one(city)
            created += 1
    
    return {"created": created, "total": len(cities)}


async def _seed_languages(db):
    """Dilleri seed et"""
    collection = db.global_languages
    
    languages = [
        {"code": "tr", "name": "Turkish", "name_native": "Türkçe", "direction": "ltr", "is_active": True, "is_default": True, "sort_order": 1},
        {"code": "en", "name": "English", "name_native": "English", "direction": "ltr", "is_active": True, "is_default": False, "sort_order": 2},
        {"code": "de", "name": "German", "name_native": "Deutsch", "direction": "ltr", "is_active": False, "is_default": False, "sort_order": 3},
        {"code": "ar", "name": "Arabic", "name_native": "العربية", "direction": "rtl", "is_active": False, "is_default": False, "sort_order": 4},
        {"code": "fr", "name": "French", "name_native": "Français", "direction": "ltr", "is_active": False, "is_default": False, "sort_order": 5},
        {"code": "es", "name": "Spanish", "name_native": "Español", "direction": "ltr", "is_active": False, "is_default": False, "sort_order": 6},
        {"code": "ru", "name": "Russian", "name_native": "Русский", "direction": "ltr", "is_active": False, "is_default": False, "sort_order": 7},
        {"code": "zh", "name": "Chinese", "name_native": "中文", "direction": "ltr", "is_active": False, "is_default": False, "sort_order": 8},
    ]
    
    created = 0
    for lang in languages:
        existing = await collection.find_one({"code": lang["code"]})
        if not existing:
            lang["created_at"] = datetime.utcnow()
            lang["updated_at"] = datetime.utcnow()
            await collection.insert_one(lang)
            created += 1
    
    return {"created": created, "total": len(languages)}
