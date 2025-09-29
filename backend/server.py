from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
# Debug environment variables
print(f"DEBUG: SENDGRID_API_KEY exists: {'SENDGRID_API_KEY' in os.environ}")
print(f"DEBUG: SENDGRID_API_KEY value: {os.environ.get('SENDGRID_API_KEY', 'NOT_FOUND')[:20]}...")

from email_service import email_service
try:
    from sendgrid.helpers.mail import Mail
except ImportError:
    Mail = None
import csv
import io
from pathlib import Path
import requests
import xml.etree.ElementTree as ET
from decimal import Decimal
import re
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import base64


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
    companyName: str
    relationshipType: str = ""
    contactPerson: str = ""
    contactPersonId: str = ""
    phone: str = ""
    countryCode: str = "TR"
    email: str = ""
    website: str = ""
    address: str = ""
    country: str = "TR"
    city: str = ""
    sector: str = ""
    notes: str = ""
    logo: Optional[str] = ""  # Allow None and default to empty string
    status: str = "active"
    customerSince: str = ""
    lastActivity: str = ""
    totalOrders: int = 0
    totalRevenue: float = 0.0
    currency: str = "TRY"
    # Turkish-specific fields
    companyTitle: str = ""  # Firma Unvanı
    taxOffice: str = ""     # Vergi Dairesi  
    taxNumber: str = ""     # Vergi Numarası
    # Tags field
    tags: List[str] = Field(default_factory=list)  # Etiketler
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Geographic Data Models
class Country(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    iso2: str = Field(..., description="ISO 3166-1 alpha-2 code")
    iso3: str = Field(..., description="ISO 3166-1 alpha-3 code") 
    name: str = Field(..., description="Country name in English")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class City(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="City name in English")
    country_iso2: str = Field(..., description="Country ISO2 code")
    admin1: str = Field(default="", description="Administrative division (state/province)")
    lat: Optional[float] = Field(None, description="Latitude")
    lng: Optional[float] = Field(None, description="Longitude") 
    population: Optional[int] = Field(None, description="Population")
    is_capital: bool = Field(default=False, description="Is this city a capital?")
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Product/Service Model for Invoicing
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Product/Service name")
    name_en: Optional[str] = Field("", description="Product name in English")
    category: str = Field(default="service", description="Product category")
    unit: str = Field(default="adet", description="Unit of measurement")
    default_price: Optional[float] = Field(None, description="Default price")
    currency: str = Field(default="TRY", description="Default currency")
    is_active: bool = Field(default=True, description="Is product active")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: Optional[str] = Field(None, description="Product ID if selected from database")
    name: str = Field(..., description="Product/Service name")
    quantity: float = Field(..., description="Quantity")
    unit: str = Field(..., description="Unit")
    unit_price: float = Field(..., description="Unit price")
    total: float = Field(..., description="Total amount for this item")

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str = Field(..., description="Generated invoice number")
    customer_id: Optional[str] = Field(None, description="Customer ID")
    customer_name: str = Field("", description="Customer name for display")
    date: str = Field(..., description="Invoice date")
    currency: str = Field(..., description="Invoice currency")
    items: List[InvoiceItem] = Field(..., description="Invoice items")
    subtotal: float = Field(..., description="Subtotal before tax")
    vat_rate: float = Field(..., description="VAT rate percentage")
    vat_amount: float = Field(..., description="VAT amount")
    discount: float = Field(0.0, description="Discount value (percentage or fixed amount)")
    discount_type: str = Field("percentage", description="Discount type: percentage or fixed")
    discount_amount: float = Field(0.0, description="Discount amount")
    total: float = Field(..., description="Final total amount")
    conditions: str = Field("", description="Terms and conditions")
    payment_term: str = Field("30", description="Payment terms in days")
    status: str = Field("draft", description="Invoice status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceCreate(BaseModel):
    invoice_number: str
    customer_id: Optional[str] = None
    customer_name: str = ""
    date: str
    currency: str
    items: List[InvoiceItem]
    subtotal: float
    vat_rate: float
    vat_amount: float
    discount: float = 0.0
    discount_type: str = "percentage"
    discount_amount: float = 0.0
    total: float
    conditions: str = ""
    payment_term: str = "30"

# ===================== BANK MODELS =====================

class Bank(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    country: str = Field(..., description="Country: USA, Turkey, UAE")
    bank_name: str = Field(..., description="Bank name")
    
    # Common fields for Turkey/UAE
    swift_code: Optional[str] = Field(None, description="SWIFT code (Turkey/UAE)")
    iban: Optional[str] = Field(None, description="IBAN (Turkey/UAE)")
    branch_name: Optional[str] = Field(None, description="Branch name (Turkey/UAE)")
    branch_code: Optional[str] = Field(None, description="Branch code (Turkey/UAE)")
    account_holder: Optional[str] = Field(None, description="Account holder (Turkey/UAE)")
    account_number: Optional[str] = Field(None, description="Account number (Turkey/UAE)")
    
    # USA specific fields
    routing_number: Optional[str] = Field(None, description="Routing number (USA)")
    us_account_number: Optional[str] = Field(None, description="Account number (USA)")
    bank_address: Optional[str] = Field(None, description="Bank address (USA)")
    recipient_address: Optional[str] = Field(None, description="Recipient address (USA)")
    recipient_name: Optional[str] = Field(None, description="Recipient name (USA)")
    recipient_zip_code: Optional[str] = Field(None, description="Recipient zip code (USA)")
    
    is_active: bool = Field(default=True, description="Is bank active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BankCreate(BaseModel):
    country: str
    bank_name: str
    swift_code: Optional[str] = None
    iban: Optional[str] = None
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    account_holder: Optional[str] = None
    account_number: Optional[str] = None
    routing_number: Optional[str] = None
    us_account_number: Optional[str] = None
    bank_address: Optional[str] = None
    recipient_address: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_zip_code: Optional[str] = None

class BankUpdate(BaseModel):
    country: Optional[str] = None
    bank_name: Optional[str] = None
    swift_code: Optional[str] = None
    iban: Optional[str] = None
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    account_holder: Optional[str] = None
    account_number: Optional[str] = None
    routing_number: Optional[str] = None
    us_account_number: Optional[str] = None
    bank_address: Optional[str] = None
    recipient_address: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_zip_code: Optional[str] = None

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
    ip_address: Optional[str] = None

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
    customer_id: str,
    project_id: str,
    email: str,
    customer_name: str,
    contact_name: str,
    project_name: str,
    fair_name: str,
    city: str,
    country: str,
    delivery_date: str
):
    """Send survey invitation to customer via SendGrid email"""
    try:
        # Generate unique survey token
        survey_token = str(uuid.uuid4())
        base_url = os.environ.get('FRONTEND_URL', 'https://supplier-map.preview.emergentagent.com')
        survey_link = f"{base_url}/survey/{survey_token}"
        
        # Prepare customer and project data for email
        customer_data = {
            "id": customer_id,
            "name": customer_name,
            "contact": contact_name,
            "email": email
        }
        
        project_data = {
            "id": project_id,
            "name": project_name,
            "fairName": fair_name,
            "city": city,
            "country": country,
            "deliveryDate": delivery_date
        }
        
        # Send email via SendGrid
        email_result = email_service.send_survey_invitation(customer_data, project_data, survey_link)
        
        if email_result["success"]:
            # Create invitation record only if email sent successfully
            invitation = SurveyInvitation(
                customer_id=customer_id,
                project_id=project_id,
                survey_token=survey_token,
                email=email,
                survey_link=survey_link
            )
            
            # Save to database
            await db.survey_invitations.insert_one(invitation.dict())
            
            return {
                "success": True,
                "survey_token": survey_token,
                "survey_link": survey_link,
                "message": f"Survey invitation sent successfully to {email}",
                "email_status": email_result
            }
        else:
            return {
                "success": False,
                "error": f"Failed to send email: {email_result.get('error', 'Unknown error')}"
            }
        
    except Exception as e:
        logger.error(f"Error sending survey invitation: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

class TestEmailRequest(BaseModel):
    email: str

@api_router.post("/send-test-email")
async def send_test_email(request: TestEmailRequest):
    """Send test email to verify SendGrid configuration"""
    try:
        result = email_service.send_test_email(request.email)
        return result
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

class UserEmailRequest(BaseModel):
    to: str
    cc: Optional[str] = ""
    bcc: Optional[str] = ""
    subject: str
    body: str
    from_name: str
    from_email: str
    to_name: str
    attachments: Optional[List[Dict]] = []

class CustomerEmailRequest(BaseModel):
    to: str
    cc: Optional[str] = ""
    bcc: Optional[str] = ""
    subject: str
    body: str
    from_name: str
    from_email: str
    to_name: str
    customer_id: str
    customer_company: str
    attachments: Optional[List[Dict]] = []

@api_router.post("/send-user-email")
async def send_user_email(request: UserEmailRequest):
    """Send email from user to user via CRM system"""
    try:
        result = email_service.send_user_email(
            to_email=request.to,
            to_name=request.to_name,
            from_email=request.from_email,
            from_name=request.from_name,
            subject=request.subject,
            body=request.body,
            cc=request.cc,
            bcc=request.bcc,
            attachments=request.attachments
        )
        
        # Save email to sent_emails collection for tracking
        email_record = {
            "id": str(uuid.uuid4()),
            "from": request.from_email,
            "from_name": request.from_name,
            "to": request.to,
            "to_name": request.to_name,
            "cc": request.cc,
            "bcc": request.bcc,
            "subject": request.subject,
            "body": request.body,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "sent" if result.get("success") else "failed",
            "attachments": len(request.attachments) if request.attachments else 0,
            "sendgrid_message_id": result.get("message_id")
        }
        
        await db.sent_emails.insert_one(email_record)
        
        return result
    except Exception as e:
        logger.error(f"Error sending user email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@api_router.post("/send-customer-email")
async def send_customer_email(request: CustomerEmailRequest):
    """Send email to customer via CRM system"""
    try:
        result = email_service.send_user_email(  # We can reuse the same email service method
            to_email=request.to,
            to_name=request.to_name,
            from_email=request.from_email,
            from_name=request.from_name,
            subject=request.subject,
            body=request.body,
            cc=request.cc,
            bcc=request.bcc,
            attachments=request.attachments
        )
        
        # Save email to customer_emails collection for tracking
        email_record = {
            "id": str(uuid.uuid4()),
            "from": request.from_email,
            "from_name": request.from_name,
            "to": request.to,
            "to_name": request.to_name,
            "cc": request.cc,
            "bcc": request.bcc,
            "subject": request.subject,
            "body": request.body,
            "customer_id": request.customer_id,
            "customer_company": request.customer_company,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "sent" if result.get("success") else "failed",
            "attachments": len(request.attachments) if request.attachments else 0,
            "sendgrid_message_id": result.get("message_id")
        }
        
        await db.customer_emails.insert_one(email_record)
        
        return result
    except Exception as e:
        logger.error(f"Error sending customer email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

class ArbitrarySurveyRequest(BaseModel):
    email: str
    contact_name: str
    company_name: Optional[str] = ""
    project_name: str

@api_router.post("/surveys/send-arbitrary")
async def send_arbitrary_survey_invitation(request: ArbitrarySurveyRequest):
    """Send survey invitation to arbitrary email address"""
    try:
        # Generate unique survey token
        survey_token = str(uuid.uuid4())
        base_url = os.environ.get('FRONTEND_URL', 'https://supplier-map.preview.emergentagent.com')
        survey_link = f"{base_url}/survey/{survey_token}"
        
        # Prepare customer and project data for email
        customer_data = {
            "id": "arbitrary",
            "name": request.company_name or "Değerli Müşterimiz",
            "contact": request.contact_name,
            "email": request.email
        }
        
        project_data = {
            "id": "arbitrary",
            "name": request.project_name,
            "fairName": request.project_name,
            "city": "",
            "country": "",
            "deliveryDate": datetime.now().isoformat()
        }
        
        # Send email via SendGrid
        email_result = email_service.send_survey_invitation(customer_data, project_data, survey_link)
        
        if email_result["success"]:
            # Create invitation record with arbitrary flag
            invitation = SurveyInvitation(
                customer_id="arbitrary",
                project_id="arbitrary", 
                survey_token=survey_token,
                email=request.email,
                survey_link=survey_link
            )
            
            # Add extra fields for arbitrary surveys
            invitation_dict = invitation.dict()
            invitation_dict.update({
                "is_arbitrary": True,
                "contact_name": request.contact_name,
                "company_name": request.company_name,
                "project_name": request.project_name,
                "created_at": datetime.now().isoformat()
            })
            
            # Save to database
            await db.survey_invitations.insert_one(invitation_dict)
            
            return {
                "success": True,
                "survey_token": survey_token,
                "survey_link": survey_link,
                "message": f"Survey invitation sent successfully to {request.email}",
                "email_status": email_result
            }
        else:
            return {
                "success": False,
                "error": f"Failed to send email: {email_result.get('error', 'Unknown error')}"
            }
        
    except Exception as e:
        logger.error(f"Error sending arbitrary survey invitation: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# =====================================
# HANDOVER ENDPOINTS
# =====================================

class HandoverRequest(BaseModel):
    customer_id: str
    project_id: str
    email: str
    customer_name: str
    contact_name: str
    project_name: str
    language: str
    customer_representative: str

class HandoverSubmission(BaseModel):
    customer_name: str
    customer_title: Optional[str] = ""
    customer_company: Optional[str] = ""
    signature_base64: str
    acceptance_confirmed: bool

@api_router.post("/handovers/send")
async def send_handover_form(request: HandoverRequest):
    """Send handover form to customer"""
    try:
        # Generate unique handover token
        handover_token = f"ho_{str(uuid.uuid4()).replace('-', '')}"
        base_url = os.environ.get('FRONTEND_URL', 'https://supplier-map.preview.emergentagent.com')
        handover_link = f"{base_url}/handover/{handover_token}"
        
        # Prepare customer and project data for email
        customer_data = {
            "id": request.customer_id,
            "name": request.customer_name,
            "contact": request.contact_name,
            "email": request.email
        }
        
        project_data = {
            "id": request.project_id,
            "name": request.project_name,
            "language": request.language
        }
        
        # Send email via SendGrid
        email_result = email_service.send_handover_invitation(customer_data, project_data, handover_link)
        
        if email_result["success"]:
            # Create handover invitation record
            handover_invitation = {
                "customer_id": request.customer_id,
                "project_id": request.project_id,
                "handover_token": handover_token,
                "email": request.email,
                "handover_link": handover_link,
                "customer_name": request.customer_name,
                "contact_name": request.contact_name,
                "project_name": request.project_name,
                "customer_representative": request.customer_representative,
                "language": request.language,
                "status": "pending",
                "sent_at": datetime.now().isoformat(),
                "completed_at": None,
                "signature_data": None,
                "auto_survey_triggered": False,
                "survey_token": None
            }
            
            # Save to database
            await db.handover_invitations.insert_one(handover_invitation)
            
            return {
                "success": True,
                "handover_token": handover_token,
                "handover_link": handover_link,
                "message": f"Handover form sent successfully to {request.email}",
                "email_status": email_result
            }
        else:
            return {
                "success": False,
                "error": f"Failed to send email: {email_result.get('error', 'Unknown error')}"
            }
        
    except Exception as e:
        logger.error(f"Error sending handover form: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

class ArbitraryHandoverRequest(BaseModel):
    email: str
    contact_name: str
    company_name: Optional[str] = ""
    project_name: str
    country: str
    language: str
    customer_representative: str

@api_router.post("/handovers/send-arbitrary")
async def send_arbitrary_handover_form(request: ArbitraryHandoverRequest):
    """Send handover form to arbitrary email address"""
    try:
        # Generate unique handover token
        handover_token = f"ho_{str(uuid.uuid4()).replace('-', '')}"
        base_url = os.environ.get('FRONTEND_URL', 'https://supplier-map.preview.emergentagent.com')
        handover_link = f"{base_url}/handover/{handover_token}"
        
        # Prepare customer and project data for email
        customer_data = {
            "id": "arbitrary",
            "name": request.company_name or "Değerli Müşterimiz",
            "contact": request.contact_name,
            "email": request.email
        }
        
        project_data = {
            "id": "arbitrary",
            "name": request.project_name,
            "language": request.language
        }
        
        # Send email via SendGrid
        email_result = email_service.send_handover_invitation(customer_data, project_data, handover_link)
        
        if email_result["success"]:
            # Create handover invitation record with arbitrary flag
            handover_invitation = {
                "customer_id": "arbitrary",
                "project_id": "arbitrary",
                "handover_token": handover_token,
                "email": request.email,
                "handover_link": handover_link,
                "customer_name": request.company_name or "Arbitrary Customer",
                "contact_name": request.contact_name,
                "project_name": request.project_name,
                "customer_representative": request.customer_representative,
                "language": request.language,
                "country": request.country,
                "status": "pending",
                "sent_at": datetime.now().isoformat(),
                "completed_at": None,
                "signature_data": None,
                "auto_survey_triggered": False,
                "survey_token": None,
                "is_arbitrary": True
            }
            
            # Save to database
            await db.handover_invitations.insert_one(handover_invitation)
            
            return {
                "success": True,
                "handover_token": handover_token,
                "handover_link": handover_link,
                "message": f"Handover form sent successfully to {request.email}",
                "email_status": email_result
            }
        else:
            return {
                "success": False,
                "error": f"Failed to send email: {email_result.get('error', 'Unknown error')}"
            }
        
    except Exception as e:
        logger.error(f"Error sending arbitrary handover form: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@api_router.get("/handovers/{handover_token}")
async def get_handover_by_token(handover_token: str):
    """Get handover details by token"""
    try:
        # Find invitation by token
        invitation = await db.handover_invitations.find_one({"handover_token": handover_token})
        
        if not invitation:
            return {"error": "Handover form not found", "status": 404}
        
        # Check if already completed
        if invitation.get("status") == "completed":
            return {"error": "Handover form already completed", "status": 410}
        
        # Check if this is an arbitrary handover
        if invitation.get("is_arbitrary", False):
            # For arbitrary handovers, create customer and project data from stored info
            customer = {
                "id": "arbitrary",
                "name": invitation.get("customer_name", "Değerli Müşterimiz"),
                "contact": invitation.get("contact_name", ""),
                "email": invitation.get("email", "")
            }
            
            project = {
                "id": "arbitrary",
                "name": invitation.get("project_name", ""),
                "country": invitation.get("country", "")
            }
        else:
            # For regular customer handovers, create data from stored info
            customer = {
                "id": invitation["customer_id"],
                "name": invitation["customer_name"],
                "contact": invitation["contact_name"],
                "email": invitation["email"]
            }
            
            project = {
                "id": invitation["project_id"],
                "name": invitation["project_name"]
            }
        
        return {
            "handover_token": handover_token,
            "customer": customer,
            "project": project,
            "language": invitation.get("language", "en"),
            "status": "active"
        }
        
    except Exception as e:
        logger.error(f"Error getting handover: {str(e)}")
        return {"error": str(e), "status": 500}

@api_router.post("/handovers/{handover_token}/submit")
async def submit_handover_form(handover_token: str, submission: HandoverSubmission):
    """Submit handover form with signature"""
    try:
        # Find invitation by token
        invitation = await db.handover_invitations.find_one({"handover_token": handover_token})
        
        if not invitation:
            return {"success": False, "error": "Handover form not found"}
        
        if invitation.get("status") == "completed":
            return {"success": False, "error": "Handover form already completed"}
        
        # Update invitation with signature and completion
        signature_data = {
            "customer_name": submission.customer_name,
            "customer_title": submission.customer_title,
            "customer_company": submission.customer_company,
            "signature_base64": submission.signature_base64,
            "acceptance_confirmed": submission.acceptance_confirmed,
            "submitted_at": datetime.now().isoformat(),
            "ip_address": None  # Could get real IP if needed
        }
        
        await db.handover_invitations.update_one(
            {"handover_token": handover_token},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now().isoformat(),
                    "signature_data": signature_data
                }
            }
        )
        
        # TODO: Trigger automatic survey sending after handover completion
        # This would be implemented based on the reminder schedule
        
        return {
            "success": True,
            "message": "Handover form submitted successfully",
            "handover_token": handover_token
        }
        
    except Exception as e:
        logger.error(f"Error submitting handover: {str(e)}")
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

@api_router.get("/surveys/{survey_token}")
async def get_survey_by_token(survey_token: str):
    """Get survey details by token"""
    try:
        # Find invitation by token
        invitation = await db.survey_invitations.find_one({"survey_token": survey_token})
        
        if not invitation:
            return {"error": "Survey not found", "status": 404}
        
        # Check if this is an arbitrary survey
        if invitation.get("is_arbitrary", False):
            # For arbitrary surveys, create customer and project data from stored info
            customer = {
                "id": "arbitrary",
                "name": invitation.get("company_name", "Değerli Müşterimiz"),
                "contact": invitation.get("contact_name", ""),
                "email": invitation.get("email", "")
            }
            
            project = {
                "id": "arbitrary",
                "name": invitation.get("project_name", ""),
                "fairName": invitation.get("project_name", ""),
                "city": "",
                "country": "",
                "deliveryDate": invitation.get("created_at", datetime.now().isoformat())
            }
        else:
            # For regular customer surveys, try to get data from database first
            customer = await db.customers.find_one({"id": invitation["customer_id"]})
            project = await db.projects.find_one({"id": invitation["project_id"]})
            
            # If not found in database, create mock data from invitation context
            if not customer:
                customer = {
                    "id": invitation["customer_id"],
                    "name": "Customer",
                    "contact": "Contact Person",
                    "email": invitation.get("email", "")
                }
            
            if not project:
                project = {
                    "id": invitation["project_id"],
                    "name": "Project",
                    "fairName": "Fair",
                    "city": "",
                    "country": "",
                    "deliveryDate": ""
                }
        
        # Get survey questions
        questions = await get_survey_questions()
        
        return {
            "survey_token": survey_token,
            "customer": customer,
            "project": project,
            "questions": questions,
            "status": "active",
            "is_arbitrary": invitation.get("is_arbitrary", False)
        }
        
    except Exception as e:
        logger.error(f"Error getting survey: {str(e)}")
        return {"error": str(e), "status": 500}

class SurveySubmissionRequest(BaseModel):
    responses: Dict
    ip_address: Optional[str] = None

@api_router.post("/surveys/{survey_token}/submit")
async def submit_survey_response(
    survey_token: str,
    request: SurveySubmissionRequest
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
            responses=request.responses,
            ip_address=request.ip_address
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
        
        # Enrich responses with customer names from invitations
        for response in responses:
            invitation = await db.survey_invitations.find_one({"survey_token": response.get("survey_token")})
            if invitation:
                if invitation.get("is_arbitrary"):
                    response["customer_name"] = invitation.get("company_name", "Anonim Müşteri")
                else:
                    response["customer_name"] = invitation.get("customer_name", "Müşteri")
            else:
                response["customer_name"] = "Bilinmeyen Müşteri"
        
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

# ===================== CUSTOMER CRUD ENDPOINTS =====================

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: dict):
    """Create a new customer"""
    try:
        # Convert dict to Customer model
        customer = Customer(**customer_data)
        customer_dict = customer.dict()
        
        # Insert to MongoDB
        await db.customers.insert_one(customer_dict)
        
        logger.info(f"Customer created: {customer.id}")
        return customer
        
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    """Get all customers"""
    try:
        customers = await db.customers.find().to_list(length=None)
        return [Customer(**customer) for customer in customers]
        
    except Exception as e:
        logger.error(f"Error getting customers: {str(e)}")
        return []

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    """Get a specific customer"""
    try:
        customer = await db.customers.find_one({"id": customer_id})
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        return Customer(**customer)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: dict):
    """Update a customer"""
    try:
        # Update in MongoDB
        result = await db.customers.update_one(
            {"id": customer_id},
            {"$set": customer_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        # Get updated customer
        updated_customer = await db.customers.find_one({"id": customer_id})
        return Customer(**updated_customer)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers/{customer_id}/can-delete")
async def check_customer_can_delete(customer_id: str):
    """Check if a customer can be deleted (no related records)"""
    try:
        # Customer must exist first
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        related_records = []
        
        # Check for related invoices (faturalar)
        invoices_count = await db.invoices.count_documents({"customer_id": customer_id})
        if invoices_count > 0:
            related_records.append(f"{invoices_count} Fatura")
        
        # Check for related quotes (teklifler) 
        quotes_count = await db.quotes.count_documents({"customer_id": customer_id})
        if quotes_count > 0:
            related_records.append(f"{quotes_count} Teklif")
        
        # Check for related opportunities (satış fırsatları)
        opportunities_count = await db.opportunities.count_documents({"customer_id": customer_id})
        if opportunities_count > 0:
            related_records.append(f"{opportunities_count} Satış Fırsatı")
        
        # Check for related projects (projeler)
        projects_count = await db.projects.count_documents({"customer_id": customer_id})
        if projects_count > 0:
            related_records.append(f"{projects_count} Proje")
        
        # Check for related survey invitations
        surveys_count = await db.survey_invitations.count_documents({"customer_id": customer_id})
        if surveys_count > 0:
            related_records.append(f"{surveys_count} Anket")
        
        # Check for related handovers (teslimler)
        handovers_count = await db.handovers.count_documents({"customer_id": customer_id})
        if handovers_count > 0:
            related_records.append(f"{handovers_count} Teslim")
            
        can_delete = len(related_records) == 0
        
        return {
            "canDelete": can_delete,
            "relatedRecords": related_records,
            "message": "Müşteri silinebilir" if can_delete else "Müşteriyle ilişkili kayıtlar bulunduğu için silinemez"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking if customer {customer_id} can be deleted: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    """Delete a customer (only if no related records exist)"""
    try:
        # First check if customer can be deleted
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Check for related records
        related_records = []
        
        # Check for related invoices
        invoices_count = await db.invoices.count_documents({"customer_id": customer_id})
        if invoices_count > 0:
            related_records.append(f"{invoices_count} Fatura")
        
        # Check for related quotes
        quotes_count = await db.quotes.count_documents({"customer_id": customer_id})
        if quotes_count > 0:
            related_records.append(f"{quotes_count} Teklif")
        
        # Check for related opportunities
        opportunities_count = await db.opportunities.count_documents({"customer_id": customer_id})
        if opportunities_count > 0:
            related_records.append(f"{opportunities_count} Satış Fırsatı")
        
        # Check for related projects
        projects_count = await db.projects.count_documents({"customer_id": customer_id})
        if projects_count > 0:
            related_records.append(f"{projects_count} Proje")
        
        # Check for related surveys
        surveys_count = await db.survey_invitations.count_documents({"customer_id": customer_id})
        if surveys_count > 0:
            related_records.append(f"{surveys_count} Anket")
        
        # Check for related handovers
        handovers_count = await db.handovers.count_documents({"customer_id": customer_id})
        if handovers_count > 0:
            related_records.append(f"{handovers_count} Teslim")
        
        # If there are related records, prevent deletion
        if related_records:
            raise HTTPException(
                status_code=400, 
                detail=f"Müşteri silinemez. İlişkili kayıtlar: {', '.join(related_records)}"
            )
        
        # No related records, safe to delete
        result = await db.customers.delete_one({"id": customer_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        return {
            "success": True, 
            "message": f"Müşteri '{customer.get('companyName', customer_id)}' başarıyla silindi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Geographic API Endpoints (Removed - using newer endpoint at line 4117)

@api_router.get("/geo/countries/{iso2}/cities")
async def get_cities_by_country(
    iso2: str,
    query: str = "",
    limit: int = 50,
    page: int = 1
):
    """Get cities by country with optional search, pagination"""
    try:
        # Validate ISO2 code
        country = await db.countries.find_one({"iso2": iso2.upper()})
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        # Create search filter
        search_filter = {"country_iso2": iso2.upper()}
        if query:
            # Support fuzzy search with accent tolerance for city names
            query_regex = query.replace("i", "[iıİI]").replace("u", "[uüUÜ]").replace("o", "[oöOÖ]").replace("c", "[cçCÇ]").replace("s", "[sşSŞ]").replace("g", "[gğGĞ]")
            search_filter["name"] = {"$regex": query_regex, "$options": "i"}
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get cities with pagination
        cities = await db.cities.find(search_filter)\
            .sort([("is_capital", -1), ("population", -1), ("name", 1)])\
            .skip(skip)\
            .limit(limit)\
            .to_list(length=limit)
        
        # Get total count for pagination info
        total_count = await db.cities.count_documents(search_filter)
        
        return {
            "cities": [City(**city) for city in cities],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": (total_count + limit - 1) // limit,
                "has_next": skip + len(cities) < total_count,
                "has_prev": page > 1
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cities for country {iso2}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Products/Services API Endpoints
@api_router.get("/products")
async def get_products(category: str = None, search: str = None, active_only: bool = True):
    """Get products/services with optional filtering"""
    try:
        # Create filter
        filter_query = {}
        if active_only:
            filter_query["is_active"] = True
        if category:
            filter_query["category"] = category
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"name_en": {"$regex": search, "$options": "i"}}
            ]
        
        # Get products
        products = await db.products.find(filter_query)\
            .sort([("category", 1), ("name", 1)])\
            .to_list(length=None)
        
        return [Product(**product) for product in products]
        
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/products")
async def create_product(product: Product):
    """Create a new product/service"""
    try:
        # Check if product already exists
        existing = await db.products.find_one({"name": product.name})
        if existing:
            raise HTTPException(status_code=400, detail="Product with this name already exists")
        
        product_dict = product.dict()
        result = await db.products.insert_one(product_dict)
        
        if result.inserted_id:
            return {"success": True, "message": "Product created successfully", "product": product}
        else:
            raise HTTPException(status_code=500, detail="Failed to create product")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a specific product"""
    try:
        product = await db.products.find_one({"id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return Product(**product)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: Product):
    """Update a product"""
    try:
        # Update product
        product_dict = product.dict()
        product_dict.pop("id", None)  # Remove ID from update data
        
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": product_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"success": True, "message": "Product updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete (deactivate) a product"""
    try:
        # Soft delete - just mark as inactive
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": {"is_active": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"success": True, "message": "Product deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== INVOICE ENDPOINTS =====================

@api_router.get("/invoices/next-number/{currency}")
async def get_next_invoice_number(currency: str):
    """Get the next invoice number for a specific currency"""
    try:
        # Get current date
        now = datetime.now()
        current_month = f"{now.month:02d}"
        current_year = str(now.year)
        
        # Currency prefix mapping
        currency_prefixes = {
            "USD": "USD",
            "EUR": "EURU", 
            "GBP": "GBP",
            "TRY": "TL",
            "AED": "AED"
        }
        
        currency_prefix = currency_prefixes.get(currency, currency)
        
        # Create the pattern for current month/year
        pattern_prefix = f"{currency_prefix}-{current_month}{current_year}"
        
        # Find the highest invoice number for this currency/month/year combination
        regex_pattern = f"^{currency_prefix}-{current_month}{current_year}(\d{{6}})$"
        
        invoices = await db.invoices.find({
            "invoice_number": {"$regex": regex_pattern}
        }).to_list(1000)
        
        logger.info(f"Found {len(invoices)} invoices matching pattern {regex_pattern}")
        
        # Find the highest sequence number
        max_sequence = 0
        for invoice in invoices:
            # Extract the sequence number (last 6 digits)
            match = re.search(r'(\d{6})$', invoice["invoice_number"])
            if match:
                sequence = int(match.group(1))
                max_sequence = max(max_sequence, sequence)
                logger.info(f"Found invoice {invoice['invoice_number']} with sequence {sequence}")
        
        # Generate next number
        next_sequence = max_sequence + 1
        next_invoice_number = f"{pattern_prefix}{next_sequence:06d}"
        
        logger.info(f"Generated next invoice number: {next_invoice_number}")
        
        return {
            "next_invoice_number": next_invoice_number,
            "currency": currency,
            "month": current_month,
            "year": current_year,
            "sequence": next_sequence,
            "pattern": pattern_prefix
        }
        
    except Exception as e:
        logger.error(f"Error generating next invoice number: {str(e)}")
        # Fallback - generate first number for this month/year
        now = datetime.now()
        current_month = f"{now.month:02d}"
        current_year = str(now.year)
        currency_prefixes = {
            "USD": "USD",
            "EUR": "EURU", 
            "GBP": "GBP",
            "TRY": "TL",
            "AED": "AED"
        }
        currency_prefix = currency_prefixes.get(currency, currency)
        fallback_number = f"{currency_prefix}-{current_month}{current_year}100001"
        
        return {
            "next_invoice_number": fallback_number,
            "currency": currency,
            "month": current_month,
            "year": current_year,
            "sequence": 1,
            "pattern": f"{currency_prefix}-{current_month}{current_year}"
        }

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_input: InvoiceCreate):
    """Create a new invoice"""
    try:
        logger.info(f"Received invoice creation request: {invoice_input.invoice_number}")
        
        # Validate required fields
        if not invoice_input.invoice_number or not invoice_input.invoice_number.strip():
            raise HTTPException(status_code=400, detail="Fatura numarası zorunludur")
        
        if not invoice_input.date:
            raise HTTPException(status_code=400, detail="Fatura tarihi zorunludur")
        
        if not invoice_input.currency:
            raise HTTPException(status_code=400, detail="Para birimi zorunludur")
            
        if not invoice_input.items or len(invoice_input.items) == 0:
            raise HTTPException(status_code=400, detail="En az bir ürün/hizmet eklenmelidir")
        
        # Check for duplicate invoice number
        existing_invoice = await db.invoices.find_one({"invoice_number": invoice_input.invoice_number})
        if existing_invoice:
            raise HTTPException(status_code=400, detail=f"Bu fatura numarası zaten kullanılmış: {invoice_input.invoice_number}")
        
        invoice_dict = invoice_input.dict()
        logger.info(f"Creating invoice object with data: {invoice_dict}")
        
        invoice_obj = Invoice(**invoice_dict)
        
        # Insert to MongoDB
        logger.info("Inserting invoice to database...")
        result = await db.invoices.insert_one(invoice_obj.dict())
        
        if result.inserted_id:
            logger.info(f"Invoice created successfully: {invoice_obj.invoice_number} with ID: {result.inserted_id}")
            return invoice_obj
        else:
            logger.error("Failed to insert invoice to database - no inserted_id returned")
            raise HTTPException(status_code=500, detail="Veritabanına kaydetme başarısız")
            
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating invoice: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Fatura kaydedilirken beklenmeyen hata: {str(e)}")

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    """Get all invoices"""
    try:
        invoices = await db.invoices.find().to_list(1000)
        return [Invoice(**invoice) for invoice in invoices]
    except Exception as e:
        logger.error(f"Error getting invoices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting invoices: {str(e)}")

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    """Get a specific invoice"""
    try:
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return Invoice(**invoice)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/invoices/{invoice_id}")
async def update_invoice_status(invoice_id: str, status: str):
    """Update invoice status"""
    try:
        # Update invoice status
        result = await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"success": True, "message": f"Invoice status updated to {status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/invoices/status/{status}")
async def get_invoices_by_status(status: str):
    """Get invoices by status"""
    try:
        invoices = await db.invoices.find({"status": status}).to_list(1000)
        return [Invoice(**invoice) for invoice in invoices]
    except Exception as e:
        logger.error(f"Error getting invoices by status {status}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== END CUSTOMER ENDPOINTS =====================

# ===================== BANK ENDPOINTS =====================

@api_router.post("/banks", response_model=Bank)
async def create_bank(bank_input: BankCreate):
    """Create a new bank"""
    try:
        logger.info(f"Creating bank: {bank_input.bank_name} in {bank_input.country}")
        
        # Validate required fields based on country
        if bank_input.country in ["Turkey", "UAE"]:
            if not bank_input.swift_code or not bank_input.iban:
                raise HTTPException(status_code=400, detail="SWIFT code and IBAN are required for Turkey/UAE banks")
        elif bank_input.country == "USA":
            if not bank_input.routing_number or not bank_input.us_account_number:
                raise HTTPException(status_code=400, detail="Routing number and account number are required for USA banks")
        
        bank_dict = bank_input.dict()
        bank_obj = Bank(**bank_dict)
        
        # Insert to MongoDB
        result = await db.banks.insert_one(bank_obj.dict())
        
        if result.inserted_id:
            logger.info(f"Bank created successfully: {bank_obj.bank_name}")
            return bank_obj
        else:
            logger.error("Failed to insert bank to database")
            raise HTTPException(status_code=500, detail="Failed to create bank")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bank: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating bank: {str(e)}")

@api_router.get("/banks", response_model=List[Bank])
async def get_banks():
    """Get all banks grouped by country"""
    try:
        banks = await db.banks.find({"is_active": True}).to_list(1000)
        return [Bank(**bank) for bank in banks]
    except Exception as e:
        logger.error(f"Error getting banks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting banks: {str(e)}")

@api_router.get("/banks/{bank_id}", response_model=Bank)
async def get_bank(bank_id: str):
    """Get a specific bank"""
    try:
        bank = await db.banks.find_one({"id": bank_id, "is_active": True})
        if not bank:
            raise HTTPException(status_code=404, detail="Bank not found")
        
        return Bank(**bank)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bank {bank_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/banks/{bank_id}", response_model=Bank)
async def update_bank(bank_id: str, bank_update: BankUpdate):
    """Update a bank"""
    try:
        # Get existing bank
        existing_bank = await db.banks.find_one({"id": bank_id, "is_active": True})
        if not existing_bank:
            raise HTTPException(status_code=404, detail="Bank not found")
        
        # Update fields
        update_data = {k: v for k, v in bank_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Validate updated data based on country
        country = update_data.get("country", existing_bank.get("country"))
        if country in ["Turkey", "UAE"]:
            swift_code = update_data.get("swift_code", existing_bank.get("swift_code"))
            iban = update_data.get("iban", existing_bank.get("iban"))
            if not swift_code or not iban:
                raise HTTPException(status_code=400, detail="SWIFT code and IBAN are required for Turkey/UAE banks")
        elif country == "USA":
            routing_number = update_data.get("routing_number", existing_bank.get("routing_number"))
            us_account_number = update_data.get("us_account_number", existing_bank.get("us_account_number"))
            if not routing_number or not us_account_number:
                raise HTTPException(status_code=400, detail="Routing number and account number are required for USA banks")
        
        # Update in database
        result = await db.banks.update_one(
            {"id": bank_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bank not found")
        
        # Return updated bank
        updated_bank = await db.banks.find_one({"id": bank_id})
        return Bank(**updated_bank)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating bank {bank_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/banks/{bank_id}")
async def delete_bank(bank_id: str):
    """Delete (deactivate) a bank"""
    try:
        # Soft delete by setting is_active to False
        result = await db.banks.update_one(
            {"id": bank_id},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bank not found")
        
        return {"success": True, "message": "Bank deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bank {bank_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== COUNTRY ENDPOINTS =====================

@api_router.get("/countries")
async def get_countries():
    """Get all countries"""
    try:
        countries = await db.countries.find().to_list(1000)
        # Add default countries if none exist
        if not countries:
            default_countries = [
                {"code": "Turkey", "name": "Türkiye", "flag": "🇹🇷"},
                {"code": "UAE", "name": "BAE", "flag": "🇦🇪"},
                {"code": "USA", "name": "ABD", "flag": "🇺🇸"}
            ]
            for country in default_countries:
                await db.countries.insert_one(country)
            countries = await db.countries.find().to_list(1000)
        
        return countries
    except Exception as e:
        logger.error(f"Error getting countries: {str(e)}")
        return [
            {"code": "Turkey", "name": "Türkiye", "flag": "🇹🇷"},
            {"code": "UAE", "name": "BAE", "flag": "🇦🇪"},
            {"code": "USA", "name": "ABD", "flag": "🇺🇸"}
        ]

@api_router.post("/countries")
async def add_country(country_data: dict):
    """Add a new country"""
    try:
        country_name = country_data.get("country_name", "").strip()
        
        if not country_name:
            raise HTTPException(status_code=400, detail="Ülke adı gereklidir")
        
        # Generate country code from name
        country_code = country_name.replace(' ', '_').upper()
        
        # Check if country already exists
        existing = await db.countries.find_one({"$or": [{"code": country_code}, {"name": country_name}]})
        if existing:
            raise HTTPException(status_code=400, detail="Bu ülke zaten mevcut")
        
        # Add country
        new_country = {
            "code": country_code,
            "name": country_name,
            "flag": "🌍"  # Default flag
        }
        
        result = await db.countries.insert_one(new_country)
        
        if result.inserted_id:
            logger.info(f"Country added successfully: {country_name}")
            return new_country
        else:
            raise HTTPException(status_code=500, detail="Ülke eklenemedi")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding country: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding country: {str(e)}")

# ===================== SUPPLIER MANAGEMENT MODELS =====================

class SupplierCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Tedarikçi, Usta, 3D Tasarımcı, Grafik Tasarımcı, Yazılımcı, Partner
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupplierSpecialty(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str  # Which SupplierCategory this belongs to
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_short_name: str
    company_title: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    tax_office: Optional[str] = ""
    tax_number: Optional[str] = ""
    services: List[str] = []  # Array of service tags (etiket sistemi)
    supplier_type_id: str  # Reference to SupplierCategory
    specialty_id: str  # Reference to SupplierSpecialty
    specialty: Optional[str] = "Belirtilmemiş"  # Populated specialty name from SupplierSpecialty
    # Bank/Payment Information
    iban: Optional[str] = ""
    bank_name: Optional[str] = ""
    bank_branch: Optional[str] = ""
    account_holder_name: Optional[str] = ""
    swift_code: Optional[str] = ""
    country: Optional[str] = ""
    city: Optional[str] = ""
    # USA Bank Information
    routing_number: Optional[str] = ""
    us_account_number: Optional[str] = ""
    bank_address: Optional[str] = ""
    status: str = "active"  # active, passive, blacklist
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupplierContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str  # Reference to Supplier
    full_name: str
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    position: Optional[str] = ""  # Görevi
    tags: List[str] = []  # Array of tags (etiket sistemi)
    notes: Optional[str] = ""  # Additional notes
    address: Optional[str] = ""  # Contact address
    country: Optional[str] = ""  # Contact country  
    city: Optional[str] = ""  # Contact city
    unique_url_key: str = Field(default_factory=lambda: str(uuid.uuid4()).replace('-', ''))  # For unique page URL
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupplierPhone(BaseModel):
    phone: str

# Create/Update Models for API
class SupplierCategoryCreate(BaseModel):
    name: str

class SupplierSpecialtyCreate(BaseModel):
    name: str
    category_id: str

class SupplierCreate(BaseModel):
    company_short_name: str
    company_title: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    tax_office: Optional[str] = ""
    tax_number: Optional[str] = ""
    services: List[str] = []
    supplier_type_id: str
    specialty_id: str
    # Bank/Payment Information
    iban: Optional[str] = ""
    bank_name: Optional[str] = ""
    bank_branch: Optional[str] = ""
    account_holder_name: Optional[str] = ""
    swift_code: Optional[str] = ""
    country: Optional[str] = ""
    city: Optional[str] = ""
    # USA Bank Information
    routing_number: Optional[str] = ""
    us_account_number: Optional[str] = ""
    bank_address: Optional[str] = ""

class SupplierContactCreate(BaseModel):
    supplier_id: str
    full_name: str
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    position: Optional[str] = ""
    tags: List[str] = []
    notes: Optional[str] = ""
    address: Optional[str] = ""
    country: Optional[str] = ""
    city: Optional[str] = ""

class SupplierUpdate(BaseModel):
    company_short_name: Optional[str] = None
    company_title: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    tax_office: Optional[str] = None
    tax_number: Optional[str] = None
    services: Optional[List[str]] = None
    supplier_type_id: Optional[str] = None
    specialty_id: Optional[str] = None
    # Bank/Payment Information
    iban: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    account_holder_name: Optional[str] = None
    swift_code: Optional[str] = None
    country: Optional[str] = None
    # USA Bank Information
    routing_number: Optional[str] = None
    us_account_number: Optional[str] = None
    bank_address: Optional[str] = None
    status: Optional[str] = None

class SupplierContactUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    is_active: Optional[bool] = None

# ===================== SUPPLIER MANAGEMENT ENDPOINTS =====================

# Supplier Categories (Tedarikçi Türü) Endpoints
@api_router.get("/supplier-categories", response_model=List[SupplierCategory])
async def get_supplier_categories():
    """Get all supplier categories"""
    try:
        categories = await db.supplier_categories.find({"is_active": True}).to_list(1000)
        if not categories:
            # Seed default categories if none exist
            default_categories = [
                {"name": "Tedarikçi"},
                {"name": "Usta"},
                {"name": "3D Tasarımcı"},
                {"name": "Grafik Tasarımcı"},
                {"name": "Yazılımcı"},
                {"name": "Partner"}
            ]
            for cat_data in default_categories:
                category = SupplierCategory(**cat_data)
                await db.supplier_categories.insert_one(category.dict())
            
            categories = await db.supplier_categories.find({"is_active": True}).to_list(1000)
        
        return [SupplierCategory(**category) for category in categories]
    except Exception as e:
        logger.error(f"Error getting supplier categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/supplier-categories", response_model=SupplierCategory)
async def create_supplier_category(category_data: SupplierCategoryCreate):
    """Create a new supplier category"""
    try:
        # Check if category already exists
        existing = await db.supplier_categories.find_one({"name": category_data.name, "is_active": True})
        if existing:
            raise HTTPException(status_code=400, detail="Bu kategori zaten mevcut")
        
        category = SupplierCategory(**category_data.dict())
        await db.supplier_categories.insert_one(category.dict())
        
        logger.info(f"Supplier category created: {category.name}")
        return category
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Supplier Specialties (Uzmanlık Alanı) Endpoints
@api_router.get("/supplier-specialties/{category_id}", response_model=List[SupplierSpecialty])
async def get_supplier_specialties(category_id: str):
    """Get specialties for a specific category"""
    try:
        specialties = await db.supplier_specialties.find({
            "category_id": category_id, 
            "is_active": True
        }).to_list(1000)
        
        if not specialties:
            # Seed default specialties based on category
            category = await db.supplier_categories.find_one({"id": category_id})
            if category:
                default_specialties = await get_default_specialties_for_category(category["name"])
                for spec_data in default_specialties:
                    spec_data["category_id"] = category_id
                    specialty = SupplierSpecialty(**spec_data)
                    await db.supplier_specialties.insert_one(specialty.dict())
                
                specialties = await db.supplier_specialties.find({
                    "category_id": category_id, 
                    "is_active": True
                }).to_list(1000)
        
        return [SupplierSpecialty(**specialty) for specialty in specialties]
    except Exception as e:
        logger.error(f"Error getting supplier specialties: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/supplier-specialties", response_model=SupplierSpecialty)
async def create_supplier_specialty(specialty_data: SupplierSpecialtyCreate):
    """Create a new supplier specialty"""
    try:
        # Check if specialty already exists in this category
        existing = await db.supplier_specialties.find_one({
            "name": specialty_data.name, 
            "category_id": specialty_data.category_id,
            "is_active": True
        })
        if existing:
            raise HTTPException(status_code=400, detail="Bu uzmanlık alanı zaten mevcut")
        
        specialty = SupplierSpecialty(**specialty_data.dict())
        await db.supplier_specialties.insert_one(specialty.dict())
        
        logger.info(f"Supplier specialty created: {specialty.name}")
        return specialty
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier specialty: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function for default specialties
async def get_default_specialties_for_category(category_name: str):
    """Get default specialties based on category name"""
    specialties_map = {
        "Tedarikçi": [
            {"name": "Lojistik Şirketi"},
            {"name": "Ahşap Atölyesi"},
            {"name": "Reklam Atölyesi"},
            {"name": "Baskı Atölyesi"},
            {"name": "Demir Atölyesi"}
        ],
        "Usta": [
            {"name": "Usta Marangoz"},
            {"name": "Marangoz"},
            {"name": "Çırak Marangoz"},
            {"name": "Usta Elektrikçi"},
            {"name": "Elektrikçi"},
            {"name": "Çırak Elektrikçi"},
            {"name": "Reklam + Elektrik bilen usta"},
            {"name": "Elektrik bilen usta"},
            {"name": "Reklam bilen usta"}
        ],
        "3D Tasarımcı": [
            {"name": "Deneyimli 3D Tasarımcı"},
            {"name": "3D Tasarımcı"}
        ],
        "Grafik Tasarımcı": [
            {"name": "Deneyimli Grafik Tasarımcı"},
            {"name": "Grafik Tasarımcı"}
        ],
        "Yazılımcı": [
            {"name": "Deneyimli Yazılımcı"},
            {"name": "Yazılımcı"}
        ],
        "Partner": [
            {"name": "Hindistan"},
            {"name": "Almanya"},
            {"name": "Fransa"},
            {"name": "Malezya"},
            {"name": "Singapur"}
        ]
    }
    
    return specialties_map.get(category_name, [])

# Supplier CRUD Endpoints
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier_data: SupplierCreate):
    """Create a new supplier"""
    try:
        # Validate that category and specialty exist
        category = await db.supplier_categories.find_one({"id": supplier_data.supplier_type_id, "is_active": True})
        if not category:
            raise HTTPException(status_code=400, detail="Geçersiz tedarikçi türü")
        
        specialty = await db.supplier_specialties.find_one({"id": supplier_data.specialty_id, "is_active": True})
        if not specialty:
            raise HTTPException(status_code=400, detail="Geçersiz uzmanlık alanı")
        
        # Check if supplier already exists with same name
        existing = await db.suppliers.find_one({"company_short_name": supplier_data.company_short_name})
        if existing:
            raise HTTPException(status_code=400, detail="Bu firma adıyla tedarikçi zaten mevcut")
        
        supplier = Supplier(**supplier_data.dict())
        await db.suppliers.insert_one(supplier.dict())
        
        logger.info(f"Supplier created: {supplier.company_short_name}")
        return supplier
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    """Get all suppliers with specialty names"""
    try:
        suppliers = await db.suppliers.find().to_list(1000)
        # Add specialty names to suppliers
        for supplier in suppliers:
            if supplier.get('specialty_id'):
                specialty = await db.supplier_specialties.find_one({"id": supplier['specialty_id']})
                if specialty:
                    supplier['specialty'] = specialty['name']
                else:
                    supplier['specialty'] = 'Belirtilmemiş'
            else:
                supplier['specialty'] = 'Belirtilmemiş'
        return [Supplier(**supplier) for supplier in suppliers]
    except Exception as e:
        logger.error(f"Error getting suppliers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str):
    """Get a specific supplier with specialty name"""
    try:
        supplier = await db.suppliers.find_one({"id": supplier_id})
        if not supplier:
            raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
        
        # Add specialty name
        if supplier.get('specialty_id'):
            specialty = await db.supplier_specialties.find_one({"id": supplier['specialty_id']})
            if specialty:
                supplier['specialty'] = specialty['name']
            else:
                supplier['specialty'] = 'Belirtilmemiş'
        else:
            supplier['specialty'] = 'Belirtilmemiş'
            
        return Supplier(**supplier)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting supplier {supplier_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier_data: SupplierUpdate):
    """Update a supplier"""
    try:
        # Check if supplier exists
        existing = await db.suppliers.find_one({"id": supplier_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
        
        # Update fields
        update_data = {k: v for k, v in supplier_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.suppliers.update_one(
            {"id": supplier_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
        
        # Return updated supplier
        updated_supplier = await db.suppliers.find_one({"id": supplier_id})
        return Supplier(**updated_supplier)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating supplier {supplier_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str):
    """Delete or deactivate a supplier based on related records"""
    try:
        # Check if supplier exists
        supplier = await db.suppliers.find_one({"id": supplier_id})
        if not supplier:
            raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
        
        # Check for related records (invoices, projects, etc.)
        # For now, we'll just check contacts
        contacts_count = await db.supplier_contacts.count_documents({"supplier_id": supplier_id, "is_active": True})
        
        if contacts_count > 0:
            # Has related records - set to passive instead of delete
            await db.suppliers.update_one(
                {"id": supplier_id},
                {"$set": {"status": "passive", "updated_at": datetime.now(timezone.utc)}}
            )
            return {"success": True, "message": "Tedarikçi pasif duruma alındı (ilişkili kayıtlar bulunduğu için silinemedi)"}
        else:
            # No related records - safe to delete
            await db.suppliers.delete_one({"id": supplier_id})
            return {"success": True, "message": "Tedarikçi başarıyla silindi"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting supplier {supplier_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Supplier Contact CRUD Endpoints
@api_router.post("/supplier-contacts", response_model=SupplierContact)
async def create_supplier_contact(contact_data: SupplierContactCreate):
    """Create a new supplier contact"""
    try:
        # Validate that supplier exists
        supplier = await db.suppliers.find_one({"id": contact_data.supplier_id})
        if not supplier:
            raise HTTPException(status_code=400, detail="Geçersiz tedarikçi ID")
        
        contact = SupplierContact(**contact_data.dict())
        await db.supplier_contacts.insert_one(contact.dict())
        
        logger.info(f"Supplier contact created: {contact.full_name} for supplier {contact.supplier_id}")
        return contact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating supplier contact: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/supplier-contacts/{supplier_id}", response_model=List[SupplierContact])
async def get_supplier_contacts(supplier_id: str):
    """Get all contacts for a specific supplier"""
    try:
        contacts = await db.supplier_contacts.find({
            "supplier_id": supplier_id, 
            "is_active": True
        }).to_list(1000)
        return [SupplierContact(**contact) for contact in contacts]
    except Exception as e:
        logger.error(f"Error getting supplier contacts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/supplier-contacts/{contact_id}", response_model=SupplierContact)
async def update_supplier_contact(contact_id: str, contact_data: SupplierContactUpdate):
    """Update a supplier contact"""
    try:
        # Update fields
        update_data = {k: v for k, v in contact_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.supplier_contacts.update_one(
            {"id": contact_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Yetkili kişi bulunamadı")
        
        # Return updated contact
        updated_contact = await db.supplier_contacts.find_one({"id": contact_id})
        return SupplierContact(**updated_contact)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating supplier contact {contact_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/supplier-contacts/{contact_id}")
async def delete_supplier_contact(contact_id: str):
    """Deactivate a supplier contact"""
    try:
        result = await db.supplier_contacts.update_one(
            {"id": contact_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Yetkili kişi bulunamadı")
        
        return {"success": True, "message": "Yetkili kişi başarıyla silindi"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting supplier contact {contact_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== BANK EMAIL ENDPOINTS =====================

class BankEmailRequest(BaseModel):
    to: str
    cc: Optional[str] = ""
    bcc: Optional[str] = ""
    subject: str
    body: str
    from_name: str
    from_email: str
    to_name: str
    banks: List[Dict]
    mode: str  # 'single' or 'group'
    attachments: Optional[List[Dict]] = []

@api_router.post("/send-bank-email")
async def send_bank_email(request: BankEmailRequest):
    """Send bank details via email using SendGrid"""
    try:
        result = email_service.send_user_email(
            to_email=request.to,
            to_name=request.to_name,
            from_email=request.from_email,
            from_name=request.from_name,
            subject=request.subject,
            body=request.body,
            cc=request.cc,
            bcc=request.bcc,
            attachments=request.attachments
        )
        
        # Save email to bank_emails collection for tracking
        email_record = {
            "id": str(uuid.uuid4()),
            "from": request.from_email,
            "from_name": request.from_name,
            "to": request.to,
            "to_name": request.to_name,
            "cc": request.cc,
            "bcc": request.bcc,
            "subject": request.subject,
            "body": request.body,
            "banks": request.banks,
            "mode": request.mode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "sent" if result.get("success") else "failed",
            "attachments": len(request.attachments) if request.attachments else 0,
            "sendgrid_message_id": result.get("message_id")
        }
        
        await db.bank_emails.insert_one(email_record)
        
        return result
    except Exception as e:
        logger.error(f"Error sending bank email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# ===================== EXPENSE RECEIPT MODELS =====================

class ExpenseReceipt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    receipt_number: str  # USD-GM-012025100001 format
    date: date
    currency: str  # USD, EUR, GBP, TRY, AED
    supplier_id: str  # Reference to supplier
    supplier_name: str  # Cached for performance
    supplier_phone: Optional[str] = ""
    supplier_iban: Optional[str] = ""
    supplier_bank_name: Optional[str] = ""
    supplier_country: Optional[str] = ""
    # USA bank fields
    is_usa_bank: Optional[bool] = False
    supplier_routing_number: Optional[str] = ""
    supplier_us_account_number: Optional[str] = ""
    supplier_bank_address: Optional[str] = ""
    sender_bank_id: Optional[str] = ""  # Reference to user's bank
    sender_bank_name: Optional[str] = ""
    amount: float
    description: str
    status: str = "pending"  # pending, approved, paid
    approval_link: Optional[str] = ""  # Unique link for supplier approval
    signature_data: Optional[str] = ""  # Base64 signature when approved
    signer_name: Optional[str] = ""  # Name of the person who signed
    signer_title: Optional[str] = ""  # Title/position of signer
    signer_company: Optional[str] = ""  # Company of signer
    signed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_by: str  # User who created the receipt
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseReceiptCreate(BaseModel):
    date: date
    currency: str
    supplier_id: str
    sender_bank_id: Optional[str] = None
    amount: float
    description: str
    # USA bank fields
    is_usa_bank: Optional[bool] = False
    supplier_routing_number: Optional[str] = ""
    supplier_us_account_number: Optional[str] = ""
    supplier_bank_address: Optional[str] = ""

class ExpenseReceiptUpdate(BaseModel):
    date: Optional[date] = None
    currency: Optional[str] = None
    supplier_id: Optional[str] = None
    sender_bank_id: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None
    signature_data: Optional[str] = None
    # USA bank fields
    is_usa_bank: Optional[bool] = None
    supplier_routing_number: Optional[str] = None
    supplier_us_account_number: Optional[str] = None
    supplier_bank_address: Optional[str] = None

# ===================== CONTACT REGISTRATION ENDPOINTS =====================

@api_router.get("/contact-registration/{registration_key}")
async def get_contact_by_registration_key(registration_key: str):
    """Get contact and supplier info by registration key"""
    try:
        # Find contact by registration key
        contact = await db.supplier_contacts.find_one({"unique_url_key": registration_key, "is_active": True})
        
        if not contact:
            raise HTTPException(status_code=404, detail="Kayıt linki bulunamadı veya geçersiz")
        
        # Get supplier info
        supplier = await db.suppliers.find_one({"id": contact["supplier_id"]})
        
        if not supplier:
            raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
        
        return {
            "contact": SupplierContact(**contact),
            "supplier": Supplier(**supplier)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contact by registration key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/contact-registration/{registration_key}")
async def update_contact_by_registration_key(registration_key: str, contact_data: SupplierContactUpdate):
    """Update contact via registration key"""
    try:
        # Find contact by registration key
        existing_contact = await db.supplier_contacts.find_one({"unique_url_key": registration_key, "is_active": True})
        
        if not existing_contact:
            raise HTTPException(status_code=404, detail="Kayıt linki bulunamadı veya geçersiz")
        
        # Update fields
        update_data = {k: v for k, v in contact_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.supplier_contacts.update_one(
            {"unique_url_key": registration_key},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Kayıt güncellenemedi")
        
        # Return updated contact
        updated_contact = await db.supplier_contacts.find_one({"unique_url_key": registration_key})
        return SupplierContact(**updated_contact)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact by registration key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== EXPENSE RECEIPT ENDPOINTS =====================

def generate_expense_receipt_number(currency: str) -> str:
    """Generate expense receipt number: USD-GM-012025100001"""
    now = datetime.now(timezone.utc)
    month_year = now.strftime("%m%Y")
    
    # Get the current sequence number for this month/year
    # This is a simplified version - in production, you'd want atomic counters
    import random
    sequence = random.randint(100001, 999999)  # Temporary - implement proper sequence
    
    return f"{currency}-GM-{month_year}{sequence}"

@api_router.post("/expense-receipts", response_model=ExpenseReceipt)
async def create_expense_receipt(receipt_data: ExpenseReceiptCreate):
    """Create new expense receipt"""
    try:
        # Get supplier information
        supplier = await db.suppliers.find_one({"id": receipt_data.supplier_id})
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Get sender bank info if provided
        sender_bank_name = ""
        if receipt_data.sender_bank_id:
            bank = await db.banks.find_one({"id": receipt_data.sender_bank_id})
            if bank:
                sender_bank_name = bank.get("bank_name", "")
        
        # Generate receipt number
        receipt_number = generate_expense_receipt_number(receipt_data.currency)
        
        # Generate approval link
        approval_key = str(uuid.uuid4()).replace('-', '')
        approval_link = f"/expense-receipt-approval/{approval_key}"
        
        # Create expense receipt
        expense_receipt = ExpenseReceipt(
            receipt_number=receipt_number,
            date=receipt_data.date,
            currency=receipt_data.currency,
            supplier_id=receipt_data.supplier_id,
            supplier_name=supplier.get("company_short_name", ""),
            supplier_phone=supplier.get("phone", ""),
            supplier_iban=supplier.get("iban", "") if not receipt_data.is_usa_bank else "",
            supplier_bank_name=supplier.get("bank_name", ""),
            supplier_country=supplier.get("country", ""),
            # USA bank fields
            is_usa_bank=receipt_data.is_usa_bank,
            supplier_routing_number=receipt_data.supplier_routing_number if receipt_data.is_usa_bank else "",
            supplier_us_account_number=receipt_data.supplier_us_account_number if receipt_data.is_usa_bank else "",
            supplier_bank_address=receipt_data.supplier_bank_address if receipt_data.is_usa_bank else "",
            sender_bank_id=receipt_data.sender_bank_id,
            sender_bank_name=sender_bank_name,
            amount=receipt_data.amount,
            description=receipt_data.description,
            approval_link=approval_key,
            created_by="current_user"  # TODO: Get from auth context
        )
        
        # Save to database
        receipt_dict = expense_receipt.dict()
        receipt_dict['date'] = receipt_dict['date'].isoformat()
        await db.expense_receipts.insert_one(receipt_dict)
        
        # Send approval email to supplier
        await send_expense_receipt_approval_email(expense_receipt, approval_key)
        
        return expense_receipt
    except Exception as e:
        logger.error(f"Error creating expense receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expense-receipts", response_model=List[ExpenseReceipt])
async def get_expense_receipts(status: Optional[str] = None):
    """Get expense receipts, optionally filtered by status"""
    try:
        query = {}
        if status:
            query["status"] = status
            
        receipts = await db.expense_receipts.find(query).to_list(length=None)
        
        # Parse dates
        for receipt in receipts:
            if isinstance(receipt.get('date'), str):
                receipt['date'] = datetime.fromisoformat(receipt['date']).date()
        
        return [ExpenseReceipt(**receipt) for receipt in receipts]
    except Exception as e:
        logger.error(f"Error getting expense receipts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expense-receipts/{receipt_id}", response_model=ExpenseReceipt)
async def get_expense_receipt(receipt_id: str):
    """Get expense receipt by ID"""
    try:
        receipt = await db.expense_receipts.find_one({"id": receipt_id})
        if not receipt:
            raise HTTPException(status_code=404, detail="Expense receipt not found")
            
        # Parse date
        if isinstance(receipt.get('date'), str):
            receipt['date'] = datetime.fromisoformat(receipt['date']).date()
            
        return ExpenseReceipt(**receipt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting expense receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/expense-receipts/{receipt_id}", response_model=ExpenseReceipt)
async def update_expense_receipt(receipt_id: str, receipt_data: ExpenseReceiptUpdate):
    """Update expense receipt"""
    try:
        # Check if receipt exists
        existing_receipt = await db.expense_receipts.find_one({"id": receipt_id})
        if not existing_receipt:
            raise HTTPException(status_code=404, detail="Expense receipt not found")
        
        # Update fields
        update_data = {k: v for k, v in receipt_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Convert date to string if provided
        if 'date' in update_data:
            update_data['date'] = update_data['date'].isoformat()
        
        result = await db.expense_receipts.update_one(
            {"id": receipt_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Expense receipt not found")
        
        # Return updated receipt
        updated_receipt = await db.expense_receipts.find_one({"id": receipt_id})
        if isinstance(updated_receipt.get('date'), str):
            updated_receipt['date'] = datetime.fromisoformat(updated_receipt['date']).date()
            
        return ExpenseReceipt(**updated_receipt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/expense-receipts/{receipt_id}")
async def delete_expense_receipt(receipt_id: str):
    """Delete an expense receipt"""
    try:
        result = await db.expense_receipts.delete_one({"id": receipt_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense receipt not found")
        
        return {"message": "Gider makbuzu başarıyla silindi", "deleted_id": receipt_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting expense receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expense-receipts/{receipt_id}/payment")
async def mark_expense_receipt_as_paid(receipt_id: str):
    """Mark an expense receipt as paid - only for accounting/admin users"""
    try:
        # Check if receipt exists and is approved
        receipt = await db.expense_receipts.find_one({"id": receipt_id})
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Gider makbuzu bulunamadı")
        
        if receipt.get("status") != "approved":
            raise HTTPException(
                status_code=400, 
                detail="Sadece onaylanmış makbuzlar ödeme olarak işaretlenebilir"
            )
        
        # Update status to paid
        result = await db.expense_receipts.update_one(
            {"id": receipt_id},
            {
                "$set": {
                    "status": "paid",
                    "paid_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Makbuz güncellenemedi")
        
        return {
            "success": True,
            "message": "Gider makbuzu başarıyla ödendi olarak işaretlendi",
            "receipt_number": receipt.get("receipt_number"),
            "status": "paid"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking receipt as paid: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== EXPENSE RECEIPT EMAIL ENDPOINTS =====================

async def send_expense_receipt_approval_email(receipt, approval_key):
    """Send approval email to supplier when expense receipt is created"""
    try:
        # Get supplier contacts for email
        supplier = await db.suppliers.find_one({"id": receipt.supplier_id})
        if not supplier:
            logger.error(f"Supplier not found for receipt: {receipt.id}")
            return
        
        # Get supplier contacts
        contacts = supplier.get("contacts", [])
        if not contacts:
            logger.error(f"No contacts found for supplier: {receipt.supplier_id}")
            return
        
        # Use first contact's email
        contact_email = contacts[0].get("email")
        if not contact_email:
            logger.error(f"No email found for supplier contact: {receipt.supplier_id}")
            return
        
        # Get SendGrid settings
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        if not sendgrid_api_key:
            logger.warning("SendGrid API key not configured")
            return
        
        # Create approval URL
        frontend_url = os.environ.get('FRONTEND_URL', 'https://supplier-map.preview.emergentagent.com')
        approval_url = f"{frontend_url}/expense-receipt-approval/{approval_key}"
        
        # Create email content
        email_content = f"""
Sayın {contacts[0].get('name', 'Yetkili')},

{receipt.receipt_number} numaralı gider makbuzunuz onayınızı bekliyor.

Makbuz Detayları:
- Makbuz No: {receipt.receipt_number}
- Tarih: {receipt.date}
- Tutar: {receipt.amount} {receipt.currency}
- Açıklama: {receipt.description}

Makbuzu onaylamak için aşağıdaki linke tıklayın:
{approval_url}

Bu link 30 gün süreyle geçerlidir.

İyi çalışmalar,
Vitingo CRM Sistemi
"""
        
        # Send email
        if Mail:
            message = Mail(
                from_email='noreply@vitingo.com',
                to_emails=contact_email,
                subject=f'Gider Makbuzu Onayı - {receipt.receipt_number}',
                plain_text_content=email_content
            )
            
            try:
                from sendgrid import SendGridAPIClient
                sg = SendGridAPIClient(api_key=sendgrid_api_key)
                response = sg.send(message)
                logger.info(f"Approval email sent for receipt {receipt.receipt_number} to {contact_email}")
            except Exception as e:
                logger.error(f"SendGrid error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error sending approval email: {str(e)}")

def generate_expense_receipt_pdf(receipt):
    """Generate PDF for expense receipt"""
    try:
        # Create a BytesIO buffer to hold the PDF
        buffer = io.BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1,  # Center alignment
            textColor=colors.darkblue
        )
        
        normal_style = styles['Normal']
        normal_style.fontSize = 12
        normal_style.spaceAfter = 12
        
        # Add title
        title = Paragraph("GIDER BELGESİ / EXPENSE RECEIPT", title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Receipt details table
        receipt_data = [
            ['Makbuz No / Receipt No:', receipt.get('receipt_number', 'N/A')],
            ['Tarih / Date:', receipt.get('date', 'N/A')],
            ['Tedarikçi / Supplier:', receipt.get('supplier_name', 'N/A')],
            ['Tutar / Amount:', f"{receipt.get('amount', 'N/A')} {receipt.get('currency', 'N/A')}"],
            ['Durum / Status:', receipt.get('status', 'N/A').upper()],
            ['Açıklama / Description:', receipt.get('description', 'N/A')]
        ]
        
        if receipt.get('paid_at'):
            paid_date = receipt.get('paid_at', '')
            if isinstance(paid_date, str):
                paid_date = paid_date.split('T')[0]
            elif hasattr(paid_date, 'strftime'):
                paid_date = paid_date.strftime('%Y-%m-%d')
            receipt_data.append(['Ödeme Tarihi / Payment Date:', paid_date])
        
        # Create table
        table = Table(receipt_data, colWidths=[200, 300])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 30))
        
        # Add signature section if receipt has signer information
        if receipt.get('signer_name'):
            # Format signed date
            signed_date = 'N/A'
            if receipt.get('signed_at'):
                signed_at = receipt.get('signed_at')
                if isinstance(signed_at, str):
                    signed_date = signed_at.split('T')[0]
                elif hasattr(signed_at, 'strftime'):
                    signed_date = signed_at.strftime('%Y-%m-%d')
            
            # Create signature section with prominent styling
            signature_style = ParagraphStyle(
                'SignatureStyle',
                parent=normal_style,
                fontSize=12,
                spaceAfter=12,
                leftIndent=20,
                borderWidth=1,
                borderColor=colors.darkblue,
                borderPadding=10,
                backColor=colors.lightblue
            )
            
            signature_para = Paragraph(f"""
            <b>DİJİTAL İMZA BİLGİLERİ / DIGITAL SIGNATURE INFORMATION</b><br/><br/>
            <b>İmzalayan / Signed by:</b> {receipt.get('signer_name', 'N/A')}<br/>
            <b>Pozisyon / Position:</b> {receipt.get('signer_position', 'Belirtilmemiş')}<br/>
            <b>Şirket / Company:</b> {receipt.get('signer_company', 'N/A')}<br/>
            <b>İmza Tarihi / Signed Date:</b> {signed_date}<br/>
            <br/>
            <i>Bu makbuz yukarıda belirtilen kişi tarafından dijital olarak imzalanmıştır.<br/>
            This receipt has been digitally signed by the person mentioned above.</i>
            """, signature_style)
            story.append(Spacer(1, 20))
            story.append(signature_para)
        
        # Add footer
        footer_para = Paragraph(f"""
        <br/><br/>
        <i>Bu belge Vitingo CRM sistemi tarafından otomatik olarak oluşturulmuştur.<br/>
        This document was automatically generated by Vitingo CRM system.<br/>
        Oluşturma Tarihi / Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC</i>
        """, normal_style)
        story.append(footer_para)
        
        # Build PDF
        doc.build(story)
        
        # Get the value of the BytesIO buffer
        pdf_data = buffer.getvalue()
        buffer.close()
        
        return pdf_data
        
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return None

class ExpenseReceiptEmailRequest(BaseModel):
    to: str
    subject: str
    message: str
    receipt_id: str
    sender_name: Optional[str] = None  # Name of the user sending the email
    recipient_name: Optional[str] = None  # Name of the email recipient
    recipient_company: Optional[str] = None  # Company of the email recipient

@api_router.post("/send-expense-receipt-email")
async def send_expense_receipt_email(request: ExpenseReceiptEmailRequest):
    """Send email about expense receipt via SendGrid"""
    try:
        # Get receipt details for email context
        receipt = await db.expense_receipts.find_one({"id": request.receipt_id})
        if not receipt:
            raise HTTPException(status_code=404, detail="Expense receipt not found")
        
        # Get SendGrid settings from environment
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        if not sendgrid_api_key:
            return {"success": False, "message": "E-posta servisi yapılandırılmamış"}
        
        # Create standard email content with proper Vitingo format
        recipient_line = f"Sayın {request.recipient_name}" if request.recipient_name else "Sayın Yetkili"
        company_line = f"{request.recipient_company}" if request.recipient_company else ""
        
        plain_content = f"""{recipient_line}
{company_line}

İmzalamış olduğunuz gider makbuzunun imzalı kopyası ekte sunulmuştur.

İyi çalışmalar dileriz

Vitingo CRM Sistemi"""
        
        # Create HTML email content matching Vitingo CRM format
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .email-container {{ background-color: white; max-width: 600px; margin: 20px auto; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .content {{ font-size: 16px; line-height: 1.8; color: #333; font-family: Arial, sans-serif; }}
        .recipient {{ font-weight: bold; margin-bottom: 5px; }}
        .company {{ color: #666; margin-bottom: 20px; }}
        .message {{ margin: 20px 0; }}
        .signature {{ margin-top: 30px; color: #333; }}
        .system {{ font-weight: bold; color: #4f46e5; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="content">
            <div class="recipient">{recipient_line}</div>
            {f'<div class="company">{company_line}</div>' if company_line else ''}
            
            <div class="message">
                İmzalamış olduğunuz gider makbuzunun imzalı kopyası ekte sunulmuştur.
            </div>
            
            <div class="signature">
                İyi çalışmalar dileriz<br><br>
                <span class="system">Vitingo CRM Sistemi</span>
            </div>
        </div>
    </div>
</body>
</html>"""
        
        # Generate PDF for the receipt
        pdf_data = generate_expense_receipt_pdf(receipt)
        
        # Create sender name in format "Vitingo CRM - {User Name}"
        sender_display_name = f"Vitingo CRM - {request.sender_name}" if request.sender_name else "Vitingo CRM"
        
        # Send email using SendGrid with proper from_email format
        try:
            from sendgrid.helpers.mail import Email
            from_email_obj = Email(email='info@quattrostand.com', name=sender_display_name)
        except ImportError:
            from_email_obj = f"{sender_display_name} <info@quattrostand.com>"
        
        message = Mail(
            from_email=from_email_obj,
            to_emails=request.to,
            subject=request.subject,
            plain_text_content=plain_content,
            html_content=html_content
        )
        
        # Add PDF attachment if generated successfully
        if pdf_data:
            try:
                from sendgrid.helpers.mail import Attachment, FileContent, FileName, FileType, Disposition
                
                # Convert PDF to base64
                pdf_base64 = base64.b64encode(pdf_data).decode()
                
                # Create attachment
                attachment = Attachment()
                attachment.file_content = FileContent(pdf_base64)
                attachment.file_type = FileType('application/pdf')
                attachment.file_name = FileName(f"Gider_Makbuzu_{receipt.get('receipt_number', 'N_A')}.pdf")
                attachment.disposition = Disposition('attachment')
                
                message.attachment = [attachment]
                logger.info(f"PDF attachment created for receipt {receipt.get('receipt_number')}")
                
            except Exception as pdf_error:
                logger.error(f"Error adding PDF attachment: {str(pdf_error)}")
                # Continue without attachment
        
        try:
            from sendgrid import SendGridAPIClient
            sg = SendGridAPIClient(api_key=sendgrid_api_key)
            response = sg.send(message)
            
            return {
                "success": True, 
                "message": "E-posta başarıyla gönderildi",
                "receipt_number": receipt.get('receipt_number')
            }
        except Exception as e:
            logger.error(f"SendGrid error: {str(e)}")
            return {"success": False, "message": f"E-posta gönderilemedi: {str(e)}"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending expense receipt email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== EXPENSE RECEIPT APPROVAL ENDPOINTS =====================

@api_router.get("/expense-receipt-approval/{approval_key}")
async def get_expense_receipt_for_approval(approval_key: str):
    """Get expense receipt details for approval"""
    try:
        receipt = await db.expense_receipts.find_one({"approval_link": approval_key})
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Makbuz bulunamadı veya onay linki geçersiz")
        
        # Check if already approved
        if receipt.get("status") != "pending":
            return {
                "error": True,
                "message": "Bu makbuz zaten onaylanmış veya işlem görmüş",
                "status": receipt.get("status")
            }
        
        # Get supplier details for pre-filling form
        supplier = await db.suppliers.find_one({"id": receipt.get("supplier_id")})
        
        # Parse date string back to date object for response
        if isinstance(receipt.get('date'), str):
            receipt['date'] = datetime.fromisoformat(receipt['date']).date()
        
        # Add supplier contact info for form pre-filling
        supplier_info = {}
        if supplier:
            supplier_info = {
                "supplier_company_name": supplier.get("company_short_name", ""),
                "supplier_contact_name": "",
                "supplier_contact_specialty": "",
                "supplier_contact_email": ""
            }
            
            # Get first contact info if available from supplier_contacts collection
            contacts = await db.supplier_contacts.find({
                "supplier_id": receipt.get("supplier_id"),
                "is_active": True
            }).to_list(length=None)
            
            if contacts:
                first_contact = contacts[0]
                supplier_info.update({
                    "supplier_contact_name": first_contact.get("full_name", ""),
                    "supplier_contact_specialty": first_contact.get("position", ""),  # Using position as title/role
                    "supplier_contact_email": first_contact.get("email", "")
                })
            else:
                logger.error(f"No contacts found for supplier: {receipt.get('supplier_id')}")
        
        # Create response with receipt and supplier info
        receipt_response = ExpenseReceipt(**receipt)
        response_dict = receipt_response.dict()
        response_dict.update(supplier_info)
        
        return response_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting expense receipt for approval: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ExpenseReceiptApprovalRequest(BaseModel):
    signature_data: str
    signer_name: str
    signer_title: Optional[str] = ""
    signer_company: Optional[str] = ""

@api_router.post("/expense-receipt-approval/{approval_key}")
async def approve_expense_receipt(approval_key: str, approval_data: ExpenseReceiptApprovalRequest):
    """Approve expense receipt with signature"""
    try:
        receipt = await db.expense_receipts.find_one({"approval_link": approval_key})
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Makbuz bulunamadı veya onay linki geçersiz")
        
        # Check if already approved
        if receipt.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Bu makbuz zaten onaylanmış veya işlem görmüş")
        
        # Update receipt with approval data
        update_data = {
            "status": "approved",
            "signature_data": approval_data.signature_data,
            "signer_name": approval_data.signer_name,
            "signer_title": approval_data.signer_title,
            "signer_company": approval_data.signer_company,
            "signed_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.expense_receipts.update_one(
            {"approval_link": approval_key},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Makbuz güncellenemedi")
        
        return {
            "success": True,
            "message": "Gider makbuzu başarıyla onaylandı",
            "receipt_number": receipt.get("receipt_number"),
            "status": "approved"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving expense receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== CONTACT EMAIL ENDPOINTS =====================

class ContactEmailRequest(BaseModel):
    to: str
    subject: str
    message: str
    contact_id: Optional[str] = None
    supplier_id: Optional[str] = None

@api_router.post("/send-contact-email")
async def send_contact_email(request: ContactEmailRequest):
    """Send email to supplier contact via SendGrid"""
    try:
        # Get contact and supplier info for logging/tracking
        contact = None
        supplier = None
        
        if request.contact_id:
            contact = await db.supplier_contacts.find_one({"id": request.contact_id})
        
        if request.supplier_id:
            supplier = await db.suppliers.find_one({"id": request.supplier_id})
        
        # Use default sender info (can be made configurable)
        from_email = "noreply@vendormate.com"
        from_name = "VendorMate CRM"
        
        result = email_service.send_user_email(
            to_email=request.to,
            to_name=contact.get("full_name", "Değerli Müşterimiz") if contact else "Değerli Müşterimiz",
            from_email=from_email,
            from_name=from_name,
            subject=request.subject,
            body=request.message,
            cc="",
            bcc="",
            attachments=[]
        )
        
        # Save email to contact_emails collection for tracking
        email_record = {
            "id": str(uuid.uuid4()),
            "from": from_email,
            "from_name": from_name,
            "to": request.to,
            "to_name": contact.get("full_name", "Bilinmiyor") if contact else "Bilinmiyor",
            "subject": request.subject,
            "message": request.message,
            "contact_id": request.contact_id,
            "supplier_id": request.supplier_id,
            "contact_name": contact.get("full_name") if contact else None,
            "supplier_name": supplier.get("company_short_name") if supplier else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "sent" if result.get("success") else "failed",
            "sendgrid_message_id": result.get("message_id")
        }
        
        await db.contact_emails.insert_one(email_record)
        
        return result
    except Exception as e:
        logger.error(f"Error sending contact email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# ===================== GEO DATA ENDPOINTS =====================

@api_router.get("/geo/countries")
async def get_countries(query: str = ""):
    """Get all countries with optional search query"""
    try:
        # Use database instead of hardcoded data
        filter_query = {}
        if query:
            # Support fuzzy search with accent tolerance
            query_regex = query.replace("i", "[iıİI]").replace("u", "[uüUÜ]").replace("o", "[oöOÖ]").replace("c", "[cçCÇ]").replace("s", "[sşSŞ]").replace("g", "[gğGĞ]")
            filter_query = {
                "$or": [
                    {"name": {"$regex": query_regex, "$options": "i"}},
                    {"iso2": {"$regex": query, "$options": "i"}},
                    {"iso3": {"$regex": query, "$options": "i"}}
                ]
            }
        
        countries = await db.countries.find(filter_query).sort("name", 1).to_list(length=None)
        
        # Convert MongoDB documents to API format
        result = []
        for country in countries:
            result.append({
                "code": country.get("iso2", ""),
                "name": country.get("name", ""),
                "iso2": country.get("iso2", ""),
                "iso3": country.get("iso3", "")
            })
        
        return result
    except Exception as e:
        logger.error(f"Error fetching countries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/geo/countries/{country_code}/cities")
async def get_cities(country_code: str, query: str = "", limit: int = 50, page: int = 1):
    """Get cities for a specific country with pagination"""
    try:
        filter_query = {"country_iso2": country_code.upper()}
        if query:
            query_regex = {"$regex": query, "$options": "i"}
            filter_query["name"] = query_regex
        
        # Count total documents
        total_count = await db.cities.count_documents(filter_query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        # Get cities with pagination
        cities = await db.cities.find(filter_query).sort("name", 1).skip(skip).limit(limit).to_list(length=limit)
        
        # Convert to API format
        cities_result = []
        for city in cities:
            cities_result.append({
                "id": city.get("id", ""),
                "name": city.get("name", ""),
                "country_iso2": city.get("country_iso2", country_code.upper()),
                "admin1": city.get("admin1", ""),
                "is_capital": city.get("is_capital", False),
                "population": city.get("population"),
                "lat": city.get("lat"),
                "lng": city.get("lng")
            })
        
        return {
            "cities": cities_result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            }
        }
    except Exception as e:
        logger.error(f"Error fetching cities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== MAIN APP SETUP =====================

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
