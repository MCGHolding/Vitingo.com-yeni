"""
Email Management Routes
FastAPI routes for email management
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId
import os
import logging
import uuid
from typing import Optional, List
import sendgrid
from sendgrid.helpers.mail import Mail, Email as SGEmail, To, Content, Bcc, ReplyTo, Header

from email_models import (
    Email,
    EmailCreate,
    EmailReply,
    EmailForward,
    UserEmailSettings,
    UserEmailSettingsUpdate,
    EmailListResponse,
    EmailFilter,
    EmailDirection,
    EmailStatus,
    EmailAddress
)

logger = logging.getLogger(__name__)

# Router
router = APIRouter(prefix="/api", tags=["emails"])

# MongoDB connection (will be set from main app)
db = None

def set_database(database):
    global db
    db = database

# SendGrid configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
PLATFORM_EMAIL = os.getenv("PLATFORM_EMAIL", "mail@vitingo.com")
PLATFORM_NAME = os.getenv("PLATFORM_NAME", "Vitingo CRM")
INBOUND_DOMAIN = os.getenv("INBOUND_DOMAIN", "inbound.vitingo.com")


# ==================== USER EMAIL SETTINGS ====================

@router.get("/users/me/email-settings")
async def get_user_email_settings(user_id: str = "default_user"):  # TODO: Get from auth
    """Get current user's email settings"""
    try:
        settings = await db.user_email_settings.find_one(
            {"userId": user_id},
            {"_id": 0}
        )
        
        if not settings:
            # Return default settings
            return {
                "userId": user_id,
                "senderEmail": None,
                "senderName": None,
                "signature": None
            }
        
        return settings
        
    except Exception as e:
        logger.error(f"Error getting user email settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/me/email-settings")
