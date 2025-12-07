"""
Tenant-Aware Documents Router
Multi-tenant documents endpoints
Created: 2025-12-07
"""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Optional
from datetime import datetime

from dependencies import get_tenant_db, get_tenant_info

router = APIRouter()


@router.get("/api/{tenant_slug}/documents")
async def get_documents(
    tenant_slug: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info),
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get documents for specific tenant
    
    Query params:
        - entity_type: Filter by entity type (customer, project, etc.)
        - entity_id: Filter by entity ID
        - limit: Maximum number of documents
    """
    try:
        query = {}
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        
        documents = await tenant_db.documents.find(
            query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "count": len(documents),
            "data": documents
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching documents: {str(e)}"
        )


@router.get("/api/{tenant_slug}/documents/{document_id}")
async def get_document_by_id(
    tenant_slug: str,
    document_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Get single document by ID
    """
    try:
        document = await tenant_db.documents.find_one(
            {"id": document_id},
            {"_id": 0}
        )
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail=f"Document not found: {document_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": document
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching document: {str(e)}"
        )


@router.post("/api/{tenant_slug}/documents")
async def create_document(
    tenant_slug: str,
    document_data: dict,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Create new document
    """
    try:
        # Add timestamps
        document_data["createdAt"] = datetime.utcnow()
        document_data["updatedAt"] = datetime.utcnow()
        
        result = await tenant_db.documents.insert_one(document_data)
        
        # Fetch the created document
        created_document = await tenant_db.documents.find_one(
            {"_id": result.inserted_id},
            {"_id": 0}
        )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "data": created_document
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating document: {str(e)}"
        )


@router.delete("/api/{tenant_slug}/documents/{document_id}")
async def delete_document(
    tenant_slug: str,
    document_id: str,
    tenant_db: AsyncIOMotorDatabase = Depends(get_tenant_db),
    tenant: dict = Depends(get_tenant_info)
):
    """
    Delete document
    """
    try:
        result = await tenant_db.documents.delete_one(
            {"id": document_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Document not found: {document_id}"
            )
        
        return {
            "status": "success",
            "tenant": {
                "slug": tenant_slug,
                "name": tenant["name"]
            },
            "message": f"Document {document_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )
