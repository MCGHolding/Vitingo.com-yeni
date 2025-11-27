"""
Email Management Models
Pydantic models for email management system
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class EmailDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class EmailStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    REPLIED = "replied"
    BOUNCED = "bounced"
    FAILED = "failed"
    RECEIVED = "received"


class EmailAddress(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class EmailAttachment(BaseModel):
    filename: str
    contentType: str
    size: int
    url: str


class SendGridEvent(BaseModel):
    event: str
    timestamp: datetime


# Email Document (MongoDB)
class Email(BaseModel):
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    customerId: str
    userId: str
    direction: EmailDirection
    threadId: Optional[str] = None
    
    # Email content
    sender: EmailAddress = Field(alias="from")
    to: List[EmailAddress]
    cc: Optional[List[EmailAddress]] = []
    replyTo: Optional[str] = None
    
    subject: str
    bodyText: Optional[str] = None
    bodyHtml: Optional[str] = None
    
    # Attachments
    attachments: Optional[List[EmailAttachment]] = []
    
    # Status
    status: EmailStatus = EmailStatus.SENT
    isRead: bool = False
    isStarred: bool = False
    isArchived: bool = False
    
    # SendGrid
    sendgridMessageId: Optional[str] = None
    sendgridEvents: Optional[List[SendGridEvent]] = []
    
    # Dates
    sentAt: Optional[datetime] = None
    receivedAt: Optional[datetime] = None
    readAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


# Create Email Request
class EmailCreate(BaseModel):
    to: str  # Email address
    toName: Optional[str] = None
    subject: str
    bodyHtml: Optional[str] = None
    bodyText: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = []
    replyToEmailId: Optional[str] = None  # For replies


# Email Reply Request
class EmailReply(BaseModel):
    bodyHtml: Optional[str] = None
    bodyText: str
    attachments: Optional[List[Dict[str, Any]]] = []


# Email Forward Request  
class EmailForward(BaseModel):
    to: str
    toName: Optional[str] = None
    bodyHtml: Optional[str] = None
    bodyText: Optional[str] = None
    additionalMessage: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = []


# User Email Settings
class UserEmailSettings(BaseModel):
    userId: str
    senderEmail: Optional[EmailStr] = None
    senderName: Optional[str] = None
    signature: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class UserEmailSettingsUpdate(BaseModel):
    senderEmail: Optional[EmailStr] = None
    senderName: Optional[str] = None
    signature: Optional[str] = None


# Email List Response
class EmailListResponse(BaseModel):
    emails: List[Email]
    total: int
    page: int
    totalPages: int
    hasMore: bool


# Email filters
class EmailFilter(str, Enum):
    ALL = "all"
    UNREAD = "unread"
    STARRED = "starred"
    SENT = "sent"
    AWAITING = "awaiting"
    ARCHIVED = "archived"
