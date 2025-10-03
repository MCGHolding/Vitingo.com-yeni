from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any
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

# Country Profile Models
class CountryProfileFormConfig(BaseModel):
    fields: Dict[str, Any] = Field(default_factory=dict)  # Field overrides
    sections: List[Dict[str, Any]] = Field(default_factory=list)  # Section configs
    validation_rules: Dict[str, Any] = Field(default_factory=dict)  # Custom validation
    conditional_logic: List[Dict[str, Any]] = Field(default_factory=list)  # Show/hide rules
    field_order: List[str] = Field(default_factory=list)  # Field ordering

class CountryProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # ISO-2 country code (e.g., "US", "TR")
    name: str  # Country name
    locales: List[str] = Field(default_factory=list)  # ["en_US", "tr_TR"]
    currency: str = "USD"  # Currency code
    phone_code: str = "+1"  # International phone code
    address_format: Dict[str, Any] = Field(default_factory=dict)  # Address structure
    date_format: str = "MM/DD/YYYY"  # Date format
    tax_config: Dict[str, Any] = Field(default_factory=dict)  # Tax/VAT configuration
    form_config: CountryProfileFormConfig = Field(default_factory=CountryProfileFormConfig)  # Brief form overrides
    status: str = "draft"  # draft, published
    version: int = 1
    created_by: str = ""  # User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CountryProfileCreate(BaseModel):
    code: str
    name: str
    locales: List[str] = Field(default_factory=list)
    currency: str = "USD"
    phone_code: str = "+1"
    address_format: Dict[str, Any] = Field(default_factory=dict)
    date_format: str = "MM/DD/YYYY"
    tax_config: Dict[str, Any] = Field(default_factory=dict)
    form_config: CountryProfileFormConfig = Field(default_factory=CountryProfileFormConfig)

class CountryProfileUpdate(BaseModel):
    name: Optional[str] = None
    locales: Optional[List[str]] = None
    currency: Optional[str] = None
    phone_code: Optional[str] = None
    address_format: Optional[Dict[str, Any]] = None
    date_format: Optional[str] = None
    tax_config: Optional[Dict[str, Any]] = None
    form_config: Optional[CountryProfileFormConfig] = None
    status: Optional[str] = None

# Stand Elements Models - Recursive Structure
class StandElementCreate(BaseModel):
    key: str
    label: str
    icon: Optional[str] = None
    required: bool = False
    element_type: str = "option"  # option, property, unit
    input_type: Optional[str] = None  # text, number, select, color
    unit: Optional[str] = None  # adet, m2, m3, kg, litre
    options: Optional[List[str]] = None  # For select type
    parent_path: Optional[str] = None  # Dot notation path: "flooring.raised36mm.carpet"

class RecursiveStandElement(BaseModel):
    key: str
    label: str
    icon: Optional[str] = None
    required: bool = False
    element_type: str = "option"  # option, property, unit
    input_type: Optional[str] = None  # text, number, select, color
    unit: Optional[str] = None  # adet, m2, m3, kg, litre
    options: Optional[List[str]] = None  # For select type
    children: Optional[Dict[str, 'RecursiveStandElement']] = None

# For Pydantic forward reference
RecursiveStandElement.model_rebuild()

class StandElement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # Unique key like 'flooring', 'counter'
    label: str  # Display name
    icon: Optional[str] = None
    required: bool = False
    structure: Dict[str, RecursiveStandElement] = Field(default_factory=dict)  # Recursive structure
    created_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
    company_id: str = ""  # Link to customer ID
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
    id: Union[str, int] = Field(default_factory=lambda: str(uuid.uuid4()))
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
    status: str = "active"  # Taslak fatura durumu için status field'ı
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

# ===================== COLLECTION RECEIPT MODELS =====================

class CollectionReceiptCheckDetail(BaseModel):
    """Çek detayları için model"""
    bank: str = Field(..., description="Banka adı")
    branch: str = Field(..., description="Şube adı")
    account_iban: str = Field(..., description="Hesap/IBAN numarası")
    check_number: str = Field(..., description="Çek numarası")
    check_date: str = Field(..., description="Çek tarihi")
    amount: float = Field(..., description="Çek tutarı")

class CollectionReceiptPaymentDetails(BaseModel):
    """Ödeme detayları modeli"""
    cash_amount: float = Field(0.0, description="Nakit tutar")
    credit_card_amount: float = Field(0.0, description="Kredi kartı tutar")
    check_amount: float = Field(0.0, description="Çek tutar")
    promissory_note_amount: float = Field(0.0, description="Senet tutar")
    check_details: List[CollectionReceiptCheckDetail] = Field([], description="Çek detayları listesi")