async def update_user_email_settings(
    settings_update: UserEmailSettingsUpdate,
    user_id: str = "default_user"  # TODO: Get from auth
):
    """Update current user's email settings"""
    try:
        update_data = settings_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await db.user_email_settings.update_one(
            {"userId": user_id},
            {
                "$set": update_data,
                "$setOnInsert": {
                    "userId": user_id,
                    "createdAt": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        
        # Get updated settings
        settings = await db.user_email_settings.find_one(
            {"userId": user_id},
            {"_id": 0}
        )
        
        return settings
        
    except Exception as e:
        logger.error(f"Error updating user email settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EMAIL CRUD ====================

@router.get("/customers/{customer_id}/emails")
async def get_customer_emails(
    customer_id: str,
    filter: EmailFilter = EmailFilter.ALL,
    page: int = 1,
    limit: int = 20,
    user_id: str = "default_user"
):
    """Get emails for a customer with filtering and pagination"""
    try:
        # Build query
        query = {"customerId": customer_id}
        
        if filter == EmailFilter.UNREAD:
            query["isRead"] = False
            query["direction"] = EmailDirection.INBOUND
        elif filter == EmailFilter.STARRED:
            query["isStarred"] = True
        elif filter == EmailFilter.SENT:
            query["direction"] = EmailDirection.OUTBOUND
        elif filter == EmailFilter.ARCHIVED:
            query["isArchived"] = True
        elif filter == EmailFilter.AWAITING:
            # Emails waiting for reply (outbound and no inbound response yet)
            query["direction"] = EmailDirection.OUTBOUND
            # TODO: Add logic to check if there's a reply in the thread
        
        # Count total
        total = await db.emails.count_documents(query)
        
        # Get emails
        skip = (page - 1) * limit
        cursor = db.emails.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit)
        emails = await cursor.to_list(length=limit)
        
        total_pages = (total + limit - 1) // limit
        
        return {
            "emails": emails,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "hasMore": page < total_pages
        }
        
    except Exception as e:
        logger.error(f"Error getting customer emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers/{customer_id}/emails/{email_id}")
async def get_email_detail(customer_id: str, email_id: str):
    """Get email details"""
    try:
        email = await db.emails.find_one(
            {"id": email_id, "customerId": customer_id},
            {"_id": 0}
        )
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return email
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting email detail: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customers/{customer_id}/emails")
async def send_email(
    customer_id: str,
    email_data: EmailCreate,
    user_id: str = "default_user"
):
    """Send a new email to customer"""
    try:
        # Get user email settings
        user_settings = await db.user_email_settings.find_one({"userId": user_id})
        
        # Get customer details
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Generate thread ID
        thread_id = None
        if email_data.replyToEmailId:
            # Get original email's thread
            original_email = await db.emails.find_one({"id": email_data.replyToEmailId})
            if original_email:
                thread_id = original_email.get("threadId")
        
        if not thread_id:
            thread_id = str(uuid.uuid4())
        
        # Prepare SendGrid email
        if not SENDGRID_API_KEY:
            raise HTTPException(status_code=500, detail="SendGrid not configured")
        
        # Create Mail object with proper structure
        from_email_obj = SGEmail(PLATFORM_EMAIL, user_settings.get("senderName", PLATFORM_NAME) if user_settings else PLATFORM_NAME)
        to_email_obj = To(email_data.to, email_data.toName or email_data.to)
        
        message = Mail(
            from_email=from_email_obj,
            to_emails=to_email_obj,
            subject=email_data.subject
        )
        
        # Add content
        message.add_content(Content("text/plain", email_data.bodyText or ""))
        message.add_content(Content("text/html", email_data.bodyHtml or f"<p>{email_data.bodyText}</p>"))
        
        # Reply-To: User's email
        if user_settings and user_settings.get("senderEmail"):
            from sendgrid.helpers.mail import ReplyTo
            message.reply_to = ReplyTo(user_settings["senderEmail"], user_settings.get("senderName", ""))
        
        # BCC: Tracking email (optional - commented out for now)
        # tracking_email = f"customer_{customer_id}@{INBOUND_DOMAIN}"
        # message.add_bcc(Bcc(tracking_email))
        
        # Custom headers
        from sendgrid.helpers.mail import Header
        message.add_header(Header("X-Thread-ID", thread_id))
        
        # Send via SendGrid
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        response = sg.send(message)
        
        # Save to database
        email_doc = {
            "id": str(uuid.uuid4()),
            "customerId": customer_id,
            "userId": user_id,
            "direction": EmailDirection.OUTBOUND,
            "threadId": thread_id,
            "from": {
                "email": PLATFORM_EMAIL,
                "name": user_settings.get("senderName", PLATFORM_NAME) if user_settings else PLATFORM_NAME
            },
            "to": [{
                "email": email_data.to,
                "name": email_data.toName or email_data.to
            }],
            "cc": [],
            "replyTo": user_settings.get("senderEmail") if user_settings else None,
            "subject": email_data.subject,
            "bodyHtml": email_data.bodyHtml,
            "bodyText": email_data.bodyText,
            "attachments": email_data.attachments or [],
            "status": EmailStatus.SENT,
            "isRead": True,
            "isStarred": False,
            "isArchived": False,
            "sendgridMessageId": response.headers.get("X-Message-Id"),
            "sendgridEvents": [],
            "sentAt": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc)
        }
        
        result = await db.emails.insert_one(email_doc)
        
        # Remove _id for response
        email_doc.pop("_id", None)
        
        return email_doc
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


# ==================== EMAIL ACTIONS ====================

@router.put("/emails/{email_id}/read")
async def mark_email_read(email_id: str):
    """Mark email as read"""
    try:
        result = await db.emails.update_one(
            {"id": email_id},
            {
                "$set": {
                    "isRead": True,
                    "readAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return {"success": True, "message": "Email marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking email as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/emails/{email_id}/star")
async def toggle_email_star(email_id: str):
    """Toggle email star status"""
    try:
        # Get current status
        email = await db.emails.find_one({"id": email_id}, {"isStarred": 1})
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        new_status = not email.get("isStarred", False)
        
        result = await db.emails.update_one(
            {"id": email_id},
            {"$set": {"isStarred": new_status}}
        )
        
        return {"success": True, "isStarred": new_status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling email star: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/emails/{email_id}/archive")
async def archive_email(email_id: str):
    """Archive email"""
    try:
        result = await db.emails.update_one(
            {"id": email_id},
            {"$set": {"isArchived": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return {"success": True, "message": "Email archived"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/emails/{email_id}")
async def delete_email(email_id: str):
    """Delete email (soft delete - archive)"""
    try:
        result = await db.emails.update_one(
            {"id": email_id},
            {"$set": {"isArchived": True, "deletedAt": datetime.now(timezone.utc)}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return {"success": True, "message": "Email deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SENDGRID WEBHOOKS ====================

@router.post("/webhooks/sendgrid/inbound")
async def handle_inbound_email(request: Request):
    """Handle incoming emails from SendGrid Inbound Parse"""
    try:
        # SendGrid sends form data
        form_data = await request.form()
        
        # Extract email data
        from_email = form_data.get("from", "")
        to_emails = form_data.get("to", "")
        cc_emails = form_data.get("cc", "")
        subject = form_data.get("subject", "")
        text_body = form_data.get("text", "")
        html_body = form_data.get("html", "")
        
        # Extract customer_id from BCC
        # Format: customer_{id}@inbound.vitingo.com
        import re
        customer_id = None
        all_recipients = f"{to_emails},{cc_emails}"
        
        escaped_domain = INBOUND_DOMAIN.replace(".", r"\.")
        pattern = rf'customer_([a-f0-9\-]+)@{escaped_domain}'
        match = re.search(pattern, all_recipients)
        if match:
            customer_id = match.group(1)
        
        if not customer_id:
            logger.warning(f"Inbound email without customer tracking: {to_emails}")
            return {"status": "ignored", "reason": "no_customer_id"}
        
        # Find customer
        customer = await db.customers.find_one({"id": customer_id})
        if not customer:
            logger.warning(f"Customer not found: {customer_id}")
            return {"status": "customer_not_found"}
        
        # Parse email addresses
        def parse_email(email_str):
            # Simple parser for "Name <email@example.com>" or "email@example.com"
            match = re.search(r'<(.+?)>', email_str)
            if match:
                email = match.group(1)
                name = email_str.split('<')[0].strip().strip('"')
                return {"email": email, "name": name if name else None}
            return {"email": email_str.strip(), "name": None}
        
        from_data = parse_email(from_email)
        to_data = [parse_email(e.strip()) for e in to_emails.split(',') if e.strip()]
        cc_data = [parse_email(e.strip()) for e in cc_emails.split(',') if e.strip() and cc_emails]
        
        # Generate thread ID (or extract from headers)
        thread_id = str(uuid.uuid4())
        
        # Handle attachments
        attachments = []
        attachment_count = int(form_data.get("attachments", 0))
        for i in range(1, attachment_count + 1):
            file = form_data.get(f"attachment{i}")
            if file:
                # TODO: Upload to storage and get URL
                attachments.append({
                    "filename": file.filename,
                    "contentType": file.content_type,
                    "size": len(file.file.read()),
                    "url": f"https://storage.example.com/{file.filename}"  # Placeholder
                })
        
        # Save to database
        email_doc = {
            "id": str(uuid.uuid4()),
            "customerId": customer_id,
            "userId": customer.get("assignedUserId", "system"),
            "direction": EmailDirection.INBOUND,
            "threadId": thread_id,
            "from": from_data,
            "to": to_data,
            "cc": cc_data,
            "subject": subject,
            "bodyHtml": html_body,
            "bodyText": text_body,
            "attachments": attachments,
            "status": EmailStatus.RECEIVED,
            "isRead": False,
            "isStarred": False,
            "isArchived": False,
            "receivedAt": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc)
        }
        
        result = await db.emails.insert_one(email_doc)
        
        logger.info(f"Inbound email saved: {email_doc['id']} for customer {customer_id}")
        
        return {"status": "success", "email_id": email_doc["id"]}
        
    except Exception as e:
        logger.error(f"Error handling inbound email: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/webhooks/sendgrid/events")
async def handle_sendgrid_events(request: Request):
    """Handle SendGrid event webhooks (delivered, opened, etc.)"""
    try:
        events = await request.json()
        
        for event in events:
            message_id = event.get("sg_message_id")
            event_type = event.get("event")
            timestamp = event.get("timestamp")
            
            if not message_id:
                continue
            
            # Update email status
            update_data = {
                "$push": {
                    "sendgridEvents": {
                        "event": event_type,
                        "timestamp": datetime.fromtimestamp(timestamp, tz=timezone.utc)
                    }
                }
            }
            
            # Update status based on event
            if event_type == "delivered":
                update_data["$set"] = {"status": EmailStatus.DELIVERED}
            elif event_type == "open":
                update_data["$set"] = {"status": EmailStatus.OPENED}
            elif event_type in ["bounce", "dropped"]:
                update_data["$set"] = {"status": EmailStatus.BOUNCED}
            
            await db.emails.update_one(
                {"sendgridMessageId": message_id},
                update_data
            )
        
        return {"status": "success", "processed": len(events)}
        
    except Exception as e:
        logger.error(f"Error handling SendGrid events: {str(e)}")
        return {"status": "error", "message": str(e)}
