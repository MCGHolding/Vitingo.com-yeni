from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Dict
import uuid
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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