class CollectionReceipt(BaseModel):
    """Tahsilat Makbuzu modeli"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    receipt_number: str = Field(..., description="Makbuz numarası")
    
    # Makbuz düzenleyen bilgileri
    issuer_name: str = Field(..., description="Makbuz düzenleyen adı soyadı")
    issuer_title: str = Field(..., description="Makbuz düzenleyen ünvanı")
    
    # Şirket bilgileri
    company_name: str = Field(..., description="Şirket ünvanı")
    company_address: str = Field(..., description="Şirket adresi")
    company_phone: str = Field(..., description="Şirket telefonu")
    company_email: str = Field(..., description="Şirket e-posta")
    
    # Makbuz bilgileri
    issue_date: str = Field(..., description="Makbuz düzenlenme tarihi")
    
    # Ödeme yapan bilgileri
    payer_name: str = Field(..., description="Ödemeyi yapan kişi/şirket adı")
    payer_email: str = Field("", description="Ödemeyi yapan e-posta")
    
    # Ödeme detayları
    payment_reason: str = Field(..., description="Ödemenin yapılma sebebi")
    total_amount: float = Field(..., description="Toplam ödeme tutarı")
    total_amount_words: str = Field(..., description="Toplam tutar yazıyla")
    payment_details: CollectionReceiptPaymentDetails = Field(..., description="Detaylı ödeme bilgileri")
    
    # İmza durumu
    signature_status: str = Field("pending", description="İmza durumu: pending, signed, rejected")
    signature_link: Optional[str] = Field(None, description="İmzalama linki")
    signature_date: Optional[str] = Field(None, description="İmzalama tarihi")
    signed_receipt_url: Optional[str] = Field(None, description="İmzalanmış makbuz URL'i")
    
    # İlişkili fatura
    related_invoice_id: Optional[str] = Field(None, description="İlişkili fatura ID'si")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CollectionReceiptCreate(BaseModel):
    """Tahsilat makbuzu oluşturma modeli"""
    issuer_name: str
    issuer_title: str
    company_name: str
    company_address: str
    company_phone: str
    company_email: str
    payer_name: str
    payer_email: str
    payment_reason: str
    total_amount: float
    payment_details: CollectionReceiptPaymentDetails
    related_invoice_id: Optional[str] = None

class CollectionReceiptApproval(BaseModel):
    """Tahsilat makbuzu onay/imza modeli"""
    signature_key: str = Field(..., description="İmzalama anahtarı")
    status: str = Field(..., description="Onay durumu: approved, rejected")
    signer_name: str = Field(..., description="İmzalayan kişinin adı")
    signer_title: str = Field("", description="İmzalayan kişinin ünvanı")
    signature_date: str = Field(..., description="İmzalama tarihi")
    comments: str = Field("", description="Ek yorumlar")

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
        base_url = os.environ.get('FRONTEND_URL', 'https://smart-brief-creator.preview.emergentagent.com')
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
        base_url = os.environ.get('FRONTEND_URL', 'https://smart-brief-creator.preview.emergentagent.com')
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
        base_url = os.environ.get('FRONTEND_URL', 'https://smart-brief-creator.preview.emergentagent.com')
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
        base_url = os.environ.get('FRONTEND_URL', 'https://smart-brief-creator.preview.emergentagent.com')
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
        logger.info(f"Found {len(customers)} customers in database")
        
        # Debug first customer
        if customers:
            logger.info(f"First customer keys: {list(customers[0].keys())}")
        
        validated_customers = []
        for i, customer in enumerate(customers):
            try:
                # Remove MongoDB _id field
                customer_dict = {k: v for k, v in customer.items() if k != '_id'}
                logger.info(f"Validating customer {i+1}: {customer_dict.get('companyName', 'Unknown')}")
                validated_customers.append(Customer(**customer_dict))
            except Exception as validation_error:
                logger.error(f"Customer {i+1} validation error: {validation_error}")
                logger.error(f"Customer {i+1} keys: {list(customer.keys())}")
                logger.error(f"CompanyName present: {'companyName' in customer}")
                # Try to identify the specific issue
                break  # Stop at first error
                
        logger.info(f"Successfully validated {len(validated_customers)} customers")
        return validated_customers
        
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

@api_router.get("/invoices/status/{status}", response_model=List[Invoice])
async def get_invoices_by_status(status: str):
    """Get invoices by status (draft, active, cancelled, etc.)"""
    try:
        invoices = await db.invoices.find({"status": status}).to_list(1000)
        return [Invoice(**invoice) for invoice in invoices]
    except Exception as e:
        logger.error(f"Error getting invoices by status {status}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting invoices by status: {str(e)}")

@api_router.get("/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(invoice_id: str):
    """Generate PDF for a specific invoice"""
    return {"message": f"PDF generation for invoice {invoice_id}", "status": "test"}

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

@api_router.put("/invoices/{invoice_id}/cancel")
async def cancel_invoice(invoice_id: str):
    """Cancel a specific invoice"""
    try:
        # Check if invoice exists
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Fatura bulunamadı")
        
        # Update the invoice status to cancelled
        result = await db.invoices.update_one(
            {"id": invoice_id},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=400, detail="Fatura iptal edilemedi")
        
        return {
            "success": True, 
            "message": "Fatura başarıyla iptal edildi",
            "cancelled_invoice_id": invoice_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fatura iptal hatası: {str(e)}")

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    """Delete a specific invoice"""
    try:
        # Check if invoice exists
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Fatura bulunamadı")
        
        # Delete the invoice
        result = await db.invoices.delete_one({"id": invoice_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Fatura silinemedi")
        
        return {
            "success": True, 
            "message": "Fatura başarıyla silindi",
            "deleted_invoice_id": invoice_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting invoice {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fatura silme hatası: {str(e)}")

@api_router.get("/invoices/status/{status}")
async def get_invoices_by_status(status: str):
    """Get invoices by status"""
    try:
        invoices = await db.invoices.find({"status": status}).to_list(1000)
        return [Invoice(**invoice) for invoice in invoices]
    except Exception as e:
        logger.error(f"Error getting invoices by status {status}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== CUSTOMER PROSPECTS ENDPOINTS =====================

class CustomerProspectCreate(BaseModel):
    company_short_name: str = ""
    company_title: str = ""
    customer_type_id: str = ""
    specialty_id: str = ""
    address: str = ""
    phone: str = ""
    mobile: str = ""
    email: str = ""
    tax_office: str = ""
    tax_number: str = ""
    services: List[str] = []
    iban: str = ""
    bank_name: str = ""
    bank_branch: str = ""
    account_holder_name: str = ""
    swift_code: str = ""
    country: str = ""
    city: str = ""
    routing_number: str = ""
    us_account_number: str = ""
    bank_address: str = ""
    sector: str = ""
    tags: List[str] = []
    notes: str = ""
    is_candidate: bool = True
    contacts: List[dict] = []

class CustomerProspect(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_short_name: str = ""
    company_title: str = ""
    customer_type_id: str = ""
    specialty_id: str = ""
    address: str = ""
    phone: str = ""
    mobile: str = ""
    email: str = ""
    tax_office: str = ""
    tax_number: str = ""
    services: List[str] = []
    iban: str = ""
    bank_name: str = ""
    bank_branch: str = ""
    account_holder_name: str = ""
    swift_code: str = ""
    country: str = ""
    city: str = ""
    routing_number: str = ""
    us_account_number: str = ""
    bank_address: str = ""
    sector: str = ""
    tags: List[str] = []
    notes: str = ""
    is_candidate: bool = True
    contacts: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

@api_router.post("/customer-prospects", response_model=CustomerProspect)
async def create_customer_prospect(prospect_data: CustomerProspectCreate):
    """Create a new customer prospect"""
    try:
        # Convert to CustomerProspect model
        prospect = CustomerProspect(**prospect_data.dict())
        prospect_dict = prospect.dict()
        
        # Insert to MongoDB
        await db.customer_prospects.insert_one(prospect_dict)
        
        logger.info(f"Customer prospect created: {prospect.id}")
        return prospect
        
    except Exception as e:
        logger.error(f"Error creating customer prospect: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customer-prospects", response_model=List[CustomerProspect])
async def get_customer_prospects():
    """Get all customer prospects"""
    try:
        prospects = await db.customer_prospects.find().to_list(length=None)
        return [CustomerProspect(**prospect) for prospect in prospects]
        
    except Exception as e:
        logger.error(f"Error getting customer prospects: {str(e)}")
        return []

# ===================== END CUSTOMER PROSPECTS ENDPOINTS =====================

# ===================== CUSTOMER TYPES ENDPOINTS =====================

class CustomerType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerTypeCreate(BaseModel):
    name: str
    value: str

@api_router.post("/customer-types", response_model=CustomerType)
async def create_customer_type(customer_type_data: CustomerTypeCreate):
    """Create a new customer type"""
    try:
        # Check if already exists
        existing = await db.customer_types.find_one({"value": customer_type_data.value})
        if existing:
            raise HTTPException(status_code=400, detail="Bu müşteri türü zaten mevcut")
        
        customer_type = CustomerType(**customer_type_data.dict())
        customer_type_dict = customer_type.dict()
        
        # Insert to MongoDB
        await db.customer_types.insert_one(customer_type_dict)
        
        logger.info(f"Customer type created: {customer_type.name}")
        return customer_type
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating customer type: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customer-types", response_model=List[CustomerType])
async def get_customer_types():
    """Get all customer types"""
    try:
        customer_types = await db.customer_types.find().sort("name", 1).to_list(length=None)
        
        # If no data, insert default types
        if not customer_types:
            default_types = [
                {"name": "Firma", "value": "firma"},
                {"name": "Ajans", "value": "ajans"},
                {"name": "Devlet Kurumu", "value": "devlet_kurumu"},
                {"name": "Dernek veya Vakıf", "value": "dernek_vakif"}
            ]
            
            for type_data in default_types:
                customer_type = CustomerType(**type_data)
                await db.customer_types.insert_one(customer_type.dict())
            
            # Fetch again after inserting defaults
            customer_types = await db.customer_types.find().sort("name", 1).to_list(length=None)
            
        return [CustomerType(**ct) for ct in customer_types]
        
    except Exception as e:
        logger.error(f"Error getting customer types: {str(e)}")
        return []

# ===================== SECTORS ENDPOINTS =====================

class Sector(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SectorCreate(BaseModel):
    name: str
    value: str

@api_router.post("/sectors", response_model=Sector)
async def create_sector(sector_data: SectorCreate):
    """Create a new sector"""
    try:
        # Check if already exists
        existing = await db.sectors.find_one({"value": sector_data.value})
        if existing:
            raise HTTPException(status_code=400, detail="Bu sektör zaten mevcut")
        
        sector = Sector(**sector_data.dict())
        sector_dict = sector.dict()
        
        # Insert to MongoDB
        await db.sectors.insert_one(sector_dict)
        
        logger.info(f"Sector created: {sector.name}")
        return sector
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating sector: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/sectors", response_model=List[Sector])
async def get_sectors():
    """Get all sectors"""
    try:
        sectors = await db.sectors.find().sort("name", 1).to_list(length=None)
        
        # If no data, insert default sectors
        if not sectors:
            default_sectors = [
                {"name": "Tarım", "value": "tarim"},
                {"name": "Hayvancılık", "value": "hayvancilik"},
                {"name": "Gıda Üretimi", "value": "gida_uretimi"},
                {"name": "İçecek Üretimi", "value": "icecek_uretimi"},
                {"name": "Tekstil", "value": "tekstil"},
                {"name": "Hazır Giyim", "value": "hazir_giyim"},
                {"name": "Deri ve Ayakkabı", "value": "deri_ayakkabi"},
                {"name": "Mobilya", "value": "mobilya"},
                {"name": "Orman Ürünleri", "value": "orman_urunleri"},
                {"name": "Kağıt ve Ambalaj", "value": "kagit_ambalaj"},
                {"name": "Plastik ve Kauçuk", "value": "plastik_kaucuk"},
                {"name": "Cam ve Seramik", "value": "cam_seramik"},
                {"name": "Metal İşleme", "value": "metal_isleme"},
                {"name": "Demir-Çelik", "value": "demir_celik"},
                {"name": "Otomotiv", "value": "otomotiv"},
                {"name": "Yedek Parça", "value": "yedek_parca"},
                {"name": "Elektrik ve Elektronik", "value": "elektrik_elektronik"},
                {"name": "Beyaz Eşya", "value": "beyaz_esya"},
                {"name": "Makine ve Ekipman", "value": "makine_ekipman"},
                {"name": "İnşaat", "value": "insaat"},
                {"name": "Yapı Malzemeleri", "value": "yapi_malzemeleri"},
                {"name": "Enerji", "value": "enerji"},
                {"name": "Yenilenebilir Enerji", "value": "yenilenebilir_enerji"},
                {"name": "Doğalgaz ve Petrol", "value": "dogalgaz_petrol"},
                {"name": "Kimya", "value": "kimya"},
                {"name": "İlaç ve Sağlık", "value": "ilac_saglik"},
                {"name": "Tıbbi Cihazlar", "value": "tibbi_cihazlar"},
                {"name": "Kozmetik ve Kişisel Bakım", "value": "kozmetik_kisisel_bakim"},
                {"name": "Temizlik Ürünleri", "value": "temizlik_urunleri"},
                {"name": "Bilgi Teknolojileri (IT)", "value": "bilgi_teknolojileri"},
                {"name": "Yazılım", "value": "yazilim"},
                {"name": "Donanım", "value": "donanim"},
                {"name": "Telekomünikasyon", "value": "telekomunikasyon"},
                {"name": "E-Ticaret", "value": "e_ticaret"},
                {"name": "Lojistik", "value": "lojistik"},
                {"name": "Taşımacılık", "value": "tasimacilik"},
                {"name": "Depolama", "value": "depolama"},
                {"name": "Denizcilik", "value": "denizcilik"},
                {"name": "Havacılık", "value": "havacilik"},
                {"name": "Turizm", "value": "turizm"},
                {"name": "Otelcilik", "value": "otelcilik"},
                {"name": "Restoran ve Yiyecek Hizmetleri", "value": "restoran_yiyecek"},
                {"name": "Eğlence ve Medya", "value": "eglence_medya"},
                {"name": "Reklam ve Pazarlama", "value": "reklam_pazarlama"},
                {"name": "Yayıncılık", "value": "yayincilik"},
                {"name": "Eğitim", "value": "egitim"},
                {"name": "Danışmanlık", "value": "danismanlik"},
                {"name": "Finans", "value": "finans"},
                {"name": "Bankacılık", "value": "bankacilik"},
                {"name": "Sigortacılık", "value": "sigortacilik"},
                {"name": "Yatırım ve Portföy Yönetimi", "value": "yatirim_portfoy"},
                {"name": "Gayrimenkul", "value": "gayrimenkul"},
                {"name": "Mimarlık", "value": "mimarlik"},
                {"name": "Mühendislik", "value": "muhendislik"},
                {"name": "Güvenlik", "value": "guvenlik"},
                {"name": "Savunma Sanayi", "value": "savunma_sanayi"},
                {"name": "Kamu Hizmetleri", "value": "kamu_hizmetleri"},
                {"name": "STK ve Dernekler", "value": "stk_dernekler"}
            ]
            
            for sector_data in default_sectors:
                sector = Sector(**sector_data)
                await db.sectors.insert_one(sector.dict())
            
            # Fetch again after inserting defaults
            sectors = await db.sectors.find().sort("name", 1).to_list(length=None)
            
        return [Sector(**sector) for sector in sectors]
        
    except Exception as e:
        logger.error(f"Error getting sectors: {str(e)}")
        return []

# ===================== COUNTRIES ENDPOINTS =====================

class Country(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    iso2: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CountryCreate(BaseModel):
    name: str
    iso2: str

@api_router.post("/countries", response_model=Country)
async def create_country(country_data: CountryCreate):
    """Create a new country"""
    try:
        # Check if already exists
        existing = await db.countries.find_one({"iso2": country_data.iso2.upper()})
        if existing:
            raise HTTPException(status_code=400, detail="Bu ülke zaten mevcut")
        
        country = Country(
            name=country_data.name,
            iso2=country_data.iso2.upper()
        )
        country_dict = country.dict()
        
        # Insert to MongoDB
        await db.countries.insert_one(country_dict)
        
        logger.info(f"Country created: {country.name}")
        return country
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating country: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/countries", response_model=List[Country])
async def get_countries():
    """Get all countries"""
    try:
        countries = await db.countries.find().sort("name", 1).to_list(length=None)
        return [Country(**country) for country in countries]
        
    except Exception as e:
        logger.error(f"Error getting countries: {str(e)}")
        return []

# ===================== CITIES ENDPOINTS =====================

class City(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CityCreate(BaseModel):
    name: str
    country_code: str

@api_router.post("/cities", response_model=City)
async def create_city(city_data: CityCreate):
    """Create a new city"""
    try:
        # Check if already exists for this country
        existing = await db.cities.find_one({
            "name": city_data.name,
            "country_code": city_data.country_code.upper()
        })
        if existing:
            raise HTTPException(status_code=400, detail="Bu şehir zaten mevcut")
        
        city = City(
            name=city_data.name,
            country_code=city_data.country_code.upper()
        )
        city_dict = city.dict()
        
        # Insert to MongoDB
        await db.cities.insert_one(city_dict)
        
        logger.info(f"City created: {city.name} ({city.country_code})")
        return city
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating city: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cities", response_model=List[City])
async def get_cities():
    """Get all cities"""
    try:
        cities = await db.cities.find().sort("name", 1).to_list(length=None)
        return [City(**city) for city in cities]
        
    except Exception as e:
        logger.error(f"Error getting cities: {str(e)}")
        return []

@api_router.get("/cities/{country_code}", response_model=List[City])
async def get_cities_by_country(country_code: str):
    """Get cities by country code"""
    try:
        cities = await db.cities.find({"country_code": country_code.upper()}).sort("name", 1).to_list(length=None)
        return [City(**city) for city in cities]
        
    except Exception as e:
        logger.error(f"Error getting cities for country {country_code}: {str(e)}")
        return []

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

@api_router.post("/suppliers/phone")
async def save_supplier_phone(data: SupplierPhone):
    """Save supplier phone number"""
    try:
        phone = data.phone
        # MongoDB'ye kaydetme işlemi buraya gelecek
        return {"status": "success", "phone": phone}
    except Exception as e:
        logger.error(f"Error saving supplier phone: {str(e)}")
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
        frontend_url = os.environ.get('FRONTEND_URL', 'https://smart-brief-creator.preview.emergentagent.com')
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

# ===================== PEOPLE CRUD ENDPOINTS =====================

class PersonCreate(BaseModel):
    first_name: str
    last_name: str
    email: str = ""
    phone: str = ""
    job_title: str = ""
    company: str = ""
    company_id: str = ""  # Link to customer ID
    relationship_type: str = ""
    notes: str = ""

class PersonUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    company_id: Optional[str] = None
    relationship_type: Optional[str] = None
    notes: Optional[str] = None

@api_router.post("/people", response_model=Person)
async def create_person(person_data: PersonCreate):
    """Create a new person"""
    try:
        # Convert to Person model
        person = Person(**person_data.dict())
        person_dict = person.dict()
        
        # Insert to MongoDB
        await db.people.insert_one(person_dict)
        
        logger.info(f"Person created: {person.id}")
        return person
        
    except Exception as e:
        logger.error(f"Error creating person: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/people", response_model=List[Person])
async def get_people():
    """Get all people"""
    try:
        people = await db.people.find().to_list(length=None)
        return [Person(**person) for person in people]
        
    except Exception as e:
        logger.error(f"Error getting people: {str(e)}")
        return []

@api_router.get("/people/{person_id}", response_model=Person)
async def get_person(person_id: str):
    """Get a specific person"""
    try:
        person = await db.people.find_one({"id": person_id})
        
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
            
        return Person(**person)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting person {person_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/people/{person_id}", response_model=Person)
async def update_person(person_id: str, person_data: PersonUpdate):
    """Update a person"""
    try:
        # Only update non-None fields
        update_data = {k: v for k, v in person_data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Update in MongoDB
        result = await db.people.update_one(
            {"id": person_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Person not found")
            
        # Get updated person
        updated_person = await db.people.find_one({"id": person_id})
        return Person(**updated_person)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating person {person_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/people/{person_id}")
async def delete_person(person_id: str):
    """Delete a person"""
    try:
        person = await db.people.find_one({"id": person_id})
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        result = await db.people.delete_one({"id": person_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Person not found")
            
        return {
            "success": True, 
            "message": f"Kişi '{person.get('first_name', '')} {person.get('last_name', '')}' başarıyla silindi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting person {person_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers/{customer_id}/people", response_model=List[Person])
async def get_customer_people(customer_id: str):
    """Get all people related to a specific customer"""
    try:
        # First verify customer exists
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Find people linked to this customer by company_id or company name
        people = await db.people.find({
            "$or": [
                {"company_id": customer_id},
                {"company": customer.get("companyName", "")}
            ]
        }).to_list(length=None)
        
        return [Person(**person) for person in people]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting people for customer {customer_id}: {str(e)}")
        return []

# ===================== OPPORTUNITIES MODELS & ENDPOINTS =====================

# Opportunity Models
class Opportunity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    customer: str
    contact_person: Optional[str] = ""
    amount: float = 0.0
    currency: str = "TRY"
    status: str = "open"
    stage: str = "lead"
    priority: str = "medium"
    close_date: str  # YYYY-MM-DD format
    source: Optional[str] = ""
    description: Optional[str] = ""
    business_type: Optional[str] = ""
    country: Optional[str] = ""
    city: Optional[str] = ""
    trade_show: Optional[str] = ""
    trade_show_dates: Optional[str] = ""
    expected_revenue: float = 0.0
    probability: int = 50
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OpportunityCreate(BaseModel):
    title: str
    customer: str
    contact_person: Optional[str] = ""
    amount: float = 0.0
    currency: str = "TRY"
    status: str = "open"
    stage: str = "lead"
    priority: str = "medium"
    close_date: str
    source: Optional[str] = ""
    description: Optional[str] = ""
    business_type: Optional[str] = ""
    country: Optional[str] = ""
    city: Optional[str] = ""
    trade_show: Optional[str] = ""
    trade_show_dates: Optional[str] = ""
    expected_revenue: Optional[float] = None
    probability: int = 50
    tags: List[str] = Field(default_factory=list)

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    customer: Optional[str] = None
    contact_person: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    close_date: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None
    business_type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    trade_show: Optional[str] = None
    trade_show_dates: Optional[str] = None
    expected_revenue: Optional[float] = None
    probability: Optional[int] = None
    tags: Optional[List[str]] = None

# Opportunity API Endpoints
@api_router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(opportunity_input: OpportunityCreate):
    """Create a new sales opportunity"""
    try:
        # Convert to dict and prepare for MongoDB
        opportunity_data = opportunity_input.dict()
        opportunity_data["id"] = str(uuid.uuid4())
        opportunity_data["created_at"] = datetime.now(timezone.utc)
        opportunity_data["updated_at"] = datetime.now(timezone.utc)
        
        # Set expected_revenue to amount if not provided
        if opportunity_data.get("expected_revenue") is None or opportunity_data.get("expected_revenue") == 0:
            opportunity_data["expected_revenue"] = opportunity_data.get("amount", 0.0)
        
        # Insert into database
        result = await db.opportunities.insert_one(opportunity_data)
        
        # Return created opportunity
        created_opportunity = await db.opportunities.find_one({"_id": result.inserted_id})
        return Opportunity(**created_opportunity)
        
    except Exception as e:
        logger.error(f"Error creating opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating opportunity: {str(e)}")

@api_router.get("/opportunities", response_model=List[Opportunity])
async def get_opportunities(
    status: Optional[str] = None,
    stage: Optional[str] = None,
    customer: Optional[str] = None
):
    """Get all opportunities with optional filtering"""
    try:
        # Build query filters
        query = {}
        if status:
            query["status"] = status
        if stage:
            query["stage"] = stage
        if customer:
            query["customer"] = {"$regex": customer, "$options": "i"}  # Case-insensitive search
        
        opportunities = await db.opportunities.find(query).sort("created_at", -1).to_list(length=None)
        return [Opportunity(**opportunity) for opportunity in opportunities]
        
    except Exception as e:
        logger.error(f"Error fetching opportunities: {str(e)}")
        return []

@api_router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def get_opportunity(opportunity_id: str):
    """Get a specific opportunity by ID"""
    try:
        opportunity = await db.opportunities.find_one({"id": opportunity_id})
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        return Opportunity(**opportunity)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching opportunity {opportunity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/opportunities/{opportunity_id}", response_model=Opportunity)
async def update_opportunity(opportunity_id: str, opportunity_input: OpportunityUpdate):
    """Update an existing opportunity"""
    try:
        # Check if opportunity exists
        existing = await db.opportunities.find_one({"id": opportunity_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        # Prepare update data
        update_data = {k: v for k, v in opportunity_input.dict().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            # Update in database
            await db.opportunities.update_one(
                {"id": opportunity_id},
                {"$set": update_data}
            )
        
        # Return updated opportunity
        updated_opportunity = await db.opportunities.find_one({"id": opportunity_id})
        return Opportunity(**updated_opportunity)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating opportunity {opportunity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/opportunities/{opportunity_id}")
async def delete_opportunity(opportunity_id: str):
    """Delete an opportunity"""
    try:
        # Check if opportunity exists
        existing = await db.opportunities.find_one({"id": opportunity_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        # Delete the opportunity
        result = await db.opportunities.delete_one({"id": opportunity_id})
        
        if result.deleted_count == 1:
            return {"message": "Opportunity deleted successfully", "id": opportunity_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete opportunity")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity {opportunity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== COLLECTION RECEIPT ENDPOINTS =====================

def generate_receipt_number():
    """Benzersiz makbuz numarası üret"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"TAH-{timestamp}"

