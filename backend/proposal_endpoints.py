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
        
        # Set defaults if not provided
        if not profile_data.get("branding"):
            profile_data["branding"] = Branding().dict()
        if not profile_data.get("defaults"):
            profile_data["defaults"] = ProfileDefaults().dict()
        
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

# ===================== LINE ITEMS ENDPOINTS =====================

@proposal_router.post("/proposals/{proposal_id}/line-items", response_model=ProposalLineItem)
async def add_line_item(proposal_id: str, item_input: ProposalLineItemCreate):
    """Add a line item to proposal"""
    try:
        item_data = item_input.dict()
        item_data["id"] = str(uuid.uuid4())
        item_data["proposal_id"] = proposal_id
        
        # Calculate totals
        item_data = await calculate_line_item_totals(item_data)
        
        item_data["created_at"] = datetime.now(timezone.utc)
        item_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.proposal_line_items.insert_one(item_data)
        
        # Recalculate proposal totals
        await recalculate_proposal_totals(proposal_id)
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.LINE_ITEM_ADDED,
            f"Kalem eklendi: {item_data['description']}"
        )
        
        return ProposalLineItem(**item_data)
    except Exception as e:
        logger.error(f"Error adding line item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.put("/proposals/{proposal_id}/line-items/{item_id}", response_model=ProposalLineItem)
async def update_line_item(proposal_id: str, item_id: str, item_update: dict):
    """Update a line item"""
    try:
        # Calculate totals
        item_update = await calculate_line_item_totals(item_update)
        item_update["updated_at"] = datetime.now(timezone.utc)
        
        await db.proposal_line_items.update_one(
            {"id": item_id, "proposal_id": proposal_id},
            {"$set": item_update}
        )
        
        # Recalculate proposal totals
        await recalculate_proposal_totals(proposal_id)
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.LINE_ITEM_UPDATED,
            "Kalem güncellendi"
        )
        
        updated = await db.proposal_line_items.find_one({"id": item_id}, {"_id": 0})
        return ProposalLineItem(**updated)
    except Exception as e:
        logger.error(f"Error updating line item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.delete("/proposals/{proposal_id}/line-items/{item_id}")
async def delete_line_item(proposal_id: str, item_id: str):
    """Delete a line item"""
    try:
        result = await db.proposal_line_items.delete_one({"id": item_id, "proposal_id": proposal_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Line item not found")
        
        # Recalculate proposal totals
        await recalculate_proposal_totals(proposal_id)
        
        # Log activity
        await log_activity(
            proposal_id,
            ActivityType.LINE_ITEM_REMOVED,
            "Kalem silindi"
        )
        
        return {"message": "Line item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting line item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== PUBLIC ENDPOINTS =====================

@proposal_router.get("/proposals/public/{token}")
async def get_public_proposal(token: str):
    """Public proposal view for customers"""
    try:
        proposal = await db.proposals.find_one({"public_token": token}, {"_id": 0})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Get modules
        modules = await db.proposal_modules.find(
            {"proposal_id": proposal["id"], "is_active": True},
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        
        # Get line items
        line_items = await db.proposal_line_items.find(
            {"proposal_id": proposal["id"], "is_active": True},
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        
        # Update tracking - first view
        update_data = {
            "tracking.view_count": proposal.get("tracking", {}).get("view_count", 0) + 1,
            "tracking.last_viewed_at": datetime.now(timezone.utc)
        }
        
        if not proposal.get("tracking", {}).get("first_viewed_at"):
            update_data["tracking.first_viewed_at"] = datetime.now(timezone.utc)
            update_data["status"] = "viewed"
        
        await db.proposals.update_one(
            {"id": proposal["id"]},
            {"$set": update_data}
        )
        
        # Log activity
        await log_activity(
            proposal["id"],
            ActivityType.VIEWED,
            "Teklif görüntülendi (Public)",
            actor_type="customer"
        )
        
        return {
            "proposal": proposal,
            "modules": modules,
            "line_items": line_items
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching public proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.post("/proposals/public/{token}/accept")
async def accept_proposal(token: str, acceptance_data: dict):
    """Customer accepts the proposal"""
    try:
        proposal = await db.proposals.find_one({"public_token": token})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        await db.proposals.update_one(
            {"id": proposal["id"]},
            {"$set": {
                "status": "accepted",
                "tracking.accepted_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Log activity
        await log_activity(
            proposal["id"],
            ActivityType.ACCEPTED,
            "Teklif kabul edildi",
            actor_type="customer",
            metadata=acceptance_data
        )
        
        return {"message": "Proposal accepted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@proposal_router.post("/proposals/public/{token}/reject")
async def reject_proposal(token: str, rejection_data: dict):
    """Customer rejects the proposal"""
    try:
        proposal = await db.proposals.find_one({"public_token": token})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        await db.proposals.update_one(
            {"id": proposal["id"]},
            {"$set": {
                "status": "rejected",
                "tracking.rejected_at": datetime.now(timezone.utc),
                "tracking.rejection_reason": rejection_data.get("reason", ""),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Log activity
        await log_activity(
            proposal["id"],
            ActivityType.REJECTED,
            f"Teklif reddedildi: {rejection_data.get('reason', '')}",
            actor_type="customer",
            metadata=rejection_data
        )
        
        return {"message": "Proposal rejected"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== CURRENCIES ENDPOINTS =====================

@proposal_router.get("/currencies", response_model=List[Currency])
async def get_currencies():
    """Get all active currencies"""
    try:
        currencies = await db.currencies.find(
            {"is_active": True},
            {"_id": 0}
        ).sort("display_order", 1).to_list(length=None)
        return [Currency(**c) for c in currencies]
    except Exception as e:
        logger.error(f"Error fetching currencies: {str(e)}")
        return []

@proposal_router.get("/currencies/rates")
async def get_currency_rates():
    """Get current exchange rates"""
    try:
        currencies = await db.currencies.find(
            {"is_active": True},
            {"_id": 0, "code": 1, "symbol": 1, "exchange_rate_to_usd": 1, "last_updated": 1}
        ).to_list(length=None)
        
        return {
            "rates": currencies,
            "base": "USD",
            "last_updated": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.error(f"Error fetching rates: {str(e)}")
        return {"rates": [], "base": "USD", "last_updated": datetime.now(timezone.utc)}

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
