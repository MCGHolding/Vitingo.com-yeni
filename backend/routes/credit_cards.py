from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from cryptography.fernet import Fernet
import base64
from hashlib import sha256

router = APIRouter()

# Initialize MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Encryption key management
# In production, this should be stored securely (e.g., env variable, key vault)
# For now, we'll generate a deterministic key from a secret
SECRET_KEY = os.environ.get('ENCRYPTION_SECRET', 'default-secret-key-change-in-production')
# Create a Fernet key from the secret
fernet_key = base64.urlsafe_b64encode(sha256(SECRET_KEY.encode()).digest())
cipher_suite = Fernet(fernet_key)


# ==================== MODELS ====================

class CreditCardCreate(BaseModel):
    cardCategory: str = Field(..., description="corporate or personal")
    cardHolderFirstName: str
    cardHolderLastName: str
    cardHolderFullName: str
    companyId: Optional[str] = None
    companyName: Optional[str] = None
    cardNumber: str = Field(..., description="16-digit card number")
    expiryDate: str = Field(..., description="MM/YY format")
    cardType: str = Field(default="visa", description="visa, mastercard, amex")
    bank: Optional[str] = None
    spendingLimit: Optional[float] = None  # For corporate cards
    isActive: bool = True


class CreditCardUpdate(BaseModel):
    cardCategory: Optional[str] = None
    cardHolderFirstName: Optional[str] = None
    cardHolderLastName: Optional[str] = None
    cardHolderFullName: Optional[str] = None
    companyId: Optional[str] = None
    companyName: Optional[str] = None
    cardNumber: Optional[str] = None
    expiryDate: Optional[str] = None
    cardType: Optional[str] = None
    bank: Optional[str] = None
    spendingLimit: Optional[float] = None
    isActive: Optional[bool] = None


class CreditCardResponse(BaseModel):
    id: str
    cardCategory: str
    cardHolderFullName: str
    companyId: Optional[str] = None
    companyName: Optional[str] = None
    cardNumber: str  # Will be masked in the response
    expiryDate: str
    cardType: str
    bank: Optional[str] = None
    spendingLimit: Optional[float] = None
    isActive: bool
    created_at: datetime
    updated_at: datetime


# ==================== HELPER FUNCTIONS ====================

def encrypt_card_number(card_number: str) -> str:
    """Encrypt card number using Fernet symmetric encryption"""
    try:
        encrypted = cipher_suite.encrypt(card_number.encode())
        return encrypted.decode()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption error: {str(e)}")


def decrypt_card_number(encrypted_card: str) -> str:
    """Decrypt card number"""
    try:
        decrypted = cipher_suite.decrypt(encrypted_card.encode())
        return decrypted.decode()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption error: {str(e)}")


def mask_card_number(card_number: str) -> str:
    """Mask card number to show only last 4 digits"""
    if not card_number or len(card_number) < 4:
        return "**** **** **** ****"
    
    last4 = card_number[-4:]
    return f"**** **** **** {last4}"


def validate_luhn(card_number: str) -> bool:
    """Validate card number using Luhn algorithm"""
    # Remove spaces and non-digits
    card_number = ''.join(filter(str.isdigit, card_number))
    
    if len(card_number) != 16:
        return False
    
    # Luhn algorithm
    def digits_of(n):
        return [int(d) for d in str(n)]
    
    digits = digits_of(card_number)
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    
    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(digits_of(d * 2))
    
    return checksum % 10 == 0


def detect_card_type(card_number: str) -> str:
    """Auto-detect card type from first digit"""
    if not card_number:
        return "visa"
    
    first_digit = card_number[0]
    
    if first_digit == '4':
        return 'visa'
    elif first_digit == '5':
        return 'mastercard'
    elif first_digit == '3':
        return 'amex'
    else:
        return 'visa'  # Default


def validate_expiry_date(expiry_date: str) -> bool:
    """Validate expiry date is not in the past"""
    try:
        # Expected format: MM/YY
        if '/' not in expiry_date or len(expiry_date) != 5:
            return False
        
        month_str, year_str = expiry_date.split('/')
        month = int(month_str)
        year = int('20' + year_str)  # Convert YY to YYYY
        
        if month < 1 or month > 12:
            return False
        
        # Get current date
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # Check if expired
        if year < current_year:
            return False
        if year == current_year and month < current_month:
            return False
        
        return True
    except:
        return False


# ==================== API ENDPOINTS ====================

