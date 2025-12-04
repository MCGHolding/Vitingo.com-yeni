from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

router = APIRouter()

# Initialize MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# ==================== MODELS ====================

class PurchaseInvoiceItem(BaseModel):
    documentType: str = Field(..., description="fatura or fis")
    documentNo: str
    date: str
    supplierId: str
    supplierName: str
    description: Optional[str] = ""
    quantity: float
    unit: str
    price: float
    currency: str
    vatRate: int = 20
    netAmount: float
    vatAmount: float
    grossAmount: float
    amountTRY: float
    paymentStatus: str = Field(..., description="odendi or odenmedi")
    paymentMethod: Optional[str] = ""  # nakit, banka, kredi-karti
    bankAccountId: Optional[str] = ""
    creditCardId: Optional[str] = ""
    attachments: Optional[List[dict]] = []


class BulkPurchaseInvoice(BaseModel):
    items: List[dict]


# ==================== HELPER FUNCTIONS ====================

async def update_supplier_balance(supplier_id: str, amount: float, transaction_type: str):
    """Update supplier balance (borç/alacak)"""
    if not supplier_id:
        return
    
    try:
        supplier = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
        if supplier:
            current_balance = supplier.get('balance', 0)
            if transaction_type == 'borç':
                new_balance = current_balance + amount
            else:  # alacak
                new_balance = current_balance - amount
            
            await db.suppliers.update_one(
                {"id": supplier_id},
                {
                    "$set": {
                        "balance": new_balance,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Supplier balance updated: {supplier_id} -> {new_balance} TRY")
    except Exception as e:
        print(f"⚠️ Supplier balance update error: {e}")


async def update_cash_account(amount: float):
    """Update main cash account"""
    try:
        cash = await db.cash_accounts.find_one({"type": "main"}, {"_id": 0})
        if cash:
            new_balance = cash.get('balance', 0) + amount
            await db.cash_accounts.update_one(
                {"type": "main"},
                {
                    "$set": {
                        "balance": new_balance,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Cash account updated: {new_balance} TRY")
        else:
            # Create main cash account if doesn't exist
            await db.cash_accounts.insert_one({
                "id": str(uuid.uuid4()),
                "type": "main",
                "name": "Ana Kasa",
                "balance": amount,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            print(f"✅ Main cash account created with balance: {amount} TRY")
    except Exception as e:
        print(f"⚠️ Cash account update error: {e}")


async def update_bank_account(bank_id: str, amount: float):
    """Update bank account balance"""
    if not bank_id:
        return
    
    try:
        bank = await db.banks.find_one({"id": bank_id}, {"_id": 0})
        if bank:
            new_balance = bank.get('balance', 0) + amount
            await db.banks.update_one(
                {"id": bank_id},
                {
                    "$set": {
                        "balance": new_balance,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Bank account updated: {bank_id} -> {new_balance} TRY")
    except Exception as e:
        print(f"⚠️ Bank account update error: {e}")


async def update_credit_card_balance(card_id: str, amount: float):
    """Update credit card used limit"""
    if not card_id:
        return
    
    try:
        card = await db.credit_cards.find_one({"id": card_id}, {"_id": 0})
        if card:
            used_limit = card.get('usedLimit', 0) + amount
            await db.credit_cards.update_one(
                {"id": card_id},
                {
                    "$set": {
                        "usedLimit": used_limit,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Credit card updated: {card_id} -> used: {used_limit} TRY")
    except Exception as e:
        print(f"⚠️ Credit card update error: {e}")


# ==================== API ENDPOINTS ====================

@router.post("/purchase-invoices")
async def create_purchase_invoice(invoice: dict):
    """Create a single purchase invoice"""
    try:
        # Validations
        if not invoice.get('supplierId'):
            raise HTTPException(status_code=400, detail="Tedarikçi seçimi zorunludur")
        
        if not invoice.get('documentNo'):
            raise HTTPException(status_code=400, detail="Belge numarası zorunludur")
        
        if invoice.get('quantity', 0) <= 0:
            raise HTTPException(status_code=400, detail="Miktar sıfırdan büyük olmalıdır")
        
        if invoice.get('price', 0) <= 0:
            raise HTTPException(status_code=400, detail="Fiyat sıfırdan büyük olmalıdır")
        
        # Add timestamps and ID
        invoice_id = str(uuid.uuid4())
        invoice['id'] = invoice_id
        invoice['created_at'] = datetime.utcnow()
        invoice['updated_at'] = datetime.utcnow()
        
        # Insert to database
        await db.purchase_invoices.insert_one(invoice)
        
        # Update supplier balance if not paid
        if invoice.get('paymentStatus') == 'odenmedi':
            amount_try = invoice.get('amountTRY', 0)
            await update_supplier_balance(
                invoice.get('supplierId'),
                amount_try,
                'borç'
            )
        
        # Update accounts if paid
        if invoice.get('paymentStatus') == 'odendi':
            payment_method = invoice.get('paymentMethod')
            amount_try = invoice.get('amountTRY', 0)
            
            if payment_method == 'nakit':
                await update_cash_account(-amount_try)  # Decrease cash
            elif payment_method == 'banka':
                await update_bank_account(invoice.get('bankAccountId'), -amount_try)
            elif payment_method == 'kredi-karti':
                await update_credit_card_balance(invoice.get('creditCardId'), amount_try)
        
        return {
            "success": True,
            "message": "Fatura başarıyla kaydedildi",
            "id": invoice_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kayıt hatası: {str(e)}")


@router.post("/purchase-invoices/bulk")
async def create_bulk_purchase_invoices(data: BulkPurchaseInvoice):
    """Create multiple purchase invoices at once"""
    try:
        items = data.items
        saved_count = 0
        errors = []
        
        for idx, item in enumerate(items):
            try:
                # Add ID and timestamps
                item['id'] = str(uuid.uuid4())
                item['created_at'] = datetime.utcnow()
                item['updated_at'] = datetime.utcnow()
                
                # Insert
                await db.purchase_invoices.insert_one(item)
                
                # Update balances if needed
                if item.get('paymentStatus') == 'odenmedi':
                    await update_supplier_balance(
                        item.get('supplierId'),
                        item.get('amountTRY', 0),
                        'borç'
                    )
                
                if item.get('paymentStatus') == 'odendi':
                    payment_method = item.get('paymentMethod')
                    amount = item.get('amountTRY', 0)
                    
                    if payment_method == 'nakit':
                        await update_cash_account(-amount)
                    elif payment_method == 'banka':
                        await update_bank_account(item.get('bankAccountId'), -amount)
                    elif payment_method == 'kredi-karti':
                        await update_credit_card_balance(item.get('creditCardId'), amount)
                
                saved_count += 1
            except Exception as e:
                errors.append(f"Satır {idx + 1}: {str(e)}")
        
        if errors:
            return {
                "success": True,
                "message": f"{saved_count} fatura kaydedildi, {len(errors)} hatada hata oluştu",
                "count": saved_count,
                "errors": errors
            }
        
        return {
            "success": True,
            "message": f"{saved_count} adet fatura başarıyla kaydedildi",
            "count": saved_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Toplu kayıt hatası: {str(e)}")


@router.get("/purchase-invoices")
async def get_purchase_invoices():
    """Get all purchase invoices"""
    try:
        invoices = await db.purchase_invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Listeleme hatası: {str(e)}")


@router.get("/purchase-invoices/{invoice_id}")
async def get_purchase_invoice(invoice_id: str):
    """Get a single purchase invoice by ID"""
    try:
        invoice = await db.purchase_invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Fatura bulunamadı")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fatura getirme hatası: {str(e)}")


@router.put("/purchase-invoices/{invoice_id}")
async def update_purchase_invoice(invoice_id: str, invoice_data: dict):
    """Update a purchase invoice"""
    try:
        # Check if exists
        existing = await db.purchase_invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Fatura bulunamadı")
        
        invoice_data['updated_at'] = datetime.utcnow()
        
        await db.purchase_invoices.update_one(
            {"id": invoice_id},
            {"$set": invoice_data}
        )
        
        return {
            "success": True,
            "message": "Fatura başarıyla güncellendi"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Güncelleme hatası: {str(e)}")


@router.delete("/purchase-invoices/{invoice_id}")
async def delete_purchase_invoice(invoice_id: str):
    """Delete a purchase invoice"""
    try:
        result = await db.purchase_invoices.delete_one({"id": invoice_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Fatura bulunamadı")
        
        return {
            "success": True,
            "message": "Fatura başarıyla silindi"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Silme hatası: {str(e)}")
