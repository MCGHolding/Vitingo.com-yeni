from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/api/leads", tags=["leads"])

# Lead Pydantic Model
class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    companyName: str
    companyTitle: str = ""  # Firma Ünvanı
    contactPerson: str = ""
    contactMobile: str = ""  # İletişim Kişisi Cep Telefonu
    contactEmail: str = ""  # İletişim Kişisi Email
    contactPosition: str = ""  # İletişim Kişisi Pozisyonu
    phone: str = ""
    email: str = ""
    address: str = ""
    contactAddress: str = ""  # İletişim Kişisi Adresi
    country: str = "TR"
    city: str = ""
    contactCountry: str = ""  # İletişim Kişisi Ülkesi
    contactCity: str = ""  # İletişim Kişisi Şehri
    sector: str = ""
    relationshipType: str = ""  # Müşteri Türü
    notes: str = ""
    tags: List[str] = Field(default_factory=list)
    services: List[str] = Field(default_factory=list)
    # Lead-specific fields
    source: str = "direct"  # web, referral, campaign, etc.
    potential_value: float = 0.0
    status: str = "new"  # new, contacted, qualified, converted, lost
    # Bank information (preserved for conversion)
    iban: str = ""
    bankName: str = ""
    bankBranch: str = ""
    accountHolderName: str = ""
    swiftCode: str = ""
    # Conversion tracking
    converted_at: Optional[datetime] = None
    customer_id: Optional[str] = None
    # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    updated_at: Optional[datetime] = None

# Dependency to get database
async def get_db():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client['vitingo_crm']
    return db

# Helper function to serialize document
def serialize_lead(doc):
    """Convert MongoDB lead document to JSON-serializable format"""
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB _id
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, list):
                result[key] = value
            else:
                result[key] = value
        return result
    return doc

@router.get("")
async def get_leads(
    status: Optional[str] = None,
    db = Depends(get_db)
):
    """Get all leads, optionally filtered by status"""
    try:
        leads_collection = db["leads"]
        
        # Build filter
        filter_query = {}
        if status:
            filter_query["status"] = status
        
        # Get leads
        leads_cursor = leads_collection.find(filter_query).sort("created_at", -1)
        leads = await leads_cursor.to_list(length=None)
        
        # Serialize
        serialized_leads = [serialize_lead(lead) for lead in leads]
        
        return JSONResponse(content=serialized_leads)
    except Exception as e:
        print(f"Error fetching leads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Leadler alınırken hata oluştu: {str(e)}")

@router.post("")
async def create_lead(
    lead: Lead,
    db = Depends(get_db)
):
    """Create a new lead"""
    try:
        leads_collection = db["leads"]
        
        # Convert to dict
        lead_dict = lead.dict()
        
        # Ensure datetime fields are properly formatted
        if 'created_at' in lead_dict and isinstance(lead_dict['created_at'], datetime):
            lead_dict['created_at'] = lead_dict['created_at']
        else:
            lead_dict['created_at'] = datetime.now(timezone.utc)
        
        # Insert
        result = await leads_collection.insert_one(lead_dict)
        
        if result.inserted_id:
            # Fetch the created lead
            created_lead = await leads_collection.find_one({"id": lead.id})
            return JSONResponse(
                content={
                    "message": "Lead başarıyla oluşturuldu",
                    "lead": serialize_lead(created_lead)
                },
                status_code=201
            )
        else:
            raise HTTPException(status_code=500, detail="Lead oluşturulamadı")
    except Exception as e:
        print(f"Error creating lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead oluşturulurken hata oluştu: {str(e)}")

@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    db = Depends(get_db)
):
    """Get a single lead by ID"""
    try:
        leads_collection = db["leads"]
        lead = await leads_collection.find_one({"id": lead_id})
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead bulunamadı")
        
        return JSONResponse(content=serialize_lead(lead))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead alınırken hata oluştu: {str(e)}")