@router.post("/credit-cards", response_model=CreditCardResponse)
async def create_credit_card(card: CreditCardCreate):
    """Create a new credit card with encryption"""
    try:
        # Remove spaces from card number
        card_number_clean = card.cardNumber.replace(' ', '')
        
        # Validate card number length
        if len(card_number_clean) != 16:
            raise HTTPException(status_code=400, detail="Kart numarası 16 haneli olmalıdır")
        
        # Validate Luhn algorithm
        if not validate_luhn(card_number_clean):
            raise HTTPException(status_code=400, detail="Geçersiz kart numarası (Luhn kontrolü başarısız)")
        
        # Validate expiry date
        if not validate_expiry_date(card.expiryDate):
            raise HTTPException(status_code=400, detail="Son kullanma tarihi geçersiz veya geçmiş bir tarih")
        
        # Auto-detect card type if not specified correctly
        detected_type = detect_card_type(card_number_clean)
        
        # Encrypt the card number
        encrypted_card_number = encrypt_card_number(card_number_clean)
        
        # Prepare document
        card_id = str(uuid.uuid4())
        card_doc = {
            "id": card_id,
            "cardCategory": card.cardCategory,
            "cardHolderFullName": card.cardHolderFullName,
            "companyId": card.companyId,
            "companyName": card.companyName,
            "encrypted_card_number": encrypted_card_number,  # Store encrypted
            "expiryDate": card.expiryDate,
            "cardType": detected_type,  # Use auto-detected type
            "bank": card.bank,
            "spendingLimit": card.spendingLimit,
            "isActive": card.isActive,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert to MongoDB
        await db.credit_cards.insert_one(card_doc)
        
        # Return response with masked card number
        return CreditCardResponse(
            id=card_id,
            cardCategory=card.cardCategory,
            cardHolderFullName=card.cardHolderFullName,
            companyId=card.companyId,
            companyName=card.companyName,
            cardNumber=card_number_clean,  # Return unmasked on creation for user to verify
            expiryDate=card.expiryDate,
            cardType=detected_type,
            bank=card.bank,
            spendingLimit=card.spendingLimit,
            isActive=card.isActive,
            created_at=card_doc["created_at"],
            updated_at=card_doc["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kart oluşturma hatası: {str(e)}")


@router.get("/credit-cards", response_model=List[CreditCardResponse])
async def get_all_credit_cards():
    """Get all credit cards with masked numbers"""
    try:
        cards = await db.credit_cards.find({}, {"_id": 0}).to_list(1000)
        
        # Decrypt and mask card numbers for display
        result = []
        for card in cards:
            try:
                # Decrypt the card number
                decrypted_number = decrypt_card_number(card.get("encrypted_card_number", ""))
                # Mask it for display
                masked_number = mask_card_number(decrypted_number)
                
                result.append(CreditCardResponse(
                    id=card["id"],
                    cardCategory=card.get("cardCategory", "personal"),
                    cardHolderFullName=card.get("cardHolderFullName", ""),
                    companyId=card.get("companyId"),
                    companyName=card.get("companyName"),
                    cardNumber=masked_number,  # Masked for security
                    expiryDate=card.get("expiryDate", ""),
                    cardType=card.get("cardType", "visa"),
                    bank=card.get("bank"),
                    spendingLimit=card.get("spendingLimit"),
                    isActive=card.get("isActive", True),
                    created_at=card.get("created_at", datetime.utcnow()),
                    updated_at=card.get("updated_at", datetime.utcnow())
                ))
            except Exception as e:
                # Skip cards with decryption errors
                print(f"Error processing card {card.get('id')}: {str(e)}")
                continue
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kartları getirme hatası: {str(e)}")


@router.get("/credit-cards/{card_id}", response_model=CreditCardResponse)
async def get_credit_card(card_id: str):
    """Get a single credit card by ID"""
    try:
        card = await db.credit_cards.find_one({"id": card_id}, {"_id": 0})
        
        if not card:
            raise HTTPException(status_code=404, detail="Kart bulunamadı")
        
        # Decrypt and mask the card number
        decrypted_number = decrypt_card_number(card.get("encrypted_card_number", ""))
        masked_number = mask_card_number(decrypted_number)
        
        return CreditCardResponse(
            id=card["id"],
            cardCategory=card.get("cardCategory", "personal"),
            cardHolderFullName=card.get("cardHolderFullName", ""),
            companyId=card.get("companyId"),
            companyName=card.get("companyName"),
            cardNumber=masked_number,
            expiryDate=card.get("expiryDate", ""),
            cardType=card.get("cardType", "visa"),
            bank=card.get("bank"),
            spendingLimit=card.get("spendingLimit"),
            isActive=card.get("isActive", True),
            created_at=card.get("created_at", datetime.utcnow()),
            updated_at=card.get("updated_at", datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kart getirme hatası: {str(e)}")


@router.put("/credit-cards/{card_id}", response_model=CreditCardResponse)
async def update_credit_card(card_id: str, card_update: CreditCardUpdate):
    """Update a credit card"""
    try:
        # Check if card exists
        existing_card = await db.credit_cards.find_one({"id": card_id}, {"_id": 0})
        if not existing_card:
            raise HTTPException(status_code=404, detail="Kart bulunamadı")
        
        # Prepare update data
        update_data = {}
        
        if card_update.cardCategory is not None:
            update_data["cardCategory"] = card_update.cardCategory
        if card_update.cardHolderFullName is not None:
            update_data["cardHolderFullName"] = card_update.cardHolderFullName
        if card_update.companyId is not None:
            update_data["companyId"] = card_update.companyId
        if card_update.companyName is not None:
            update_data["companyName"] = card_update.companyName
        if card_update.expiryDate is not None:
            # Validate expiry date
            if not validate_expiry_date(card_update.expiryDate):
                raise HTTPException(status_code=400, detail="Son kullanma tarihi geçersiz")
            update_data["expiryDate"] = card_update.expiryDate
        if card_update.bank is not None:
            update_data["bank"] = card_update.bank
        if card_update.spendingLimit is not None:
            update_data["spendingLimit"] = card_update.spendingLimit
        if card_update.isActive is not None:
            update_data["isActive"] = card_update.isActive
        
        # Handle card number update (if provided)
        if card_update.cardNumber is not None:
            card_number_clean = card_update.cardNumber.replace(' ', '')
            
            # Validate
            if len(card_number_clean) != 16:
                raise HTTPException(status_code=400, detail="Kart numarası 16 haneli olmalıdır")
            if not validate_luhn(card_number_clean):
                raise HTTPException(status_code=400, detail="Geçersiz kart numarası")
            
            # Encrypt and update
            encrypted_card_number = encrypt_card_number(card_number_clean)
            update_data["encrypted_card_number"] = encrypted_card_number
            
            # Auto-detect card type
            detected_type = detect_card_type(card_number_clean)
            update_data["cardType"] = detected_type
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update in database
        await db.credit_cards.update_one(
            {"id": card_id},
            {"$set": update_data}
        )
        
        # Fetch updated card
        updated_card = await db.credit_cards.find_one({"id": card_id}, {"_id": 0})
        
        # Decrypt and mask for response
        decrypted_number = decrypt_card_number(updated_card.get("encrypted_card_number", ""))
        masked_number = mask_card_number(decrypted_number)
        
        return CreditCardResponse(
            id=updated_card["id"],
            cardCategory=updated_card.get("cardCategory", "personal"),
            cardHolderFullName=updated_card.get("cardHolderFullName", ""),
            companyId=updated_card.get("companyId"),
            companyName=updated_card.get("companyName"),
            cardNumber=masked_number,
            expiryDate=updated_card.get("expiryDate", ""),
            cardType=updated_card.get("cardType", "visa"),
            bank=updated_card.get("bank"),
            spendingLimit=updated_card.get("spendingLimit"),
            isActive=updated_card.get("isActive", True),
            created_at=updated_card.get("created_at", datetime.utcnow()),
            updated_at=updated_card.get("updated_at", datetime.utcnow())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kart güncelleme hatası: {str(e)}")


@router.delete("/credit-cards/{card_id}")
async def delete_credit_card(card_id: str):
    """Delete a credit card"""
    try:
        result = await db.credit_cards.delete_one({"id": card_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Kart bulunamadı")
        
        return {"message": "Kart başarıyla silindi", "id": card_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kart silme hatası: {str(e)}")


@router.get("/credit-cards/{card_id}/decrypt")
async def decrypt_credit_card(card_id: str, x_user_role: str = None):
    """Decrypt and return full card details - Only for ultra admin"""
    try:
        # Get role from header (frontend sends this)
        from fastapi import Header
        
        # Only allow super-admin and admin roles
        allowed_roles = ['super-admin', 'admin']
        if not x_user_role or x_user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Yetkisiz erişim - Bu işlem sadece yöneticiler tarafından yapılabilir")
        
        # Find card
        card = await db.credit_cards.find_one({"id": card_id}, {"_id": 0})
        if not card:
            raise HTTPException(status_code=404, detail="Kart bulunamadı")
        
        # Decrypt card number
        try:
            decrypted_number = decrypt_card_number(card.get("encrypted_card_number", ""))
            
            # Format the decrypted number with spaces (4-digit groups)
            formatted_number = ' '.join([decrypted_number[i:i+4] for i in range(0, len(decrypted_number), 4)])
            
            return {
                "cardHolder": card.get("cardHolderFullName", ""),
                "cardHolderFullName": card.get("cardHolderFullName", ""),
                "fullCardNumber": formatted_number,
                "expiryDate": card.get("expiryDate", ""),
                "cardType": card.get("cardType", ""),
                "cvv": "***",  # CVV is never stored or shown
                "bank": card.get("bank", ""),
                "cardCategory": card.get("cardCategory", "")
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Kart şifresi çözülemedi: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")
