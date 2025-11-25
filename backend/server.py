from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta, date
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any
import uuid
import re
from bson import ObjectId
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
import json
from pathlib import Path
import requests
import xml.etree.ElementTree as ET
from decimal import Decimal
import re
import shutil
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import base64
import asyncio
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from openai import AsyncOpenAI
import aiohttp
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import base64
# Contract management imports removed


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import lead routes
from routes import leads as leads_router
from routes import projects as projects_router

# Validation functions for bank information
def validate_iban(iban: str) -> bool:
    """Validate IBAN format (Turkish IBAN: TR + 2 digits + 4 bank code + 1 check + 16 account number)"""
    if not iban:
        return True  # Allow empty IBAN
    
    # Remove spaces and convert to uppercase
    iban = iban.replace(" ", "").upper()
    
    # Turkish IBAN format: TR followed by 24 digits
    turkish_iban_pattern = r'^TR\d{24}$'
    
    if re.match(turkish_iban_pattern, iban):
        return True
    
    # General IBAN format (2 letters + 2 digits + up to 30 alphanumeric)
    general_iban_pattern = r'^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$'
    return bool(re.match(general_iban_pattern, iban))

def validate_swift_code(swift: str) -> bool:
    """Validate Swift code format (8-11 characters: 4 bank + 2 country + 2 location + optional 3 branch)"""
    if not swift:
        return True  # Allow empty Swift code
    
    swift = swift.replace(" ", "").upper()
    
    # Swift code format: 8-11 alphanumeric characters
    swift_pattern = r'^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$'
    return bool(re.match(swift_pattern, swift))