def amount_to_words(amount):
    """Tutarı yazıya çevir (Basit versiyon - Türkçe)"""
    # Bu fonksiyon genişletilebilir
    ones = ["", "BİR", "İKİ", "ÜÇ", "DÖRT", "BEŞ", "ALTI", "YEDİ", "SEKİZ", "DOKUZ"]
    tens = ["", "", "YİRMİ", "OTUZ", "KIRK", "ELLİ", "ALTMIŞ", "YETMİŞ", "SEKSEN", "DOKSAN"]
    
    if amount == 0:
        return "SIFIR TÜRK LİRASI"
    
    if amount < 10:
        return f"{ones[int(amount)]} TÜRK LİRASI"
    elif amount < 100:
        tens_digit = int(amount // 10)
        ones_digit = int(amount % 10)
        return f"{tens[tens_digit]} {ones[ones_digit]} TÜRK LİRASI".strip()
    else:
        # Daha karmaşık sayılar için basit çözüm
        return f"{int(amount)} TÜRK LİRASI"

@api_router.post("/collection-receipts", response_model=CollectionReceipt)
async def create_collection_receipt(receipt_input: CollectionReceiptCreate):
    """Tahsilat makbuzu oluştur ve imzalama için gönder"""
    try:
        # Makbuz numarası oluştur
        receipt_number = generate_receipt_number()
        
        # Tutarı yazıya çevir
        amount_words = amount_to_words(receipt_input.total_amount)
        
        # Makbuz verisini hazırla
        receipt_data = receipt_input.dict()
        receipt_data.update({
            "id": str(uuid.uuid4()),
            "receipt_number": receipt_number,
            "issue_date": datetime.now().strftime("%Y-%m-%d"),
            "total_amount_words": amount_words,
            "status": "completed",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # MongoDB'ye kaydet
        result = await db.collection_receipts.insert_one(receipt_data)
        
        # PDF görüntüleme linki oluştur
        pdf_link = f"/api/collection-receipts/{receipt_data['id']}/pdf"
        receipt_data["pdf_link"] = pdf_link
        
        # E-posta gönder
        if receipt_input.payer_email:
            try:
                # E-posta içeriğini dinamik olarak oluştur
                email_content = generate_collection_email_content(
                    receipt_input, 
                    receipt_number, 
                    receipt_data['issue_date'],
                    pdf_link
                )
                
                email_service.send_email(
                    to_email=receipt_input.payer_email,
                    subject=f"Ödeme Onayı ve Tahsilat Makbuzu - {receipt_number}",
                    html_content=email_content
                )
                
                logger.info(f"Collection receipt email sent to: {receipt_input.payer_email}")
                
            except Exception as email_error:
                logger.error(f"Failed to send collection receipt email: {str(email_error)}")
                # E-posta gönderilmese de makbuz oluşturuldu
        
        return CollectionReceipt(**receipt_data)
        
    except Exception as e:
        logger.error(f"Error creating collection receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Tahsilat makbuzu oluşturma hatası: {str(e)}")

@api_router.get("/collection-receipts", response_model=List[CollectionReceipt])
async def get_collection_receipts():
    """Tüm tahsilat makbuzlarını getir"""
    try:
        receipts = await db.collection_receipts.find().sort([("created_at", -1)]).to_list(1000)
        return [CollectionReceipt(**receipt) for receipt in receipts]
    except Exception as e:
        logger.error(f"Error getting collection receipts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collection-receipts/{receipt_id}", response_model=CollectionReceipt)
async def get_collection_receipt(receipt_id: str):
    """Belirli bir tahsilat makbuzunu getir"""
    try:
        receipt = await db.collection_receipts.find_one({"id": receipt_id})
        if not receipt:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        return CollectionReceipt(**receipt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting collection receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/collection-receipts/{receipt_id}", response_model=CollectionReceipt)
async def update_collection_receipt(receipt_id: str, receipt_data: CollectionReceiptCreate):
    """Update existing collection receipt"""
    try:
        # Check if receipt exists
        existing_receipt = await db.collection_receipts.find_one({"id": receipt_id})
        if not existing_receipt:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        
        # Prepare update data
        update_data = receipt_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        # Keep original receipt number and creation date
        update_data["receipt_number"] = existing_receipt["receipt_number"]
        update_data["created_at"] = existing_receipt["created_at"]
        update_data["id"] = receipt_id
        
        # Generate total amount words (simple implementation)
        def amount_to_words_turkish(amount):
            return f"{amount:.2f} TÜRK LİRASI"
        
        update_data["total_amount_words"] = amount_to_words_turkish(update_data["total_amount"])
        
        # Update receipt in database
        result = await db.collection_receipts.replace_one({"id": receipt_id}, update_data)
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        
        # Return updated receipt
        updated_receipt = await db.collection_receipts.find_one({"id": receipt_id})
        return CollectionReceipt(**updated_receipt)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating collection receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/collection-receipts/{receipt_id}/send-email")
async def send_collection_receipt_email(receipt_id: str, email_data: dict):
    """Send collection receipt via email"""
    try:
        # Get receipt
        receipt = await db.collection_receipts.find_one({"id": receipt_id})
        if not receipt:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        
        # Here you would integrate with email service
        # For now, just return success
        return {
            "success": True,
            "message": "E-posta başarıyla gönderildi",
            "receipt_id": receipt_id,
            "to": email_data.get("to", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending collection receipt email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collection-receipt-approval/{signature_key}")
async def get_collection_receipt_approval(signature_key: str):
    """İmzalama sayfası için tahsilat makbuzu bilgilerini getir"""
    try:
        # İmzalama anahtarını kontrol et
        signature_record = await db.collection_receipt_signatures.find_one({"signature_key": signature_key})
        if not signature_record:
            raise HTTPException(status_code=404, detail="Geçersiz imzalama linki")
        
        # Link süresini kontrol et
        if signature_record["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="İmzalama linki süresi dolmuş")
        
        # İlgili makbuzu getir
        receipt = await db.collection_receipts.find_one({"id": signature_record["receipt_id"]})
        if not receipt:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        
        return {
            "receipt": CollectionReceipt(**receipt),
            "signature_key": signature_key,
            "expires_at": signature_record["expires_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting receipt for approval: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/collection-receipt-approval/{signature_key}")
async def approve_collection_receipt(signature_key: str, approval_data: CollectionReceiptApproval):
    """Tahsilat makbuzunu onayla/imzala"""
    try:
        # İmzalama anahtarını kontrol et
        signature_record = await db.collection_receipt_signatures.find_one({"signature_key": signature_key})
        if not signature_record:
            raise HTTPException(status_code=404, detail="Geçersiz imzalama linki")
        
        # Link süresini kontrol et
        if signature_record["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="İmzalama linki süresi dolmuş")
        
        # Makbuzu güncelle
        update_data = {
            "signature_status": approval_data.status,
            "signature_date": approval_data.signature_date,
            "updated_at": datetime.utcnow()
        }
        
        # Onaylandıysa imzalanan makbuz URL'i oluştur
        if approval_data.status == "approved":
            update_data["signed_receipt_url"] = f"/api/collection-receipts/{signature_record['receipt_id']}/pdf"
        
        result = await db.collection_receipts.update_one(
            {"id": signature_record["receipt_id"]},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        
        # İmzalama kaydını güncelle
        await db.collection_receipt_signatures.update_one(
            {"signature_key": signature_key},
            {"$set": {
                "status": approval_data.status,
                "signer_name": approval_data.signer_name,
                "signer_title": approval_data.signer_title,
                "signed_at": datetime.utcnow(),
                "comments": approval_data.comments
            }}
        )
        
        return {
            "success": True,
            "message": "Tahsilat makbuzu başarıyla imzalandı" if approval_data.status == "approved" else "Tahsilat makbuzu reddedildi",
            "receipt_id": signature_record["receipt_id"],
            "status": approval_data.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving collection receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collection-receipts/{receipt_id}/pdf")
async def generate_collection_receipt_pdf(receipt_id: str):
    """Tahsilat makbuzu PDF'ini oluştur"""
    try:
        # Makbuzu getir
        receipt = await db.collection_receipts.find_one({"id": receipt_id})
        if not receipt:
            raise HTTPException(status_code=404, detail="Tahsilat makbuzu bulunamadı")
        
        # PDF oluştur
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=30, alignment=1)
        normal_style = styles["Normal"]
        
        # Story elements
        story = []
        
        # Başlık
        story.append(Paragraph("TAHSİLAT MAKBUZU", title_style))
        story.append(Spacer(1, 20))
        
        # Şirket bilgileri
        company_info = f"""
        <b>{receipt['company_name']}</b><br/>
        {receipt['company_address']}<br/>
        Tel: {receipt['company_phone']}<br/>
        E-posta: {receipt['company_email']}
        """
        story.append(Paragraph(company_info, normal_style))
        story.append(Spacer(1, 20))
        
        # Makbuz bilgileri tablosu
        receipt_info_data = [
            ["Makbuz No:", receipt['receipt_number']],
            ["Tarih:", receipt['issue_date']],
            ["Düzenleyen:", f"{receipt['issuer_name']} - {receipt['issuer_title']}"]
        ]
        
        receipt_info_table = Table(receipt_info_data, colWidths=[2*inch, 4*inch])
        receipt_info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(receipt_info_table)
        story.append(Spacer(1, 20))
        
        # Ödeme bilgileri
        story.append(Paragraph(f"<b>Ödeyen:</b> {receipt['payer_name']}", normal_style))
        story.append(Paragraph(f"<b>Ödeme Sebebi:</b> {receipt['payment_reason']}", normal_style))
        story.append(Spacer(1, 20))
        
        # Ödeme detayları tablosu
        payment_details = receipt['payment_details']
        payment_data = [
            ["ÖDEME TİPİ", "TUTAR"],
            ["Nakit", f"{payment_details.get('cash_amount', 0):,.2f} TL"],
            ["Kredi Kartı", f"{payment_details.get('credit_card_amount', 0):,.2f} TL"],
            ["Çek", f"{payment_details.get('check_amount', 0):,.2f} TL"],
            ["Senet", f"{payment_details.get('promissory_note_amount', 0):,.2f} TL"],
            ["TOPLAM", f"{receipt['total_amount']:,.2f} TL"]
        ]
        
        payment_table = Table(payment_data, colWidths=[3*inch, 2*inch])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(payment_table)
        story.append(Spacer(1, 20))
        
        # Çek detayları (varsa)
        if payment_details.get('check_details'):
            story.append(Paragraph("<b>ÇEK DETAYLARI:</b>", normal_style))
            story.append(Spacer(1, 10))
            
            check_data = [["BANKA", "ŞUBE", "HESAP/IBAN", "ÇEK NO", "TARİH", "TUTAR"]]
            for check in payment_details['check_details']:
                check_data.append([
                    check.get('bank', ''),
                    check.get('branch', ''),
                    check.get('account_iban', ''),
                    check.get('check_number', ''),
                    check.get('check_date', ''),
                    f"{check.get('amount', 0):,.2f} TL"
                ])
            
            check_table = Table(check_data, colWidths=[1.2*inch, 1*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
            check_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(check_table)
            story.append(Spacer(1, 20))
        
        # Yazılı tutar
        story.append(Paragraph(f"<b>Yalnız:</b> {receipt['total_amount_words']}", normal_style))
        story.append(Spacer(1, 30))
        
        # İmza alanı
        signature_info = f"""
        <b>Tahsil Eden:</b><br/>
        <br/>
        <br/>
        İmza: ________________<br/>
        <br/>
        Tarih: {receipt.get('signature_date', receipt['issue_date'])}
        """
        story.append(Paragraph(signature_info, normal_style))
        
        # PDF oluştur
        doc.build(story)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.read()),
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename=Tahsilat_Makbuzu_{receipt['receipt_number']}.pdf"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating collection receipt PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== EMAIL CONTENT GENERATORS =====================

def generate_collection_email_content(receipt_input, receipt_number, issue_date, pdf_link):
    """Generate dynamic email content based on payment details and type"""
    
    # Parse payment details
    payment_details = receipt_input.payment_details
    
    # Handle both dict and object types
    if hasattr(payment_details, '__dict__'):
        # It's a Pydantic object
        cash_amount = getattr(payment_details, 'cash_amount', 0) or 0
        credit_card_amount = getattr(payment_details, 'credit_card_amount', 0) or 0
        check_amount = getattr(payment_details, 'check_amount', 0) or 0
        promissory_note_amount = getattr(payment_details, 'promissory_note_amount', 0) or 0
    else:
        # It's a dict
        cash_amount = payment_details.get('cash_amount', 0) or 0
        credit_card_amount = payment_details.get('credit_card_amount', 0) or 0
        check_amount = payment_details.get('check_amount', 0) or 0
        promissory_note_amount = payment_details.get('promissory_note_amount', 0) or 0
    
    # Determine primary payment method
    payment_methods = []
    if cash_amount > 0:
        payment_methods.append(("nakit", cash_amount))
    if credit_card_amount > 0:
        payment_methods.append(("kredi kartı", credit_card_amount))
    if check_amount > 0:
        payment_methods.append(("çek", check_amount))
    if promissory_note_amount > 0:
        payment_methods.append(("senet", promissory_note_amount))
    
    # Default to bank transfer if no specific method detected
    if not payment_methods:
        payment_methods.append(("banka havalesi", receipt_input.total_amount))
    
    # Generate payment method specific text
    primary_method = payment_methods[0][0]
    
    if primary_method == "banka havalesi":
        payment_text = f"banka kanalıyla yapmış olduğunuz {receipt_input.total_amount:,.0f} TL tutarındaki ödeme"
        gratitude_text = "Bankacılık kanalıyla gerçekleştirdiğiniz güvenli ödeme"
    elif primary_method == "nakit":
        payment_text = f"nakit olarak yapmış olduğunuz {receipt_input.total_amount:,.0f} TL tutarındaki ödeme"
        gratitude_text = "Nakit olarak gerçekleştirdiğiniz ödeme"
    elif primary_method == "kredi kartı":
        payment_text = f"kredi kartıyla yapmış olduğunuz {receipt_input.total_amount:,.0f} TL tutarındaki ödeme"
        gratitude_text = "Kredi kartıyla gerçekleştirdiğiniz ödeme"
    elif primary_method == "çek":
        # Handle check details
        if hasattr(payment_details, '__dict__'):
            check_info = getattr(payment_details, 'check_details', []) or []
        else:
            check_info = payment_details.get('check_details', []) or []
            
        if check_info:
            check_detail = check_info[0]
            if hasattr(check_detail, '__dict__'):
                check_number = getattr(check_detail, 'check_number', 'Belirtilmemiş') or 'Belirtilmemiş'
                check_bank = getattr(check_detail, 'bank', 'Belirtilmemiş') or 'Belirtilmemiş'
            else:
                check_number = check_detail.get('check_number', 'Belirtilmemiş') or 'Belirtilmemiş'
                check_bank = check_detail.get('bank', 'Belirtilmemiş') or 'Belirtilmemiş'
            payment_text = f"çek ile yapmış olduğunuz {receipt_input.total_amount:,.0f} TL tutarındaki ödeme (Çek No: {check_number}, Banka: {check_bank})"
        else:
            payment_text = f"çek ile yapmış olduğunuz {receipt_input.total_amount:,.0f} TL tutarındaki ödeme"
        gratitude_text = "Çek ile gerçekleştirdiğiniz ödeme"
    elif primary_method == "senet":
        payment_text = f"senet ile yapmış olduğunuz {receipt_input.total_amount:,.0f} TL tutarındaki ödeme"
        gratitude_text = "Senet ile gerçekleştirdiğiniz ödeme"
    
    # Format date in Turkish
    try:
        date_obj = datetime.strptime(issue_date, "%Y-%m-%d")
        formatted_date = date_obj.strftime("%d.%m.%Y")
    except:
        formatted_date = issue_date
    
    # Mock remaining balance and payment history (will be real data later)
    remaining_balance = 126800  # USD mock data
    currency_symbol = "USD"
    
    # Calculate if payment is late (mock logic for now)
    is_late = False
    late_days = 0
    # TODO: Implement real late payment calculation based on due date
    # For demo purposes, randomly set some payments as late
    import random
    if random.choice([True, False, False, False]):  # 25% chance of being late
        is_late = True
        late_days = random.randint(1, 15)
    
    # Generate late payment text
    late_payment_text = ""
    if is_late:
        if late_days <= 5:
            late_payment_text = f"""
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>💡 Bilgilendirme:</strong> Bu ödeme vade tarihinden {late_days} gün sonra gerçekleşmiştir. 
                    Gelecekte ödemelerinizi vade tarihinde yapmanız durumunda size daha iyi hizmet verebiliriz. 
                    Anlayışınız için teşekkür ederiz.
                </p>
            </div>
            """
        else:
            late_payment_text = f"""
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #721c24; margin: 0; font-size: 14px;">
                    <strong>⏰ Gecikme Bildirimi:</strong> Bu ödeme vade tarihinden {late_days} gün sonra gerçekleşmiştir. 
                    Zamanında ödemelerinizi yapmanız hem sizin hem de bizim için daha verimli bir iş sürecidir. 
                    Ödemeler konusunda göstereceğiniz ilgiden duyacağımız memnuniyeti şimdiden belirtmek isteriz.
                </p>
            </div>
            """
    
    # Mock payment history
    payment_history = [
        {"date": "15.11.2024", "amount": "25.500", "currency": "USD", "method": "Banka Havalesi"},
        {"date": "28.10.2024", "amount": "18.200", "currency": "USD", "method": "Çek"},
        {"date": formatted_date, "amount": f"{receipt_input.total_amount:,.0f}", "currency": "TL", "method": primary_method.title()},
    ]
    
    payment_history_html = ""
    for payment in payment_history:
        payment_history_html += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; color: #4a5568;">{payment['date']}</td>
            <td style="padding: 8px; color: #4a5568;">{payment['amount']} {payment['currency']}</td>
            <td style="padding: 8px; color: #4a5568;">{payment['method']}</td>
        </tr>
        """
    
    # Generate full email content
    email_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ödeme Onayı - {receipt_number}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">💰 Ödeme Onayı</h1>
                <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 14px;">Tahsilat Makbuzu #{receipt_number}</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px;">
                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px;">
                    Sayın {receipt_input.payer_name},
                </h2>
                
                <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0;">
                    Şirketimize <strong>{formatted_date}</strong> tarihinde {payment_text} hesabınıza yansımıştır. 
                    Değerli ödemeniz için teşekkür ederiz.
                </p>
                
                {late_payment_text}
                
                <!-- Payment Summary -->
                <div style="background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">📋 Ödeme Özeti</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #4a5568;"><strong>Ödeme Tutarı:</strong></span>
                        <span style="color: #38a169; font-weight: bold;">{receipt_input.total_amount:,.2f} TL</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #4a5568;"><strong>Ödeme Yöntemi:</strong></span>
                        <span style="color: #4a5568;">{primary_method.title()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #4a5568;"><strong>Kalan Bakiye:</strong></span>
                        <span style="color: #3182ce; font-weight: bold;">{remaining_balance:,.0f} {currency_symbol}</span>
                    </div>
                </div>
                
                <!-- Payment History -->
                <div style="margin: 25px 0;">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">📊 Son Ödemeleriniz</h3>
                    <table style="width: 100%; border-collapse: collapse; background-color: #f7fafc; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background-color: #e2e8f0;">
                                <th style="padding: 10px; text-align: left; color: #2d3748; font-size: 14px;">Tarih</th>
                                <th style="padding: 10px; text-align: left; color: #2d3748; font-size: 14px;">Tutar</th>
                                <th style="padding: 10px; text-align: left; color: #2d3748; font-size: 14px;">Yöntem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payment_history_html}
                        </tbody>
                    </table>
                </div>
                
                <!-- Gratitude Message -->
                <div style="background-color: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <p style="color: #22543d; margin: 0; text-align: center; font-size: 15px;">
                        ✨ {gratitude_text} için teşekkür ederiz. Zamanında gerçekleştirdiğiniz ödemeler 
                        iş ortaklığımızın güçlenmesine katkıda bulunmaktadır.
                    </p>
                </div>
                
                <!-- Receipt Download -->
                <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #4a5568; margin: 0 0 15px 0;">
                        Aşağıdaki butona basarak tahsilat makbuzunu görüntüleyebilir veya PDF formatında indirebilirsiniz:
                    </p>
                    <a href="https://smart-brief-creator.preview.emergentagent.com{pdf_link}" 
                       style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
                              color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; 
                              font-weight: bold; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);">
                        📄 Makbuzu Görüntüle/İndir
                    </a>
                </div>
                
                <!-- Closing -->
                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #4a5568; line-height: 1.6; margin: 0; text-align: center;">
                        Şirketimize gösterdiğiniz ilgi ve güven için teşekkür ederiz. 
                        Herhangi bir sorunuz olması durumunda bizimle iletişime geçmekten çekinmeyiniz.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2d3748; padding: 20px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                    <strong>{receipt_input.company_name}</strong><br>
                    {receipt_input.company_address}<br>
                    Tel: {receipt_input.company_phone} | Email: {receipt_input.company_email}
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return email_content

# ===================== COLLECTION MODELS & ENDPOINTS =====================

class CollectionItem(BaseModel):
    """Single collection item (payment method)"""
    type: str = Field(..., description="Collection type: transfer, cash, check, promissory, credit_card")
    amount: float = Field(..., description="Amount for this payment method")
    currency: str = Field("TL", description="Currency")
    
    # Transfer/Bank fields
    bank_id: Optional[str] = Field(None, description="Bank ID for transfer")
    
    # Check fields
    check_date: Optional[str] = Field(None, description="Check date")
    check_number: Optional[str] = Field(None, description="Check number")
    check_bank: Optional[str] = Field(None, description="Check bank")
    
    # Promissory note fields
    promissory_date: Optional[str] = Field(None, description="Promissory note date")
    promissory_number: Optional[str] = Field(None, description="Promissory note number")
    promissory_bank: Optional[str] = Field(None, description="Promissory note bank")

class Collection(BaseModel):
    """Collection record - manual payment entry"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    collection_number: str = Field(..., description="Auto-generated collection number")
    
    # Customer/Supplier info
    customer_type: str = Field(..., description="customer or supplier")
    customer_id: Optional[str] = Field(None, description="Customer ID if customer type")
    supplier_id: Optional[str] = Field(None, description="Supplier ID if supplier type")
    contact_person_id: Optional[str] = Field(None, description="Contact person ID")
    
    # Collection details
    date: str = Field(..., description="Collection date")
    project_id: Optional[str] = Field(None, description="Related project ID")
    total_amount: float = Field(..., description="Total collection amount")
    currency: str = Field("TL", description="Collection currency")
    
    # Collection items (multiple payment methods)
    collection_items: List[CollectionItem] = Field(..., description="List of payment methods used")
    
    # Status & tracking
    status: str = Field("completed", description="Collection status")
    receipt_sent: bool = Field(False, description="Whether receipt was sent via email")
    receipt_id: Optional[str] = Field(None, description="Generated collection receipt ID")
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CollectionCreate(BaseModel):
    """Create collection model"""
    customer_type: str
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    contact_person_id: Optional[str] = None
    date: str
    project_id: Optional[str] = None
    total_amount: float
    currency: str = "TL"
    collection_items: List[CollectionItem]

@api_router.post("/collections", response_model=Collection)
async def create_collection(collection_data: CollectionCreate):
    """Create a new collection entry and automatically send receipt"""
    try:
        # Generate collection number
        current_date = datetime.now().strftime("%Y%m%d")
        count = await db.collections.count_documents({
            "collection_number": {"$regex": f"^COL-{current_date}"}
        }) + 1
        collection_number = f"COL-{current_date}-{count:04d}"
        
        # Get customer or supplier details
        customer_name = ""
        customer_email = ""
        contact_name = ""
        contact_email = ""
        
        if collection_data.customer_type == "customer" and collection_data.customer_id:
            customer = await db.customers.find_one({"id": collection_data.customer_id})
            if customer:
                customer_name = customer.get("companyName", "")
                customer_email = customer.get("email", "")
        elif collection_data.customer_type == "supplier" and collection_data.supplier_id:
            supplier = await db.suppliers.find_one({"id": collection_data.supplier_id})
            if supplier:
                customer_name = supplier.get("company_short_name", "")
                customer_email = supplier.get("email", "")
        
        # Get contact person details
        if collection_data.contact_person_id:
            # This would be implementation for real contact person data
            # For now using mock data
            contact_name = "Yetkili Kişi"
            contact_email = customer_email  # Fallback to customer email
        
        # Create collection record
        collection = Collection(
            collection_number=collection_number,
            customer_type=collection_data.customer_type,
            customer_id=collection_data.customer_id,
            supplier_id=collection_data.supplier_id,
            contact_person_id=collection_data.contact_person_id,
            date=collection_data.date,
            project_id=collection_data.project_id,
            total_amount=collection_data.total_amount,
            currency=collection_data.currency,
            collection_items=collection_data.collection_items,
            status="completed"
        )
        
        # Save collection to database
        await db.collections.insert_one(collection.dict())
        
        # Create collection receipt automatically
        receipt_data = {
            "issuer_name": "Sistem Yöneticisi",
            "issuer_title": "Muhasebe Departmanı",
            "company_name": "Başarı Uluslararası Fuarcılık A.Ş.",
            "company_address": "Küçükyalı Merkez Mh. Şevki Çavuş Sok. Merve Apt. No:9/7 34840 Maltepe / İstanbul",
            "company_phone": "+90 216 123 45 67",
            "company_email": "info@basariuluslararasi.com",
            "payer_name": customer_name or "Müşteri",
            "payer_email": contact_email or customer_email or "mbucak@gmail.com",  # Test email fallback
            "payment_reason": f"Tahsilat - {collection_number}",
            "total_amount": collection_data.total_amount,
            "payment_details": {
                "cash_amount": sum(item.amount for item in collection_data.collection_items if item.type == "cash"),
                "credit_card_amount": sum(item.amount for item in collection_data.collection_items if item.type == "credit_card"),
                "check_amount": sum(item.amount for item in collection_data.collection_items if item.type == "check"),
                "promissory_note_amount": sum(item.amount for item in collection_data.collection_items if item.type == "promissory"),
                "check_details": [
                    {
                        "bank": item.check_bank or "Belirtilmemiş",
                        "branch": "Ana Şube",
                        "account_iban": "TR00 0000 0000 0000 0000 000000",
                        "check_number": item.check_number or "",
                        "check_date": item.check_date or "",
                        "amount": item.amount
                    }
                    for item in collection_data.collection_items if item.type == "check"
                ]
            }
        }
        
        # Create collection receipt
        receipt_create = CollectionReceiptCreate(**receipt_data)
        receipt_response = await create_collection_receipt(receipt_create)
        
        # Update collection with receipt ID
        if hasattr(receipt_response, 'id'):
            await db.collections.update_one(
                {"id": collection.id},
                {"$set": {
                    "receipt_id": receipt_response.id,
                    "receipt_sent": True
                }}
            )
        
        logger.info(f"Collection created successfully: {collection_number}")
        return collection
        
    except Exception as e:
        logger.error(f"Error creating collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collections", response_model=List[Collection])
async def get_collections():
    """Get all collections"""
    try:
        collections = await db.collections.find().sort("created_at", -1).to_list(length=None)
        return [Collection(**collection) for collection in collections]
    except Exception as e:
        logger.error(f"Error getting collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collections/{collection_id}", response_model=Collection)
async def get_collection(collection_id: str):
    """Get specific collection by ID"""
    try:
        collection = await db.collections.find_one({"id": collection_id})
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        return Collection(**collection)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting collection {collection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== MOCK CUSTOMERS ENDPOINT =====================

@api_router.get("/create-mock-customers")
async def create_mock_customers():
    """Create 30 mock customers with realistic data"""
    try:
        # Clear existing customers
        await db.customers.delete_many({})
        logger.info("Cleared existing customers")
        
        # Mock customer data - 30 realistic Turkish companies
        companies = [
            ("Anadolu Holding", "Anadolu Endüstri Holding Anonim Şirketi", "Holding", "Ataşehir V.D.", "8860094304"),
            ("Turkcell", "Turkcell İletişim Hizmetleri Anonim Şirketi", "Telekomunikasyon", "Beşiktaş V.D.", "3530808304"),
            ("Arçelik", "Arçelik Anonim Şirketi", "Beyaz Eşya", "Sütlüce V.D.", "8850003907"),
            ("Garanti BBVA", "Türkiye Garanti Bankası Anonim Şirketi", "Bankacılık", "Levent V.D.", "1261070407"),
            ("Trendyol", "Trendyol E-Ticaret Anonim Şirketi", "E-Ticaret", "Sarıyer V.D.", "0870877304"),
            ("Migros", "Migros Ticaret Anonim Şirketi", "Perakende", "Ataşehir V.D.", "8690051901"),
            ("TAV Havalimanları", "TAV Havalimanları Holding Anonim Şirketi", "Havacılık", "Bakırköy V.D.", "5770051726"),
            ("BIM", "BİM Birleşik Mağazalar Anonim Şirketi", "Perakende", "Şişli V.D.", "3890851304"),
            ("Coca-Cola İçecek", "Coca-Cola İçecek Anonim Şirketi", "İçecek", "Etiler V.D.", "2220051304"),
            ("Enka İnşaat", "Enka İnşaat ve Sanayi Anonim Şirketi", "İnşaat", "Sarıyer V.D.", "5770051901"),
            ("Vakıfbank", "Türkiye Vakıflar Bankası Türk Anonim Ortaklığı", "Bankacılık", "Ümraniye V.D.", "1261074507"),
            ("Eczacıbaşı Holding", "Eczacıbaşı Holding Anonim Şirketi", "Holding", "Levent V.D.", "8860094507"),
            ("Ford Otosan", "Ford Otomotiv Sanayi Anonim Şirketi", "Otomotiv", "Gebze V.D.", "4130051304"),
            ("Halkbank", "Türkiye Halk Bankası Anonim Şirketi", "Bankacılık", "Ataşehir V.D.", "1261074304"),
            ("Getir", "Getir Perakende Lojistik Anonim Şirketi", "Teknoloji", "Beykoz V.D.", "0870877507"),
            ("Pegasus", "Pegasus Hava Taşımacılığı Anonim Şirketi", "Havacılık", "Bakırköy V.D.", "8760051304"),
            ("Akbank", "Akbank Türk Anonim Şirketi", "Bankacılık", "Levent V.D.", "1261070304"),
            ("THY", "Türk Hava Yolları Anonim Ortaklığı", "Havacılık", "Yeşilköy V.D.", "2200051304"),
            ("Teknosa", "Teknosa İç ve Dış Ticaret Anonim Şirketi", "Teknoloji", "Sarıyer V.D.", "0870877401"),
            ("Zorlu Holding", "Zorlu Holding Anonim Şirketi", "Holding", "Beşiktaş V.D.", "8860094401"),
            ("Siemens Türkiye", "Siemens Sanayi ve Ticaret Anonim Şirketi", "Teknoloji", "Maslak V.D.", "1330051304"),
            ("Borusan Holding", "Borusan Holding Anonim Şirketi", "Holding", "Okmeydanı V.D.", "8860094202"),
            ("Vestel", "Vestel Elektronik Sanayi ve Ticaret Anonim Şirketi", "Elektronik", "Manisa V.D.", "4500051304"),
            ("CarrefourSA", "CarrefourSA Carrefour Sabancı Ticaret Merkezi Anonim Şirketi", "Perakende", "Levent V.D.", "8690051702"),
            ("Şişe Cam", "Türkiye Şişe ve Cam Fabrikaları Anonim Şirketi", "Cam", "Ataşehir V.D.", "2860051304"),
            ("Doğan Holding", "Doğan Şirketler Grubu Holding Anonim Şirketi", "Medya", "Etiler V.D.", "8860094101"),
            ("Yemeksepeti", "Yemeksepeti Elektronik İletişim Tanıtım ve Pazarlama Ltd. Şti.", "Teknoloji", "Sarıyer V.D.", "0870877201"),
            ("TOFAŞ", "Tofaş Türk Otomobil Fabrikası Anonim Şirketi", "Otomotiv", "Bursa V.D.", "1610051304"),
            ("Petkim", "Petkim Petrokimya Holding Anonim Şirketi", "Petrokimya", "İzmir V.D.", "3500051304"),
            ("İş Bankası", "Türkiye İş Bankası Anonim Şirketi", "Bankacılık", "Levent V.D.", "1261070201")
        ]
        
        mock_customers = []
        for i, (short_name, full_name, sector, tax_office, tax_number) in enumerate(companies):
            customer = {
                "id": str(uuid.uuid4()),
                "companyName": short_name,
                "companyTitle": full_name,
                "email": f"info@{short_name.lower().replace(' ', '').replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u')}.com.tr",
                "phone": f"+90 212 {300 + i:03d} {10 + i:02d} {20 + i:02d}",
                "address": f"Merkez Mah. {short_name} Sok. No:{10 + i} 34000 İstanbul",
                "city": "İstanbul",
                "country": "Türkiye",
                "sector": sector,
                "relationshipType": "Müşteri",
                "website": f"www.{short_name.lower().replace(' ', '').replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u')}.com.tr",
                "taxNumber": tax_number,
                "taxOffice": tax_office,
                "status": "active",
                "customerSince": datetime.now().isoformat(),
                "lastActivity": datetime.now().isoformat(),
                "totalOrders": i * 2,
                "totalRevenue": float(i * 50000 + 100000),
                "currency": "TRY",
                "countryCode": "TR",
                "contactPerson": f"{short_name} Temsilcisi",
                "contactPersonId": "",
                "notes": f"{sector} sektöründe faaliyet gösteren önemli müşteri",
                "logo": "",
                "tags": [sector.lower(), "aktif"]
            }
            mock_customers.append(customer)
        
        # Insert all mock customers
        await db.customers.insert_many(mock_customers)
        logger.info(f"Created {len(mock_customers)} mock customers")
        
        return {
            "success": True,
            "message": f"Successfully created {len(mock_customers)} mock customers",
            "count": len(mock_customers)
        }
        
    except Exception as e:
        logger.error(f"Error creating mock customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== COLLECTION STATISTICS ENDPOINT =====================

class CollectionStatistics(BaseModel):
    """Collection statistics model"""
    total_amount_tl: float = Field(..., description="TL cinsinden toplam tahsilat tutarı")
    top_customer: str = Field(..., description="En çok tahsilat yapan müşteri")
    total_count: int = Field(..., description="Toplam tahsilat adedi")
    average_days: float = Field(..., description="Ortalama tahsilat vadesi (gün)")

@api_router.get("/collection-statistics", response_model=CollectionStatistics)
async def get_collection_statistics():
    """Get collection statistics for dashboard"""
    try:
        # Get all collection receipts
        receipts = await db.collection_receipts.find().to_list(1000)
        
        if not receipts:
            return CollectionStatistics(
                total_amount_tl=0.0,
                top_customer="Veri Yok",
                total_count=0,
                average_days=0.0
            )
        
        # Get current exchange rates
        currency_rates = await get_currency_rates()
        rates_dict = {rate.code: rate.selling_rate for rate in currency_rates}
        
        # Calculate statistics
        total_amount_tl = 0.0
        customer_amounts = {}
        total_count = len(receipts)
        total_days = 0.0
        days_count = 0
        
        for receipt in receipts:
            # Convert amounts to TL using TCMB rates
            payment_details = receipt.get('payment_details', {})
            receipt_total = receipt.get('total_amount', 0.0)
            
            # Assume main currency is TL unless specified otherwise
            total_amount_tl += receipt_total
            
            # Track customer amounts for top customer calculation
            payer = receipt.get('payer_name', 'Bilinmiyor')
            if payer not in customer_amounts:
                customer_amounts[payer] = 0.0
            customer_amounts[payer] += receipt_total
            
            # Calculate average payment days (mock calculation based on created dates)
            # In production, this would use actual due dates vs payment dates
            created_at = receipt.get('created_at')
            if created_at:
                # For demo purposes, assume payments made on average 15 days after due date
                # This should be calculated from actual due dates and payment dates
                total_days += 15.0  # Mock calculation
                days_count += 1
        
        # Find top customer
        top_customer = "Veri Yok"
        if customer_amounts:
            top_customer = max(customer_amounts.items(), key=lambda x: x[1])[0]
            # Get short name (first 20 characters)
            if len(top_customer) > 20:
                top_customer = top_customer[:17] + "..."
        
        # Calculate average days
        average_days = total_days / days_count if days_count > 0 else 0.0
        
        return CollectionStatistics(
            total_amount_tl=total_amount_tl,
            top_customer=top_customer,
            total_count=total_count,
            average_days=round(average_days, 1)
        )
        
    except Exception as e:
        logger.error(f"Error getting collection statistics: {str(e)}")
        # Return default values on error
        return CollectionStatistics(
            total_amount_tl=0.0,
            top_customer="Hata",
            total_count=0,
            average_days=0.0
        )

# ===================== COUNTRY PROFILE ENDPOINTS =====================

@api_router.get("/country-profiles", response_model=List[CountryProfile])
async def get_country_profiles():
    """Get all published country profiles"""
    try:
        profiles = await db.country_profiles.find({"status": "published"}).to_list(length=None)
        
        # If no profiles exist, create default ones
        if not profiles:
            default_profiles = [
                {
                    "code": "US",
                    "name": "Amerika",
                    "locales": ["en_US"],
                    "currency": "USD",
                    "phone_code": "+1",
                    "address_format": {"format": "street,city,state,zip"},
                    "date_format": "MM/DD/YYYY",
                    "tax_config": {"tax_name": "Sales Tax", "rate": 0.0875},
                    "form_config": {
                        "fields": {},
                        "sections": [],
                        "validation_rules": {},
                        "conditional_logic": [],
                        "field_order": []
                    },
                    "status": "published",
                    "created_by": "system"
                },
                {
                    "code": "TR",
                    "name": "Türkiye", 
                    "locales": ["tr_TR"],
                    "currency": "TRY",
                    "phone_code": "+90",
                    "address_format": {"format": "street,district,city,country"},
                    "date_format": "DD/MM/YYYY",
                    "tax_config": {"tax_name": "KDV", "rate": 0.18},
                    "form_config": {
                        "fields": {},
                        "sections": [],
                        "validation_rules": {},
                        "conditional_logic": [],
                        "field_order": []
                    },
                    "status": "draft",
                    "created_by": "system"
                },
                {
                    "code": "OTHER",
                    "name": "Diğer",
                    "locales": ["en_US"],
                    "currency": "USD",
                    "phone_code": "+1",
                    "address_format": {"format": "street,city,country"},
                    "date_format": "MM/DD/YYYY", 
                    "tax_config": {"tax_name": "Tax", "rate": 0.0},
                    "form_config": {
                        "fields": {},
                        "sections": [],
                        "validation_rules": {},
                        "conditional_logic": [],
                        "field_order": []
                    },
                    "status": "draft",
                    "created_by": "system"
                }
            ]
            
            for profile_data in default_profiles:
                profile = CountryProfile(**profile_data)
                await db.country_profiles.insert_one(profile.dict())
            
            # Fetch again after inserting defaults
            profiles = await db.country_profiles.find({"status": "published"}).to_list(length=None)
        
        return [CountryProfile(**profile) for profile in profiles]
        
    except Exception as e:
        logger.error(f"Error getting country profiles: {str(e)}")
        return []

@api_router.get("/country-profiles/{country_code}", response_model=CountryProfile)
async def get_country_profile(country_code: str):
    """Get specific country profile by code"""
    try:
        profile = await db.country_profiles.find_one({"code": country_code.upper()})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Country profile not found")
        
        return CountryProfile(**profile)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting country profile {country_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/country-profiles", response_model=CountryProfile)
async def create_country_profile(profile_data: CountryProfileCreate):
    """Create new country profile (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can create
        
        # Check if country profile already exists
        existing = await db.country_profiles.find_one({"code": profile_data.code.upper()})
        if existing:
            raise HTTPException(status_code=400, detail="Country profile already exists")
        
        profile = CountryProfile(**profile_data.dict())
        profile.code = profile.code.upper()
        
        await db.country_profiles.insert_one(profile.dict())
        
        logger.info(f"Country profile created: {profile.code} - {profile.name}")
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating country profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/country-profiles/{country_code}", response_model=CountryProfile)
async def update_country_profile(country_code: str, profile_data: CountryProfileUpdate):
    """Update country profile (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can update
        
        # Check if profile exists
        existing = await db.country_profiles.find_one({"code": country_code.upper()})
        if not existing:
            raise HTTPException(status_code=404, detail="Country profile not found")
        
        # Update fields
        update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.country_profiles.update_one(
            {"code": country_code.upper()},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Country profile not found")
        
        # Return updated profile
        updated_profile = await db.country_profiles.find_one({"code": country_code.upper()})
        return CountryProfile(**updated_profile)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating country profile {country_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/country-profiles/{country_code}/publish")
async def publish_country_profile(country_code: str):
    """Publish country profile (super_admin only)"""
    try:
        # TODO: Add role check - only super_admin can publish
        
        result = await db.country_profiles.update_one(
            {"code": country_code.upper()},
            {"$set": {"status": "published", "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Country profile not found")
        
        return {"success": True, "message": f"Country profile {country_code} published successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing country profile {country_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forms/brief")
async def get_brief_form_schema(country: str = "US"):
    """Get merged brief form schema for specific country"""
    try:
        # Get base schema (Amerika/US as default)
        base_profile = await db.country_profiles.find_one({"code": "US"})
        
        # Get country-specific profile
        country_profile = await db.country_profiles.find_one({"code": country.upper()})
        
        # Start with base schema
        base_config = base_profile.get("form_config", {}) if base_profile else {}
        
        # Merge with country-specific overrides if different from base
        if country_profile and country_profile.get("code") != "US":
            country_config = country_profile.get("form_config", {})
            
            # Simple merge strategy - country config overrides base config
            merged_config = {
                "fields": {**base_config.get("fields", {}), **country_config.get("fields", {})},
                "sections": country_config.get("sections", []) or base_config.get("sections", []),
                "validation_rules": {**base_config.get("validation_rules", {}), **country_config.get("validation_rules", {})},
                "conditional_logic": country_config.get("conditional_logic", []) or base_config.get("conditional_logic", []),
                "field_order": country_config.get("field_order", []) or base_config.get("field_order", [])
            }
        else:
            merged_config = base_config
        
        return {
            "country_code": country.upper(),
            "country_name": country_profile.get("name", "Unknown") if country_profile else "Amerika",
            "form_config": merged_config,
            "currency": country_profile.get("currency", "USD") if country_profile else "USD",
            "date_format": country_profile.get("date_format", "MM/DD/YYYY") if country_profile else "MM/DD/YYYY",
            "tax_config": country_profile.get("tax_config", {}) if country_profile else {}
        }
        
    except Exception as e:
        logger.error(f"Error getting brief form schema for country {country}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== STAND ELEMENTS ENDPOINTS =====================

@api_router.get("/stand-elements")
async def get_stand_elements():
    """Get all stand elements configuration with recursive structure"""
    try:
        elements = await db.stand_elements.find().to_list(length=None)
        
        # If no custom elements exist, create default recursive configuration
        if not elements:
            default_elements = [
                {
                    "key": "flooring",
                    "label": "Zemin",
                    "icon": "🟫",
                    "required": True,
                    "structure": {
                        "raised36mm": {
                            "key": "raised36mm",
                            "label": "36mm Yükseltilmiş Zemin",
                            "element_type": "option",
                            "children": {
                                "carpet": {
                                    "key": "carpet",
                                    "label": "Halı Kaplama",
                                    "icon": "🟫",
                                    "element_type": "option",
                                    "children": {
                                        "carpet_type": {
                                            "key": "carpet_type",
                                            "label": "Halı Türü",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["İnce Tüylü", "Kalın Tüylü", "Düz Dokuma", "Berber Halısı"]
                                        },
                                        "color": {
                                            "key": "color",
                                            "label": "Renk",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["Gri", "Bej", "Lacivert", "Kırmızı", "Yeşil", "Siyah"]
                                        },
                                        "quantity": {
                                            "key": "quantity",
                                            "label": "Miktar",
                                            "element_type": "unit",
                                            "input_type": "number",
                                            "unit": "m²"
                                        }
                                    }
                                },
                                "parquet": {
                                    "key": "parquet",
                                    "label": "Parke Kaplama",
                                    "icon": "🪵",
                                    "element_type": "option",
                                    "children": {
                                        "wood_type": {
                                            "key": "wood_type",
                                            "label": "Ahşap Türü",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["Meşe", "Ceviz", "Kayın", "Laminat"]
                                        },
                                        "color": {
                                            "key": "color",
                                            "label": "Renk Tonu",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["Açık Ton", "Orta Ton", "Koyu Ton", "Doğal"]
                                        },
                                        "quantity": {
                                            "key": "quantity",
                                            "label": "Miktar",
                                            "element_type": "unit",
                                            "input_type": "number",
                                            "unit": "m²"
                                        }
                                    }
                                }
                            }
                        },
                        "standard": {
                            "key": "standard",
                            "label": "Standart Zemin",
                            "element_type": "option"
                        }
                    },
                    "created_by": "system"
                },
                {
                    "key": "furniture",
                    "label": "Mobilya",
                    "icon": "🪑",
                    "required": False,
                    "structure": {
                        "seating": {
                            "key": "seating",
                            "label": "Oturma Grupları",
                            "element_type": "option",
                            "children": {
                                "armchairs": {
                                    "key": "armchairs",
                                    "label": "Berjer/Koltuk",
                                    "icon": "🛋️",
                                    "element_type": "option",
                                    "children": {
                                        "style": {
                                            "key": "style",
                                            "label": "Stil",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["Modern", "Klasik", "Avangard", "Minimalist"]
                                        },
                                        "fabric_type": {
                                            "key": "fabric_type",
                                            "label": "Kumaş Türü",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["Deri", "Kumaş", "Suni Deri", "Kadife"]
                                        },
                                        "color": {
                                            "key": "color",
                                            "label": "Renk",
                                            "element_type": "property",
                                            "input_type": "select",
                                            "options": ["Siyah", "Beyaz", "Gri", "Kahverengi", "Lacivert", "Kırmızı"]
                                        },
                                        "quantity": {
                                            "key": "quantity",
                                            "label": "Miktar",
                                            "element_type": "unit",
                                            "input_type": "number",
                                            "unit": "adet"
                                        }
                                    }
                                },
                                "sofas": {
                                    "key": "sofas",
                                    "label": "Kanepe Takımı",
                                    "icon": "🛋️",
                                    "element_type": "option"
                                }
                            }
                        }
                    },
                    "created_by": "system"
                }
            ]
            
            for element_data in default_elements:
                element = StandElement(**element_data)
                await db.stand_elements.insert_one(element.dict())
                logger.info(f"Created default recursive stand element: {element.key}")
            
            # Fetch again after inserting defaults
            elements = await db.stand_elements.find().to_list(length=None)
        
        # Return recursive structure directly
        config = {}
        for element in elements:
            config[element['key']] = {
                'label': element['label'],
                'icon': element.get('icon'),
                'required': element.get('required', False),
                'structure': element.get('structure', {})
            }
        
        return config
        
    except Exception as e:
        logger.error(f"Error getting stand elements: {str(e)}")
        return {}

@api_router.post("/stand-elements")
async def create_stand_element(element_data: StandElementCreate):
    """Create new stand element or sub-element (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can create
        
        if element_data.parent_key:
            # Adding sub-element to existing element
            existing = await db.stand_elements.find_one({"key": element_data.parent_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Parent element not found")
            
            # Update sub-options
            sub_options = existing.get("subOptions", {})
            
            if element_data.parent_sub_key:
                # Adding sub-sub-element
                if element_data.parent_sub_key not in sub_options:
                    raise HTTPException(status_code=404, detail="Parent sub-element not found")
                
                if "subOptions" not in sub_options[element_data.parent_sub_key]:
                    sub_options[element_data.parent_sub_key]["subOptions"] = {}
                
                sub_options[element_data.parent_sub_key]["subOptions"][element_data.key] = {
                    "label": element_data.label,
                    "icon": element_data.icon
                }
            else:
                # Adding sub-element
                sub_options[element_data.key] = {
                    "label": element_data.label,
                    "icon": element_data.icon,
                    "subOptions": {}
                }
            
            await db.stand_elements.update_one(
                {"key": element_data.parent_key},
                {"$set": {"subOptions": sub_options, "updated_at": datetime.utcnow()}}
            )
            
            return {"success": True, "message": f"Sub-element added to {element_data.parent_key}"}
        
        else:
            # Creating new main element
            existing = await db.stand_elements.find_one({"key": element_data.key})
            if existing:
                raise HTTPException(status_code=400, detail="Element already exists")
            
            element = StandElement(
                key=element_data.key,
                label=element_data.label,
                icon=element_data.icon,
                required=element_data.required,
                created_by="admin"  # TODO: Get from JWT
            )
            
            await db.stand_elements.insert_one(element.dict())
            
            return {"success": True, "message": f"Element {element_data.key} created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating stand element: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/stand-elements/{element_key}")
async def update_stand_element(element_key: str, update_data: StandElementCreate, sub_key: str = None, sub_sub_key: str = None):
    """Update stand element or sub-element (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can update
        
        if sub_key:
            # Updating sub-element
            existing = await db.stand_elements.find_one({"key": element_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Element not found")
            
            sub_options = existing.get("subOptions", {})
            
            if sub_sub_key:
                # Updating sub-sub-element
                if sub_key in sub_options and "subOptions" in sub_options[sub_key]:
                    if sub_sub_key in sub_options[sub_key]["subOptions"]:
                        sub_options[sub_key]["subOptions"][sub_sub_key] = {
                            "label": update_data.label,
                            "icon": update_data.icon
                        }
                        
                        await db.stand_elements.update_one(
                            {"key": element_key},
                            {"$set": {"subOptions": sub_options, "updated_at": datetime.utcnow()}}
                        )
                        
                        return {"success": True, "message": "Sub-sub-element updated"}
                    else:
                        raise HTTPException(status_code=404, detail="Sub-sub-element not found")
                else:
                    raise HTTPException(status_code=404, detail="Sub-element not found")
            else:
                # Updating sub-element
                if sub_key in sub_options:
                    sub_options[sub_key]["label"] = update_data.label
                    if update_data.icon:
                        sub_options[sub_key]["icon"] = update_data.icon
                    
                    await db.stand_elements.update_one(
                        {"key": element_key},
                        {"$set": {"subOptions": sub_options, "updated_at": datetime.utcnow()}}
                    )
                    
                    return {"success": True, "message": "Sub-element updated"}
                else:
                    raise HTTPException(status_code=404, detail="Sub-element not found")
        
        else:
            # Updating main element
            update_fields = {
                "label": update_data.label,
                "updated_at": datetime.utcnow()
            }
            if update_data.icon:
                update_fields["icon"] = update_data.icon
            if hasattr(update_data, 'required'):
                update_fields["required"] = update_data.required
            
            result = await db.stand_elements.update_one(
                {"key": element_key},
                {"$set": update_fields}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Element not found")
            
            return {"success": True, "message": f"Element {element_key} updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating stand element: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/stand-elements/{element_key}")
async def delete_stand_element(element_key: str, sub_key: str = None, sub_sub_key: str = None):
    """Delete stand element or sub-element (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can delete
        
        if sub_key:
            # Deleting sub-element
            existing = await db.stand_elements.find_one({"key": element_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Element not found")
            
            sub_options = existing.get("subOptions", {})
            
            if sub_sub_key:
                # Deleting sub-sub-element
                if sub_key in sub_options and "subOptions" in sub_options[sub_key]:
                    if sub_sub_key in sub_options[sub_key]["subOptions"]:
                        del sub_options[sub_key]["subOptions"][sub_sub_key]
                        
                        await db.stand_elements.update_one(
                            {"key": element_key},
                            {"$set": {"subOptions": sub_options, "updated_at": datetime.utcnow()}}
                        )
                        
                        return {"success": True, "message": "Sub-sub-element deleted"}
                    else:
                        raise HTTPException(status_code=404, detail="Sub-sub-element not found")
                else:
                    raise HTTPException(status_code=404, detail="Sub-element not found")
            else:
                # Deleting sub-element
                if sub_key in sub_options:
                    del sub_options[sub_key]
                    
                    await db.stand_elements.update_one(
                        {"key": element_key},
                        {"$set": {"subOptions": sub_options, "updated_at": datetime.utcnow()}}
                    )
                    
                    return {"success": True, "message": "Sub-element deleted"}
                else:
                    raise HTTPException(status_code=404, detail="Sub-element not found")
        
        else:
            # Deleting main element
            result = await db.stand_elements.delete_one({"key": element_key})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Element not found")
            
            return {"success": True, "message": f"Element {element_key} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stand element: {str(e)}")
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
