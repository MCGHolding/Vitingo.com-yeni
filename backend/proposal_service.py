"""
CRM - Proposal/Teklif Module
Comprehensive proposal management system with profiles, templates, versions, and tracking
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
import logging
from enum import Enum
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'crm_db')]

# Create router
proposal_router = APIRouter(prefix="/api", tags=["proposals"])

# ===================== ENUMS =====================

class PageOrientation(str, Enum):
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"

class ProposalStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    SENT = "sent"
    VIEWED = "viewed"
    IN_NEGOTIATION = "in_negotiation"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class ModuleType(str, Enum):
    COVER_PAGE = "cover_page"
    INTRODUCTION = "introduction"
    ABOUT_COMPANY = "about_company"
    COMPANY_STATISTICS = "company_statistics"
    INCLUDED_SERVICES = "included_services"
    EXCLUDED_SERVICES = "excluded_services"
    REFERENCES = "references"
    PORTFOLIO = "portfolio"
    TIMELINE = "timeline"
    TECHNICAL_SPECS = "technical_specs"
    PRICING = "pricing"
    PAYMENT_TERMS = "payment_terms"
    WARRANTY = "warranty"
    TERMS_CONDITIONS = "terms_conditions"
    CONTACT = "contact"
    ATTACHMENTS = "attachments"

class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    NONE = "none"

class ItemType(str, Enum):
    STANDARD = "standard"
    OPTIONAL = "optional"

class ActivityType(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    MODULE_ADDED = "module_added"
    MODULE_REMOVED = "module_removed"
    MODULE_UPDATED = "module_updated"
    LINE_ITEM_ADDED = "line_item_added"
    LINE_ITEM_UPDATED = "line_item_updated"
    LINE_ITEM_REMOVED = "line_item_removed"
    STATUS_CHANGED = "status_changed"
    SENT = "sent"
    VIEWED = "viewed"
    DOWNLOADED = "downloaded"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    VERSION_CREATED = "version_created"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVED = "approved"
    APPROVAL_REJECTED = "approval_rejected"
    COMMENT_ADDED = "comment_added"

# ===================== SUB-MODELS =====================

class CompanyInfo(BaseModel):
    name: str
    address: Optional[str] = ""
    city: Optional[str] = ""
    country: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    tax_office: Optional[str] = ""
    tax_number: Optional[str] = ""

class Branding(BaseModel):
    logo_url: Optional[str] = ""
    primary_color: Optional[str] = "#1a73e8"
    secondary_color: Optional[str] = "#34a853"
    accent_color: Optional[str] = "#fbbc04"

class ProfileDefaults(BaseModel):
    page_orientation: PageOrientation = PageOrientation.PORTRAIT
    currency: str = "TRY"
    language: str = "tr"
    validity_days: int = 30
    payment_terms: Optional[str] = ""

class CustomerSnapshot(BaseModel):
    company_name: str
    contact_person: Optional[str] = ""
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    address: Optional[str] = ""

class ProjectInfo(BaseModel):
    project_name: Optional[str] = ""
    fair_name: Optional[str] = ""
    fair_venue: Optional[str] = ""
    fair_city: Optional[str] = ""
    fair_country: Optional[str] = ""
    hall_number: Optional[str] = ""
    stand_number: Optional[str] = ""
    stand_size: Optional[str] = ""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProposalSettings(BaseModel):
    page_orientation: PageOrientation = PageOrientation.PORTRAIT
    currency: str = "TRY"
    exchange_rate: float = 1.0
    exchange_rate_date: Optional[datetime] = None
    language: str = "tr"
    validity_date: Optional[datetime] = None

class PricingSummary(BaseModel):
    subtotal: float = 0.0
    discount_type: DiscountType = DiscountType.NONE
    discount_value: float = 0.0
    discount_amount: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total: float = 0.0

class Tracking(BaseModel):
    sent_at: Optional[datetime] = None
    sent_via: Optional[str] = ""
    sent_to_email: Optional[str] = ""
    first_viewed_at: Optional[datetime] = None
    view_count: int = 0
    last_viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = ""

class ImageData(BaseModel):
    url: str
    caption: Optional[str] = ""
    display_order: int = 0

class ModuleContent(BaseModel):
    title: Optional[str] = ""
    body: Optional[str] = ""
    images: List[ImageData] = Field(default_factory=list)
    custom_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TemplateContent(BaseModel):
    layout: str
    default_text: Dict[str, Any] = Field(default_factory=dict)  # Changed to Any to support nested dicts
    placeholders: List[str] = Field(default_factory=list)
    styles: Optional[Dict[str, Any]] = Field(default_factory=dict)

# ===================== MAIN MODELS =====================

class ProposalProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_group_id: Optional[str] = None
    profile_name: str
    company_info: CompanyInfo
    branding: Branding = Field(default_factory=Branding)
    defaults: ProfileDefaults = Field(default_factory=ProfileDefaults)
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProposalProfileCreate(BaseModel):
    user_id: str
    company_group_id: Optional[str] = None
    profile_name: str
    company_info: CompanyInfo
    branding: Optional[Branding] = None
    defaults: Optional[ProfileDefaults] = None
    is_default: bool = False

class ModuleTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    module_type: ModuleType
    template_name: str
    description: Optional[str] = ""
    thumbnail_url: Optional[str] = ""
    content: TemplateContent
    is_system: bool = True
    is_active: bool = True
    display_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Proposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    profile_id: str
    proposal_number: str
    sales_opportunity_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_snapshot: CustomerSnapshot
    project_info: ProjectInfo = Field(default_factory=ProjectInfo)
    settings: ProposalSettings = Field(default_factory=ProposalSettings)
    status: ProposalStatus = ProposalStatus.DRAFT
    pricing_summary: PricingSummary = Field(default_factory=PricingSummary)
    tracking: Tracking = Field(default_factory=Tracking)
    public_token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    public_url: Optional[str] = ""
    internal_notes: Optional[str] = ""
    current_version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProposalCreate(BaseModel):
    user_id: str
    profile_id: str
    customer_id: Optional[str] = None
    sales_opportunity_id: Optional[str] = None
    customer_snapshot: CustomerSnapshot
    project_info: Optional[ProjectInfo] = None
    settings: Optional[ProposalSettings] = None

class ProposalModule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proposal_id: str
    module_type: ModuleType
    template_id: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    content: ModuleContent = Field(default_factory=ModuleContent)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProposalModuleCreate(BaseModel):
    proposal_id: str
    module_type: ModuleType
    template_id: Optional[str] = None
    display_order: int = 0
    content: Optional[ModuleContent] = None

class ProposalLineItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proposal_id: str
    display_order: int = 0
    item_type: ItemType = ItemType.STANDARD
    category: Optional[str] = ""
    description: str
    quantity: float = 1.0
    unit: str = "adet"
    unit_price: float = 0.0
    discount_type: DiscountType = DiscountType.NONE
    discount_value: float = 0.0
    discount_amount: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    subtotal: float = 0.0
    total: float = 0.0
    notes: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProposalLineItemCreate(BaseModel):
    proposal_id: str
    item_type: ItemType = ItemType.STANDARD
    category: Optional[str] = ""
    description: str
    quantity: float = 1.0
    unit: str = "adet"
    unit_price: float = 0.0
    discount_type: DiscountType = DiscountType.NONE
    discount_value: float = 0.0
    tax_rate: float = 0.0
    notes: Optional[str] = ""

class ProposalVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proposal_id: str
    version_number: int
    version_name: Optional[str] = ""
    snapshot: Dict[str, Any] = Field(default_factory=dict)
    changes_summary: Optional[str] = ""
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    was_sent: bool = False
    sent_at: Optional[datetime] = None

class ProposalActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proposal_id: str
    activity_type: ActivityType
    description: str
    actor_type: str = "user"
    actor_id: Optional[str] = None
    actor_name: Optional[str] = ""
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    ip_address: Optional[str] = ""
    user_agent: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Currency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    symbol: str
    exchange_rate_to_usd: float = 1.0
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_popular: bool = False
    is_active: bool = True
    display_order: int = 0

# ===================== UTILITY FUNCTIONS =====================

async def generate_proposal_number() -> str:
    """Generate unique proposal number in format PRO-YYYY-NNNN"""
    year = datetime.now().year
    
    # Find the last proposal number for this year
    last_proposal = await db.proposals.find_one(
        {"proposal_number": {"$regex": f"^PRO-{year}-"}},
        sort=[("proposal_number", -1)]
    )
    
    if last_proposal:
        last_number = int(last_proposal["proposal_number"].split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"PRO-{year}-{new_number:04d}"

async def log_activity(
    proposal_id: str,
    activity_type: ActivityType,
    description: str,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = "",
    metadata: Optional[Dict] = None
):
    """Log a proposal activity"""
    activity = ProposalActivity(
        proposal_id=proposal_id,
        activity_type=activity_type,
        description=description,
        actor_id=actor_id,
        actor_name=actor_name,
        metadata=metadata or {}
    )
    
    await db.proposal_activities.insert_one(activity.dict())

async def calculate_line_item_totals(item_data: dict) -> dict:
    """Calculate line item totals"""
    quantity = item_data.get("quantity", 1.0)
    unit_price = item_data.get("unit_price", 0.0)
    discount_type = item_data.get("discount_type", "none")
    discount_value = item_data.get("discount_value", 0.0)
    tax_rate = item_data.get("tax_rate", 0.0)
    
    # Calculate discount amount
    base_amount = quantity * unit_price
    if discount_type == "percentage":
        discount_amount = base_amount * (discount_value / 100)
    elif discount_type == "fixed":
        discount_amount = discount_value
    else:
        discount_amount = 0.0
    
    # Calculate subtotal
    subtotal = base_amount - discount_amount
    
    # Calculate tax
    tax_amount = subtotal * (tax_rate / 100)
    
    # Calculate total
    total = subtotal + tax_amount
    
    item_data["discount_amount"] = round(discount_amount, 2)
    item_data["subtotal"] = round(subtotal, 2)
    item_data["tax_amount"] = round(tax_amount, 2)
    item_data["total"] = round(total, 2)
    
    return item_data

async def recalculate_proposal_totals(proposal_id: str):
    """Recalculate proposal pricing summary"""
    # Get all active line items
    line_items = await db.proposal_line_items.find({
        "proposal_id": proposal_id,
        "is_active": True
    }, {"_id": 0}).to_list(length=None)
    
    subtotal = sum(item.get("subtotal", 0.0) for item in line_items)
    tax_amount = sum(item.get("tax_amount", 0.0) for item in line_items)
    
    # Get proposal for discount info
    proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
    if not proposal:
        return
    
    pricing = proposal.get("pricing_summary", {})
    discount_type = pricing.get("discount_type", "none")
    discount_value = pricing.get("discount_value", 0.0)
    
    # Calculate proposal-level discount
    if discount_type == "percentage":
        discount_amount = subtotal * (discount_value / 100)
    elif discount_type == "fixed":
        discount_amount = discount_value
    else:
        discount_amount = 0.0
    
    total = subtotal - discount_amount + tax_amount
    
    # Update proposal
    await db.proposals.update_one(
        {"id": proposal_id},
        {"$set": {
            "pricing_summary": {
                "subtotal": round(subtotal, 2),
                "discount_type": discount_type,
                "discount_value": discount_value,
                "discount_amount": round(discount_amount, 2),
                "tax_rate": 0.0,  # Calculated from line items
                "tax_amount": round(tax_amount, 2),
                "total": round(total, 2)
            },
            "updated_at": datetime.now(timezone.utc)
        }}
    )

# Continue in next file part...