@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    db = Depends(get_db)
):
    """Delete a lead"""
    try:
        leads_collection = db["leads"]
        
        # Check if lead exists
        lead = await leads_collection.find_one({"id": lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead bulunamadı")
        
        # Delete
        result = await leads_collection.delete_one({"id": lead_id})
        
        if result.deleted_count > 0:
            return JSONResponse(
                content={
                    "message": "Lead başarıyla silindi",
                    "lead_id": lead_id
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Lead silinemedi")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead silinirken hata oluştu: {str(e)}")

@router.patch("/{lead_id}/convert")
async def convert_lead_to_customer(
    lead_id: str,
    db = Depends(get_db)
):
    """Convert a lead to a customer"""
    try:
        leads_collection = db["leads"]
        customers_collection = db["customers"]
        
        # Find the lead
        lead = await leads_collection.find_one({"id": lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead bulunamadı")
        
        # Check if already converted
        if lead.get("status") == "converted" and lead.get("customer_id"):
            return JSONResponse(
                content={
                    "success": True,
                    "message": "Lead zaten müşteriye çevrilmiş",
                    "customer_id": lead["customer_id"]
                }
            )
        
        # Create customer from lead data
        customer_doc = {
            "id": str(uuid.uuid4()),
            "companyName": lead.get("companyName", ""),
            "companyTitle": lead.get("companyTitle", ""),
            "relationshipType": lead.get("relationshipType", ""),
            "contactPerson": lead.get("contactPerson", ""),
            "contactMobile": lead.get("contactMobile", ""),
            "contactEmail": lead.get("contactEmail", ""),
            "contactPosition": lead.get("contactPosition", ""),
            "phone": lead.get("phone", ""),
            "email": lead.get("email", ""),
            "address": lead.get("address", ""),
            "contactAddress": lead.get("contactAddress", ""),
            "country": lead.get("country", "TR"),
            "city": lead.get("city", ""),
            "contactCountry": lead.get("contactCountry", ""),
            "contactCity": lead.get("contactCity", ""),
            "sector": lead.get("sector", ""),
            "notes": lead.get("notes", ""),
            "tags": lead.get("tags", []),
            "services": lead.get("services", []),
            "iban": lead.get("iban", ""),
            "bankName": lead.get("bankName", ""),
            "bankBranch": lead.get("bankBranch", ""),
            "accountHolderName": lead.get("accountHolderName", ""),
            "swiftCode": lead.get("swiftCode", ""),
            "status": "active",
            "isProspect": False,  # Regular customer
            "isFavorite": False,
            "totalOrders": 0,
            "totalRevenue": 0.0,
            "currency": "TRY",
            "created_at": datetime.now(timezone.utc),
            "customerSince": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert customer
        customer_result = await customers_collection.insert_one(customer_doc)
        new_customer_id = customer_doc["id"]
        
        # Update lead status
        await leads_collection.update_one(
            {"id": lead_id},
            {
                "$set": {
                    "status": "converted",
                    "converted_at": datetime.now(timezone.utc),
                    "customer_id": new_customer_id
                }
            }
        )
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"{lead.get('companyName', 'Lead')} başarıyla müşteriye çevrildi",
                "customer_id": new_customer_id,
                "lead_id": lead_id
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error converting lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead dönüştürülürken hata oluştu: {str(e)}")

@router.put("/{lead_id}")
async def update_lead(
    lead_id: str,
    lead_update: dict,
    db = Depends(get_db)
):
    """Update a lead"""
    try:
        leads_collection = db["leads"]
        
        # Check if lead exists
        lead = await leads_collection.find_one({"id": lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead bulunamadı")
        
        # Add updated_at
        lead_update["updated_at"] = datetime.now(timezone.utc)
        
        # Update
        result = await leads_collection.update_one(
            {"id": lead_id},
            {"$set": lead_update}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            # Fetch updated lead
            updated_lead = await leads_collection.find_one({"id": lead_id})
            return JSONResponse(content=serialize_lead(updated_lead))
        else:
            raise HTTPException(status_code=500, detail="Lead güncellenemedi")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating lead: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead güncellenirken hata oluştu: {str(e)}")