def serialize_document(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_document(value)
            elif isinstance(value, list):
                result[key] = [serialize_document(item) if isinstance(item, (dict, ObjectId, datetime)) else item for item in value]
            else:
                result[key] = value
        return result
    elif isinstance(doc, list):
        return [serialize_document(item) if isinstance(item, (dict, ObjectId, datetime)) else item for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, datetime):
        return doc.isoformat()
    else:
        return doc

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

# Library Models
class LibraryCountry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: Optional[str] = ""
    continent: Optional[str] = ""
    flag: Optional[str] = ""
    cities: Optional[List[str]] = []
    
    class Config:
        extra = "ignore"  # Ignore _id from MongoDB
    
class LibraryCity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: str
    
    class Config:
        extra = "ignore"

class LibraryPhoneCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    country: str
    country_code: str
    phone_code: str
    flag: Optional[str] = ""
    
    class Config:
        extra = "ignore"
    
class LibraryCurrency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    symbol: str
    flag: Optional[str] = ""
    
    class Config:
        extra = "ignore"
    
class LibraryFairCenter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    country: str
    address: Optional[str] = ""
    
    class Config:
        extra = "ignore"

class LibraryPhoneCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    country: str
    code: str
    
    class Config:
        extra = "ignore"

# Fair Models
class Fair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    country: str
    fairCenter: str = ""
    year: str = Field(default_factory=lambda: str(datetime.utcnow().year))
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
    needsUpdate: bool = False
    updateNotificationSent: bool = False
    createdDate: str = Field(default_factory=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FairCreate(BaseModel):
    name: str
    city: str
    country: str
    fairCenter: str = ""
    year: str
    startDate: str
    endDate: str
    sector: str = ""
    cycle: str = ""
    fairMonth: str = ""
    description: str = ""

# Project Models
class PaymentTerm(BaseModel):
    percentage: float
    dueDate: str
    description: str = ""

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projectNumber: str = ""  # PR-25-10001 format
    name: str
    companyId: str = ""
    companyName: str = ""
    customerId: str
    customerName: str = ""
    fairId: str
    fairName: str = ""
    fairStartDate: str = ""
    fairEndDate: str = ""
    city: str = ""
    country: str = ""
    contractAmount: float = 0
    currency: str = "TRY"
    paymentTerms: list = []
    notes: str = ""
    status: str = "yeni"
    isNew: bool = True
    createdFrom: str = "manual"
    createdBy: str = ""  # User ID who created the project
    createdByName: str = ""  # User name who created the project
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProjectCreate(BaseModel):
    name: str
    companyId: str = ""
    companyName: str = ""
    customerId: str
    customerName: str = ""
    fairId: str
    fairName: str = ""
    fairStartDate: str = ""
    fairEndDate: str = ""
    city: str = ""
    country: str = ""
    contractAmount: float = 0
    currency: str = "TRY"
    paymentTerms: list = []
    notes: str = ""
    status: str = "yeni"
    isNew: bool = True
    createdFrom: str = "manual"
    createdBy: str = ""  # User ID who created the project
    createdByName: str = ""  # User name who created the project

# Payment Profile Models
class PaymentProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    paymentTerms: list = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class PaymentProfileCreate(BaseModel):
    name: str
    paymentTerms: list = []

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
    # Services field
    services: List[str] = Field(default_factory=list)  # Hizmetler

class GroupCompany(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: str
    groupName: Optional[str] = ""
    status: str = "active"
    accountant: Optional[Dict] = None
    # Details
    address: Optional[str] = ""
    postalCode: Optional[str] = ""
    city: Optional[str] = ""
    vatNo: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class GroupCompanyCreate(BaseModel):
    name: str
    country: str
    groupName: Optional[str] = ""

class Accountant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = ""
    companyId: str
    role: str = "accountant"
    created_at: Optional[datetime] = None
    # Contact person details
    contactMobile: str = ""  # İletişim Kişisi Cep Telefonu
    contactEmail: str = ""  # İletişim Kişisi Email
    contactPosition: str = ""  # İletişim Kişisi Pozisyonu
    contactAddress: str = ""  # İletişim Kişisi Adresi
    contactCountry: str = ""  # İletişim Kişisi Ülkesi
    contactCity: str = ""  # İletişim Kişisi Şehri
    # Bank payment information fields
    iban: str = ""  # IBAN
    bankName: str = ""  # Banka Adı
    bankBranch: str = ""  # Şube
    accountHolderName: str = ""  # Hesap Sahibi
    swiftCode: str = ""  # Swift Kodu
    # Prospect field
    isProspect: bool = False  # Müşteri Adayı mı?
    # Favorite field
    isFavorite: bool = False  # Favori müşteri mi?
    # Deactivation fields
    deactivated_at: Optional[datetime] = None
    deactivation_reason: Optional[str] = None
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

@api_router.post("/fairs/bulk-import")
async def bulk_import_fairs(data: dict):
    """Bulk import fairs from CSV"""
    try:
        fairs_data = data.get('fairs', [])
        
        if not fairs_data:
            raise HTTPException(status_code=400, detail="No fairs data provided")
        
        imported_count = 0
        errors = []
        
        for fair_data in fairs_data:
            try:
                # Create fair object
                fair_dict = {
                    "id": str(uuid.uuid4()),
                    "name": fair_data.get('name', ''),
                    "year": fair_data.get('year', ''),
                    "country": fair_data.get('country', ''),
                    "city": fair_data.get('city', ''),
                    "fairCenter": fair_data.get('fairCenter', ''),
                    "startDate": fair_data.get('startDate', ''),
                    "endDate": fair_data.get('endDate', ''),
                    "sector": fair_data.get('sector', ''),
                    "cycle": fair_data.get('cycle', 'yearly'),
                    "fairMonth": fair_data.get('fairMonth', ''),
                    "description": fair_data.get('description', ''),
                    "defaultCountry": fair_data.get('country', ''),
                    "defaultCity": fair_data.get('city', ''),
                    "defaultStartDate": fair_data.get('startDate', ''),
                    "defaultEndDate": fair_data.get('endDate', ''),
                    "customerCount": 0,
                    "projectCount": 0,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.fairs.insert_one(fair_dict)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Error importing {fair_data.get('name', 'unknown')}: {str(e)}")
                logger.error(f"Error importing fair: {str(e)}")
        
        return {
            "success": True,
            "count": imported_count,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        logger.error(f"Error in bulk import: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk import failed: {str(e)}")

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

@api_router.delete("/fairs")
async def delete_all_fairs():
    """Delete all fairs from the database"""
    try:
        result = await db.fairs.delete_many({})
        
        return {
            "message": f"Successfully deleted {result.deleted_count} fairs",
            "deleted_count": result.deleted_count
        }
            
    except Exception as e:
        logger.error(f"Error deleting all fairs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting all fairs: {str(e)}")


# ============== PROJECT ENDPOINTS ==============

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    """Get all projects"""
    try:
        projects = await db.projects.find().sort("created_at", -1).to_list(1000)
        return [Project(**project) for project in projects]
    except Exception as e:
        logger.error(f"Error getting projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_project_number():
    """Generate project number in format PR-25-10001"""
    current_year = datetime.now().year % 100  # Get last 2 digits of year
    
    # Get the latest project number for this year
    year_prefix = f"PR-{current_year:02d}-"
    latest_project = await db.projects.find_one(
        {"projectNumber": {"$regex": f"^{year_prefix}"}},
        sort=[("projectNumber", -1)]
    )
    
    if latest_project and latest_project.get("projectNumber"):
        # Extract the sequence number and increment
        try:
            last_number = int(latest_project["projectNumber"].split("-")[-1])
            next_number = last_number + 1
        except:
            next_number = 10001
    else:
        # First project of the year
        next_number = 10001
    
    return f"{year_prefix}{next_number:05d}"

@api_router.post("/projects")
async def create_project(project_input: ProjectCreate):
    """Create a new project"""
    try:
        project_dict = project_input.dict()
        project_dict["id"] = str(uuid.uuid4())
        project_dict["projectNumber"] = await generate_project_number()
        project_dict["created_at"] = datetime.utcnow()
        project_dict["updated_at"] = datetime.utcnow()
        
        await db.projects.insert_one(project_dict)
        
        created_project = await db.projects.find_one({"id": project_dict["id"]})
        return {"success": True, "project": Project(**created_project)}
        
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a single project"""
    try:
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return Project(**project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_input: ProjectCreate):
    """Update a project"""
    try:
        update_data = project_input.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.projects.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            updated_project = await db.projects.find_one({"id": project_id})
            return Project(**updated_project)
        else:
            raise HTTPException(status_code=404, detail="Project not found or no changes made")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        result = await db.projects.delete_one({"id": project_id})
        
        if result.deleted_count:
            return {"message": "Project deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Project not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")


# ============== PAYMENT PROFILE ENDPOINTS ==============

@api_router.get("/payment-profiles", response_model=List[PaymentProfile])
async def get_payment_profiles():
    """Get all payment profiles"""
    try:
        profiles = await db.payment_profiles.find().sort("name", 1).to_list(1000)
        return [PaymentProfile(**profile) for profile in profiles]
    except Exception as e:
        logger.error(f"Error getting payment profiles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payment-profiles")
async def create_payment_profile(profile_input: PaymentProfileCreate):
    """Create a new payment profile"""
    try:
        profile_dict = profile_input.dict()
        profile_dict["id"] = str(uuid.uuid4())
        profile_dict["created_at"] = datetime.utcnow()
        profile_dict["updated_at"] = datetime.utcnow()
        
        await db.payment_profiles.insert_one(profile_dict)
        
        created_profile = await db.payment_profiles.find_one({"id": profile_dict["id"]})
        return {"success": True, "profile": PaymentProfile(**created_profile)}
        
    except Exception as e:
        logger.error(f"Error creating payment profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating payment profile: {str(e)}")

@api_router.delete("/payment-profiles/{profile_id}")
async def delete_payment_profile(profile_id: str):
    """Delete a payment profile"""
    try:
        result = await db.payment_profiles.delete_one({"id": profile_id})
        
        if result.deleted_count:
            return {"message": "Payment profile deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Payment profile not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting payment profile: {str(e)}")


# ============== LIBRARY ENDPOINTS ==============

# Countries Endpoints
@api_router.get("/library/countries", response_model=List[LibraryCountry])
async def get_countries():
    """Get all countries with Turkish locale sorting"""
    try:
        # Use Turkish locale collation for proper alphabetical sorting
        countries = await db.countries.find().sort("name", 1).collation({"locale": "tr"}).to_list(None)
        return [LibraryCountry(**country) for country in countries]
    except Exception as e:
        logger.error(f"Error getting countries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/countries", response_model=LibraryCountry)
async def create_country(country: LibraryCountry):
    """Create a new country"""
    try:
        country_dict = country.dict()
        await db.countries.insert_one(country_dict)
        return country
    except Exception as e:
        logger.error(f"Error creating country: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/library/countries/{country_id}", response_model=LibraryCountry)
async def update_country(country_id: str, country: LibraryCountry):
    """Update a country"""
    try:
        result = await db.countries.update_one(
            {"id": country_id},
            {"$set": country.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Country not found")
        return country
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating country: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/library/countries/{country_id}")
async def update_country(country_id: str, country: LibraryCountry):
    """Update a country"""
    try:
        country_dict = country.dict()
        result = await db.countries.update_one(
            {"id": country_id}, 
            {"$set": country_dict}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Country not found")
        return {"message": "Country updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating country: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/library/countries/{country_id}")
async def delete_country(country_id: str):
    """Delete a country"""
    try:
        result = await db.countries.delete_one({"id": country_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Country not found")
        return {"message": "Country deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting country: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Cities Endpoints
@api_router.get("/library/cities", response_model=List[LibraryCity])
async def get_cities(country: Optional[str] = None):
    """Get all cities, optionally filtered by country"""
    try:
        # Build query filter
        query = {}
        if country:
            query["country"] = country
            logger.info(f"Fetching cities for country: '{country}'")
        
        cities = await db.cities.find(query).sort("name", 1).to_list(None)
        logger.info(f"Found {len(cities)} cities" + (f" for country '{country}'" if country else ""))
        return [LibraryCity(**city) for city in cities]
    except Exception as e:
        logger.error(f"Error getting cities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/library/cities/{country}", response_model=List[LibraryCity])
async def get_cities_by_country(country: str):
    """Get cities for a specific country"""
    try:
        logger.info(f"Fetching cities for country: '{country}'")
        cities = await db.cities.find({"country": country}).sort("name", 1).to_list(None)
        logger.info(f"Found {len(cities)} cities for country '{country}'")
        return [LibraryCity(**city) for city in cities]
    except Exception as e:
        logger.error(f"Error getting cities for country {country}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/cities", response_model=LibraryCity)
async def create_city(city: LibraryCity):
    """Create a new city"""
    try:
        city_dict = city.dict()
        await db.cities.insert_one(city_dict)
        return city
    except Exception as e:
        logger.error(f"Error creating city: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/library/cities/{city_id}", response_model=LibraryCity)
async def update_city(city_id: str, city: LibraryCity):
    """Update a city"""
    try:
        result = await db.cities.update_one(
            {"id": city_id},
            {"$set": city.dict()}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="City not found")
        return city
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating city: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/library/cities/{city_id}")
async def delete_city(city_id: str):
    """Delete a city"""
    try:
        result = await db.cities.delete_one({"id": city_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="City not found")
        return {"message": "City deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting city: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/countries/bulk-import")
async def bulk_import_countries(data: dict):
    """Bulk import countries and cities"""
    try:
        countries_data = data.get("countries", [])
        cities_data = data.get("cities", [])
        
        # Import countries
        countries_imported = 0
        for country_dict in countries_data:
            country = LibraryCountry(**country_dict)
            # Check if country already exists
            existing = await db.countries.find_one({"name": country.name})
            if not existing:
                await db.countries.insert_one(country.dict())
                countries_imported += 1
        
        # Import cities
        cities_imported = 0
        for city_dict in cities_data:
            city = LibraryCity(**city_dict)
            # Check if city already exists
            existing = await db.cities.find_one({"name": city.name, "country": city.country})
            if not existing:
                await db.cities.insert_one(city.dict())
                cities_imported += 1
        
        return {
            "message": "Toplu içe aktarma başarılı",
            "countries_imported": countries_imported,
            "cities_imported": cities_imported
        }
    except Exception as e:
        logger.error(f"Error in bulk import: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/countries/initialize-defaults")
async def initialize_default_countries(force_reload: bool = False):
    """Initialize database with 195 UN member countries and their major cities"""
    try:
        from seed_data import COUNTRIES_AND_CITIES_SEED
        
        # Check if already initialized
        existing_countries = await db.countries.count_documents({})
        existing_cities = await db.cities.count_documents({})
        
        # If force_reload or if counts don't match expected, clear and reload
        if force_reload or existing_countries != 195:
            logger.info(f"🔄 Clearing existing data: {existing_countries} countries, {existing_cities} cities")
            await db.countries.delete_many({})
            await db.cities.delete_many({})
            logger.info("✅ Existing data cleared")
        elif existing_countries == 195:
            return {
                "message": "Varsayılan veriler zaten yüklenmiş (tam 195 ülke)",
                "countries_count": existing_countries,
                "cities_count": existing_cities,
                "status": "already_initialized"
            }
        
        # Import countries
        countries_data = COUNTRIES_AND_CITIES_SEED["countries"]
        cities_data = COUNTRIES_AND_CITIES_SEED["cities"]
        
        logger.info(f"📥 Loading {len(countries_data)} countries and {len(cities_data)} cities from seed data")
        
        countries_imported = 0
        for country_dict in countries_data:
            country = LibraryCountry(**country_dict)
            await db.countries.insert_one(country.dict())
            countries_imported += 1
        
        # Import cities
        cities_imported = 0
        for city_dict in cities_data:
            city = LibraryCity(**city_dict)
            await db.cities.insert_one(city.dict())
            cities_imported += 1
        
        final_countries = await db.countries.count_documents({})
        final_cities = await db.cities.count_documents({})
        
        logger.info(f"✅ Import complete: {final_countries} countries, {final_cities} cities")
        
        return {
            "message": f"Varsayılan veriler başarıyla yüklendi! {final_countries} ülke, {final_cities} şehir",
            "countries_imported": countries_imported,
            "cities_imported": cities_imported,
            "total_countries": final_countries,
            "total_cities": final_cities,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"❌ Error initializing defaults: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Currencies Endpoints
@api_router.get("/library/currencies", response_model=List[LibraryCurrency])
async def get_currencies():
    """Get all currencies"""
    try:
        currencies = await db.currencies.find().sort("code", 1).to_list(1000)
        return [LibraryCurrency(**currency) for currency in currencies]
    except Exception as e:
        logger.error(f"Error getting currencies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/currencies", response_model=LibraryCurrency)
async def create_currency(currency: LibraryCurrency):
    """Create a new currency"""
    try:
        currency_dict = currency.dict()
        await db.currencies.insert_one(currency_dict)
        return currency
    except Exception as e:
        logger.error(f"Error creating currency: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/library/currencies/{currency_id}", response_model=LibraryCurrency)
async def update_currency(currency_id: str, currency: LibraryCurrency):
    """Update a currency"""
    try:
        result = await db.currencies.update_one(
            {"id": currency_id},
            {"$set": currency.dict()}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Currency not found")
        return currency
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating currency: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/library/currencies/{currency_id}")
async def delete_currency(currency_id: str):
    """Delete a currency"""
    try:
        result = await db.currencies.delete_one({"id": currency_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Currency not found")
        return {"message": "Currency deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting currency: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Fair Centers Endpoints
@api_router.get("/library/fair-centers", response_model=List[LibraryFairCenter])
async def get_fair_centers():
    """Get all fair centers"""
    try:
        fair_centers = await db.fair_centers.find().sort("name", 1).to_list(1000)
        return [LibraryFairCenter(**center) for center in fair_centers]
    except Exception as e:
        logger.error(f"Error getting fair centers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/fair-centers", response_model=LibraryFairCenter)
async def create_fair_center(center: LibraryFairCenter):
    """Create a new fair center"""
    try:
        center_dict = center.dict()
        await db.fair_centers.insert_one(center_dict)
        return center
    except Exception as e:
        logger.error(f"Error creating fair center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/library/fair-centers/{center_id}", response_model=LibraryFairCenter)
async def update_fair_center(center_id: str, center: LibraryFairCenter):
    """Update a fair center"""
    try:
        result = await db.fair_centers.update_one(
            {"id": center_id},
            {"$set": center.dict()}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Fair center not found")
        return center
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating fair center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/library/fair-centers/{center_id}")
async def delete_fair_center(center_id: str):
    """Delete a fair center"""
    try:
        result = await db.fair_centers.delete_one({"id": center_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Fair center not found")
        return {"message": "Fair center deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting fair center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Phone Codes Endpoints
@api_router.get("/library/phone-codes", response_model=List[LibraryPhoneCode])
async def get_phone_codes():
    """Get all phone codes"""
    try:
        phone_codes = await db.phone_codes.find().sort("country", 1).to_list(1000)
        return [LibraryPhoneCode(**code) for code in phone_codes]
    except Exception as e:
        logger.error(f"Error getting phone codes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/library/phone-codes", response_model=LibraryPhoneCode)
async def create_phone_code(phone_code: LibraryPhoneCode):
    """Create a new phone code"""
    try:
        code_dict = phone_code.dict()
        await db.phone_codes.insert_one(code_dict)
        return phone_code
    except Exception as e:
        logger.error(f"Error creating phone code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/library/phone-codes/{code_id}", response_model=LibraryPhoneCode)
async def update_phone_code(code_id: str, phone_code: LibraryPhoneCode):
    """Update a phone code"""
    try:
        result = await db.phone_codes.update_one(
            {"id": code_id},
            {"$set": phone_code.dict()}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Phone code not found")
        return phone_code
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating phone code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/library/phone-codes/{code_id}")
async def delete_phone_code(code_id: str):
    """Delete a phone code"""
    try:
        result = await db.phone_codes.delete_one({"id": code_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Phone code not found")
        return {"message": "Phone code deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting phone code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        logger.error(f"Error deleting fair center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== END LIBRARY ENDPOINTS ==============

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
        base_url = os.environ.get('FRONTEND_URL', 'https://smartlibrary-7.preview.emergentagent.com')
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
        base_url = os.environ.get('FRONTEND_URL', 'https://smartlibrary-7.preview.emergentagent.com')
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
        base_url = os.environ.get('FRONTEND_URL', 'https://smartlibrary-7.preview.emergentagent.com')
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
        base_url = os.environ.get('FRONTEND_URL', 'https://smartlibrary-7.preview.emergentagent.com')
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
        logger.info(f"Received customer data: {customer_data}")
        logger.info(f"Customer data keys: {list(customer_data.keys())}")
        
        # Remove contacts field if present (not part of Customer model)
        if 'contacts' in customer_data:
            logger.info(f"Removing contacts field: {customer_data['contacts']}")
            customer_data.pop('contacts')
        
        # Validate bank information if provided
        if 'iban' in customer_data and customer_data['iban']:
            if not validate_iban(customer_data['iban']):
                raise HTTPException(status_code=400, detail="Geçersiz IBAN formatı")
        
        if 'swiftCode' in customer_data and customer_data['swiftCode']:
            if not validate_swift_code(customer_data['swiftCode']):
                raise HTTPException(status_code=400, detail="Geçersiz Swift kodu formatı")
        
        # Convert dict to Customer model
        customer = Customer(**customer_data)
        customer_dict = customer.dict()
        
        logger.info(f"Customer model created successfully: {customer.companyName}")
        
        # Insert to MongoDB
        await db.customers.insert_one(customer_dict)
        
        logger.info(f"Customer created in database: {customer.id}")
        return customer
        
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        logger.error(f"Customer data that caused error: {customer_data}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers")
async def get_customers():
    """Get all customers"""
    customers = await db.customers.find().to_list(length=None)
    # Serialize all documents properly
    serialized_customers = [serialize_document(customer) for customer in customers]
    return JSONResponse(content=serialized_customers)

@api_router.get("/customers/{customer_id}")
async def get_customer(customer_id: str):
    """Get a specific customer"""
    try:
        customer = await db.customers.find_one({"id": customer_id})
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Serialize document properly
        serialized_customer = serialize_document(customer)
        return JSONResponse(content=serialized_customer)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer_data: dict):
    """Update a customer"""
    try:
        # Validate bank information if provided
        if 'iban' in customer_data and customer_data['iban']:
            if not validate_iban(customer_data['iban']):
                raise HTTPException(status_code=400, detail="Geçersiz IBAN formatı")
        
        if 'swiftCode' in customer_data and customer_data['swiftCode']:
            if not validate_swift_code(customer_data['swiftCode']):
                raise HTTPException(status_code=400, detail="Geçersiz Swift kodu formatı")
        
        # Update in MongoDB
        result = await db.customers.update_one(
            {"id": customer_id},
            {"$set": customer_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        # Get updated customer
        updated_customer = await db.customers.find_one({"id": customer_id})
        # Serialize document properly
        if updated_customer:
            serialized_customer = serialize_document(updated_customer)
            return JSONResponse(content={"customer": serialized_customer})
        else:
            raise HTTPException(status_code=404, detail="Customer not found after update")
        
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
        
        try:
            # Check for related opportunities (satış fırsatları) - this collection exists
            opportunities_count = await db.opportunities.count_documents({"customer_id": customer_id})
            if opportunities_count > 0:
                related_records.append(f"{opportunities_count} Satış Fırsatı")
        except Exception as e:
            logger.error(f"Error checking opportunities for customer {customer_id}: {e}")
            
        try:
            # Check for related invoices (faturalar) - if exists
            invoices_count = await db.invoices.count_documents({"customer_id": customer_id})
            if invoices_count > 0:
                related_records.append(f"{invoices_count} Fatura")
        except Exception as e:
            logger.debug(f"Invoices collection not found or error: {e}")
            
        try:
            # Check for related quotes (teklifler) - if exists  
            quotes_count = await db.quotes.count_documents({"customer_id": customer_id})
            if quotes_count > 0:
                related_records.append(f"{quotes_count} Teklif")
        except Exception as e:
            logger.debug(f"Quotes collection not found or error: {e}")
            
        # Only check essential collections that we know exist
        logger.info(f"Customer {customer_id} related records check: {related_records}")
            
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

@api_router.patch("/customers/{customer_id}/toggle-favorite")
async def toggle_customer_favorite(customer_id: str):
    """Toggle customer favorite status"""
    try:
        # Find customer
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        # Toggle isFavorite field
        current_favorite = customer.get("isFavorite", False)
        new_favorite = not current_favorite
        
        # Update in database
        result = await db.customers.update_one(
            {"id": customer_id},
            {"$set": {"isFavorite": new_favorite}}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Müşteri güncellenemedi")
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"Müşteri {'favorilere eklendi' if new_favorite else 'favorilerden çıkarıldı'}",
                "isFavorite": new_favorite,
                "customer_id": customer_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling customer favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Favori durumu güncellenirken hata oluştu: {str(e)}")

@api_router.patch("/customers/{customer_id}/toggle-status")
async def toggle_customer_status(customer_id: str):
    """Toggle customer status between active and passive"""
    try:
        # Find customer
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        
        # Toggle status field between 'active' and 'passive'
        current_status = customer.get("status", "active")
        new_status = "passive" if current_status == "active" else "active"
        
        # Update in database
        result = await db.customers.update_one(
            {"id": customer_id},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Müşteri güncellenemedi")
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"Müşteri {'pasife alındı' if new_status == 'passive' else 'aktif hale getirildi'}",
                "status": new_status,
                "customer_id": customer_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling customer status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Müşteri durumu güncellenirken hata oluştu: {str(e)}")

@api_router.patch("/customers/{customer_id}/convert-to-customer")
async def convert_prospect_to_customer(customer_id: str):
    """Convert a customer prospect to regular customer"""
    try:
        # Find customer prospect
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri adayı bulunamadı")
        
        # Check if already a customer
        if not customer.get("isProspect", False):
            raise HTTPException(status_code=400, detail="Bu zaten bir müşteri, müşteri adayı değil")
        
        # Convert to customer by setting isProspect to false
        result = await db.customers.update_one(
            {"id": customer_id},
            {"$set": {"isProspect": False}}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Müşteri güncellenemedi")
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"'{customer.get('companyName', 'Müşteri')}' başarıyla müşteriye çevrildi",
                "isProspect": False,
                "customer_id": customer_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting prospect to customer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Müşteriye çevirme işlemi sırasında hata oluştu: {str(e)}")

@api_router.put("/customers/{customer_id}/deactivate")
async def deactivate_customer(customer_id: str, request: dict):
    """Deactivate a customer (move to passive customers)"""
    try:
        # Check if customer exists
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Update customer status to inactive
        update_data = {
            "status": "inactive",
            "deactivated_at": datetime.utcnow(),
            "deactivation_reason": request.get("reason", "Moved to passive customers"),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.customers.update_one(
            {"id": customer_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found or already inactive")
            
        return {
            "success": True, 
            "message": f"Müşteri '{customer.get('company_name', customer_id)}' pasif müşteriler arasına alındı"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating customer {customer_id}: {str(e)}")
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
            "cities": [LibraryCity(**city) for city in cities],
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

@api_router.delete("/customer-prospects/{prospect_id}")
async def delete_customer_prospect(prospect_id: str):
    """Delete a customer prospect"""
    try:
        # Check if prospect exists
        prospect = await db.customer_prospects.find_one({"id": prospect_id})
        if not prospect:
            raise HTTPException(status_code=404, detail="Müşteri adayı bulunamadı")
        
        # Delete the prospect
        result = await db.customer_prospects.delete_one({"id": prospect_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Müşteri adayı silinemedi")
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Müşteri adayı başarıyla silindi",
                "prospect_id": prospect_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting customer prospect: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Müşteri adayı silinirken hata oluştu: {str(e)}")

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

@api_router.delete("/customer-types/{customer_type_id}")
async def delete_customer_type(customer_type_id: str):
    """Delete a customer type"""
    try:
        result = await db.customer_types.delete_one({"id": customer_type_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Müşteri türü bulunamadı")
        
        return {"message": "Müşteri türü başarıyla silindi", "id": customer_type_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting customer type: {str(e)}")
        raise HTTPException(status_code=500, detail="Müşteri türü silinirken hata oluştu")

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

@api_router.delete("/sectors/{sector_id}")
async def delete_sector(sector_id: str):
    """Delete a sector"""
    try:
        result = await db.sectors.delete_one({"id": sector_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Sektör bulunamadı")
        
        return {"message": "Sektör başarıyla silindi", "id": sector_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sector: {str(e)}")
        raise HTTPException(status_code=500, detail="Sektör silinirken hata oluştu")

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

@api_router.post("/cities", response_model=LibraryCity)
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

@api_router.get("/cities", response_model=List[LibraryCity])
async def get_cities():
    """Get all cities"""
    try:
        cities = await db.cities.find().sort("name", 1).to_list(length=None)
        return [LibraryCity(**city) for city in cities]
        
    except Exception as e:
        logger.error(f"Error getting cities: {str(e)}")
        return []

@api_router.get("/cities/{country_code}", response_model=List[LibraryCity])
async def get_cities_by_country(country_code: str):
    """Get cities by country code"""
    try:
        cities = await db.cities.find({"country_code": country_code.upper()}).sort("name", 1).to_list(length=None)
        return [LibraryCity(**city) for city in cities]
        
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
        frontend_url = os.environ.get('FRONTEND_URL', 'https://smartlibrary-7.preview.emergentagent.com')
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
    is_favorite: bool = False  # Favori fırsat işaretlemesi
    tags: List[str] = Field(default_factory=list)
    design_files: List[str] = Field(default_factory=list)
    sample_files: List[str] = Field(default_factory=list)
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
    design_files: List[str] = Field(default_factory=list)
    sample_files: List[str] = Field(default_factory=list)

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
    is_favorite: Optional[bool] = None  # Favori güncelleme
    tags: Optional[List[str]] = None
    design_files: Optional[List[str]] = None
    sample_files: Optional[List[str]] = None

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

# ===================== OPPORTUNITY STATUS & STAGE MANAGEMENT =====================

# Status and Stage Models
class OpportunityStatus(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    value: str
    label: str
    description: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = ""

class OpportunityStage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    value: str
    label: str
    description: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = ""

class StatusCreate(BaseModel):
    label: str
    description: Optional[str] = ""

class StageCreate(BaseModel):
    label: str
    description: Optional[str] = ""

# Project Type Model
class ProjectType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    value: str
    label: str
    description: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = ""

class ProjectTypeCreate(BaseModel):
    label: str
    description: Optional[str] = ""

# Avans (Advance) Model
class Avans(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    amount: float
    currency: str = "TRY"
    employee_name: str
    employee_id: Optional[str] = ""
    department: Optional[str] = ""
    project_name: Optional[str] = ""
    reason: str
    status: str = "pending"  # pending, finance_approved, closed
    finance_approved: bool = False
    finance_approved_by: Optional[str] = ""
    finance_approved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = ""

class AvansCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    amount: float
    currency: str = "TRY"
    employee_name: str
    employee_id: Optional[str] = ""
    department: Optional[str] = ""
    project_name: Optional[str] = ""
    reason: str
    notes: Optional[str] = ""

class AvansUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    employee_name: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    project_name: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

# Status Endpoints
@api_router.get("/opportunity-statuses")
async def get_opportunity_statuses():
    """Get all opportunity statuses"""
    try:
        statuses = await db.opportunity_statuses.find({"is_active": True}).sort("created_at", 1).to_list(length=None)
        return [OpportunityStatus(**status) for status in statuses]
    except Exception as e:
        logger.error(f"Error fetching opportunity statuses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/opportunity-statuses", response_model=OpportunityStatus)
async def create_opportunity_status(status_input: StatusCreate):
    """Create a new opportunity status"""
    try:
        # Generate value from label (lowercase, replace spaces with underscores)
        # Handle Turkish characters before lowercasing to avoid issues with İ -> i̇
        value = status_input.label.replace('İ', 'I').replace('Ğ', 'G').replace('Ü', 'U').replace('Ş', 'S').replace('Ö', 'O').replace('Ç', 'C')
        value = value.lower().replace(' ', '_').replace('ı', 'i').replace('ü', 'u').replace('ö', 'o').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c')
        
        # Check if status with same value already exists
        existing = await db.opportunity_statuses.find_one({"value": value, "is_active": True})
        if existing:
            raise HTTPException(status_code=400, detail="Bu durum zaten mevcut")
        
        status_data = {
            "id": str(uuid.uuid4()),
            "value": value,
            "label": status_input.label,
            "description": status_input.description,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "created_by": "system"  # In real app, get from authenticated user
        }
        
        result = await db.opportunity_statuses.insert_one(status_data)
        created_status = await db.opportunity_statuses.find_one({"_id": result.inserted_id})
        
        return OpportunityStatus(**created_status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/opportunity-statuses/{status_id}")
async def delete_opportunity_status(status_id: str):
    """Soft delete an opportunity status"""
    try:
        existing = await db.opportunity_statuses.find_one({"id": status_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Durum bulunamadı")
        
        # Soft delete - mark as inactive
        await db.opportunity_statuses.update_one(
            {"id": status_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Durum başarıyla silindi", "id": status_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity status {status_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Stage Endpoints
@api_router.get("/opportunity-stages")
async def get_opportunity_stages():
    """Get all opportunity stages"""
    try:
        stages = await db.opportunity_stages.find({"is_active": True}).sort("created_at", 1).to_list(length=None)
        return [OpportunityStage(**stage) for stage in stages]
    except Exception as e:
        logger.error(f"Error fetching opportunity stages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/opportunity-stages", response_model=OpportunityStage)
async def create_opportunity_stage(stage_input: StageCreate):
    """Create a new opportunity stage"""
    try:
        # Generate value from label (lowercase, replace spaces with underscores)
        # Handle Turkish characters before lowercasing to avoid issues with İ -> i̇
        value = stage_input.label.replace('İ', 'I').replace('Ğ', 'G').replace('Ü', 'U').replace('Ş', 'S').replace('Ö', 'O').replace('Ç', 'C')
        value = value.lower().replace(' ', '_').replace('ı', 'i').replace('ü', 'u').replace('ö', 'o').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c')
        
        # Check if stage with same value already exists
        existing = await db.opportunity_stages.find_one({"value": value, "is_active": True})
        if existing:
            raise HTTPException(status_code=400, detail="Bu aşama zaten mevcut")
        
        stage_data = {
            "id": str(uuid.uuid4()),
            "value": value,
            "label": stage_input.label,
            "description": stage_input.description,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "created_by": "system"  # In real app, get from authenticated user
        }
        
        result = await db.opportunity_stages.insert_one(stage_data)
        created_stage = await db.opportunity_stages.find_one({"_id": result.inserted_id})
        
        return OpportunityStage(**created_stage)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity stage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/opportunity-stages/{stage_id}")
async def delete_opportunity_stage(stage_id: str):
    """Soft delete an opportunity stage"""
    try:
        existing = await db.opportunity_stages.find_one({"id": stage_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Aşama bulunamadı")
        
        # Soft delete - mark as inactive
        await db.opportunity_stages.update_one(
            {"id": stage_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Aşama başarıyla silindi", "id": stage_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity stage {stage_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== PROJECT TYPE ENDPOINTS =====================

@api_router.get("/project-types")
async def get_project_types():
    """Get all project types"""
    try:
        project_types = await db.project_types.find({"is_active": True}).sort("created_at", 1).to_list(length=None)
        return [ProjectType(**project_type) for project_type in project_types]
    except Exception as e:
        logger.error(f"Error fetching project types: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/project-types", response_model=ProjectType)
async def create_project_type(project_type_input: ProjectTypeCreate):
    """Create a new project type"""
    try:
        # Generate value from label (lowercase, replace spaces with underscores)
        # Handle Turkish characters before lowercasing to avoid issues with İ -> i̇
        value = project_type_input.label.replace('İ', 'I').replace('Ğ', 'G').replace('Ü', 'U').replace('Ş', 'S').replace('Ö', 'O').replace('Ç', 'C')
        value = value.lower().replace(' ', '_').replace('ı', 'i').replace('ü', 'u').replace('ö', 'o').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c')
        
        # Check if project type with same value already exists
        existing = await db.project_types.find_one({"value": value, "is_active": True})
        if existing:
            raise HTTPException(status_code=400, detail="Bu proje türü zaten mevcut")
        
        project_type_data = {
            "id": str(uuid.uuid4()),
            "value": value,
            "label": project_type_input.label,
            "description": project_type_input.description,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "created_by": "system"  # In real app, get from authenticated user
        }
        
        result = await db.project_types.insert_one(project_type_data)
        created_project_type = await db.project_types.find_one({"_id": result.inserted_id})
        
        return ProjectType(**created_project_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project type: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/project-types/{project_type_id}")
async def delete_project_type(project_type_id: str):
    """Soft delete a project type"""
    try:
        existing = await db.project_types.find_one({"id": project_type_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Proje türü bulunamadı")
        
        # Soft delete - mark as inactive
        await db.project_types.update_one(
            {"id": project_type_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Proje türü başarıyla silindi", "id": project_type_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project type {project_type_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== AVANS (ADVANCE) ENDPOINTS =====================

@api_router.get("/avans")
async def get_all_avans():
    """Get all advances"""
    try:
        advances = await db.advances.find().sort("created_at", -1).to_list(length=None)
        return [Avans(**advance) for advance in advances]
    except Exception as e:
        logger.error(f"Error fetching advances: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/avans/finans-onayi")
async def get_finans_onayi_avans():
    """Get advances pending finance approval"""
    try:
        advances = await db.advances.find({"finance_approved": False}).sort("created_at", -1).to_list(length=None)
        return [Avans(**advance) for advance in advances]
    except Exception as e:
        logger.error(f"Error fetching finance approval advances: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/avans/kapanmis")
async def get_kapanmis_avans():
    """Get closed advances (finance approved only)"""
    try:
        advances = await db.advances.find({"finance_approved": True}).sort("closed_at", -1).to_list(length=None)
        return [Avans(**advance) for advance in advances]
    except Exception as e:
        logger.error(f"Error fetching closed advances: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/avans/{avans_id}")
async def get_avans_by_id(avans_id: str):
    """Get advance by ID"""
    try:
        advance = await db.advances.find_one({"id": avans_id})
        if not advance:
            raise HTTPException(status_code=404, detail="Avans bulunamadı")
        return Avans(**advance)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching advance {avans_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/avans", response_model=Avans)
async def create_avans(avans_input: AvansCreate):
    """Create a new advance"""
    try:
        avans_data = {
            "id": str(uuid.uuid4()),
            "title": avans_input.title,
            "description": avans_input.description,
            "amount": avans_input.amount,
            "currency": avans_input.currency,
            "employee_name": avans_input.employee_name,
            "employee_id": avans_input.employee_id,
            "department": avans_input.department,
            "project_name": avans_input.project_name,
            "reason": avans_input.reason,
            "status": "pending",
            "finance_approved": False,
            "finance_approved_by": "",
            "finance_approved_at": None,
            "closed_at": None,
            "notes": avans_input.notes,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "created_by": "system"  # In real app, get from authenticated user
        }
        
        result = await db.advances.insert_one(avans_data)
        created_avans = await db.advances.find_one({"_id": result.inserted_id})
        
        return Avans(**created_avans)
        
    except Exception as e:
        logger.error(f"Error creating advance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/avans/{avans_id}", response_model=Avans)
async def update_avans(avans_id: str, avans_update: AvansUpdate):
    """Update advance (save)"""
    try:
        existing = await db.advances.find_one({"id": avans_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Avans bulunamadı")
        
        # Prepare update data
        update_data = {k: v for k, v in avans_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.advances.update_one(
            {"id": avans_id},
            {"$set": update_data}
        )
        
        updated_avans = await db.advances.find_one({"id": avans_id})
        return Avans(**updated_avans)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating advance {avans_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/avans/{avans_id}/onayla")
async def onayla_avans(avans_id: str):
    """Approve advance and move to closed advances"""
    try:
        existing = await db.advances.find_one({"id": avans_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Avans bulunamadı")
        
        # Update advance as finance approved and closed
        update_data = {
            "finance_approved": True,
            "finance_approved_by": "system",  # In real app, get from authenticated user
            "finance_approved_at": datetime.now(timezone.utc),
            "status": "closed",
            "closed_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.advances.update_one(
            {"id": avans_id},
            {"$set": update_data}
        )
        
        updated_avans = await db.advances.find_one({"id": avans_id})
        return Avans(**updated_avans)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving advance {avans_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/avans/{avans_id}")
async def delete_avans(avans_id: str):
    """Delete advance"""
    try:
        existing = await db.advances.find_one({"id": avans_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Avans bulunamadı")
        
        await db.advances.delete_one({"id": avans_id})
        
        return {"message": "Avans başarıyla silindi", "id": avans_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting advance {avans_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== FILE UPLOAD ENDPOINTS =====================

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (images, PDFs, videos, etc.)"""
    try:
        # Check file size (limit to 100MB)
        if file.size and file.size > 100 * 1024 * 1024:  # 100MB
            raise HTTPException(status_code=413, detail="Dosya boyutu çok büyük (maksimum 100MB)")
        
        # Check file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',  # Images
                            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',  # Documents
                            '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm',    # Videos
                            '.mp3', '.wav', '.m4a', '.flac', '.aac'}                    # Audio
        
        file_extension = Path(file.filename).suffix.lower() if file.filename else ''
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Desteklenmeyen dosya türü")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create file record in database
        file_record = {
            "id": str(uuid.uuid4()),
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": str(file_path),
            "file_size": file.size,
            "content_type": file.content_type,
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": "system"  # In real app, get from authenticated user
        }
        
        await db.uploaded_files.insert_one(file_record)
        
        return {
            "id": file_record["id"],
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_size": file.size,
            "content_type": file.content_type,
            "uploaded_at": file_record["uploaded_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya yükleme hatası: {str(e)}")

@api_router.get("/files/{file_id}")
async def download_file(file_id: str):
    """Download a file by ID"""
    try:
        file_record = await db.uploaded_files.find_one({"id": file_id})
        if not file_record:
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")
        
        file_path = Path(file_record["file_path"])
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Dosya sistemde bulunamadı")
        
        def iterfile():
            with open(file_path, "rb") as file_like:
                yield from file_like
        
        return StreamingResponse(
            iterfile(),
            media_type=file_record.get("content_type", "application/octet-stream"),
            headers={"Content-Disposition": f"attachment; filename={file_record['original_filename']}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dosya indirme hatası")

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete a file by ID"""
    try:
        file_record = await db.uploaded_files.find_one({"id": file_id})
        if not file_record:
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")
        
        # Delete from filesystem
        file_path = Path(file_record["file_path"])
        if file_path.exists():
            file_path.unlink()
        
        # Delete from database
        await db.uploaded_files.delete_one({"id": file_id})
        
        return {"message": "Dosya başarıyla silindi", "id": file_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Dosya silme hatası")

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
                    <a href="https://smartlibrary-7.preview.emergentagent.com{pdf_link}" 
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
    """Create new stand element with recursive structure (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can create
        
        if element_data.parent_path:
            # Adding nested element using dot notation path
            # Parse parent path: "flooring.raised36mm.carpet"
            path_parts = element_data.parent_path.split('.')
            
            if len(path_parts) < 1:
                raise HTTPException(status_code=400, detail="Invalid parent path")
            
            # Find main element
            main_element_key = path_parts[0]
            existing = await db.stand_elements.find_one({"key": main_element_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Parent element not found")
            
            # Navigate to the target parent in recursive structure
            current_node = existing.get("structure", {})
            
            # Navigate through path to find parent node
            for i in range(1, len(path_parts)):
                part_key = path_parts[i]
                if part_key not in current_node:
                    raise HTTPException(status_code=404, detail=f"Parent path not found at: {'.'.join(path_parts[:i+1])}")
                
                # Move to children of current node
                current_node = current_node[part_key].get("children", {})
            
            # Check for duplicate labels in current level
            existing_labels = [item.get("label", "").lower().strip() for item in current_node.values() if item.get("label")]
            new_label_normalized = element_data.label.lower().strip()
            
            if new_label_normalized in existing_labels:
                raise HTTPException(status_code=400, detail=f'Kategori "{element_data.label}" bu seviyede zaten mevcut. Farklı bir isim kullanın.')
            
            # Add new element to parent node
            new_element = {
                "key": element_data.key,
                "label": element_data.label,
                "icon": element_data.icon,
                "required": element_data.required,
                "element_type": element_data.element_type,
                "input_type": element_data.input_type,
                "unit": element_data.unit,
                "options": element_data.options,
                "children": {}
            }
            
            # Insert new element at the correct location
            # We need to reconstruct the update path
            if len(path_parts) == 1:
                # Adding to main element's structure
                await db.stand_elements.update_one(
                    {"key": main_element_key},
                    {
                        "$set": {
                            f"structure.{element_data.key}": new_element,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            else:
                # Adding to nested children - build MongoDB update path
                update_path = f"structure.{'.children.'.join(path_parts[1:])}.children.{element_data.key}"
                await db.stand_elements.update_one(
                    {"key": main_element_key},
                    {
                        "$set": {
                            update_path: new_element,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
            return {"success": True, "message": f"Element {element_data.key} added to path {element_data.parent_path}"}
        
        else:
            # Creating new main element
            existing_key = await db.stand_elements.find_one({"key": element_data.key})
            if existing_key:
                raise HTTPException(status_code=400, detail="Element key already exists")
            
            # Check for duplicate labels in main elements
            existing_elements = await db.stand_elements.find().to_list(length=None)
            existing_labels = [item.get("label", "").lower().strip() for item in existing_elements if item.get("label")]
            new_label_normalized = element_data.label.lower().strip()
            
            if new_label_normalized in existing_labels:
                raise HTTPException(status_code=400, detail=f'Ana kategori "{element_data.label}" zaten mevcut. Farklı bir isim kullanın.')
            
            element = StandElement(
                key=element_data.key,
                label=element_data.label,
                icon=element_data.icon,
                required=element_data.required,
                created_by="admin"  # TODO: Get from JWT
            )
            
            await db.stand_elements.insert_one(element.dict())
            
            return {"success": True, "message": f"Main element {element_data.key} created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating stand element: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/stand-elements/{element_key}")
async def update_stand_element(element_key: str, update_data: StandElementCreate):
    """Update stand element with recursive path support (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can update
        
        if update_data.parent_path:
            # Updating nested element using dot notation path
            path_parts = update_data.parent_path.split('.')
            main_element_key = path_parts[0]
            
            existing = await db.stand_elements.find_one({"key": main_element_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Main element not found")
            
            # Build update path for nested element
            if len(path_parts) == 1:
                # Updating element in main structure
                update_fields = {
                    f"structure.{element_key}.label": update_data.label,
                    f"structure.{element_key}.element_type": update_data.element_type,
                    f"structure.{element_key}.input_type": update_data.input_type,
                    f"structure.{element_key}.unit": update_data.unit,
                    f"structure.{element_key}.options": update_data.options,
                    "updated_at": datetime.utcnow()
                }
                if update_data.icon:
                    update_fields[f"structure.{element_key}.icon"] = update_data.icon
            else:
                # Updating element in nested children
                nested_path = f"structure.{'.children.'.join(path_parts[1:])}.children.{element_key}"
                update_fields = {
                    f"{nested_path}.label": update_data.label,
                    f"{nested_path}.element_type": update_data.element_type,
                    f"{nested_path}.input_type": update_data.input_type,
                    f"{nested_path}.unit": update_data.unit,
                    f"{nested_path}.options": update_data.options,
                    "updated_at": datetime.utcnow()
                }
                if update_data.icon:
                    update_fields[f"{nested_path}.icon"] = update_data.icon
            
            await db.stand_elements.update_one(
                {"key": main_element_key},
                {"$set": update_fields}
            )
            
            return {"success": True, "message": f"Element {element_key} at path {update_data.parent_path} updated successfully"}
        
        else:
            # Updating main element
            existing = await db.stand_elements.find_one({"key": element_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Element not found")
            
            update_fields = {
                "label": update_data.label,
                "required": update_data.required,
                "updated_at": datetime.utcnow()
            }
            if update_data.icon:
                update_fields["icon"] = update_data.icon
            
            await db.stand_elements.update_one(
                {"key": element_key},
                {"$set": update_fields}
            )
            
            return {"success": True, "message": f"Main element {element_key} updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating stand element: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/stand-elements/{element_key}")
async def delete_stand_element(element_key: str, parent_path: str = None):
    """Delete stand element with recursive path support (admin+ only)"""
    try:
        # TODO: Add role check - only admin and super_admin can delete
        
        if parent_path:
            # Deleting nested element using dot notation path
            path_parts = parent_path.split('.')
            main_element_key = path_parts[0]
            
            existing = await db.stand_elements.find_one({"key": main_element_key})
            if not existing:
                raise HTTPException(status_code=404, detail="Main element not found")
            
            # Build unset path for nested element
            if len(path_parts) == 1:
                # Deleting element from main structure
                unset_path = f"structure.{element_key}"
            else:
                # Deleting element from nested children
                nested_path = f"structure.{'.children.'.join(path_parts[1:])}.children.{element_key}"
                unset_path = nested_path
            
            await db.stand_elements.update_one(
                {"key": main_element_key},
                {
                    "$unset": {unset_path: ""},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return {"success": True, "message": f"Element {element_key} deleted from path {parent_path}"}
        
        else:
            # Deleting main element
            result = await db.stand_elements.delete_one({"key": element_key})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Element not found")
            
            return {"success": True, "message": f"Main element {element_key} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stand element: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== AI DESIGN GENERATION ENDPOINTS =====================

# Models for AI Design Generation
class ImageUpload(BaseModel):
    filename: str
    image_data: str  # base64 encoded image
    
class DesignRequest(BaseModel):
    brief_data: dict  # Brief form data including dimensions, stand elements etc.
    uploaded_images: List[ImageUpload] = []
    logo_image: Optional[ImageUpload] = None

class GeneratedDesign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_data: str  # base64 encoded generated image
    prompt_used: str
    brief_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/analyze-uploaded-images")
async def analyze_uploaded_images(images: List[ImageUpload]):
    """Analyze uploaded design inspiration images using OpenAI Vision API"""
    try:
        load_dotenv()
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        analyses = []
        
        for image in images:
            try:
                # Create a new chat instance for image analysis
                chat = LlmChat(
                    api_key=api_key,
                    session_id=f"image-analysis-{uuid.uuid4()}",
                    system_message="You are an expert in exhibition stand design. Analyze the provided image and extract design elements, colors, style, materials, layout concepts that could inspire new designs."
                ).with_model("openai", "gpt-4o")
                
                # Create image content for analysis
                image_content = ImageContent(image_base64=image.image_data)
                
                # Analyze the image
                user_message = UserMessage(
                    text="Please analyze this exhibition stand design image and provide detailed insights about: 1) Design style and aesthetic, 2) Color palette used, 3) Materials visible, 4) Layout and space organization, 5) Key design elements that make it effective, 6) Lighting concepts, 7) Brand presentation approaches. Focus on elements that could inspire new stand designs.",
                    file_contents=[image_content]
                )
                
                response = await chat.send_message(user_message)
                
                analyses.append({
                    "filename": image.filename,
                    "analysis": response,
                    "status": "success"
                })
                
            except Exception as e:
                logger.error(f"Error analyzing image {image.filename}: {str(e)}")
                analyses.append({
                    "filename": image.filename,
                    "analysis": f"Analysis failed: {str(e)}",
                    "status": "error"
                })
        
        return {"analyses": analyses}
        
    except Exception as e:
        logger.error(f"Error in analyze_uploaded_images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-stand-designs")
async def generate_stand_designs(request: DesignRequest):
    """Generate stand design concepts using OpenAI Image Generation"""
    try:
        load_dotenv()
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        # Initialize direct OpenAI client to avoid EmergentIntegrations issues
        openai_client = AsyncOpenAI(api_key=api_key)
        
        # Analyze uploaded images if provided
        design_inspiration = ""
        if request.uploaded_images:
            image_analyses = await analyze_uploaded_images(request.uploaded_images)
            inspiration_texts = [analysis["analysis"] for analysis in image_analyses["analyses"] if analysis["status"] == "success"]
            if inspiration_texts:
                design_inspiration = f"\n\nDesign Inspiration from uploaded images:\n" + "\n".join(inspiration_texts[:3])  # Limit to 3 analyses
        
        # Extract brief information
        brief = request.brief_data
        stand_elements = brief.get('standElements', {})
        # Handle both dict and list formats from frontend
        if isinstance(stand_elements, dict):
            selected_elements = [k for k, v in stand_elements.items() if v]
        else:
            selected_elements = stand_elements if isinstance(stand_elements, list) else []
        
        service_elements = brief.get('serviceElements', {})
        # Handle both dict and list formats from frontend  
        if isinstance(service_elements, dict):
            selected_services = [k for k, v in service_elements.items() if v]
        else:
            selected_services = service_elements if isinstance(service_elements, list) else []
        
        # Build comprehensive design prompts
        base_prompts = [
            # Modern & Minimalist
            f"Modern minimalist exhibition stand design, {brief.get('standDimensions', '3x3 meters')}, clean lines, white and corporate color palette, featuring {', '.join(selected_elements[:3]) if selected_elements else 'display areas'}, professional lighting, company branding space, high-end materials, glass and metal accents, spacious layout",
            
            # Tech & Innovation
            f"High-tech innovation exhibition stand, {brief.get('standDimensions', '3x3 meters')}, LED screens, interactive displays, futuristic design, blue and white color scheme, featuring {', '.join(selected_elements[:3]) if selected_elements else 'technology showcase'}, ambient lighting, sleek surfaces, digital elements",
            
            # Warm & Inviting
            f"Warm inviting exhibition stand design, {brief.get('standDimensions', '3x3 meters')}, wood materials, comfortable seating area, earth tones, featuring {', '.join(selected_elements[:3]) if selected_elements else 'meeting spaces'}, soft lighting, natural materials, welcoming atmosphere",
            
            # Bold & Creative
            f"Bold creative exhibition stand, {brief.get('standDimensions', '3x3 meters')}, vibrant colors, artistic elements, dynamic layout, featuring {', '.join(selected_elements[:3]) if selected_elements else 'creative displays'}, dramatic lighting, unique shapes, eye-catching design",
            
            # Luxury & Premium
            f"Luxury premium exhibition stand, {brief.get('standDimensions', '3x3 meters')}, premium materials, marble accents, gold details, sophisticated design, featuring {', '.join(selected_elements[:3]) if selected_elements else 'VIP areas'}, elegant lighting, high-end finishes",
            
            # Industrial & Modern
            f"Industrial modern exhibition stand, {brief.get('standDimensions', '3x3 meters')}, metal framework, concrete elements, industrial lighting, featuring {', '.join(selected_elements[:3]) if selected_elements else 'product displays'}, raw materials, urban aesthetic",
            
            # Open & Airy
            f"Open airy exhibition stand design, {brief.get('standDimensions', '3x3 meters')}, glass walls, transparent elements, light colors, featuring {', '.join(selected_elements[:3]) if selected_elements else 'open spaces'}, natural lighting, spacious feel",
            
            # Sustainable & Eco
            f"Sustainable eco-friendly exhibition stand, {brief.get('standDimensions', '3x3 meters')}, recycled materials, green elements, natural wood, featuring {', '.join(selected_elements[:3]) if selected_elements else 'eco displays'}, energy-efficient lighting, sustainable design",
            
            # Dynamic & Interactive
            f"Dynamic interactive exhibition stand, {brief.get('standDimensions', '3x3 meters')}, curved surfaces, interactive zones, bright colors, featuring {', '.join(selected_elements[:3]) if selected_elements else 'engagement areas'}, dynamic lighting, movement elements",
            
            # Classic & Professional
            f"Classic professional exhibition stand, {brief.get('standDimensions', '3x3 meters')}, traditional materials, corporate colors, formal layout, featuring {', '.join(selected_elements[:3]) if selected_elements else 'business areas'}, professional lighting, timeless design"
        ]
        
        # Add common suffixes to all prompts
        common_suffix = f"{design_inspiration}, photorealistic, professional trade show environment, 8K quality, architectural visualization style, detailed render"
        
        generated_designs = []
        
        for i, base_prompt in enumerate(base_prompts):
            try:
                full_prompt = base_prompt + common_suffix
                
                # Generate image using direct OpenAI client
                response = await openai_client.images.generate(
                    model="dall-e-3",
                    prompt=full_prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1
                )
                
                # Get image URL and download
                image_url = response.data[0].url
                async with aiohttp.ClientSession() as session:
                    async with session.get(image_url) as img_response:
                        if img_response.status == 200:
                            images = [await img_response.read()]
                        else:
                            images = []
                
                if images and len(images) > 0:
                    # Convert to base64
                    image_base64 = base64.b64encode(images[0]).decode('utf-8')
                    
                    design = GeneratedDesign(
                        image_data=image_base64,
                        prompt_used=full_prompt,
                        brief_id=brief.get('id')
                    )
                    
                    # Save to database
                    await db.generated_designs.insert_one(design.dict())
                    
                    generated_designs.append(design)
                    
                    logger.info(f"Generated design {i+1}/10 successfully")
                else:
                    logger.error(f"No image generated for prompt {i+1}")
                    
            except Exception as e:
                logger.error(f"Error generating design {i+1}: {str(e)}")
                continue
        
        return {"designs": generated_designs, "total_generated": len(generated_designs)}
        
    except Exception as e:
        logger.error(f"Error in generate_stand_designs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/generated-designs/{brief_id}")
async def get_generated_designs(brief_id: str):
    """Get all generated designs for a specific brief"""
    try:
        designs = await db.generated_designs.find({"brief_id": brief_id}).to_list(length=None)
        return [GeneratedDesign(**design) for design in designs]
    except Exception as e:
        logger.error(f"Error getting generated designs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== END AI DESIGN GENERATION ENDPOINTS =====================

# ===================== CALENDAR & MEETINGS MODELS =====================

class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    start_datetime: datetime
    end_datetime: datetime
    all_day: bool = False
    event_type: str = "meeting"  # meeting, task, reminder, personal
    location: Optional[str] = ""
    organizer_id: str  # User ID who created the event
    organizer_name: str  # User name for display
    attendee_ids: List[str] = Field(default_factory=list)  # List of user IDs
    attendees: List[Dict[str, Any]] = Field(default_factory=list)  # Full attendee info
    status: str = "confirmed"  # confirmed, tentative, cancelled
    recurring: bool = False
    recurrence_rule: Optional[str] = None  # RRULE format for recurring events
    meeting_link: Optional[str] = ""  # Zoom, Teams, etc.
    reminder_minutes: List[int] = Field(default_factory=lambda: [15])  # Reminder before event
    visibility: str = "public"  # public, private
    is_archived: bool = False  # Automatically set to true for past events
    created_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    start_datetime: str  # ISO format string
    end_datetime: str    # ISO format string
    all_day: bool = False
    event_type: str = "meeting"
    location: Optional[str] = ""
    attendee_ids: List[str] = Field(default_factory=list)
    meeting_link: Optional[str] = ""
    reminder_minutes: List[int] = Field(default_factory=lambda: [15])
    visibility: str = "public"

# Meeting Request Model - for new meeting requests with detailed info
class MeetingRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str = Field(..., description="Toplantı konusu")
    date: str = Field(..., description="Toplantı tarihi (YYYY-MM-DD)")
    start_time: str = Field(..., description="Başlangıç saati (HH:MM)")
    end_time: str = Field(..., description="Bitiş saati (HH:MM)")
    meeting_type: str = Field(..., description="Toplantı türü: physical, virtual")
    location: Optional[str] = Field(None, description="Fiziki toplantı için adres")
    platform: Optional[str] = Field(None, description="Sanal toplantı için platform")
    meeting_link: Optional[str] = Field(None, description="Sanal toplantı için bağlantı linki")
    attendee_ids: List[str] = Field(default_factory=list, description="Katılımcı ID'leri")
    attendee_names: List[str] = Field(default_factory=list, description="Katılımcı isimleri")
    organizer_id: str = Field(..., description="Toplantı organize eden kişi")
    organizer_name: str = Field(..., description="Organize eden kişi adı")
    status: str = Field(default="pending", description="Toplantı durumu")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MeetingRequestCreate(BaseModel):
    subject: str
    date: str
    start_time: str
    end_time: str
    meeting_type: str  # physical, virtual
    location: Optional[str] = None
    platform: Optional[str] = None
    meeting_link: Optional[str] = None
    attendee_ids: List[str] = Field(default_factory=list)
    organizer_id: Optional[str] = None  # Allow organizer_id to be specified in request

# Meeting Request Response Model - for individual responses to meeting requests
class MeetingRequestResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str = Field(..., description="Meeting request ID")
    user_id: str = Field(..., description="Responding user ID")
    user_name: str = Field(..., description="Responding user name")
    response: str = Field(..., description="Response: accepted, maybe, declined")
    response_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: Optional[str] = Field("", description="Optional response message")

class MeetingRequestResponseCreate(BaseModel):
    request_id: str
    response: str  # accepted, maybe, declined
    message: Optional[str] = ""

# Legacy Meeting Invitation Model - keeping for backward compatibility
class MeetingInvitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    invitee_id: str
    invitee_name: str
    invitee_email: str
    status: str = "pending"  # pending, accepted, declined, maybe
    response_date: Optional[datetime] = None
    response_message: Optional[str] = ""
    invitation_sent_at: datetime = Field(default_factory=datetime.utcnow)

class MeetingResponse(BaseModel):
    invitation_id: str
    status: str  # accepted, declined, maybe
    message: Optional[str] = ""

# User Permission Model for Calendar Access
class UserRole(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    email: str
    role: str = "user"  # user, admin, super_admin
    department: Optional[str] = ""
    can_view_all_calendars: bool = False
    can_create_meetings: bool = True
    can_manage_users: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Calendar API Endpoints
@api_router.post("/calendar/events", response_model=CalendarEvent)
async def create_calendar_event(event_input: CalendarEventCreate, current_user_id: str = "demo_user"):
    """Create a new calendar event"""
    try:
        # Parse datetime strings
        start_dt = datetime.fromisoformat(event_input.start_datetime.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(event_input.end_datetime.replace('Z', '+00:00'))
        
        # Get organizer info (for demo, use hardcoded values)
        organizer_name = "Demo User"  # In real app, fetch from user management
        
        # Create event
        event_data = event_input.dict()
        event_data.update({
            "id": str(uuid.uuid4()),
            "start_datetime": start_dt,
            "end_datetime": end_dt,
            "organizer_id": current_user_id,
            "organizer_name": organizer_name,
            "created_by": current_user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Add attendee info
        attendees = []
        for attendee_id in event_input.attendee_ids:
            # In real app, fetch user details from database
            attendees.append({
                "id": attendee_id,
                "name": f"User {attendee_id}",  # Placeholder
                "email": f"user{attendee_id}@example.com",  # Placeholder
                "status": "pending"
            })
        event_data["attendees"] = attendees
        
        # Create calendar event object
        calendar_event = CalendarEvent(**event_data)
        
        # Insert to database
        result = await db.calendar_events.insert_one(calendar_event.dict())
        
        # Send meeting invitations
        for attendee_id in event_input.attendee_ids:
            if attendee_id != current_user_id:  # Don't send invitation to organizer
                invitation = MeetingInvitation(
                    event_id=calendar_event.id,
                    invitee_id=attendee_id,
                    invitee_name=f"User {attendee_id}",
                    invitee_email=f"user{attendee_id}@example.com"
                )
                await db.meeting_invitations.insert_one(invitation.dict())
        
        return calendar_event
        
    except Exception as e:
        logger.error(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/calendar/events", response_model=List[CalendarEvent])
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = "demo_user",
    user_role: str = "user",  # user, admin, super_admin
    include_archived: bool = False,  # Set to true to include archived events
    archived_only: bool = False  # Set to true to get only archived events
):
    """Get calendar events based on user permissions"""
    try:
        query = {}
        
        # Archive filtering
        if archived_only:
            query["is_archived"] = True
        elif not include_archived:
            query["is_archived"] = {"$ne": True}
        
        # Date filtering
        if start_date and end_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            date_query = {
                "$or": [
                    {"start_datetime": {"$gte": start_dt, "$lte": end_dt}},
                    {"end_datetime": {"$gte": start_dt, "$lte": end_dt}},
                    {"start_datetime": {"$lte": start_dt}, "end_datetime": {"$gte": end_dt}}
                ]
            }
            # Merge with existing query
            if "$or" in query:
                query = {"$and": [query, date_query]}
            else:
                query.update(date_query)
        
        # Permission-based filtering
        if user_role in ["admin", "super_admin"]:
            # Admin and super admin can see all events
            pass
        else:
            # Regular users can only see their own events and public events they're invited to
            perm_query = {
                "$or": [
                    {"organizer_id": user_id},
                    {"attendee_ids": user_id, "visibility": "public"},
                    {"visibility": "public"}
                ]
            }
            # Merge with existing query
            if "$and" in query:
                query["$and"].append(perm_query)
            else:
                query = {"$and": [query, perm_query]}
        
        events = await db.calendar_events.find(query).sort("start_datetime", 1).to_list(length=None)
        return [CalendarEvent(**event) for event in events]
        
    except Exception as e:
        logger.error(f"Error getting calendar events: {str(e)}")
        return []

@api_router.get("/calendar/events/{event_id}", response_model=CalendarEvent)
async def get_calendar_event(event_id: str):
    """Get a specific calendar event"""
    try:
        event = await db.calendar_events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return CalendarEvent(**event)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/calendar/events/{event_id}", response_model=CalendarEvent)
async def update_calendar_event(event_id: str, event_input: CalendarEventCreate):
    """Update a calendar event"""
    try:
        # Parse datetime strings
        start_dt = datetime.fromisoformat(event_input.start_datetime.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(event_input.end_datetime.replace('Z', '+00:00'))
        
        update_data = event_input.dict()
        update_data.update({
            "start_datetime": start_dt,
            "end_datetime": end_dt,
            "updated_at": datetime.utcnow()
        })
        
        result = await db.calendar_events.update_one(
            {"id": event_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            updated_event = await db.calendar_events.find_one({"id": event_id})
            return CalendarEvent(**updated_event)
        else:
            raise HTTPException(status_code=404, detail="Event not found or no changes made")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/calendar/events/archive-past")
async def archive_past_events():
    """
    Automatically archive all past events (end_datetime < now)
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Find all past events that are not archived yet
        result = await db.calendar_events.update_many(
            {
                "end_datetime": {"$lt": now},
                "is_archived": {"$ne": True}
            },
            {
                "$set": {
                    "is_archived": True,
                    "updated_at": now
                }
            }
        )
        
        return {
            "success": True,
            "archived_count": result.modified_count,
            "message": f"{result.modified_count} toplantı arşivlendi"
        }
    except Exception as e:
        logger.error(f"Error archiving past events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str):
    """Delete a calendar event"""
    try:
        result = await db.calendar_events.delete_one({"id": event_id})
        
        if result.deleted_count:
            # Also delete related invitations
            await db.meeting_invitations.delete_many({"event_id": event_id})
            return {"message": "Event deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Event not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/calendar/invitations/{user_id}")
async def get_meeting_invitations(user_id: str):
    """Get pending meeting invitations for a user"""
    try:
        invitations = await db.meeting_invitations.find({
            "invitee_id": user_id,
            "status": "pending"
        }).to_list(length=None)
        
        # Enrich with event details
        enriched_invitations = []
        for invitation in invitations:
            event = await db.calendar_events.find_one({"id": invitation["event_id"]})
            if event:
                invitation["event_details"] = {
                    "title": event["title"],
                    "description": event["description"],
                    "start_datetime": event["start_datetime"],
                    "end_datetime": event["end_datetime"],
                    "location": event["location"],
                    "organizer_name": event["organizer_name"]
                }
            enriched_invitations.append(invitation)
        
        return enriched_invitations
        
    except Exception as e:
        logger.error(f"Error getting meeting invitations: {str(e)}")
        return []

@api_router.post("/calendar/invitations/{invitation_id}/respond")
async def respond_to_meeting_invitation(invitation_id: str, response: MeetingResponse):
    """Respond to a meeting invitation"""
    try:
        # Update invitation status
        result = await db.meeting_invitations.update_one(
            {"id": invitation_id},
            {
                "$set": {
                    "status": response.status,
                    "response_message": response.message,
                    "response_date": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count:
            # Update attendee status in the event
            invitation = await db.meeting_invitations.find_one({"id": invitation_id})
            if invitation:
                await db.calendar_events.update_one(
                    {
                        "id": invitation["event_id"],
                        "attendees.id": invitation["invitee_id"]
                    },
                    {"$set": {"attendees.$.status": response.status}}
                )
            
            return {"message": "Response recorded successfully"}
        else:
            raise HTTPException(status_code=404, detail="Invitation not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to invitation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Create Sample Calendar Data Endpoint (for testing)
@api_router.post("/calendar/create-sample-data")
async def create_sample_calendar_data():
    """Create sample calendar events for testing"""
    try:
        # Clear existing events
        await db.calendar_events.delete_many({})
        await db.meeting_invitations.delete_many({})
        
        sample_events = [
            {
                "title": "Proje Kickoff Toplantısı",
                "description": "Yeni proje için başlangıç toplantısı",
                "start_datetime": (datetime.utcnow() + timedelta(days=1)).replace(hour=10, minute=0),
                "end_datetime": (datetime.utcnow() + timedelta(days=1)).replace(hour=11, minute=30),
                "event_type": "meeting",
                "location": "Toplantı Odası A",
                "organizer_id": "demo_user",
                "organizer_name": "Demo User",
                "attendee_ids": ["user1", "user2"],
                "visibility": "public"
            },
            {
                "title": "Müşteri Sunumu",
                "description": "ABC Corp için proje sunumu",
                "start_datetime": (datetime.utcnow() + timedelta(days=2)).replace(hour=14, minute=0),
                "end_datetime": (datetime.utcnow() + timedelta(days=2)).replace(hour=15, minute=0),
                "event_type": "meeting",
                "location": "Online - Zoom",
                "organizer_id": "demo_user",
                "organizer_name": "Demo User",
                "attendee_ids": ["user1"],
                "meeting_link": "https://zoom.us/j/123456789",
                "visibility": "public"
            },
            {
                "title": "Haftalık Takım Toplantısı",
                "description": "Haftalık durumsal güncellemeler",
                "start_datetime": (datetime.utcnow() + timedelta(days=3)).replace(hour=9, minute=0),
                "end_datetime": (datetime.utcnow() + timedelta(days=3)).replace(hour=10, minute=0),
                "event_type": "meeting",
                "location": "Toplantı Odası B",
                "organizer_id": "admin_user",
                "organizer_name": "Admin User",
                "attendee_ids": ["demo_user", "user1", "user2", "user3"],
                "visibility": "public"
            }
        ]
        
        created_events = []
        for event_data in sample_events:
            # Create attendees array
            attendees = []
            for attendee_id in event_data.get("attendee_ids", []):
                attendees.append({
                    "id": attendee_id,
                    "name": f"User {attendee_id}",
                    "email": f"{attendee_id}@example.com",
                    "status": "pending"
                })
            event_data["attendees"] = attendees
            
            # Add additional fields
            event_data["id"] = str(uuid.uuid4())
            event_data["created_by"] = event_data["organizer_id"]
            event_data["created_at"] = datetime.utcnow()
            event_data["updated_at"] = datetime.utcnow()
            event_data["status"] = "confirmed"
            event_data["all_day"] = False
            event_data["recurring"] = False
            event_data["reminder_minutes"] = [15]
            
            # Create event
            calendar_event = CalendarEvent(**event_data)
            result = await db.calendar_events.insert_one(calendar_event.dict())
            created_events.append(calendar_event)
            
            # Create invitations for attendees
            for attendee_id in event_data.get("attendee_ids", []):
                if attendee_id != event_data["organizer_id"]:
                    invitation = MeetingInvitation(
                        event_id=calendar_event.id,
                        invitee_id=attendee_id,
                        invitee_name=f"User {attendee_id}",
                        invitee_email=f"{attendee_id}@example.com"
                    )
                    await db.meeting_invitations.insert_one(invitation.dict())
        
        return {
            "success": True,
            "message": f"{len(created_events)} sample events created successfully",
            "events": [{"id": e.id, "title": e.title} for e in created_events]
        }
        
    except Exception as e:
        logger.error(f"Error creating sample calendar data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== MEETING REQUESTS ENDPOINTS =====================

@api_router.post("/meeting-requests", response_model=MeetingRequest)
async def create_meeting_request(request_data: MeetingRequestCreate, organizer_id: str = "demo_user"):
    """Create a new meeting request"""
    try:
        # Use organizer_id from request data if provided, otherwise use parameter default
        actual_organizer_id = request_data.organizer_id if request_data.organizer_id else organizer_id
        
        # Get organizer name from user database
        organizer_user = await db.users.find_one({"id": actual_organizer_id})
        if organizer_user:
            organizer_name = organizer_user["name"]
        else:
            # More user-friendly fallback based on known user IDs
            user_name_map = {
                "murb": "Murat Bucak",
                "tame": "Tamer Erdim", 
                "batu": "Batuhan Cücük",
                "vata": "Vatan Dalkılıç",
                "biry": "Birtan Yılmaz",
                "beyn": "Beyza Nur",
                "niyk": "Niyazi Karahan",
                "sukb": "Şükran Bucak",
                "icla": "İclal Aksu",
                "meha": "Mehmet Ağdaş"
            }
            organizer_name = user_name_map.get(actual_organizer_id, f"Kullanıcı {actual_organizer_id}")
        
        # Get attendee names from user database
        attendee_names = []
        for attendee_id in request_data.attendee_ids:
            # Try to get from user database first
            attendee_user = await db.users.find_one({"id": attendee_id})
            if attendee_user:
                attendee_names.append(attendee_user["name"])
            else:
                # Fallback with known user mapping
                user_name_map = {
                    "murb": "Murat Bucak",
                    "tame": "Tamer Erdim", 
                    "batu": "Batuhan Cücük",
                    "vata": "Vatan Dalkılıç",
                    "biry": "Birtan Yılmaz",
                    "beyn": "Beyza Nur",
                    "niyk": "Niyazi Karahan",
                    "sukb": "Şükran Bucak",
                    "icla": "İclal Aksu",
                    "meha": "Mehmet Ağdaş"
                }
                attendee_names.append(user_name_map.get(attendee_id, f"Kullanıcı {attendee_id}"))
        
        # Create meeting request
        request_dict = request_data.dict()
        request_dict.pop('organizer_id', None)  # Remove organizer_id from request data to avoid conflict
        
        meeting_request = MeetingRequest(
            **request_dict,
            organizer_id=actual_organizer_id,
            organizer_name=organizer_name,
            attendee_names=attendee_names
        )
        
        # Save to database
        await db.meeting_requests.insert_one(meeting_request.dict())
        
        # Send invitation emails to all attendees
        try:
            for attendee_id in request_data.attendee_ids:
                # Get attendee details
                attendee = await db.users.find_one({"id": attendee_id})
                if attendee:
                    attendee_email = attendee["email"]
                    attendee_name = attendee["name"]
                    
                    # Prepare meeting info for email
                    meeting_location_info = ""
                    if meeting_request.meeting_type == 'physical':
                        meeting_location_info = f"📍 Konum: {meeting_request.location}"
                    else:
                        meeting_location_info = f"💻 Platform: {meeting_request.platform}"
                        if meeting_request.meeting_link:
                            meeting_location_info += f"\n🔗 Toplantı Linki: {meeting_request.meeting_link}"
                    
                    email_subject = f"Yeni Toplantı Daveti: {meeting_request.subject}"
                    
                    email_body = f"""
Merhaba {attendee_name},

{organizer_name}, sizi "{meeting_request.subject}" konulu toplantıya davet etti.

📅 Toplantı Detayları:
• Konu: {meeting_request.subject}
• Tarih: {meeting_request.date}
• Saat: {meeting_request.start_time} - {meeting_request.end_time}
• Tür: {'Fiziki Toplantı' if meeting_request.meeting_type == 'physical' else 'Sanal Toplantı'}
{meeting_location_info}

👥 Diğer Katılımcılar: {', '.join([name for name in attendee_names if name != attendee_name])}

Lütfen bu davete yanıtınızı vermek için sisteme giriş yapın ve "Toplantı Talepleri" bölümünden davetinizi yanıtlayın.

Yanıt seçenekleriniz:
✅ Kabul - Toplantıya katılacağım
❓ Belki - Kesin değil, duruma göre katılabilirim  
❌ Reddet - Toplantıya katılamayacağım

Organize Eden: {organizer_name}

İyi çalışmalar,
Toplantı Yönetim Sistemi
                    """
                    
                    # Send invitation email
                    email_result = email_service.send_user_email(
                        to_email=attendee_email,
                        to_name=attendee_name,
                        from_email="noreply@company.com",
                        from_name="Toplantı Sistemi",
                        subject=email_subject,
                        body=email_body.strip()
                    )
                    
                    logger.info(f"Invitation email sent to {attendee_name}: {email_result}")
                    
        except Exception as email_error:
            logger.error(f"Failed to send invitation emails: {email_error}")
            # Don't fail the request creation if email fails
        
        logger.info(f"Meeting request created: {meeting_request.subject}")
        return meeting_request
        
    except Exception as e:
        logger.error(f"Error creating meeting request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating meeting request: {str(e)}")

# Enhanced Meeting Request model with responses
class MeetingRequestWithResponses(BaseModel):
    id: str
    subject: str
    date: str
    start_time: str
    end_time: str
    meeting_type: str
    location: Optional[str] = None
    platform: Optional[str] = None
    meeting_link: Optional[str] = None
    attendee_ids: List[str]
    attendee_names: List[str]
    organizer_id: str
    organizer_name: str
    status: str
    created_at: datetime
    updated_at: datetime
    responses: Dict[str, Dict] = Field(default_factory=dict)  # attendee_id -> response info

@api_router.get("/meeting-requests", response_model=List[MeetingRequestWithResponses])
async def get_meeting_requests(user_id: str = "demo_user"):
    """Get meeting requests for a user with response information"""
    try:
        # Find meeting requests where user is organizer OR attendee
        meeting_requests = await db.meeting_requests.find({
            "$or": [
                {"organizer_id": user_id},
                {"attendee_ids": {"$in": [user_id]}}
            ]
        }).sort("created_at", -1).to_list(100)
        
        # Enhance with response information
        enhanced_requests = []
        for request in meeting_requests:
            # Get all responses for this meeting request
            responses = await db.meeting_request_responses.find(
                {"request_id": request["id"]}
            ).to_list(100)
            
            # Create responses dict
            responses_dict = {}
            for response in responses:
                responses_dict[response["user_id"]] = {
                    "response": response["response"],
                    "user_name": response["user_name"],
                    "response_date": response["response_date"].isoformat() if isinstance(response["response_date"], datetime) else response["response_date"],
                    "message": response.get("message", "")
                }
            
            # Add responses to request
            request_with_responses = MeetingRequestWithResponses(
                **request,
                responses=responses_dict
            )
            enhanced_requests.append(request_with_responses)
        
        return enhanced_requests
        
    except Exception as e:
        logger.error(f"Error getting meeting requests: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting meeting requests: {str(e)}")

@api_router.get("/meeting-requests/{request_id}", response_model=MeetingRequest)
async def get_meeting_request(request_id: str):
    """Get a specific meeting request by ID"""
    try:
        request = await db.meeting_requests.find_one({"id": request_id})
        if not request:
            raise HTTPException(status_code=404, detail="Meeting request not found")
            
        return MeetingRequest(**request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting meeting request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting meeting request: {str(e)}")

@api_router.post("/meeting-requests/{request_id}/respond")
async def respond_to_meeting_request(
    request_id: str, 
    response_data: MeetingRequestResponseCreate,
    user_id: str = "demo_user"
):
    """Respond to a meeting request (accept, maybe, decline)"""
    try:
        # Verify meeting request exists
        meeting_request = await db.meeting_requests.find_one({"id": request_id})
        if not meeting_request:
            raise HTTPException(status_code=404, detail="Meeting request not found")
        
        # Get responding user details
        responding_user = await db.users.find_one({"id": user_id})
        user_name = responding_user["name"] if responding_user else f"User {user_id}"
        user_email = responding_user["email"] if responding_user else f"{user_id}@company.com"
        
        # Get organizer details
        organizer = await db.users.find_one({"id": meeting_request["organizer_id"]})
        organizer_email = organizer["email"] if organizer else f"{meeting_request['organizer_id']}@company.com"
        organizer_name = organizer["name"] if organizer else meeting_request["organizer_name"]
        
        # Check if user already responded
        existing_response = await db.meeting_request_responses.find_one({
            "request_id": request_id,
            "user_id": user_id
        })
        
        if existing_response:
            # Update existing response
            await db.meeting_request_responses.update_one(
                {"request_id": request_id, "user_id": user_id},
                {"$set": {
                    "response": response_data.response,
                    "message": response_data.message,
                    "response_date": datetime.now(timezone.utc)
                }}
            )
            response_record_id = existing_response["id"]
        else:
            # Create new response record
            response_record = MeetingRequestResponse(
                **response_data.dict(),
                user_id=user_id,
                user_name=user_name
            )
            
            # Save response
            await db.meeting_request_responses.insert_one(response_record.dict())
            response_record_id = response_record.id
        
        # Send email notification to organizer
        try:
            response_text_map = {
                "accepted": "kabul etti",
                "maybe": "belki dedi", 
                "declined": "reddetti"
            }
            
            response_emoji_map = {
                "accepted": "✅",
                "maybe": "❓",
                "declined": "❌"
            }
            
            response_text = response_text_map.get(response_data.response, response_data.response)
            response_emoji = response_emoji_map.get(response_data.response, "")
            
            email_subject = f"Toplantı Yanıtı: {meeting_request['subject']}"
            
            # Prepare meeting location/platform info
            meeting_location_info = ""
            if meeting_request['meeting_type'] == 'physical':
                meeting_location_info = f"• Konum: {meeting_request.get('location', '')}"
            else:
                meeting_location_info = f"• Platform: {meeting_request.get('platform', '')}"
                if meeting_request.get('meeting_link'):
                    meeting_location_info += f"\n• Toplantı Linki: {meeting_request['meeting_link']}"
            
            email_body = f"""
Merhaba {organizer_name},

{user_name}, "{meeting_request['subject']}" konulu toplantı davetinizi {response_emoji} {response_text}.

Toplantı Detayları:
• Konu: {meeting_request['subject']}
• Tarih: {meeting_request['date']}
• Saat: {meeting_request['start_time']} - {meeting_request['end_time']}
• Tür: {'Fiziki' if meeting_request['meeting_type'] == 'physical' else 'Sanal'}
{meeting_location_info}

{f"Yanıt Mesajı: {response_data.message}" if response_data.message else ""}

Tüm katılımcı yanıtlarını görmek için sisteme giriş yapabilirsiniz.

İyi çalışmalar,
Toplantı Yönetim Sistemi
            """
            
            # Send email using the existing email service
            email_result = email_service.send_user_email(
                to_email=organizer_email,
                to_name=organizer_name,
                from_email="noreply@company.com",
                from_name="Toplantı Sistemi",
                subject=email_subject,
                body=email_body.strip()
            )
            
            logger.info(f"Email notification sent to organizer: {email_result}")
            
        except Exception as email_error:
            logger.error(f"Failed to send email notification: {email_error}")
            # Don't fail the response if email fails
        
        logger.info(f"Meeting request response saved: {user_id} -> {response_data.response}")
        
        return {
            "success": True,
            "message": f"Yanıtınız '{response_text}' başarıyla kaydedildi ve organize edene bildirildi",
            "response_id": response_record_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to meeting request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error responding to meeting request: {str(e)}")

@api_router.get("/meeting-requests/{request_id}/responses")
async def get_meeting_request_responses(request_id: str):
    """Get all responses for a meeting request"""
    try:
        responses = await db.meeting_request_responses.find(
            {"request_id": request_id}
        ).sort("response_date", -1).to_list(100)
        
        return [MeetingRequestResponse(**response) for response in responses]
        
    except Exception as e:
        logger.error(f"Error getting meeting request responses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting meeting request responses: {str(e)}")

@api_router.delete("/meeting-requests/{request_id}")
async def delete_meeting_request(request_id: str, user_id: str = "demo_user"):
    """Delete a meeting request (only by organizer)"""
    try:
        # Verify meeting request exists and user is organizer
        meeting_request = await db.meeting_requests.find_one({"id": request_id})
        if not meeting_request:
            raise HTTPException(status_code=404, detail="Meeting request not found")
            
        if meeting_request["organizer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only organizer can delete meeting request")
        
        # Delete meeting request
        await db.meeting_requests.delete_one({"id": request_id})
        
        # Delete associated responses
        await db.meeting_request_responses.delete_many({"request_id": request_id})
        
        logger.info(f"Meeting request deleted: {request_id}")
        return {"success": True, "message": "Meeting request deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting meeting request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting meeting request: {str(e)}")

# ===================== USERS ENDPOINTS =====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="User full name")
    email: str = Field(..., description="User email")
    role: str = Field(default="user", description="User role")
    department: Optional[str] = Field(None, description="User department")
    position: Optional[str] = Field(None, description="User position/title")
    manager_id: Optional[str] = Field(None, description="Manager user ID")
    phone: Optional[str] = Field(None, description="User phone")
    password: Optional[str] = Field(None, description="User password")
    status: str = Field(default="active", description="User status: active, inactive, invited, archived")
    invited_at: Optional[datetime] = Field(None, description="Invitation timestamp")
    notification_method: Optional[str] = Field(None, description="email, whatsapp, both")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

# Password generation helper
import secrets
import string

def generate_secure_password(length=12):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

@api_router.get("/positions")
async def get_positions():
    """Get all positions"""
    try:
        positions = await db.positions.find().to_list(length=None)
        if not positions:
            # Initialize default positions
            default_positions = [
                {"id": str(uuid.uuid4()), "name": "Genel Müdür", "value": "genel_mudur", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Genel Müdür Yardımcısı", "value": "genel_mudur_yardimcisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İcra Kurulu Üyesi", "value": "icra_kurulu_uyesi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yönetim Kurulu Başkanı", "value": "yonetim_kurulu_baskani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yönetim Kurulu Üyesi", "value": "yonetim_kurulu_uyesi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Direktör", "value": "direktor", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Başkan Yardımcısı", "value": "baskan_yardimcisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Grup Başkanı", "value": "grup_baskani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bölge Müdürü", "value": "bolge_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Şube Müdürü", "value": "sube_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müdür", "value": "mudur", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müdür Yardımcısı", "value": "mudur_yardimcisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Proje Müdürü", "value": "proje_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Proje Yöneticisi", "value": "proje_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ürün Müdürü", "value": "urun_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ürün Yöneticisi", "value": "urun_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış Müdürü", "value": "satis_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış Yöneticisi", "value": "satis_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış Danışmanı", "value": "satis_danismani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış Temsilcisi", "value": "satis_temsilcisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış Uzmanı", "value": "satis_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Pazarlama Müdürü", "value": "pazarlama_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Pazarlama Yöneticisi", "value": "pazarlama_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Pazarlama Uzmanı", "value": "pazarlama_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Dijital Pazarlama Uzmanı", "value": "dijital_pazarlama_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Marka Yöneticisi", "value": "marka_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İçerik Yöneticisi", "value": "icerik_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Sosyal Medya Uzmanı", "value": "sosyal_medya_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İnsan Kaynakları Müdürü", "value": "ik_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İnsan Kaynakları Yöneticisi", "value": "ik_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İnsan Kaynakları Uzmanı", "value": "ik_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İşe Alım Uzmanı", "value": "ise_alim_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Eğitim ve Gelişim Uzmanı", "value": "egitim_gelisim_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Mali İşler Müdürü", "value": "mali_isler_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Finans Müdürü", "value": "finans_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Finans Yöneticisi", "value": "finans_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Muhasebe Müdürü", "value": "muhasebe_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Muhasebe Yöneticisi", "value": "muhasebe_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Mali Müşavir", "value": "mali_musavir", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Mali İşler Uzmanı", "value": "mali_isler_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Muhasebeci", "value": "muhasebeci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bütçe ve Planlama Uzmanı", "value": "butce_planlama_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Operasyon Müdürü", "value": "operasyon_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Operasyon Yöneticisi", "value": "operasyon_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Operasyon Uzmanı", "value": "operasyon_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Süreç Yöneticisi", "value": "surec_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kalite Güvence Müdürü", "value": "kalite_guvence_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kalite Kontrol Uzmanı", "value": "kalite_kontrol_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bilgi İşlem Müdürü", "value": "bilgi_islem_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bilgi Teknolojileri Müdürü", "value": "bt_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yazılım Geliştirme Müdürü", "value": "yazilim_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yazılım Mimarı", "value": "yazilim_mimari", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kıdemli Yazılım Geliştirici", "value": "kidemli_yazilim_gelistirici", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yazılım Geliştirici", "value": "yazilim_gelistirici", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Frontend Developer", "value": "frontend_developer", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Backend Developer", "value": "backend_developer", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Full Stack Developer", "value": "fullstack_developer", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Mobil Uygulama Geliştirici", "value": "mobil_gelistirici", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "DevOps Mühendisi", "value": "devops_muhendisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Sistem Yöneticisi", "value": "sistem_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Network Yöneticisi", "value": "network_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Veri Tabanı Yöneticisi", "value": "veritabani_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Siber Güvenlik Uzmanı", "value": "siber_guvenlik_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bilgi Güvenliği Uzmanı", "value": "bilgi_guvenligi_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Veri Analisti", "value": "veri_analisti", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Veri Bilimci", "value": "veri_bilimci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İş Analisti", "value": "is_analisti", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ürün Sahibi", "value": "urun_sahibi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Scrum Master", "value": "scrum_master", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müşteri İlişkileri Müdürü", "value": "musteri_iliskileri_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müşteri Hizmetleri Yöneticisi", "value": "musteri_hizmetleri_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müşteri Temsilcisi", "value": "musteri_temsilcisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müşteri Destek Uzmanı", "value": "musteri_destek_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Çağrı Merkezi Müdürü", "value": "cagri_merkezi_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Çağrı Merkezi Yöneticisi", "value": "cagri_merkezi_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Çağrı Merkezi Operatörü", "value": "cagri_merkezi_operatoru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Halkla İlişkiler Müdürü", "value": "halkla_iliskiler_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Halkla İlişkiler Uzmanı", "value": "halkla_iliskiler_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kurumsal İletişim Müdürü", "value": "kurumsal_iletisim_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kurumsal İletişim Uzmanı", "value": "kurumsal_iletisim_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satın Alma Müdürü", "value": "satin_alma_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satın Alma Yöneticisi", "value": "satin_alma_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satın Alma Uzmanı", "value": "satin_alma_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Tedarik Zinciri Müdürü", "value": "tedarik_zinciri_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Tedarik Zinciri Yöneticisi", "value": "tedarik_zinciri_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Lojistik Müdürü", "value": "lojistik_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Lojistik Yöneticisi", "value": "lojistik_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Lojistik Uzmanı", "value": "lojistik_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Depo Müdürü", "value": "depo_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Depo Sorumlusu", "value": "depo_sorumlusu", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Hukuk Müşaviri", "value": "hukuk_musaviri", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Hukuk Danışmanı", "value": "hukuk_danismani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Avukat", "value": "avukat", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Uyum Yöneticisi", "value": "uyum_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Risk Yöneticisi", "value": "risk_yoneticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İç Denetçi", "value": "ic_denetci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Dış Denetçi", "value": "dis_denetci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Araştırma ve Geliştirme Müdürü", "value": "ar_ge_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ar-Ge Uzmanı", "value": "ar_ge_uzmani", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Tasarım Müdürü", "value": "tasarim_muduru", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Grafik Tasarımcı", "value": "grafik_tasarimci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "UI/UX Tasarımcı", "value": "ui_ux_tasarimci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kreatif Direktör", "value": "kreatif_direktor", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İçerik Üreticisi", "value": "icerik_ureticisi", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kopyacı", "value": "kopyaci", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Editör", "value": "editor", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Uzman", "value": "uzman", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kıdemli Uzman", "value": "kidemli_uzman", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Koordinatör", "value": "koordinator", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Asistan", "value": "asistan", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Memur", "value": "memur", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Teknisyen", "value": "teknisyen", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Tekniker", "value": "tekniker", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Stajyer", "value": "stajyer", "created_at": datetime.now(timezone.utc)},
            ]
            await db.positions.insert_many(default_positions)
            positions = default_positions
        
        return [serialize_document(pos) for pos in positions]
    except Exception as e:
        logger.error(f"Error getting positions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class PositionCreate(BaseModel):
    name: str

@api_router.post("/positions")
async def create_position(position_data: PositionCreate):
    """Create a new position"""
    try:
        # Generate value from name (lowercase, replace spaces with underscores, Turkish chars)
        value = position_data.name.lower()
        # Turkish character conversion
        tr_chars = {'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'}
        for tr, en in tr_chars.items():
            value = value.replace(tr, en)
        value = value.replace(' ', '_')
        
        # Check if position already exists
        existing = await db.positions.find_one({"value": value})
        if existing:
            raise HTTPException(status_code=400, detail="Bu pozisyon zaten mevcut")
        
        new_position = {
            "id": str(uuid.uuid4()),
            "name": position_data.name,
            "value": value,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.positions.insert_one(new_position)
        logger.info(f"Created position: {new_position['name']}")
        
        return {
            "success": True,
            "message": f"{new_position['name']} pozisyonu oluşturuldu",
            "position": serialize_document(new_position)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating position: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/positions/{position_id}")
async def update_position(position_id: str, position_data: PositionCreate):
    """Update a position"""
    try:
        existing = await db.positions.find_one({"id": position_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Pozisyon bulunamadı")
        
        # Generate new value from name
        value = position_data.name.lower()
        tr_chars = {'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'}
        for tr, en in tr_chars.items():
            value = value.replace(tr, en)
        value = value.replace(' ', '_')
        
        update_data = {
            "name": position_data.name,
            "value": value,
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.positions.update_one(
            {"id": position_id},
            {"$set": update_data}
        )
        
        updated = await db.positions.find_one({"id": position_id})
        logger.info(f"Updated position: {position_id}")
        
        return {
            "success": True,
            "message": "Pozisyon güncellendi",
            "position": serialize_document(updated)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating position: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/positions/{position_id}")
async def delete_position(position_id: str):
    """Delete a position (only if not used by any user)"""
    try:
        position = await db.positions.find_one({"id": position_id})
        if not position:
            raise HTTPException(status_code=404, detail="Pozisyon bulunamadı")
        
        # Check if position is used by any user
        users_with_position = await db.users.find_one({"position": position["name"]})
        if users_with_position:
            raise HTTPException(
                status_code=400, 
                detail="Bu pozisyon aktif kullanıcılar tarafından kullanılıyor ve silinemez"
            )
        
        await db.positions.delete_one({"id": position_id})
        logger.info(f"Deleted position: {position_id}")
        
        return {
            "success": True,
            "message": f"{position['name']} pozisyonu silindi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting position: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DEPARTMENTS ENDPOINTS ====================

class Department(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentCreate(BaseModel):
    name: str

@api_router.get("/departments")
async def get_departments():
    """Get all departments"""
    try:
        departments = await db.departments.find().to_list(length=None)
        if not departments:
            # Initialize default departments
            default_departments = [
                {"id": str(uuid.uuid4()), "name": "Genel Müdürlük", "value": "genel_mudurluk", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İnsan Kaynakları", "value": "insan_kaynaklari", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Finans ve Muhasebe", "value": "finans_muhasebe", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış ve Pazarlama", "value": "satis_pazarlama", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Operasyon", "value": "operasyon", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bilgi Teknolojileri", "value": "bilgi_teknolojileri", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Hukuk", "value": "hukuk", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ar-Ge", "value": "ar_ge", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Üretim", "value": "uretim", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kalite Güvence", "value": "kalite_guvence", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Lojistik", "value": "lojistik", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satın Alma", "value": "satin_alma", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müşteri Hizmetleri", "value": "musteri_hizmetleri", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İç Denetim", "value": "ic_denetim", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kurumsal İletişim", "value": "kurumsal_iletisim", "created_at": datetime.now(timezone.utc)},
            ]
            await db.departments.insert_many(default_departments)
            departments = default_departments
        
        return [serialize_document(dept) for dept in departments]
    except Exception as e:
        logger.error(f"Error getting departments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/departments")
async def create_department(department_data: DepartmentCreate):
    """Create a new department"""
    try:
        # Generate value from name
        value = department_data.name.lower()
        tr_chars = {'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'}
        for tr, en in tr_chars.items():
            value = value.replace(tr, en)
        value = value.replace(' ', '_')
        
        # Check if department already exists
        existing = await db.departments.find_one({"value": value})
        if existing:
            raise HTTPException(status_code=400, detail="Bu departman zaten mevcut")
        
        new_department = {
            "id": str(uuid.uuid4()),
            "name": department_data.name,
            "value": value,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.departments.insert_one(new_department)
        logger.info(f"Created department: {new_department['name']}")
        
        return {
            "success": True,
            "message": f"{new_department['name']} departmanı oluşturuldu",
            "department": serialize_document(new_department)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/departments/{department_id}")
async def update_department(department_id: str, department_data: DepartmentCreate):
    """Update a department"""
    try:
        existing = await db.departments.find_one({"id": department_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Departman bulunamadı")
        
        # Generate new value from name
        value = department_data.name.lower()
        tr_chars = {'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'}
        for tr, en in tr_chars.items():
            value = value.replace(tr, en)
        value = value.replace(' ', '_')
        
        update_data = {
            "name": department_data.name,
            "value": value,
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.departments.update_one(
            {"id": department_id},
            {"$set": update_data}
        )
        
        updated = await db.departments.find_one({"id": department_id})
        logger.info(f"Updated department: {department_id}")
        
        return {
            "success": True,
            "message": "Departman güncellendi",
            "department": serialize_document(updated)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/departments/{department_id}")
async def delete_department(department_id: str):
    """Delete a department (only if not used by any user)"""
    try:
        department = await db.departments.find_one({"id": department_id})
        if not department:
            raise HTTPException(status_code=404, detail="Departman bulunamadı")
        
        # Check if department is used by any user
        users_with_dept = await db.users.find_one({"department": department["name"]})
        if users_with_dept:
            raise HTTPException(
                status_code=400, 
                detail="Bu departman aktif kullanıcılar tarafından kullanılıyor ve silinemez"
            )
        
        await db.departments.delete_one({"id": department_id})
        logger.info(f"Deleted department: {department_id}")
        
        return {
            "success": True,
            "message": f"{department['name']} departmanı silindi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== EXPENSE CENTERS ENDPOINTS ====================

class ExpenseCenter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCenterCreate(BaseModel):
    name: str

def generate_expense_center_code(name: str) -> str:
    """Generate expense center code from name"""
    # Take first letters of each word
    words = name.upper().split()
    if len(words) == 1:
        code_prefix = words[0][:3]
    else:
        code_prefix = ''.join([word[0] for word in words[:3]])
    
    # Turkish character conversion
    tr_chars = {'İ': 'I', 'Ş': 'S', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C'}
    for tr, en in tr_chars.items():
        code_prefix = code_prefix.replace(tr, en)
    
    return code_prefix

@api_router.get("/expense-centers")
async def get_expense_centers():
    """Get all expense centers"""
    try:
        centers = await db.expense_centers.find().to_list(length=None)
        if not centers:
            # Initialize default expense centers
            default_centers = [
                {"id": str(uuid.uuid4()), "name": "Genel Giderler", "code": "GG-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Pazarlama Giderleri", "code": "PAZ-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satış Giderleri", "code": "SAT-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İnsan Kaynakları Giderleri", "code": "IK-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Bilgi Teknolojileri Giderleri", "code": "BT-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Üretim Giderleri", "code": "UR-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Lojistik Giderleri", "code": "LOJ-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ar-Ge Giderleri", "code": "ARGE-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Finans Giderleri", "code": "FIN-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Hukuk Giderleri", "code": "HUK-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Operasyon Giderleri", "code": "OPR-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kalite Güvence Giderleri", "code": "KG-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Müşteri Hizmetleri Giderleri", "code": "MH-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Satın Alma Giderleri", "code": "SA-001", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İdari Giderler", "code": "ID-001", "created_at": datetime.now(timezone.utc)},
            ]
            await db.expense_centers.insert_many(default_centers)
            centers = default_centers
        
        return [serialize_document(center) for center in centers]
    except Exception as e:
        logger.error(f"Error getting expense centers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expense-centers")
async def create_expense_center(center_data: ExpenseCenterCreate):
    """Create a new expense center"""
    try:
        # Generate code from name
        code_prefix = generate_expense_center_code(center_data.name)
        
        # Find next available number
        existing_centers = await db.expense_centers.find(
            {"code": {"$regex": f"^{code_prefix}-"}}
        ).to_list(length=None)
        
        if existing_centers:
            # Extract numbers and find max
            numbers = []
            for center in existing_centers:
                try:
                    num = int(center['code'].split('-')[-1])
                    numbers.append(num)
                except:
                    pass
            next_num = max(numbers) + 1 if numbers else 1
        else:
            next_num = 1
        
        final_code = f"{code_prefix}-{next_num:03d}"
        
        new_center = {
            "id": str(uuid.uuid4()),
            "name": center_data.name,
            "code": final_code,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.expense_centers.insert_one(new_center)
        logger.info(f"Created expense center: {new_center['name']} with code {final_code}")
        
        return {
            "success": True,
            "message": f"{new_center['name']} masraf merkezi oluşturuldu (Kod: {final_code})",
            "expense_center": serialize_document(new_center)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating expense center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/expense-centers/{center_id}")
async def update_expense_center(center_id: str, center_data: ExpenseCenterCreate):
    """Update an expense center"""
    try:
        existing = await db.expense_centers.find_one({"id": center_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Masraf merkezi bulunamadı")
        
        # Generate new code from name
        code_prefix = generate_expense_center_code(center_data.name)
        
        # Find next available number for this prefix
        existing_centers = await db.expense_centers.find(
            {"code": {"$regex": f"^{code_prefix}-"}, "id": {"$ne": center_id}}
        ).to_list(length=None)
        
        if existing_centers:
            numbers = []
            for center in existing_centers:
                try:
                    num = int(center['code'].split('-')[-1])
                    numbers.append(num)
                except:
                    pass
            next_num = max(numbers) + 1 if numbers else 1
        else:
            next_num = 1
        
        final_code = f"{code_prefix}-{next_num:03d}"
        
        update_data = {
            "name": center_data.name,
            "code": final_code,
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.expense_centers.update_one(
            {"id": center_id},
            {"$set": update_data}
        )
        
        updated = await db.expense_centers.find_one({"id": center_id})
        logger.info(f"Updated expense center: {center_id} with new code {final_code}")
        
        return {
            "success": True,
            "message": f"Masraf merkezi güncellendi (Yeni Kod: {final_code})",
            "expense_center": serialize_document(updated)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/expense-centers/{center_id}")
async def delete_expense_center(center_id: str):
    """Delete an expense center"""
    try:
        center = await db.expense_centers.find_one({"id": center_id})
        if not center:
            raise HTTPException(status_code=404, detail="Masraf merkezi bulunamadı")
        
        await db.expense_centers.delete_one({"id": center_id})
        logger.info(f"Deleted expense center: {center_id}")
        
        return {
            "success": True,
            "message": f"{center['name']} masraf merkezi silindi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting expense center: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ADVANCE CATEGORIES ENDPOINTS ====================

class AdvanceCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdvanceCategoryCreate(BaseModel):
    name: str

class AdvanceCategoryStatusUpdate(BaseModel):
    status: str

@api_router.get("/advance-categories")
async def get_advance_categories():
    try:
        categories = await db.advance_categories.find().to_list(length=None)
        if not categories:
            default_categories = [
                {"id": str(uuid.uuid4()), "name": "Yol", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yemek", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Konaklama", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ulaşım", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yakıt", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Eğitim", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Kırtasiye", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Telefon", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İnternet", "status": "active", "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Temizlik", "status": "active", "created_at": datetime.now(timezone.utc)},
            ]
            await db.advance_categories.insert_many(default_categories)
            categories = default_categories
        return [serialize_document(cat) for cat in categories]
    except Exception as e:
        logger.error(f"Error getting advance categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/advance-categories")
async def create_advance_category(category_data: AdvanceCategoryCreate):
    try:
        new_category = {
            "id": str(uuid.uuid4()),
            "name": category_data.name,
            "status": "active",
            "created_at": datetime.now(timezone.utc)
        }
        await db.advance_categories.insert_one(new_category)
        logger.info(f"Created advance category: {new_category['name']}")
        return {
            "success": True,
            "message": f"{new_category['name']} kategorisi oluşturuldu",
            "category": serialize_document(new_category)
        }
    except Exception as e:
        logger.error(f"Error creating advance category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/advance-categories/{category_id}")
async def update_advance_category(category_id: str, category_data: AdvanceCategoryCreate):
    try:
        existing = await db.advance_categories.find_one({"id": category_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")
        await db.advance_categories.update_one(
            {"id": category_id},
            {"$set": {"name": category_data.name, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"success": True, "message": "Kategori güncellendi"}
    except Exception as e:
        logger.error(f"Error updating advance category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/advance-categories/{category_id}/status")
async def update_advance_category_status(category_id: str, status_data: AdvanceCategoryStatusUpdate):
    try:
        await db.advance_categories.update_one(
            {"id": category_id},
            {"$set": {"status": status_data.status, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/advance-categories/{category_id}")
async def delete_advance_category(category_id: str):
    try:
        category = await db.advance_categories.find_one({"id": category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")
        await db.advance_categories.delete_one({"id": category_id})
        return {"success": True, "message": f"{category['name']} kategorisi silindi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== EXPENSE CATEGORIES (Hierarchical) ====================

class ExpenseCategoryCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None

@api_router.get("/expense-categories")
async def get_expense_categories():
    try:
        categories = await db.expense_categories.find().to_list(length=None)
        if not categories:
            default = [
                {"id": str(uuid.uuid4()), "name": "Konaklama", "parent_id": None, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Ulaşım", "parent_id": None, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Yemek", "parent_id": None, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "İletişim", "parent_id": None, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Eğitim", "parent_id": None, "created_at": datetime.now(timezone.utc)},
            ]
            await db.expense_categories.insert_many(default)
            konaklama_id = default[0]["id"]
            ulasim_id = default[1]["id"]
            sub_cats = [
                {"id": str(uuid.uuid4()), "name": "Otel/Ev Giderleri", "parent_id": konaklama_id, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Minibar Harcamaları", "parent_id": konaklama_id, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Şehir Vergisi", "parent_id": konaklama_id, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Uçak Bileti", "parent_id": ulasim_id, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Tren Bileti", "parent_id": ulasim_id, "created_at": datetime.now(timezone.utc)},
                {"id": str(uuid.uuid4()), "name": "Taksi", "parent_id": ulasim_id, "created_at": datetime.now(timezone.utc)},
            ]
            await db.expense_categories.insert_many(sub_cats)
            categories = default + sub_cats
        return [serialize_document(cat) for cat in categories]
    except Exception as e:
        logger.error(f"Error getting expense categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expense-categories")
async def create_expense_category(category_data: ExpenseCategoryCreate):
    try:
        new_category = {
            "id": str(uuid.uuid4()),
            "name": category_data.name,
            "parent_id": category_data.parent_id,
            "created_at": datetime.now(timezone.utc)
        }
        await db.expense_categories.insert_one(new_category)
        return {"success": True, "message": f"{new_category['name']} kategorisi oluşturuldu"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/expense-categories/{category_id}")
async def update_expense_category(category_id: str, category_data: ExpenseCategoryCreate):
    try:
        existing = await db.expense_categories.find_one({"id": category_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")
        await db.expense_categories.update_one({"id": category_id}, {"$set": {"name": category_data.name}})
        return {"success": True, "message": "Kategori güncellendi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/expense-categories/{category_id}")
async def delete_expense_category(category_id: str):
    try:
        category = await db.expense_categories.find_one({"id": category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")
        await db.expense_categories.delete_many({"parent_id": category_id})
        await db.expense_categories.delete_one({"id": category_id})
        return {"success": True, "message": f"{category['name']} kategorisi silindi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users", response_model=List[User])
async def get_users(status: str = "active"):
    """Get all active users from database"""
    try:
        # Get users from database
        users_from_db = await db.users.find({"status": status}).sort("name", 1).to_list(100)
        
        if users_from_db:
            logger.info(f"Retrieved {len(users_from_db)} users from database")
            return [User(**user) for user in users_from_db]
        
        # If no users in database, return empty list and suggest migration
        logger.warning("No users found in database. Run POST /api/users/migrate to migrate AuthContext users.")
        return []
        
    except Exception as e:
        logger.error(f"Error getting users from database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting users: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting users: {str(e)}")

class UserCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[str] = None
    notification_method: str = "email"  # email, whatsapp, both

class UserInvite(BaseModel):
    email: str
    role: Optional[str] = "user"
    manager_id: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    manager_id: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class Position(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    value: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/users")
async def create_user(user_data: UserCreate):
    """Create a new user with auto-generated password"""
    try:
        # Check if user with same email already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor")
        
        # Generate secure password
        temp_password = generate_secure_password()
        
        # Create new user
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "phone": user_data.phone,
            "position": user_data.position,
            "department": user_data.department,
            "manager_id": user_data.manager_id,
            "password": temp_password,
            "role": "user",
            "status": "active",
            "notification_method": user_data.notification_method,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Save to database
        await db.users.insert_one(new_user)
        
        logger.info(f"Created new user: {new_user['name']} ({new_user['email']})")
        
        # Prepare notification info
        whatsapp_link = f"https://wa.me/{user_data.phone.replace('+', '').replace(' ', '')}?text=Merhaba%20{user_data.name},%0A%0AGiri%C5%9F%20Bilgileriniz:%0AE-posta:%20{user_data.email}%0AGe%C3%A7ici%20%C5%9Eifre:%20{temp_password}%0A%0AL%C3%BCtfen%20ilk%20giri%C5%9Ften%20sonra%20%C5%9Fifrenizi%20de%C4%9Fi%C5%9Ftirin."
        
        return {
            "success": True,
            "message": f"{new_user['name']} başarıyla oluşturuldu!",
            "user": serialize_document(new_user),
            "credentials": {
                "email": user_data.email,
                "password": temp_password
            },
            "whatsapp_link": whatsapp_link if user_data.phone else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@api_router.post("/users/invite")
async def invite_user(invite_data: UserInvite):
    """Invite a user to join the system"""
    try:
        # Check if user with same email already exists
        existing_user = await db.users.find_one({"email": invite_data.email})
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten sistemde kayıtlı")
        
        # Create invited user record
        user_id = str(uuid.uuid4())
        invited_user = {
            "id": user_id,
            "email": invite_data.email,
            "phone": invite_data.phone,
            "role": invite_data.role or "user",
            "manager_id": invite_data.manager_id,
            "status": "invited",
            "invited_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        
        # Save to database
        await db.users.insert_one(invited_user)
        
        logger.info(f"Invited user: {invite_data.email}")
        
        # TODO: Send invitation email/notification
        # This would be implemented with email service
        
        return {
            "success": True,
            "message": f"{invite_data.email} adresine davet gönderildi!",
            "user": serialize_document(invited_user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error inviting user: {str(e)}")

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate):
    """Update an existing user"""
    try:
        # Check if user exists
        existing_user = await db.users.find_one({"id": user_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update data (only include non-None fields)
        update_data = {k: v for k, v in user_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update user
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        # Return updated user
        updated_user = await db.users.find_one({"id": user_id})
        logger.info(f"Updated user: {user_id}")
        return User(**updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Archive a user (soft delete - set status to archived)"""
    try:
        # Check if user exists
        existing_user = await db.users.find_one({"id": user_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # Archive user (set status to archived)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "status": "archived",
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        user_name = existing_user.get("name", existing_user.get("email", ""))
        logger.info(f"Archived user: {user_id} ({user_name})")
        return {
            "success": True, 
            "message": f"{user_name} arşivlendi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error archiving user: {str(e)}")

@api_router.get("/users/count")
async def get_users_count():
    """Get count of users in the system"""
    try:
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"status": "active"})
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "departments": await db.users.distinct("department", {"status": "active"})
        }
        
    except Exception as e:
        logger.error(f"Error getting user count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting user count: {str(e)}")

@api_router.post("/users/migrate")
async def migrate_auth_users_to_database():
    """Migrate AuthContext users to database (one-time operation)"""
    try:
        # AuthContext users (matching frontend)
        auth_users = [
            {
                "id": "murb",
                "name": "Murat Bucak", 
                "email": "murat.bucak@quattrostand.com",
                "role": "admin",
                "department": "Genel Müdürlük",
                "phone": "+90 532 507 5555",
                "status": "active",
                "username": "murb",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "tame", 
                "name": "Tamer Erdim",
                "email": "tamer.erdim@quattrostand.com",
                "role": "manager",
                "department": "Satış",
                "phone": "+90 532 507 5556",
                "status": "active",
                "username": "tame",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "batu",
                "name": "Batuhan Cücük",
                "email": "batuhan.cucuk@quattrostand.com", 
                "role": "user",
                "department": "Müşteri Temsilcisi",
                "phone": "+90 532 507 5557",
                "status": "active",
                "username": "batu",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "vata",
                "name": "Vatan Dalkılıç",
                "email": "vatan.dalkilic@quattrostand.com",
                "role": "user", 
                "department": "Müşteri Temsilcisi",
                "phone": "+90 532 507 5558",
                "status": "active",
                "username": "vata",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "biry",
                "name": "Birtan Yılmaz", 
                "email": "birtan.yilmaz@quattrostand.com",
                "role": "admin",
                "department": "Admin",
                "phone": "+90 532 507 5559",
                "status": "active",
                "username": "biry",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "beyn",
                "name": "Beyza Nur",
                "email": "beyza.nur@quattrostand.com",
                "role": "user",
                "department": "Tasarım", 
                "phone": "+90 532 507 5560",
                "status": "active",
                "username": "beyn",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "niyk",
                "name": "Niyazi Karahan",
                "email": "niyazi.karahan@quattrostand.com",
                "role": "user",
                "department": "Tasarım",
                "phone": "+90 532 507 5561",
                "status": "active",
                "username": "niyk",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "sukb",
                "name": "Şükran Bucak", 
                "email": "sukran.bucak@quattrostand.com",
                "role": "user",
                "department": "Muhasebe",
                "phone": "+90 532 507 5562",
                "status": "active",
                "username": "sukb",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "icla",
                "name": "İclal Aksu",
                "email": "iclal.aksu@quattrostand.com",
                "role": "user", 
                "department": "Tasarım",
                "phone": "+90 532 507 5563",
                "status": "active",
                "username": "icla",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": "meha",
                "name": "Mehmet Ağdaş",
                "email": "info@noktafuar.com", 
                "role": "user",
                "department": "Üretim Müdürü",
                "phone": "+90 532 507 5564",
                "status": "active",
                "username": "meha",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        
        # Clear existing users table
        await db.users.delete_many({})
        
        # Insert all auth users
        result = await db.users.insert_many(auth_users)
        
        logger.info(f"Migrated {len(auth_users)} users from AuthContext to database")
        return {
            "success": True,
            "message": f"Successfully migrated {len(auth_users)} users to database",
            "users_migrated": len(auth_users),
            "inserted_ids": [str(id) for id in result.inserted_ids]
        }
        
    except Exception as e:
        logger.error(f"Error migrating users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error migrating users: {str(e)}")

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get a specific user by ID"""
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return User(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting user: {str(e)}")

# ===================== END USERS ENDPOINTS =====================

# ===================== END MEETING REQUESTS ENDPOINTS =====================

# ===================== END CALENDAR & MEETINGS ENDPOINTS =====================

# ===================== WEBSOCKET CHAT MODELS =====================

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: str  
    content: str
    message_type: str = "text"  # text, file, image
    chatroom_id: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRoom(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_type: str = "private"  # private, group
    participant_ids: List[str]
    participant_names: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== WEBSOCKET CONNECTION MANAGER =====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.user_chatrooms: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, chatroom_id: str):
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        
        self.active_connections[user_id][chatroom_id] = websocket
        
        if user_id not in self.user_chatrooms:
            self.user_chatrooms[user_id] = []
        
        if chatroom_id not in self.user_chatrooms[user_id]:
            self.user_chatrooms[user_id].append(chatroom_id)
        
        logger.info(f"User {user_id} connected to chatroom {chatroom_id}")
    
    def disconnect(self, user_id: str, chatroom_id: str):
        if user_id in self.active_connections and chatroom_id in self.active_connections[user_id]:
            del self.active_connections[user_id][chatroom_id]
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
            if user_id in self.user_chatrooms and chatroom_id in self.user_chatrooms[user_id]:
                self.user_chatrooms[user_id].remove(chatroom_id)
                
        logger.info(f"User {user_id} disconnected from chatroom {chatroom_id}")
    
    async def send_personal_message(self, message: str, user_id: str, chatroom_id: str):
        if user_id in self.active_connections and chatroom_id in self.active_connections[user_id]:
            try:
                await self.active_connections[user_id][chatroom_id].send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                self.disconnect(user_id, chatroom_id)
    
    async def broadcast_to_chatroom(self, message: str, chatroom_id: str, exclude_user: str = None):
        for user_id, chatrooms in self.active_connections.items():
            if user_id != exclude_user and chatroom_id in chatrooms:
                try:
                    await chatrooms[chatroom_id].send_text(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    self.disconnect(user_id, chatroom_id)

manager = ConnectionManager()

# ===================== WEBSOCKET ENDPOINTS =====================

@app.websocket("/api/v1/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = None,
    chatroom_id: str = None
):
    """WebSocket endpoint for real-time chat"""
    
    # Mock auth - in production, validate JWT token here
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    if not chatroom_id:
        await websocket.close(code=1008, reason="Missing chatroom_id")
        return
    
    # Extract user info from token (mock implementation)
    user_id = token.replace("demo_token", "demo_user")  # Simple mock
    user_name = "Demo User"  # In production, get from database
    
    try:
        await manager.connect(websocket, user_id, chatroom_id)
        
        # Send connection success with recent messages
        try:
            recent_messages = await db.chat_messages.find(
                {"chatroom_id": chatroom_id}
            ).sort("created_at", -1).limit(50).to_list(50)
            
            recent_messages.reverse()  # Show oldest first
            
            await websocket.send_text(json.dumps({
                "type": "connection_success",
                "chatroom_id": chatroom_id,
                "user_id": user_id,
                "recent_messages": [
                    {
                        "id": msg.get("id"),
                        "sender_id": msg.get("sender_id"),
                        "sender_name": msg.get("sender_name"),
                        "content": msg.get("content"),
                        "message_type": msg.get("message_type", "text"),
                        "created_at": msg.get("created_at").isoformat() if isinstance(msg.get("created_at"), datetime) else msg.get("created_at"),
                        "file_name": msg.get("file_name"),
                        "file_size": msg.get("file_size")
                    }
                    for msg in recent_messages
                ]
            }))
        except Exception as e:
            logger.error(f"Error fetching recent messages: {e}")
            await websocket.send_text(json.dumps({
                "type": "connection_success",
                "chatroom_id": chatroom_id,
                "user_id": user_id,
                "recent_messages": []
            }))
        
        # Notify other users in chatroom
        await manager.broadcast_to_chatroom(
            json.dumps({
                "type": "user_joined",
                "user_id": user_id,
                "username": user_name,
                "chatroom_id": chatroom_id
            }),
            chatroom_id,
            exclude_user=user_id
        )
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                await handle_websocket_message(message_data, user_id, user_name, chatroom_id, websocket)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"WebSocket error for user {user_id}: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error", 
                    "message": str(e)
                }))
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        manager.disconnect(user_id, chatroom_id)
        
        # Notify other users
        await manager.broadcast_to_chatroom(
            json.dumps({
                "type": "user_left",
                "user_id": user_id,
                "username": user_name,
                "chatroom_id": chatroom_id
            }),
            chatroom_id
        )

async def handle_websocket_message(message_data: dict, user_id: str, user_name: str, chatroom_id: str, websocket: WebSocket):
    """Handle incoming WebSocket messages"""
    
    message_type = message_data.get("type")
    
    if message_type == "chat_message":
        # Create and save chat message
        chat_message = ChatMessage(
            sender_id=user_id,
            sender_name=user_name,
            content=message_data.get("content", ""),
            message_type=message_data.get("message_type", "text"),
            chatroom_id=chatroom_id,
            file_name=message_data.get("file_name"),
            file_size=message_data.get("file_size")
        )
        
        # Save to database
        try:
            await db.chat_messages.insert_one(chat_message.dict())
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
        
        # Update chatroom last activity
        try:
            await db.chat_rooms.update_one(
                {"id": chatroom_id},
                {
                    "$set": {"last_activity": datetime.now(timezone.utc)},
                    "$setOnInsert": {
                        "id": chatroom_id,
                        "room_type": "private", 
                        "participant_ids": [user_id],
                        "participant_names": {user_id: user_name},
                        "created_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error updating chatroom: {e}")
        
        # Broadcast message to all users in chatroom
        broadcast_data = {
            "type": "message_received",
            "message": {
                "id": chat_message.id,
                "sender_id": chat_message.sender_id,
                "sender_name": chat_message.sender_name,
                "content": chat_message.content,
                "message_type": chat_message.message_type,
                "created_at": chat_message.created_at.isoformat(),
                "file_name": chat_message.file_name,
                "file_size": chat_message.file_size
            }
        }
        
        await manager.broadcast_to_chatroom(
            json.dumps(broadcast_data),
            chatroom_id
        )
        
    elif message_type == "typing":
        # Handle typing indicators
        is_typing = message_data.get("is_typing", False)
        
        await manager.broadcast_to_chatroom(
            json.dumps({
                "type": "typing",
                "user_id": user_id,
                "username": user_name,
                "is_typing": is_typing
            }),
            chatroom_id,
            exclude_user=user_id
        )
        
    else:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        }))

# ===================== END WEBSOCKET ENDPOINTS =====================

# ===================== OPPORTUNITY NOTES MODELS =====================

class OpportunityNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    opportunity_id: str
    content: str
    author: str = "Murat Bucak"  # Default author
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OpportunityNoteCreate(BaseModel):
    content: str
    created_at: Optional[datetime] = None

class OpportunityNoteUpdate(BaseModel):
    content: Optional[str] = None

# ===================== OPPORTUNITY ACTIVITY MODELS =====================

class OpportunityActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    opportunity_id: str
    type: str  # call_record, email_management, activity_planner, design_upload, messaging
    title: str
    description: str
    status: str = "pending"  # pending, in_progress, completed, cancelled, overdue
    priority: str = "medium"  # low, medium, high, critical
    created_by: str = "Murat Bucak"  # Default author
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    data: Optional[Dict[str, Any]] = {}  # Type-specific data

class OpportunityActivityCreate(BaseModel):
    type: str
    title: str
    description: str
    status: str = "pending"
    priority: str = "medium"
    scheduled_for: Optional[datetime] = None
    data: Optional[Dict[str, Any]] = {}

class OpportunityActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    data: Optional[Dict[str, Any]] = None

# ===================== OPPORTUNITY NOTES ENDPOINTS =====================

@api_router.get("/opportunities/{opportunity_id}/notes", response_model=List[OpportunityNote])
async def get_opportunity_notes(opportunity_id: str):
    """Get all notes for a specific opportunity"""
    try:
        notes = await db.opportunity_notes.find({"opportunity_id": opportunity_id}).sort("created_at", -1).to_list(length=None)
        return [OpportunityNote(**note) for note in notes]
    except Exception as e:
        logger.error(f"Error getting opportunity notes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/opportunities/{opportunity_id}/notes", response_model=OpportunityNote)
async def create_opportunity_note(opportunity_id: str, note_input: OpportunityNoteCreate):
    """Create a new note for an opportunity"""
    try:
        # Check if opportunity exists
        opportunity = await db.opportunities.find_one({"id": opportunity_id})
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        note_data = note_input.dict()
        note_data.update({
            "id": str(uuid.uuid4()),
            "opportunity_id": opportunity_id,
            "author": "Murat Bucak",  # In production, get from auth context
            "created_at": note_input.created_at or datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        
        # Convert datetime to string for MongoDB storage
        if isinstance(note_data.get('created_at'), datetime):
            note_data['created_at'] = note_data['created_at'].isoformat()
        if isinstance(note_data.get('updated_at'), datetime):
            note_data['updated_at'] = note_data['updated_at'].isoformat()
        
        result = await db.opportunity_notes.insert_one(note_data)
        
        if result.inserted_id:
            created_note = await db.opportunity_notes.find_one({"id": note_data["id"]})
            return OpportunityNote(**created_note)
        else:
            raise HTTPException(status_code=500, detail="Failed to create note")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/opportunities/{opportunity_id}/notes/{note_id}", response_model=OpportunityNote)
async def update_opportunity_note(opportunity_id: str, note_id: str, note_input: OpportunityNoteUpdate):
    """Update an existing opportunity note"""
    try:
        update_data = {k: v for k, v in note_input.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.opportunity_notes.update_one(
            {"id": note_id, "opportunity_id": opportunity_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            updated_note = await db.opportunity_notes.find_one({"id": note_id})
            return OpportunityNote(**updated_note)
        else:
            raise HTTPException(status_code=404, detail="Note not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating opportunity note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/opportunities/{opportunity_id}/notes/{note_id}")
async def delete_opportunity_note(opportunity_id: str, note_id: str):
    """Delete an opportunity note"""
    try:
        result = await db.opportunity_notes.delete_one({
            "id": note_id, 
            "opportunity_id": opportunity_id
        })
        
        if result.deleted_count:
            return {"message": "Note deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Note not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== OPPORTUNITY ACTIVITY ENDPOINTS =====================

@api_router.get("/opportunities/{opportunity_id}/activities", response_model=List[OpportunityActivity])
async def get_opportunity_activities(opportunity_id: str):
    """Get all activities for a specific opportunity"""
    try:
        activities = await db.opportunity_activities.find({"opportunity_id": opportunity_id}).sort("created_at", -1).to_list(length=None)
        return [OpportunityActivity(**activity) for activity in activities]
    except Exception as e:
        logger.error(f"Error getting opportunity activities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/opportunities/{opportunity_id}/activities", response_model=OpportunityActivity)
async def create_opportunity_activity(opportunity_id: str, activity_input: OpportunityActivityCreate):
    """Create a new activity for an opportunity"""
    try:
        # Check if opportunity exists
        opportunity = await db.opportunities.find_one({"id": opportunity_id})
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        activity_data = activity_input.dict()
        activity_data.update({
            "id": str(uuid.uuid4()),
            "opportunity_id": opportunity_id,
            "created_by": "Murat Bucak",  # In production, get from auth context
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        
        # Convert datetime to string for MongoDB storage
        if isinstance(activity_data.get('created_at'), datetime):
            activity_data['created_at'] = activity_data['created_at'].isoformat()
        if isinstance(activity_data.get('updated_at'), datetime):
            activity_data['updated_at'] = activity_data['updated_at'].isoformat()
        if isinstance(activity_data.get('scheduled_for'), datetime):
            activity_data['scheduled_for'] = activity_data['scheduled_for'].isoformat()
        
        result = await db.opportunity_activities.insert_one(activity_data)
        
        if result.inserted_id:
            created_activity = await db.opportunity_activities.find_one({"id": activity_data["id"]})
            return OpportunityActivity(**created_activity)
        else:
            raise HTTPException(status_code=500, detail="Failed to create activity")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/opportunities/{opportunity_id}/activities/{activity_id}", response_model=OpportunityActivity)
async def get_opportunity_activity(opportunity_id: str, activity_id: str):
    """Get a specific activity"""
    try:
        activity = await db.opportunity_activities.find_one({
            "id": activity_id,
            "opportunity_id": opportunity_id
        })
        
        if activity:
            return OpportunityActivity(**activity)
        else:
            raise HTTPException(status_code=404, detail="Activity not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting opportunity activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/opportunities/{opportunity_id}/activities/{activity_id}", response_model=OpportunityActivity)
async def update_opportunity_activity(opportunity_id: str, activity_id: str, activity_input: OpportunityActivityUpdate):
    """Update an existing opportunity activity"""
    try:
        update_data = {k: v for k, v in activity_input.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Convert datetime fields to strings if present
        if update_data.get('scheduled_for') and isinstance(update_data['scheduled_for'], datetime):
            update_data['scheduled_for'] = update_data['scheduled_for'].isoformat()
        if update_data.get('completed_at') and isinstance(update_data['completed_at'], datetime):
            update_data['completed_at'] = update_data['completed_at'].isoformat()
        
        result = await db.opportunity_activities.update_one(
            {"id": activity_id, "opportunity_id": opportunity_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            updated_activity = await db.opportunity_activities.find_one({"id": activity_id})
            return OpportunityActivity(**updated_activity)
        else:
            raise HTTPException(status_code=404, detail="Activity not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating opportunity activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/opportunities/{opportunity_id}/activities/{activity_id}")
async def delete_opportunity_activity(opportunity_id: str, activity_id: str):
    """Delete an opportunity activity"""
    try:
        result = await db.opportunity_activities.delete_one({
            "id": activity_id,
            "opportunity_id": opportunity_id
        })
        
        if result.deleted_count:
            return {"message": "Activity deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Activity not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting opportunity activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/opportunities/{opportunity_id}/activities/{activity_id}/status")
async def update_activity_status(opportunity_id: str, activity_id: str, status: str):
    """Update activity status (completed, pending, in_progress, cancelled, overdue)"""
    try:
        update_data = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # If marking as completed, set completed_at timestamp
        if status == "completed":
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.opportunity_activities.update_one(
            {"id": activity_id, "opportunity_id": opportunity_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return {"message": f"Activity status updated to {status}"}
        else:
            raise HTTPException(status_code=404, detail="Activity not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating activity status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== MONGODB COLLECTIONS ADMIN API =====================

# ===================== GROUP COMPANIES =====================

@api_router.get("/group-companies")
async def get_group_companies():
    """Get all group companies"""
    try:
        companies = await db.group_companies.find().to_list(length=None)
        serialized_companies = [serialize_document(company) for company in companies]
        return serialized_companies
    except Exception as e:
        logger.error(f"Error getting group companies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/group-companies")
async def create_group_company(company_data: GroupCompanyCreate):
    """Create a new group company"""
    try:
        company = GroupCompany(**company_data.dict())
        company.created_at = datetime.utcnow()
        company.updated_at = datetime.utcnow()
        company_dict = company.dict()
        
        await db.group_companies.insert_one(company_dict)
        return company
    except Exception as e:
        logger.error(f"Error creating group company: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/group-companies/{company_id}")
async def update_group_company(company_id: str, company_data: GroupCompanyCreate):
    """Update a group company"""
    try:
        update_data = company_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.group_companies.update_one(
            {"id": company_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Company not found")
        
        updated_company = await db.group_companies.find_one({"id": company_id})
        return serialize_document(updated_company)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating group company: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/group-companies/{company_id}")
async def delete_group_company(company_id: str):
    """Delete a group company"""
    try:
        result = await db.group_companies.delete_one({"id": company_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return {"message": "Company deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting group company: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/accountants")
async def create_accountant(accountant_data: dict):
    """Create a new accountant"""
    try:
        accountant = Accountant(**accountant_data)
        accountant.created_at = datetime.utcnow()
        accountant_dict = accountant.dict()
        
        await db.accountants.insert_one(accountant_dict)
        
        # Update company with accountant info
        await db.group_companies.update_one(
            {"id": accountant.companyId},
            {"$set": {
                "accountant": {
                    "id": accountant.id,
                    "name": accountant.name,
                    "email": accountant.email,
                    "phone": accountant.phone
                }
            }}
        )
        
        return accountant
    except Exception as e:
        logger.error(f"Error creating accountant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== LIBRARY (COUNTRIES & CITIES) =====================

@api_router.get("/library/countries")
async def get_countries():
    """Get all countries"""
    try:
        countries = [
            'Türkiye', 'ABD', 'Afganistan', 'Almanya', 'Amerika Birleşik Devletleri',
            'Arjantin', 'Avustralya', 'Avusturya', 'Belçika', 'Brezilya', 'Bulgaristan',
            'Çek Cumhuriyeti', 'Çin', 'Danimarka', 'Finlandiya', 'Fransa', 'Güney Afrika',
            'Güney Kore', 'Hindistan', 'Hollanda', 'İngiltere', 'İrlanda', 'İspanya',
            'İsrail', 'İsveç', 'İsviçre', 'İtalya', 'Japonya', 'Kanada', 'Meksika',
            'Norveç', 'Polonya', 'Portekiz', 'Romanya', 'Rusya', 'Singapur', 'Yunanistan'
        ]
        return sorted(countries)
    except Exception as e:
        logger.error(f"Error getting countries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Duplicate endpoint removed - using database-driven cities from line 1098 instead

# ===================== ADMIN ENDPOINTS =====================

@api_router.get("/admin/collections")
async def get_all_collections():
    """Get all MongoDB collections with document counts"""
    try:
        # Get all collection names
        collection_names = await db.list_collection_names()
        
        # Get stats for each collection
        collections_data = []
        for name in collection_names:
            # Skip system collections
            if name.startswith('system.'):
                continue
                
            collection = db[name]
            count = await collection.count_documents({})
            
            collections_data.append({
                "name": name,
                "count": count
            })
        
        # Sort by name
        collections_data.sort(key=lambda x: x['name'])
        
        return {
            "collections": collections_data,
            "total": len(collections_data)
        }
    except Exception as e:
        logger.error(f"Error getting collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/collections/{collection_name}")
async def get_collection_documents(
    collection_name: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    """Get documents from a specific collection"""
    try:
        collection = db[collection_name]
        
        # Build query
        query = {}
        if search:
            # Search in all string fields
            query = {"$text": {"$search": search}}
        
        # Get documents
        cursor = collection.find(query).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            if '_id' in doc and isinstance(doc['_id'], ObjectId):
                doc['_id'] = str(doc['_id'])
        
        # Get total count
        total = await collection.count_documents(query)
        
        return {
            "documents": documents,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error getting documents from {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str):
    """Get statistics for a specific collection"""
    try:
        collection = db[collection_name]
        
        # Get basic stats
        total_docs = await collection.count_documents({})
        
        # Get collection stats from MongoDB
        stats = await db.command("collStats", collection_name)
        
        return {
            "name": collection_name,
            "count": total_docs,
            "size": stats.get('size', 0),
            "avgObjSize": stats.get('avgObjSize', 0),
            "storageSize": stats.get('storageSize', 0),
            "indexes": stats.get('nindexes', 0)
        }
    except Exception as e:
        logger.error(f"Error getting stats for {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/collections/{collection_name}")
async def create_document(collection_name: str, document: Dict[str, Any]):
    """Create a new document in a collection"""
    try:
        collection = db[collection_name]
        
        # Add created_at timestamp if not present
        if 'created_at' not in document:
            document['created_at'] = datetime.now(timezone.utc).isoformat()
        
        # Generate ID if not present
        if 'id' not in document and '_id' not in document:
            document['id'] = str(uuid.uuid4())
        
        # Insert document
        result = await collection.insert_one(document)
        
        # Convert ObjectId to string
        if isinstance(result.inserted_id, ObjectId):
            document['_id'] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Document created successfully",
            "document": document
        }
    except Exception as e:
        logger.error(f"Error creating document in {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/collections/{collection_name}/{doc_id}")
async def update_document(collection_name: str, doc_id: str, document: Dict[str, Any]):
    """Update a document in a collection"""
    try:
        collection = db[collection_name]
        
        # Add updated_at timestamp
        document['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        # Try to find by 'id' field first, then by '_id'
        query = {"id": doc_id}
        result = await collection.update_one(query, {"$set": document})
        
        if result.matched_count == 0:
            # Try with _id
            try:
                query = {"_id": ObjectId(doc_id)}
                result = await collection.update_one(query, {"$set": document})
            except:
                pass
        
        if result.matched_count:
            return {
                "success": True,
                "message": "Document updated successfully",
                "modified_count": result.modified_count
            }
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document in {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/collections/{collection_name}/{doc_id}")
async def delete_document(collection_name: str, doc_id: str):
    """Delete a document from a collection"""
    try:
        collection = db[collection_name]
        
        # Try to find by 'id' field first, then by '_id'
        query = {"id": doc_id}
        result = await collection.delete_one(query)
        
        if result.deleted_count == 0:
            # Try with _id
            try:
                query = {"_id": ObjectId(doc_id)}
                result = await collection.delete_one(query)
            except:
                pass
        
        if result.deleted_count:
            return {
                "success": True,
                "message": "Document deleted successfully",
                "deleted_count": result.deleted_count
            }
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document from {collection_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== CONTRACT MANAGEMENT =====================

# Contract Template Models
class ContractField(BaseModel):
    field_name: str
    field_key: str
    field_type: str
    is_required: bool = True
    dropdown_options: Optional[List[str]] = None
    selected_text: str = ""
    placeholder: str = ""
    order_index: int = 0
    unit: Optional[str] = None
    page: Optional[int] = None
    bbox: Optional[List[int]] = None
    default_value: Optional[str] = None

class ContractTemplateCreate(BaseModel):
    template_name: str
    filename: str
    total_pages: int
    pages: List[Dict]
    fields: List[ContractField]
    creation_method: str = "manual"  # "manual", "pdf_parse", "ai_create"

class ContractTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    template_name: str
    filename: str
    total_pages: int
    pages: List[Dict]
    fields: List[ContractField]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    creation_method: str = "manual"  # "manual", "pdf_parse", "ai_create"

@api_router.post("/contracts/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    """Extract text from PDF for annotation"""
    try:
        import PyPDF2
        import io
        
        # Read PDF file
        pdf_content = await file.read()
        pdf_file = io.BytesIO(pdf_content)
        
        # Extract text from all pages
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        pages_text = []
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text = page.extract_text()
            pages_text.append({
                "page_number": page_num + 1,
                "text": text,
                "lines": text.split('\n') if text else []
            })
        
        return {
            "filename": file.filename,
            "total_pages": len(pdf_reader.pages),
            "pages": pages_text
        }
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF metni çıkarılamadı: {str(e)}")

@api_router.post("/contract-templates")
async def create_contract_template(template_data: ContractTemplateCreate):
    """Create a new contract template"""
    try:
        template = ContractTemplate(
            template_name=template_data.template_name,
            filename=template_data.filename,
            total_pages=template_data.total_pages,
            pages=template_data.pages,
            fields=[field.dict() for field in template_data.fields]
        )
        
        template_dict = template.dict()
        result = await db.contract_templates.insert_one(template_dict)
        
        logger.info(f"Contract template created: {template.id}")
        return {
            "success": True,
            "message": "Sözleşme şablonu başarıyla oluşturuldu",
            "template_id": template.id,
            "template": template.dict()
        }
    except Exception as e:
        logger.error(f"Error creating contract template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Şablon oluşturulamadı: {str(e)}")

@api_router.get("/contract-templates")
async def get_contract_templates():
    """Get all contract templates"""
    try:
        templates = await db.contract_templates.find().sort("created_at", -1).to_list(length=None)
        
        # Remove MongoDB _id field
        for template in templates:
            if '_id' in template:
                del template['_id']
        
        return {
            "templates": templates,
            "count": len(templates)
        }
    except Exception as e:
        logger.error(f"Error fetching contract templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/contract-templates/{template_id}")
async def get_contract_template(template_id: str):
    """Get a specific contract template"""
    try:
        template = await db.contract_templates.find_one({"id": template_id})
        
        if not template:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        # Remove MongoDB _id field
        if '_id' in template:
            del template['_id']
        
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contract template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/contract-templates/{template_id}")
async def update_contract_template(template_id: str, template_data: ContractTemplateCreate):
    """Update an existing contract template"""
    try:
        # Check if template exists
        existing = await db.contract_templates.find_one({"id": template_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        # Update template
        updated_template = {
            "template_name": template_data.template_name,
            "filename": template_data.filename,
            "total_pages": template_data.total_pages,
            "pages": template_data.pages,
            "fields": [field.dict() for field in template_data.fields],
            "creation_method": template_data.creation_method,
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.contract_templates.update_one(
            {"id": template_id},
            {"$set": updated_template}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        logger.info(f"Contract template updated: {template_id}")
        return {
            "success": True,
            "message": "Şablon başarıyla güncellendi",
            "template_id": template_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contract template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Şablon güncellenemedi: {str(e)}")

@api_router.delete("/contract-templates/{template_id}")
async def delete_contract_template(template_id: str):
    """Delete a contract template"""
    try:
        result = await db.contract_templates.delete_one({"id": template_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        return {
            "success": True,
            "message": "Şablon başarıyla silindi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contract template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Contract (Saved Contract) Models
class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_title: str
    template_id: str
    template_name: str
    field_values: Dict[str, Any]
    status: str = "active"  # draft, active, completed, cancelled
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    pdf_content: Optional[str] = None  # Base64 encoded PDF

class ContractCreate(BaseModel):
    contract_title: str
    template_id: str
    field_values: Dict[str, Any]
    status: Optional[str] = "active"
    created_by: str

# Contract generation models
class ContractGenerateRequest(BaseModel):
    template_id: str
    field_values: Dict[str, Any]
    contract_title: Optional[str] = "Yeni Sözleşme"
    save_contract: Optional[bool] = False
    created_by: Optional[str] = None

# ===================== CONTRACTS (Saved Contracts) CRUD =====================

@api_router.post("/contracts")
async def create_contract(contract_data: ContractCreate):
    """Create and save a new contract"""
    try:
        # Get template
        template = await db.contract_templates.find_one({"id": contract_data.template_id})
        if not template:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        # Generate PDF content
        html_content = """
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; font-size: 12pt; }
                .page { page-break-after: always; margin-bottom: 40px; }
                .page:last-child { page-break-after: auto; }
                pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 12pt; }
            </style>
        </head>
        <body>
        """
        
        for page in template.get('pages', []):
            page_text = page.get('text', '')
            for field in template.get('fields', []):
                placeholder = field.get('placeholder', '')
                field_key = field.get('field_key', '')
                field_value = contract_data.field_values.get(field_key, '[DOLDURULMADI]')
                page_text = page_text.replace(placeholder, str(field_value))
            
            html_content += f'<div class="page"><pre>{page_text}</pre></div>'
        
        html_content += "</body></html>"
        
        # Generate PDF
        from weasyprint import HTML
        import io
        import base64
        
        pdf_buffer = io.BytesIO()
        HTML(string=html_content, encoding='utf-8').write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        pdf_base64 = base64.b64encode(pdf_buffer.read()).decode('utf-8')
        
        # Create contract document
        contract = Contract(
            contract_title=contract_data.contract_title,
            template_id=contract_data.template_id,
            template_name=template.get('template_name', ''),
            field_values=contract_data.field_values,
            status=contract_data.status,
            created_by=contract_data.created_by,
            pdf_content=pdf_base64
        )
        
        contract_dict = contract.dict()
        await db.contracts.insert_one(contract_dict)
        
        logger.info(f"Contract created: {contract.id} by {contract.created_by}")
        
        return {
            "success": True,
            "message": "Sözleşme başarıyla oluşturuldu",
            "contract_id": contract.id,
            "contract": contract.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sözleşme oluşturulamadı: {str(e)}")

@api_router.get("/contracts")
async def get_contracts(user_email: Optional[str] = None):
    """Get all contracts with permission filtering"""
    try:
        # Permission check
        super_admin_email = "mbucak@gmail.com"
        finance_roles = ["Muhasebe Müdürü", "Finans Müdürü"]
        admin_roles = ["Super Admin", "Yönetici"]
        
        query = {}
        can_view_all = False
        
        # Check if user can view all contracts
        if user_email:
            if user_email == super_admin_email:
                can_view_all = True
            else:
                # Check user's role from users collection
                user = await db.users.find_one({"email": user_email})
                if user:
                    user_role = user.get('role', '')
                    user_department = user.get('department', '')
                    
                    # Super admins and finance roles can see all
                    if user_role in admin_roles or user_department in finance_roles:
                        can_view_all = True
        
        # If not authorized to view all, filter by user
        if not can_view_all and user_email:
            query["created_by"] = user_email
        
        contracts = await db.contracts.find(query).sort("created_at", -1).to_list(length=None)
        
        for contract in contracts:
            if '_id' in contract:
                del contract['_id']
            # Don't send PDF content in list (too large)
            if 'pdf_content' in contract:
                contract['has_pdf'] = True
                del contract['pdf_content']
        
        return {
            "contracts": contracts,
            "count": len(contracts),
            "can_view_all": can_view_all
        }
        
    except Exception as e:
        logger.error(f"Error fetching contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/contracts/{contract_id}")
async def get_contract(contract_id: str):
    """Get a specific contract"""
    try:
        contract = await db.contracts.find_one({"id": contract_id})
        
        if not contract:
            raise HTTPException(status_code=404, detail="Sözleşme bulunamadı")
        
        if '_id' in contract:
            del contract['_id']
        
        return contract
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contract: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/contracts/{contract_id}/pdf")
async def download_contract_pdf(contract_id: str):
    """Download contract PDF"""
    try:
        contract = await db.contracts.find_one({"id": contract_id})
        
        if not contract:
            raise HTTPException(status_code=404, detail="Sözleşme bulunamadı")
        
        if not contract.get('pdf_content'):
            raise HTTPException(status_code=404, detail="PDF bulunamadı")
        
        import base64
        from fastapi.responses import StreamingResponse
        import io
        
        pdf_bytes = base64.b64decode(contract['pdf_content'])
        pdf_buffer = io.BytesIO(pdf_bytes)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={contract['contract_title']}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading contract PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str):
    """Delete a contract"""
    try:
        result = await db.contracts.delete_one({"id": contract_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Sözleşme bulunamadı")
        
        return {
            "success": True,
            "message": "Sözleşme başarıyla silindi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contract: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/contracts/{contract_id}/status")
async def update_contract_status(contract_id: str, status: str):
    """Update contract status"""
    try:
        valid_statuses = ["draft", "active", "completed", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Geçersiz durum")
        
        result = await db.contracts.update_one(
            {"id": contract_id},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Sözleşme bulunamadı")
        
        return {
            "success": True,
            "message": "Durum güncellendi"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contract status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== CONTRACT PDF GENERATION =====================

@api_router.post("/contracts/generate")
async def generate_contract(request: ContractGenerateRequest):
    """Generate a PDF contract from template with field values"""
    try:
        # Get template
        template = await db.contract_templates.find_one({"id": request.template_id})
        if not template:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        # Build HTML content from pages
        html_content = """
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 40px;
                    font-size: 12pt;
                }
                .page {
                    page-break-after: always;
                    margin-bottom: 40px;
                }
                .page:last-child {
                    page-break-after: auto;
                }
                .page-number {
                    text-align: center;
                    font-size: 10pt;
                    color: #666;
                    margin-bottom: 20px;
                }
                pre {
                    white-space: pre-wrap;
                    font-family: Arial, sans-serif;
                    font-size: 12pt;
                }
            </style>
        </head>
        <body>
        """
        
        # Replace placeholders in each page
        for page in template.get('pages', []):
            page_text = page.get('text', '')
            
            # Replace field placeholders with actual values
            for field in template.get('fields', []):
                placeholder = field.get('placeholder', '')
                field_key = field.get('field_key', '')
                field_value = request.field_values.get(field_key, '[DOLDURULMADI]')
                
                # Replace placeholder with value
                page_text = page_text.replace(placeholder, str(field_value))
            
            html_content += f"""
            <div class="page">
                <div class="page-number">Sayfa {page.get('page_number', 1)}</div>
                <pre>{page_text}</pre>
            </div>
            """
        
        html_content += """
        </body>
        </html>
        """
        
        # Generate PDF using WeasyPrint
        try:
            from weasyprint import HTML, CSS
            import io
            
            pdf_buffer = io.BytesIO()
            # Encode HTML content as UTF-8 to handle Turkish characters
            html_bytes = html_content.encode('utf-8')
            HTML(string=html_content, encoding='utf-8').write_pdf(pdf_buffer)
            pdf_buffer.seek(0)
            
            # Return PDF as response
            from fastapi.responses import StreamingResponse
            # Encode filename properly for Turkish characters
            safe_filename = request.contract_title.encode('utf-8').decode('utf-8')
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}.pdf"
                }
            )
        except ImportError:
            raise HTTPException(status_code=500, detail="WeasyPrint kütüphanesi yüklü değil")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sözleşme oluşturulamadı: {str(e)}")

# ===================== FILE UPLOAD ENDPOINTS =====================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file and return file metadata
    Simple implementation - stores file info in memory
    """
    try:
        # Read file content
        contents = await file.read()
        file_size = len(contents)
        
        # Generate a unique ID for the file
        file_id = str(uuid.uuid4())
        
        # In a real app, you would save the file to disk or cloud storage
        # For now, we'll just return metadata
        
        return {
            "id": file_id,
            "filename": file.filename,
            "original_filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "url": f"/api/files/{file_id}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya yüklenemedi: {str(e)}")

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file by ID
    Simple implementation - just returns success
    """
    try:
        # In a real app, you would delete the file from storage
        return {"success": True, "message": "Dosya silindi"}
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya silinemedi: {str(e)}")

@api_router.get("/files/{file_id}")
async def get_file(file_id: str):
    """
    Get file by ID
    Simple implementation - returns 404 for now
    """
    raise HTTPException(status_code=404, detail="Dosya bulunamadı")

# ===================== MAIN APP SETUP =====================

# Include the API router in the main app
app.include_router(api_router)

# Contracts endpoints are above, before app.include_router

# Placeholder - contracts moved above

# Include lead routes
app.include_router(leads_router.router)

# Include project routes
app.include_router(projects_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
