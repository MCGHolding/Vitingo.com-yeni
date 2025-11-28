"""
Proposal Module API Endpoints
"""

from proposal_service import *

# ===================== PROPOSAL PROFILES ENDPOINTS =====================

@proposal_router.post("/proposal-profiles", response_model=ProposalProfile)
async def create_profile(profile_input: ProposalProfileCreate):
    """Create a new proposal profile"""
    try:
        profile_data = profile_input.dict()
        profile_data["id"] = str(uuid.uuid4())
        profile_data["created_at"] = datetime.now(timezone.utc)
        profile_data["updated_at"] = datetime.now(timezone.utc)
        
        # If this is set as default, unset others
        if profile_data.get("is_default"):
            await db.proposal_profiles.update_many(
                {"user_id": profile_data["user_id"]},
                {"$set": {"is_default": False}}
            )
        
        await db.proposal_profiles.insert_one(profile_data)
        return ProposalProfile(**profile_data)
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.get("/proposal-profiles", response_model=List[ProposalProfile])
async def get_profiles(user_id: str):
    """Get all profiles for a user"""
    try:
        profiles = await db.proposal_profiles.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=None)
        return [ProposalProfile(**p) for p in profiles]
    except Exception as e:
        logger.error(f"Error fetching profiles: {str(e)}")
        return []

