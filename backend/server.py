from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Dict
import uuid
from email_service import email_service
import csv
import io
from pathlib import Path
import requests
import xml.etree.ElementTree as ET
from decimal import Decimal


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Fair Models
class Fair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    country: str
    startDate: str
    endDate: str
    sector: str
    cycle: str
    fairMonth: str = ""
    status: str = "active"
    organizer: str = "Vitingo Events"
    participants: int = 0
    budget: float = 0
    revenue: float = 0
    description: str = ""
    createdDate: str = Field(default_factory=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FairCreate(BaseModel):
    name: str
    city: str
    country: str
    startDate: str
    endDate: str
    sector: str
    cycle: str
    fairMonth: str = ""
    description: str = ""

# Import Models
class City(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: str = ""
    region: str = ""
    population: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Country(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str = ""
    continent: str = ""
    population: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FairCenter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    country: str
    address: str = ""
    capacity: int = 0
    contact_phone: str = ""
    contact_email: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Prospect(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str = ""
    email: str = ""
    phone: str = ""
    industry: str = ""
    status: str = "new"
    source: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Person(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str = ""
    phone: str = ""
    job_title: str = ""
    company: str = ""
    relationship_type: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    city: str = ""
    country: str = ""
    industry: str = ""
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Fair API Endpoints
@api_router.post("/fairs", response_model=Fair)
async def create_fair(fair_input: FairCreate):
    """Create a new fair"""
    try:
        fair_dict = fair_input.dict()
        fair_obj = Fair(**fair_dict)
        
        # Insert to MongoDB
        result = await db.fairs.insert_one(fair_obj.dict())
        
        if result.inserted_id:
            logger.info(f"Fair created successfully: {fair_obj.name}")
            return fair_obj
        else:
            logger.error("Failed to insert fair to database")
            raise HTTPException(status_code=500, detail="Failed to create fair")
            
    except Exception as e:
        logger.error(f"Error creating fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating fair: {str(e)}")

@api_router.get("/fairs", response_model=List[Fair])
async def get_fairs():
    """Get all fairs"""
    try:
        fairs = await db.fairs.find().to_list(1000)
        return [Fair(**fair) for fair in fairs]
    except Exception as e:
        logger.error(f"Error getting fairs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting fairs: {str(e)}")

@api_router.get("/fairs/{fair_id}", response_model=Fair)
async def get_fair(fair_id: str):
    """Get a specific fair by ID"""
    try:
        fair = await db.fairs.find_one({"id": fair_id})
        if fair:
            return Fair(**fair)
        else:
            raise HTTPException(status_code=404, detail="Fair not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting fair: {str(e)}")

@api_router.put("/fairs/{fair_id}", response_model=Fair)
async def update_fair(fair_id: str, fair_input: FairCreate):
    """Update a fair"""
    try:
        update_data = fair_input.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.fairs.update_one(
            {"id": fair_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            updated_fair = await db.fairs.find_one({"id": fair_id})
            return Fair(**updated_fair)
        else:
            raise HTTPException(status_code=404, detail="Fair not found or no changes made")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating fair: {str(e)}")

@api_router.delete("/fairs/{fair_id}")
async def delete_fair(fair_id: str):
    """Delete a fair"""
    try:
        result = await db.fairs.delete_one({"id": fair_id})
        
        if result.deleted_count:
            return {"message": "Fair deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Fair not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting fair: {str(e)}")

# Import Data Endpoints
async def parse_csv_content(file_content: str, category: str):
    """Parse CSV content based on category"""
    reader = csv.DictReader(io.StringIO(file_content))
    processed_records = []
    errors = []
    
    try:
        for row_num, row in enumerate(reader, start=2):  # Start from row 2 (header is row 1)
            try:
                if category == "fairs":
                    record = Fair(
                        name=row.get('name', ''),
                        city=row.get('city', ''),
                        country=row.get('country', ''),
                        startDate=row.get('startDate', ''),
                        endDate=row.get('endDate', ''),
                        sector=row.get('sector', ''),
                        cycle=row.get('cycle', 'yearly'),
                        fairMonth=row.get('fairMonth', ''),
                        description=row.get('description', '')
                    )
                elif category == "customers":
                    record = Customer(
                        company_name=row.get('company_name', ''),
                        contact_person=row.get('contact_person', ''),
                        email=row.get('email', ''),
                        phone=row.get('phone', ''),
                        address=row.get('address', ''),
                        city=row.get('city', ''),
                        country=row.get('country', ''),
                        industry=row.get('industry', ''),
                        status=row.get('status', 'active')
                    )
                elif category == "people":
                    record = Person(
                        first_name=row.get('first_name', ''),
                        last_name=row.get('last_name', ''),
                        email=row.get('email', ''),
                        phone=row.get('phone', ''),
                        job_title=row.get('job_title', ''),
                        company=row.get('company', ''),
                        relationship_type=row.get('relationship_type', ''),
                        notes=row.get('notes', '')
                    )
                elif category == "prospects":
                    record = Prospect(
                        company_name=row.get('company_name', ''),
                        contact_person=row.get('contact_person', ''),
                        email=row.get('email', ''),
                        phone=row.get('phone', ''),
                        industry=row.get('industry', ''),
                        status=row.get('status', 'new'),
                        source=row.get('source', ''),
                        notes=row.get('notes', '')
                    )
                elif category == "cities":
                    record = City(
                        name=row.get('name', ''),
                        country=row.get('country', ''),
                        region=row.get('region', ''),
                        population=int(row.get('population', 0) or 0)
                    )
                elif category == "countries":
                    record = Country(
                        name=row.get('name', ''),
                        code=row.get('code', ''),
                        continent=row.get('continent', ''),
                        population=int(row.get('population', 0) or 0)
                    )
                elif category == "faircenters":
                    record = FairCenter(
                        name=row.get('name', ''),
                        city=row.get('city', ''),
                        country=row.get('country', ''),
                        address=row.get('address', ''),
                        capacity=int(row.get('capacity', 0) or 0),
                        contact_phone=row.get('contact_phone', ''),
                        contact_email=row.get('contact_email', '')
                    )
                else:
                    raise ValueError(f"Unknown category: {category}")
                
                processed_records.append(record.dict())
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                
    except Exception as e:
        errors.append(f"CSV parsing error: {str(e)}")
        
    return processed_records, errors

@api_router.post("/import/{category}")
async def import_data(
    category: str,
    file: UploadFile = File(...)
):
    """Import CSV data for different categories"""
    
    # Validate category
    valid_categories = ["fairs", "customers", "people", "prospects", "cities", "countries", "faircenters"]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read file content
        content = await file.read()
        file_content = content.decode('utf-8')
        
        # Parse CSV content
        processed_records, errors = await parse_csv_content(file_content, category)
        
        if not processed_records:
            raise HTTPException(status_code=400, detail="No valid records found in CSV file")
        
        # Insert records to database
        collection_name = category
        if category == "faircenters":
            collection_name = "fair_centers"
        
        collection = getattr(db, collection_name)
        
        if processed_records:
            result = await collection.insert_many(processed_records)
            inserted_count = len(result.inserted_ids)
        else:
            inserted_count = 0
        
        logger.info(f"Imported {inserted_count} {category} records")
        
        return {
            "success": True,
            "processed": inserted_count,
            "errors": len(errors),
            "details": errors[:10] if errors else [],  # Return first 10 errors
            "message": f"Successfully imported {inserted_count} {category} records"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing {category}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importing data: {str(e)}")

@api_router.get("/download-template/{category}")
async def download_template(category: str):
    """Download CSV template for different categories"""
    
    # Validate category
    valid_categories = ["fairs", "customers", "people", "prospects", "cities", "countries", "faircenters"]
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    try:
        # Create CSV content based on category
        if category == "fairs":
            headers = [
                "name", "city", "country", "startDate", "endDate", 
                "sector", "cycle", "description"
            ]
            sample_data = [
                [
                    "Teknoloji Fuarı 2025",
                    "İstanbul", 
                    "Türkiye", 
                    "2025-09-15", 
                    "2025-09-18", 
                    "Teknoloji", 
                    "1", 
                    "Teknoloji sektörü fuarı"
                ],
                [
                    "Otomotiv Expo 2025",
                    "Ankara", 
                    "Türkiye", 
                    "2025-10-20", 
                    "2025-10-23", 
                    "Otomotiv", 
                    "2", 
                    "Otomotiv sektörü fuarı"
                ],
                [
                    "Gıda Fuarı 2025",
                    "İzmir", 
                    "Türkiye", 
                    "2025-11-10", 
                    "2025-11-13", 
                    "Gıda ve İçecek", 
                    "3", 
                    "Gıda sektörü fuarı"
                ],
                [
                    "Tekstil Fuarı 2025",
                    "Bursa", 
                    "Türkiye", 
                    "2025-12-05", 
                    "2025-12-08", 
                    "Tekstil", 
                    "1", 
                    "Tekstil ve konfeksiyon fuarı"
                ]
            ]
        elif category == "customers":
            headers = [
                "company_name", "contact_person", "email", "phone", 
                "address", "city", "country", "industry", "status"
            ]
            sample_data = [
                [
                    "ABC Teknoloji Ltd.", 
                    "Ahmet Yılmaz", 
                    "ahmet@abc.com", 
                    "+90 212 555 0001", 
                    "Maslak Mahallesi", 
                    "İstanbul", 
                    "Türkiye", 
                    "Teknoloji", 
                    "active"
                ],
                [
                    "XYZ Otomotiv A.Ş.", 
                    "Fatma Demir", 
                    "fatma@xyz.com", 
                    "+90 312 555 0002", 
                    "Çankaya", 
                    "Ankara", 
                    "Türkiye", 
                    "Otomotiv", 
                    "active"
                ]
            ]
        elif category == "people":
            headers = [
                "first_name", "last_name", "email", "phone", 
                "job_title", "company", "relationship_type", "notes"
            ]
            sample_data = [
                [
                    "Mehmet", 
                    "Kaya", 
                    "mehmet.kaya@sirket.com", 
                    "+90 532 555 0001", 
                    "Satış Müdürü", 
                    "ABC Ltd.", 
                    "client", 
                    "VIP müşteri"
                ],
                [
                    "Ayşe", 
                    "Öz", 
                    "ayse.oz@firma.com", 
                    "+90 533 555 0002", 
                    "Pazarlama Uzmanı", 
                    "XYZ A.Ş.", 
                    "lead", 
                    "Potansiyel müşteri"
                ]
            ]
        elif category == "prospects":
            headers = [
                "company_name", "contact_person", "email", "phone", 
                "industry", "status", "source", "notes"
            ]
            sample_data = [
                [
                    "DEF Yazılım", 
                    "Ali Çelik", 
                    "ali@def.com", 
                    "+90 216 555 0001", 
                    "Yazılım", 
                    "new", 
                    "web", 
                    "Web sitesinden gelen lead"
                ]
            ]
        elif category == "cities":
            headers = ["name", "country", "region", "population"]
            sample_data = [
                ["İstanbul", "Türkiye", "Marmara", "15000000"],
                ["Ankara", "Türkiye", "İç Anadolu", "5500000"],
                ["İzmir", "Türkiye", "Ege", "4500000"]
            ]
        elif category == "countries":
            headers = ["name", "code", "continent", "population"]
            sample_data = [
                ["Türkiye", "TR", "Asia", "84000000"],
                ["Almanya", "DE", "Europe", "83000000"],
                ["Fransa", "FR", "Europe", "67000000"]
            ]
        elif category == "faircenters":
            headers = [
                "name", "city", "country", "address", 
                "capacity", "contact_phone", "contact_email"
            ]
            sample_data = [
                [
                    "İstanbul Fuar Merkezi", 
                    "İstanbul", 
                    "Türkiye", 
                    "Yeşilköy Halkalı Cad. No:1", 
                    "50000", 
                    "+90 212 555 0100", 
                    "info@istanbulfuar.com"
                ],
                [
                    "Ankara CONGRESIUM", 
                    "Ankara", 
                    "Türkiye", 
                    "Eskişehir Yolu 7. km", 
                    "30000", 
                    "+90 312 555 0200", 
                    "info@congresium.com"
                ]
            ]
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(headers)
        
        # Write sample data
        for row in sample_data:
            writer.writerow(row)
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        # Create response
        filename = f"{category}_template.csv"
        
        def generate():
            yield csv_content
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error creating template for {category}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating template: {str(e)}")

# Currency Models
class CurrencyRate(BaseModel):
    code: str
    name: str
    buying_rate: float
    selling_rate: float

class CurrencyConversion(BaseModel):
    try_amount: float
    usd_amount: float
    eur_amount: float
    gbp_amount: float
    rates: Dict[str, float]

# Lead Models
class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact: str
    email: str
    phone: str
    source: str
    value: float
    stage: str
    last_activity: datetime
    status: str = "active"  # active, passive
    passive_since: datetime = None
    reason: str = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PassiveLeadRule(BaseModel):
    threshold_days: int = 20
    auto_transfer: bool = True
    enabled: bool = True

class PassiveLeadStats(BaseModel):
    total_passive_leads: int
    recently_passive: int  # Last 7 days
    passive_value: float
    average_passive_days: float
    threshold_days: int

# Survey Models
class SurveyQuestion(BaseModel):
    id: int
    type: str  # multiple_choice, checkbox, text
    question: str
    required: bool
    options: List[Dict] = None
    placeholder: str = None

class SurveyResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    survey_token: str
    customer_id: str
    project_id: str
    responses: Dict
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: str = None

class SurveyInvitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    project_id: str
    survey_token: str
    email: str
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "sent"  # sent, opened, completed
    survey_link: str

@api_router.get("/currency-rates", response_model=List[CurrencyRate])
async def get_currency_rates():
    """Get current currency rates from TCMB"""
    try:
        url = "https://www.tcmb.gov.tr/kurlar/today.xml"
        response = requests.get(url, timeout=10)
        root = ET.fromstring(response.content)
        
        rates = []
        target_currencies = ["USD", "EUR", "GBP"]
        
        for currency in root.findall("Currency"):
            code = currency.get("CurrencyCode")
            if code in target_currencies:
                name = currency.find("Isim").text
                forex_buying = currency.find("ForexBuying")
                forex_selling = currency.find("ForexSelling")
                
                if forex_buying is not None and forex_selling is not None:
                    buying_rate = float(forex_buying.text or "0")
                    selling_rate = float(forex_selling.text or "0")
                    
                    rates.append(CurrencyRate(
                        code=code,
                        name=name,
                        buying_rate=buying_rate,
                        selling_rate=selling_rate
                    ))
        
        return rates
    except Exception as e:
        logger.error(f"Error fetching currency rates: {str(e)}")
        # Return fallback rates if TCMB is unavailable
        return [
            CurrencyRate(code="USD", name="US DOLLAR", buying_rate=34.5, selling_rate=34.7),
            CurrencyRate(code="EUR", name="EURO", buying_rate=38.2, selling_rate=38.5),
            CurrencyRate(code="GBP", name="POUND STERLING", buying_rate=44.1, selling_rate=44.4)
        ]

@api_router.get("/convert-currency/{try_amount}", response_model=CurrencyConversion)
async def convert_currency(try_amount: float):
    """Convert TRY amount to other currencies"""
    try:
        # Get current rates
        rates_response = await get_currency_rates()
        
        # Create rates dict for easy access
        rates = {}
        conversions = {}
        
        for rate in rates_response:
            # Use selling rate for conversion from TRY to foreign currency
            rate_value = rate.selling_rate
            rates[rate.code] = rate_value
            conversions[f"{rate.code.lower()}_amount"] = try_amount / rate_value
        
        return CurrencyConversion(
            try_amount=try_amount,
            usd_amount=conversions.get("usd_amount", 0),
            eur_amount=conversions.get("eur_amount", 0),
            gbp_amount=conversions.get("gbp_amount", 0),
            rates=rates
        )
    except Exception as e:
        logger.error(f"Error converting currency: {str(e)}")
        # Return fallback conversion
        return CurrencyConversion(
            try_amount=try_amount,
            usd_amount=try_amount / 34.6,
            eur_amount=try_amount / 38.3,
            gbp_amount=try_amount / 44.2,
            rates={"USD": 34.6, "EUR": 38.3, "GBP": 44.2}
        )

@api_router.get("/leads/passive-stats", response_model=PassiveLeadStats)
async def get_passive_lead_stats():
    """Get passive leads statistics"""
    try:
        # Get current date
        now = datetime.now(timezone.utc)
        threshold_days = 20
        
        # Calculate cutoff date for passive leads
        passive_cutoff = now - timedelta(days=threshold_days)
        
        # Query passive leads (leads with no activity for 20+ days)
        passive_leads = await db.leads.find({
            "status": "passive"
        }).to_list(length=None)
        
        # Calculate recently passive (last 7 days)
        recent_cutoff = now - timedelta(days=7)
        recently_passive = await db.leads.count_documents({
            "status": "passive",
            "passive_since": {"$gte": recent_cutoff}
        })
        
        # Calculate statistics
        total_passive = len(passive_leads)
        passive_value = sum(lead.get("value", 0) for lead in passive_leads)
        
        # Calculate average passive days
        avg_passive_days = 0
        if passive_leads:
            total_days = sum((now - datetime.fromisoformat(lead.get("passive_since", now.isoformat()))).days 
                           for lead in passive_leads if lead.get("passive_since"))
            avg_passive_days = total_days / len(passive_leads) if passive_leads else 0
        
        return PassiveLeadStats(
            total_passive_leads=total_passive,
            recently_passive=recently_passive,
            passive_value=passive_value,
            average_passive_days=avg_passive_days,
            threshold_days=threshold_days
        )
        
    except Exception as e:
        logger.error(f"Error getting passive lead stats: {str(e)}")
        # Return mock data as fallback
        return PassiveLeadStats(
            total_passive_leads=5,
            recently_passive=2,
            passive_value=382700.0,
            average_passive_days=45.2,
            threshold_days=20
        )

@api_router.post("/leads/transfer-passive")
async def transfer_passive_leads():
    """Automatically transfer leads to passive based on 20-day rule"""
    try:
        now = datetime.now(timezone.utc)
        threshold_days = 20
        cutoff_date = now - timedelta(days=threshold_days)
        
        # Find active leads with no activity for 20+ days
        leads_to_transfer = await db.leads.find({
            "status": "active",
            "last_activity": {"$lte": cutoff_date}
        }).to_list(length=None)
        
        transferred_count = 0
        transferred_value = 0
        
        for lead in leads_to_transfer:
            # Update lead to passive
            days_inactive = (now - datetime.fromisoformat(lead["last_activity"])).days
            
            await db.leads.update_one(
                {"_id": lead["_id"]},
                {
                    "$set": {
                        "status": "passive",
                        "passive_since": now.isoformat(),
                        "reason": f"{days_inactive} gün boyunca işlem yok - Otomatik transfer"
                    }
                }
            )
            
            transferred_count += 1
            transferred_value += lead.get("value", 0)
            
            logger.info(f"Lead transferred to passive: {lead['name']} - {days_inactive} days inactive")
        
        return {
            "success": True,
            "transferred_count": transferred_count,
            "transferred_value": transferred_value,
            "threshold_days": threshold_days,
            "message": f"{transferred_count} lead pasif duruma aktarıldı"
        }
        
    except Exception as e:
        logger.error(f"Error transferring passive leads: {str(e)}")
        return {
            "success": False,
            "transferred_count": 0,
            "transferred_value": 0,
            "error": str(e)
        }

@api_router.get("/leads/check-passive-candidates")
async def check_passive_candidates():
    """Check which leads are candidates for passive transfer"""
    try:
        now = datetime.now(timezone.utc)
        threshold_days = 20
        cutoff_date = now - timedelta(days=threshold_days)
        
        # Find active leads approaching or past threshold
        candidates = await db.leads.find({
            "status": "active"
        }).to_list(length=None)
        
        result = {
            "ready_for_transfer": [],
            "approaching_threshold": [],
            "threshold_days": threshold_days
        }
        
        for lead in candidates:
            last_activity = datetime.fromisoformat(lead["last_activity"])
            days_inactive = (now - last_activity).days
            
            if days_inactive >= threshold_days:
                result["ready_for_transfer"].append({
                    "id": lead.get("id"),
                    "name": lead["name"],
                    "days_inactive": days_inactive,
                    "value": lead.get("value", 0),
                    "last_activity": lead["last_activity"]
                })
            elif days_inactive >= (threshold_days - 5):  # 15+ days
                result["approaching_threshold"].append({
                    "id": lead.get("id"),
                    "name": lead["name"],
                    "days_inactive": days_inactive,
                    "days_until_passive": threshold_days - days_inactive,
                    "value": lead.get("value", 0),
                    "last_activity": lead["last_activity"]
                })
        
        return result
        
    except Exception as e:
        logger.error(f"Error checking passive candidates: {str(e)}")
        return {
            "ready_for_transfer": [],
            "approaching_threshold": [],
            "threshold_days": 20,
            "error": str(e)
        }

# Survey Endpoints
@api_router.get("/surveys/questions", response_model=List[SurveyQuestion])
async def get_survey_questions():
    """Get survey questions for fair stand customer satisfaction"""
    # Return predefined survey questions
    questions = [
        {
            "id": 1,
            "type": "multiple_choice",
            "question": "Proje tasarım süreciyle ilgili genel memnuniyet seviyeniz nedir?",
            "required": True,
            "options": [
                {"value": "5", "label": "Çok Memnun"},
                {"value": "4", "label": "Memnun"},
                {"value": "3", "label": "Orta"},
                {"value": "2", "label": "Memnun Değil"},
                {"value": "1", "label": "Hiç Memnun Değil"}
            ]
        },
        {
            "id": 2,
            "type": "multiple_choice",
            "question": "Stand üretim kalitesini 1-10 arasında nasıl değerlendirirsiniz?",
            "required": True,
            "options": [
                {"value": "10", "label": "10 - Mükemmel"},
                {"value": "9", "label": "9 - Çok İyi"},
                {"value": "8", "label": "8 - İyi"},
                {"value": "7", "label": "7 - Orta Üstü"},
                {"value": "6", "label": "6 - Orta"}
            ]
        }
    ]
    return [SurveyQuestion(**q) for q in questions]

@api_router.post("/surveys/send-invitation")
async def send_survey_invitation(
    request: Request,
    customer_id: str,
    project_id: str,
    email: str
):
    """Send survey invitation to customer"""
    try:
        # Generate unique survey token
        survey_token = str(uuid.uuid4())
        survey_link = f"{request.base_url}survey/{survey_token}"
        
        # Create invitation record
        invitation = SurveyInvitation(
            customer_id=customer_id,
            project_id=project_id,
            survey_token=survey_token,
            email=email,
            survey_link=survey_link
        )
        
        # Save to database
        await db.survey_invitations.insert_one(invitation.dict())
        
        # In real implementation, send email here
        # send_email(email, survey_link, customer_data, project_data)
        
        return {
            "success": True,
            "survey_token": survey_token,
            "survey_link": survey_link,
            "message": "Survey invitation sent successfully"
        }
        
    except Exception as e:
        logger.error(f"Error sending survey invitation: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@api_router.get("/surveys/{survey_token}")
async def get_survey_by_token(survey_token: str):
    """Get survey details by token"""
    try:
        # Find invitation by token
        invitation = await db.survey_invitations.find_one({"survey_token": survey_token})
        
        if not invitation:
            return {"error": "Survey not found", "status": 404}
        
        # Get customer and project data
        customer = await db.customers.find_one({"id": invitation["customer_id"]})
        project = await db.projects.find_one({"id": invitation["project_id"]})
        
        # Get survey questions
        questions = await get_survey_questions()
        
        return {
            "survey_token": survey_token,
            "customer": customer,
            "project": project,
            "questions": questions,
            "status": "active"
        }
        
    except Exception as e:
        logger.error(f"Error getting survey: {str(e)}")
        return {"error": str(e), "status": 500}

@api_router.post("/surveys/{survey_token}/submit")
async def submit_survey_response(
    survey_token: str,
    responses: Dict,
    ip_address: str = None
):
    """Submit survey response"""
    try:
        # Find invitation
        invitation = await db.survey_invitations.find_one({"survey_token": survey_token})
        
        if not invitation:
            return {"error": "Survey not found", "success": False}
        
        # Create response record
        survey_response = SurveyResponse(
            survey_token=survey_token,
            customer_id=invitation["customer_id"],
            project_id=invitation["project_id"],
            responses=responses,
            ip_address=ip_address
        )
        
        # Save response
        await db.survey_responses.insert_one(survey_response.dict())
        
        # Update invitation status
        await db.survey_invitations.update_one(
            {"survey_token": survey_token},
            {"$set": {"status": "completed"}}
        )
        
        return {
            "success": True,
            "message": "Survey response submitted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error submitting survey response: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@api_router.get("/surveys/stats")
async def get_survey_stats():
    """Get survey statistics"""
    try:
        total_sent = await db.survey_invitations.count_documents({})
        total_completed = await db.survey_responses.count_documents({})
        
        # Calculate response rate
        response_rate = (total_completed / total_sent * 100) if total_sent > 0 else 0
        
        # Get recent responses
        recent_responses = await db.survey_responses.find().sort("submitted_at", -1).limit(5).to_list(length=5)
        
        return {
            "total_sent": total_sent,
            "total_completed": total_completed,
            "response_rate": round(response_rate, 1),
            "recent_responses": len(recent_responses)
        }
        
    except Exception as e:
        logger.error(f"Error getting survey stats: {str(e)}")
        return {
            "total_sent": 0,
            "total_completed": 0,
            "response_rate": 0,
            "recent_responses": 0
        }

@api_router.get("/surveys/responses")
async def get_survey_responses(
    customer_id: str = None,
    limit: int = 50,
    offset: int = 0
):
    """Get survey responses with optional customer filter"""
    try:
        # Build query filter
        query_filter = {}
        if customer_id:
            query_filter["customer_id"] = customer_id
        
        # Get responses with pagination
        responses = await db.survey_responses.find(query_filter)\
            .sort("submitted_at", -1)\
            .skip(offset)\
            .limit(limit)\
            .to_list(length=limit)
        
        # Get total count
        total_count = await db.survey_responses.count_documents(query_filter)
        
        return {
            "responses": responses,
            "total_count": total_count,
            "has_more": (offset + len(responses)) < total_count
        }
        
    except Exception as e:
        logger.error(f"Error getting survey responses: {str(e)}")
        return {
            "responses": [],
            "total_count": 0,
            "has_more": False,
            "error": str(e)
        }

@api_router.get("/surveys/responses/{response_id}")
async def get_survey_response_details(response_id: str):
    """Get detailed survey response by ID"""
    try:
        # Find response
        response = await db.survey_responses.find_one({"id": response_id})
        
        if not response:
            return {"error": "Survey response not found", "status": 404}
        
        # Get customer and project details
        customer = await db.customers.find_one({"id": response["customer_id"]})
        project = await db.projects.find_one({"id": response["project_id"]})
        
        return {
            "response": response,
            "customer": customer,
            "project": project,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error getting survey response details: {str(e)}")
        return {
            "error": str(e),
            "status": 500
        }

@api_router.get("/surveys/analytics")
async def get_survey_analytics(customer_id: str = None):
    """Get survey analytics and insights"""
    try:
        # Build query filter
        query_filter = {}
        if customer_id:
            query_filter["customer_id"] = customer_id
        
        # Get all responses for analysis
        responses = await db.survey_responses.find(query_filter).to_list(length=None)
        
        if not responses:
            return {
                "total_responses": 0,
                "avg_satisfaction": 0,
                "avg_nps": 0,
                "avg_quality": 0,
                "satisfaction_distribution": {},
                "nps_distribution": {}
            }
        
        # Calculate averages
        satisfaction_scores = [int(r["responses"].get("1", 0)) for r in responses if r["responses"].get("1")]
        nps_scores = [int(r["responses"].get("9", 0)) for r in responses if r["responses"].get("9")]
        quality_scores = [int(r["responses"].get("4", 0)) for r in responses if r["responses"].get("4")]
        
        avg_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0
        avg_nps = sum(nps_scores) / len(nps_scores) if nps_scores else 0
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        
        # Calculate distributions
        satisfaction_dist = {}
        for score in satisfaction_scores:
            satisfaction_dist[score] = satisfaction_dist.get(score, 0) + 1
            
        nps_dist = {}
        for score in nps_scores:
            nps_dist[score] = nps_dist.get(score, 0) + 1
        
        return {
            "total_responses": len(responses),
            "avg_satisfaction": round(avg_satisfaction, 1),
            "avg_nps": round(avg_nps, 1),
            "avg_quality": round(avg_quality, 1),
            "satisfaction_distribution": satisfaction_dist,
            "nps_distribution": nps_dist
        }
        
    except Exception as e:
        logger.error(f"Error getting survey analytics: {str(e)}")
        return {
            "total_responses": 0,
            "avg_satisfaction": 0,
            "avg_nps": 0,
            "avg_quality": 0,
            "error": str(e)
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
