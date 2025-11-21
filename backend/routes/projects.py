from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Payment Term Model
class PaymentTerm(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    percentage: int  # 5, 10, 15, ..., 100
    amount: float
    dueType: str  # "pesin", "kurulum", "teslim", "takip", "ozel"
    dueDays: Optional[int] = None  # For "takip" and "ozel"
    notes: str = ""

# Project Model
class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    fairId: str
    fairName: str  # Denormalized for easy display
    fairStartDate: str  # ISO date string
    fairEndDate: str  # ISO date string
    city: str
    country: str
    contractAmount: float
    currency: str = "TRY"
    paymentTerms: List[PaymentTerm] = Field(default_factory=list)
    status: str = "yeni"  # yeni, devam_ediyor, tamamlandi, iptal
    isNew: bool = True  # Badge için
    createdFrom: str = "manual"  # manual or salesOpportunity
    salesOpportunityId: Optional[str] = None
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    updated_at: Optional[datetime] = None

# Fair Model
class Fair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    defaultCity: str
    defaultCountry: str
    defaultStartDate: Optional[str] = None
    defaultEndDate: Optional[str] = None
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

# Dependency to get database
async def get_db():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    return db

# Helper function to serialize document
def serialize_document(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB _id
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, list):
                result[key] = [serialize_document(item) if isinstance(item, dict) else item for item in value]
            elif isinstance(value, dict):
                result[key] = serialize_document(value)
            else:
                result[key] = value
        return result
    return doc

# ==================== PROJECTS ENDPOINTS ====================

@router.get("")
async def get_projects(
    status: Optional[str] = None,
    db = Depends(get_db)
):
    """Get all projects, optionally filtered by status"""
    try:
        projects_collection = db["projects"]
        
        # Build filter
        filter_query = {}
        if status:
            filter_query["status"] = status
        
        # Get projects, sort by created_at (new first)
        projects_cursor = projects_collection.find(filter_query).sort("created_at", -1)
        projects = await projects_cursor.to_list(length=None)
        
        # Serialize
        serialized_projects = [serialize_document(project) for project in projects]
        
        return JSONResponse(content=serialized_projects)
    except Exception as e:
        print(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Projeler alınırken hata oluştu: {str(e)}")

@router.post("")
async def create_project(
    project: Project,
    db = Depends(get_db)
):
    """Create a new project"""
    try:
        projects_collection = db["projects"]
        
        # Convert to dict
        project_dict = project.dict()
        
        # Ensure datetime fields are properly formatted
        if 'created_at' in project_dict and isinstance(project_dict['created_at'], datetime):
            project_dict['created_at'] = project_dict['created_at']
        else:
            project_dict['created_at'] = datetime.now(timezone.utc)
        
        # Insert
        result = await projects_collection.insert_one(project_dict)
        
        if result.inserted_id:
            # Fetch the created project
            created_project = await projects_collection.find_one({"id": project.id})
            return JSONResponse(
                content={
                    "message": "Proje başarıyla oluşturuldu",
                    "project": serialize_document(created_project)
                },
                status_code=201
            )
        else:
            raise HTTPException(status_code=500, detail="Proje oluşturulamadı")
    except Exception as e:
        print(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Proje oluşturulurken hata oluştu: {str(e)}")

@router.get("/{project_id}")
async def get_project(
    project_id: str,
    db = Depends(get_db)
):
    """Get a single project by ID"""
    try:
        projects_collection = db["projects"]
        project = await projects_collection.find_one({"id": project_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        
        # Mark as not new (remove "yeni" badge) when viewed
        if project.get("isNew", False):
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": {"isNew": False, "updated_at": datetime.now(timezone.utc)}}
            )
            project["isNew"] = False
        
        return JSONResponse(content=serialize_document(project))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Proje alınırken hata oluştu: {str(e)}")

@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    project_update: dict,
    db = Depends(get_db)
):
    """Update a project"""
    try:
        projects_collection = db["projects"]
        
        # Check if project exists
        project = await projects_collection.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        
        # Add updated_at
        project_update["updated_at"] = datetime.now(timezone.utc)
        
        # Update
        result = await projects_collection.update_one(
            {"id": project_id},
            {"$set": project_update}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            # Fetch updated project
            updated_project = await projects_collection.find_one({"id": project_id})
            return JSONResponse(content=serialize_document(updated_project))
        else:
            raise HTTPException(status_code=500, detail="Proje güncellenemedi")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Proje güncellenirken hata oluştu: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db = Depends(get_db)
):
    """Delete a project"""
    try:
        projects_collection = db["projects"]
        
        # Check if project exists
        project = await projects_collection.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        
        # Delete
        result = await projects_collection.delete_one({"id": project_id})
        
        if result.deleted_count > 0:
            return JSONResponse(
                content={
                    "message": "Proje başarıyla silindi",
                    "project_id": project_id
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Proje silinemedi")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Proje silinirken hata oluştu: {str(e)}")

# ==================== FAIRS ENDPOINTS ====================

@router.get("/fairs/all", tags=["fairs"])
async def get_fairs(
    db = Depends(get_db)
):
    """Get all fairs"""
    try:
        fairs_collection = db["fairs"]
        
        # Get fairs sorted by name
        fairs_cursor = fairs_collection.find({}).sort("name", 1)
        fairs = await fairs_cursor.to_list(length=None)
        
        # Serialize
        serialized_fairs = [serialize_document(fair) for fair in fairs]
        
        return JSONResponse(content=serialized_fairs)
    except Exception as e:
        print(f"Error fetching fairs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fuarlar alınırken hata oluştu: {str(e)}")

@router.post("/fairs", tags=["fairs"])
async def create_fair(
    fair: Fair,
    db = Depends(get_db)
):
    """Create a new fair"""
    try:
        fairs_collection = db["fairs"]
        
        # Convert to dict
        fair_dict = fair.dict()
        
        # Ensure datetime fields are properly formatted
        if 'created_at' in fair_dict and isinstance(fair_dict['created_at'], datetime):
            fair_dict['created_at'] = fair_dict['created_at']
        else:
            fair_dict['created_at'] = datetime.now(timezone.utc)
        
        # Insert
        result = await fairs_collection.insert_one(fair_dict)
        
        if result.inserted_id:
            # Fetch the created fair
            created_fair = await fairs_collection.find_one({"id": fair.id})
            return JSONResponse(
                content={
                    "message": "Fuar başarıyla eklendi",
                    "fair": serialize_document(created_fair)
                },
                status_code=201
            )
        else:
            raise HTTPException(status_code=500, detail="Fuar eklenemedi")
    except Exception as e:
        print(f"Error creating fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fuar eklenirken hata oluştu: {str(e)}")

@router.get("/fairs/{fair_id}", tags=["fairs"])
async def get_fair(
    fair_id: str,
    db = Depends(get_db)
):
    """Get a single fair by ID"""
    try:
        fairs_collection = db["fairs"]
        fair = await fairs_collection.find_one({"id": fair_id})
        
        if not fair:
            raise HTTPException(status_code=404, detail="Fuar bulunamadı")
        
        return JSONResponse(content=serialize_document(fair))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fuar alınırken hata oluştu: {str(e)}")

@router.delete("/fairs/{fair_id}", tags=["fairs"])
async def delete_fair(
    fair_id: str,
    db = Depends(get_db)
):
    """Delete a fair"""
    try:
        fairs_collection = db["fairs"]
        
        # Check if fair exists
        fair = await fairs_collection.find_one({"id": fair_id})
        if not fair:
            raise HTTPException(status_code=404, detail="Fuar bulunamadı")
        
        # Check if any projects use this fair
        projects_collection = db["projects"]
        projects_using_fair = await projects_collection.count_documents({"fairId": fair_id})
        
        if projects_using_fair > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Bu fuar {projects_using_fair} projede kullanılıyor. Önce projeleri silin veya fuarını değiştirin."
            )
        
        # Delete
        result = await fairs_collection.delete_one({"id": fair_id})
        
        if result.deleted_count > 0:
            return JSONResponse(
                content={
                    "message": "Fuar başarıyla silindi",
                    "fair_id": fair_id
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Fuar silinemedi")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting fair: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fuar silinirken hata oluştu: {str(e)}")