@proposal_router.get("/proposal-profiles/{profile_id}", response_model=ProposalProfile)
async def get_profile(profile_id: str):
    """Get a specific profile"""
    try:
        profile = await db.proposal_profiles.find_one({"id": profile_id}, {"_id": 0})
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return ProposalProfile(**profile)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.put("/proposal-profiles/{profile_id}", response_model=ProposalProfile)
async def update_profile(profile_id: str, profile_input: ProposalProfileCreate):
    """Update a profile"""
    try:
        existing = await db.proposal_profiles.find_one({"id": profile_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = profile_input.dict()
        profile_data["updated_at"] = datetime.now(timezone.utc)
        
        # Handle default flag
        if profile_data.get("is_default"):
            await db.proposal_profiles.update_many(
                {"user_id": profile_data["user_id"], "id": {"$ne": profile_id}},
                {"$set": {"is_default": False}}
            )
        
        await db.proposal_profiles.update_one(
            {"id": profile_id},
            {"$set": profile_data}
        )
        
        updated = await db.proposal_profiles.find_one({"id": profile_id}, {"_id": 0})
        return ProposalProfile(**updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.delete("/proposal-profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a profile"""
    try:
        result = await db.proposal_profiles.delete_one({"id": profile_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {"message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== MODULE TEMPLATES ENDPOINTS =====================

@proposal_router.get("/module-templates", response_model=List[ModuleTemplate])
async def get_module_templates(user_id: Optional[str] = None):
    """Get all module templates (system + user's)"""
    try:
        query = {"is_active": True}
        if user_id:
            query = {"$or": [{"is_system": True}, {"user_id": user_id}]}
        
        templates = await db.module_templates.find(
            query,
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        return [ModuleTemplate(**t) for t in templates]
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return []

@proposal_router.get("/module-templates/{module_type}", response_model=List[ModuleTemplate])
async def get_templates_by_type(module_type: ModuleType, user_id: Optional[str] = None):
    """Get templates for a specific module type"""
    try:
        query = {"module_type": module_type, "is_active": True}
        if user_id:
            query = {"module_type": module_type, "$or": [{"is_system": True}, {"user_id": user_id}]}
        
        templates = await db.module_templates.find(
            query,
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        return [ModuleTemplate(**t) for t in templates]
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return []

# ===================== PROPOSALS ENDPOINTS =====================

@proposal_router.post("/proposals", response_model=Proposal)
async def create_proposal(proposal_input: ProposalCreate):
    """Create a new proposal"""
    try:
        proposal_data = proposal_input.dict()
        proposal_data["id"] = str(uuid.uuid4())
        proposal_data["proposal_number"] = await generate_proposal_number()
        proposal_data["public_token"] = str(uuid.uuid4())
        proposal_data["status"] = "draft"
        proposal_data["current_version"] = 1
        proposal_data["created_at"] = datetime.now(timezone.utc)
        proposal_data["updated_at"] = datetime.now(timezone.utc)
        
        # Set defaults
        if "project_info" not in proposal_data or not proposal_data["project_info"]:
            proposal_data["project_info"] = ProjectInfo().dict()
        if "settings" not in proposal_data or not proposal_data["settings"]:
            proposal_data["settings"] = ProposalSettings().dict()
        if "pricing_summary" not in proposal_data:
            proposal_data["pricing_summary"] = PricingSummary().dict()
        if "tracking" not in proposal_data:
            proposal_data["tracking"] = Tracking().dict()
        
        await db.proposals.insert_one(proposal_data)
        
        # Log activity
        await log_activity(
            proposal_data["id"],
            ActivityType.CREATED,
            f"Teklif oluşturuldu: {proposal_data['proposal_number']}",
            proposal_data["user_id"]
        )
        
        return Proposal(**proposal_data)
    except Exception as e:
        logger.error(f"Error creating proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.get("/proposals", response_model=List[Proposal])
async def get_proposals(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[str] = None
):
    """Get all proposals with optional filters"""
    try:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if status:
            query["status"] = status
        if customer_id:
            query["customer_id"] = customer_id
        
        proposals = await db.proposals.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=None)
        return [Proposal(**p) for p in proposals]
    except Exception as e:
        logger.error(f"Error fetching proposals: {str(e)}")
        return []

@proposal_router.get("/proposals/{proposal_id}")
async def get_proposal_detail(proposal_id: str):
    """Get proposal with all modules and line items"""
    try:
        proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Get modules
        modules = await db.proposal_modules.find(
            {"proposal_id": proposal_id},
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        
        # Get line items
        line_items = await db.proposal_line_items.find(
            {"proposal_id": proposal_id},
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        
        return {
            "proposal": proposal,
            "modules": modules,
            "line_items": line_items
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching proposal detail: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.put("/proposals/{proposal_id}", response_model=Proposal)
async def update_proposal(proposal_id: str, proposal_update: dict):
    """Update a proposal"""
    try:
        existing = await db.proposals.find_one({"id": proposal_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        proposal_update["updated_at"] = datetime.now(timezone.utc)
        
        await db.proposals.update_one(
            {"id": proposal_id},
            {"$set": proposal_update}
        )
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.UPDATED,
            "Teklif güncellendi"
        )
        
        updated = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
        return Proposal(**updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.delete("/proposals/{proposal_id}")
async def delete_proposal(proposal_id: str):
    """Delete a proposal"""
    try:
        # Delete proposal
        result = await db.proposals.delete_one({"id": proposal_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Delete related data
        await db.proposal_modules.delete_many({"proposal_id": proposal_id})
        await db.proposal_line_items.delete_many({"proposal_id": proposal_id})
        await db.proposal_versions.delete_many({"proposal_id": proposal_id})
        await db.proposal_activities.delete_many({"proposal_id": proposal_id})
        
        return {"message": "Proposal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.post("/proposals/{proposal_id}/send")
async def send_proposal(proposal_id: str, send_data: dict):
    """Send a proposal"""
    try:
        proposal = await db.proposals.find_one({"id": proposal_id})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Update proposal status and tracking
        await db.proposals.update_one(
            {"id": proposal_id},
            {"$set": {
                "status": "sent",
                "tracking.sent_at": datetime.now(timezone.utc),
                "tracking.sent_via": send_data.get("method", "email"),
                "tracking.sent_to_email": send_data.get("email", ""),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.SENT,
            f"Teklif gönderildi: {send_data.get('email', '')}",
            metadata=send_data
        )
        
        return {"message": "Proposal sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.post("/proposals/{proposal_id}/version")
async def create_version(proposal_id: str, version_data: dict):
    """Create a new version of the proposal"""
    try:
        proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Get current modules and line items
        modules = await db.proposal_modules.find(
            {"proposal_id": proposal_id},
            {"_id": 0}
        ).to_list(length=None)
        
        line_items = await db.proposal_line_items.find(
            {"proposal_id": proposal_id},
            {"_id": 0}
        ).to_list(length=None)
        
        # Create version snapshot
        version_number = proposal.get("current_version", 1) + 1
        
        version = ProposalVersion(
            proposal_id=proposal_id,
            version_number=version_number,
            version_name=version_data.get("version_name", f"Versiyon {version_number}"),
            snapshot={
                "modules": modules,
                "line_items": line_items,
                "pricing_summary": proposal.get("pricing_summary"),
                "settings": proposal.get("settings")
            },
            changes_summary=version_data.get("changes_summary", ""),
            created_by=version_data.get("user_id", "")
        )
        
        await db.proposal_versions.insert_one(version.dict())
        
        # Update proposal version number
        await db.proposals.update_one(
            {"id": proposal_id},
            {"$set": {"current_version": version_number}}
        )
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.VERSION_CREATED,
            f"Yeni versiyon oluşturuldu: v{version_number}"
        )
        
        return version
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating version: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.get("/proposals/{proposal_id}/versions", response_model=List[ProposalVersion])
async def get_versions(proposal_id: str):
    """Get all versions of a proposal"""
    try:
        versions = await db.proposal_versions.find(
            {"proposal_id": proposal_id},
            {"_id": 0}
        ).sort("version_number", -1).to_list(length=None)
        return [ProposalVersion(**v) for v in versions]
    except Exception as e:
        logger.error(f"Error fetching versions: {str(e)}")
        return []

@proposal_router.get("/proposals/{proposal_id}/activities", response_model=List[ProposalActivity])
async def get_activities(proposal_id: str):
    """Get all activities for a proposal"""
    try:
        activities = await db.proposal_activities.find(
            {"proposal_id": proposal_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=None)
        return [ProposalActivity(**a) for a in activities]
    except Exception as e:
        logger.error(f"Error fetching activities: {str(e)}")
        return []

# ===================== MODULES ENDPOINTS =====================

@proposal_router.post("/proposals/{proposal_id}/modules", response_model=ProposalModule)
async def add_module(proposal_id: str, module_input: ProposalModuleCreate):
    """Add a module to proposal"""
    try:
        module_data = module_input.dict()
        module_data["id"] = str(uuid.uuid4())
        module_data["proposal_id"] = proposal_id
        module_data["created_at"] = datetime.now(timezone.utc)
        module_data["updated_at"] = datetime.now(timezone.utc)
        
        if "content" not in module_data or not module_data["content"]:
            module_data["content"] = ModuleContent().dict()
        
        await db.proposal_modules.insert_one(module_data)
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.MODULE_ADDED,
            f"Modül eklendi: {module_data['module_type']}"
        )
        
        return ProposalModule(**module_data)
    except Exception as e:
        logger.error(f"Error adding module: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.put("/proposals/{proposal_id}/modules/{module_id}", response_model=ProposalModule)
async def update_module(proposal_id: str, module_id: str, module_update: dict):
    """Update a module"""
    try:
        module_update["updated_at"] = datetime.now(timezone.utc)
        
        await db.proposal_modules.update_one(
            {"id": module_id, "proposal_id": proposal_id},
            {"$set": module_update}
        )
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.MODULE_UPDATED,
            f"Modül güncellendi"
        )
        
        updated = await db.proposal_modules.find_one({"id": module_id}, {"_id": 0})
        return ProposalModule(**updated)
    except Exception as e:
        logger.error(f"Error updating module: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.delete("/proposals/{proposal_id}/modules/{module_id}")
async def delete_module(proposal_id: str, module_id: str):
    """Delete a module"""
    try:
        result = await db.proposal_modules.delete_one({"id": module_id, "proposal_id": proposal_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Module not found")
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.MODULE_REMOVED,
            "Modül silindi"
        )
        
        return {"message": "Module deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting module: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.put("/proposals/{proposal_id}/modules/reorder")
async def reorder_modules(proposal_id: str, module_orders: List[dict]):
    """Reorder modules"""
    try:
        for item in module_orders:
            await db.proposal_modules.update_one(
                {"id": item["module_id"], "proposal_id": proposal_id},
                {"$set": {"display_order": item["order"]}}
            )
        
        return {"message": "Modules reordered successfully"}
    except Exception as e:
        logger.error(f"Error reordering modules: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Continue with LINE ITEMS and PUBLIC endpoints in next message...
