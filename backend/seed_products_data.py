#!/usr/bin/env python3
"""
Products Data Seed Script
Seeds products/services data for invoicing system

Usage:
    python seed_products_data.py --reset  # Clear and reseed all data
    python seed_products_data.py --update # Update existing data (upsert)
"""

import asyncio
import argparse
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/vitingo_crm')

# Products/Services data for Başarı Uluslararası Fuarcılık A.Ş.
PRODUCTS_DATA = [
    # Fair Services - Turkish
    {
        "name": "Yurtdışı Fuar Stand Kiralama Hizmeti",
        "name_en": "International Fair Stand Rental Service",
        "category": "fair_services",
        "unit": "adet",
        "default_price": 5000.0,
        "currency": "USD"
    },
    {
        "name": "Yurtiçi Fuar Stand Kiralama Hizmeti", 
        "name_en": "Domestic Fair Stand Rental Service",
        "category": "fair_services",
        "unit": "adet",
        "default_price": 15000.0,
        "currency": "TRY"
    },
    
    # Equipment Rental - Turkish
    {
        "name": "Truss Kiralama Bedeli",
        "name_en": "Truss Rental Fee",
        "category": "equipment_rental",
        "unit": "adet",
        "default_price": 500.0,
        "currency": "TRY"
    },
    {
        "name": "Mobilya Kiralama Bedeli",
        "name_en": "Furniture Rental Fee", 
        "category": "equipment_rental",
        "unit": "adet",
        "default_price": 300.0,
        "currency": "TRY"
    },
    
    # Utilities - Turkish
    {
        "name": "Elektrik Kullanım Ücret Yansıtması",
        "name_en": "Electricity Usage Charge",
        "category": "utilities",
        "unit": "kwh",
        "default_price": 2.5,
        "currency": "TRY"
    },
    {
        "name": "Su Kullanım Ücret Yansıtması", 
        "name_en": "Water Usage Charge",
        "category": "utilities",
        "unit": "m3",
        "default_price": 15.0,
        "currency": "TRY"
    },
    
    # Services - Turkish
    {
        "name": "Extra Hizmetler",
        "name_en": "Extra Services",
        "category": "services",
        "unit": "saat",
        "default_price": 200.0,
        "currency": "TRY"
    },
    {
        "name": "Yardımcı Personel Ücretleri",
        "name_en": "Support Staff Fees",
        "category": "services", 
        "unit": "gün",
        "default_price": 800.0,
        "currency": "TRY"
    },
    {
        "name": "Hizmet Bedeli",
        "name_en": "Service Fee",
        "category": "services",
        "unit": "adet",
        "default_price": 1000.0,
        "currency": "TRY"
    },
    
    # Transportation & Accommodation - Turkish
    {
        "name": "Transfer Bedelleri",
        "name_en": "Transfer Fees",
        "category": "transportation",
        "unit": "adet",
        "default_price": 150.0,
        "currency": "TRY"
    },
    {
        "name": "Ulaşım Bedeli",
        "name_en": "Transportation Fee",
        "category": "transportation", 
        "unit": "adet",
        "default_price": 500.0,
        "currency": "TRY"
    },
    {
        "name": "Konaklama Bedeli",
        "name_en": "Accommodation Fee",
        "category": "accommodation",
        "unit": "gece",
        "default_price": 200.0,
        "currency": "EUR"
    },
    
    # Events & Organization - Turkish
    {
        "name": "Etkinlik ve Organizasyon Bedeli",
        "name_en": "Event and Organization Fee", 
        "category": "events",
        "unit": "adet",
        "default_price": 2500.0,
        "currency": "TRY"
    },
    
    # English versions (if needed separately)
    {
        "name": "International Fair Stand Rental Service",
        "name_en": "International Fair Stand Rental Service",
        "category": "fair_services",
        "unit": "piece",
        "default_price": 5000.0,
        "currency": "USD"
    },
    {
        "name": "Domestic Fair Stand Rental Service",
        "name_en": "Domestic Fair Stand Rental Service", 
        "category": "fair_services",
        "unit": "piece",
        "default_price": 15000.0,
        "currency": "TRY"
    },
    {
        "name": "Truss Rental Fee",
        "name_en": "Truss Rental Fee",
        "category": "equipment_rental",
        "unit": "piece",
        "default_price": 500.0,
        "currency": "TRY"
    },
    {
        "name": "Electricity Usage Charge", 
        "name_en": "Electricity Usage Charge",
        "category": "utilities",
        "unit": "kwh",
        "default_price": 2.5,
        "currency": "TRY"
    },
    {
        "name": "Water Usage Charge",
        "name_en": "Water Usage Charge",
        "category": "utilities",
        "unit": "m3", 
        "default_price": 15.0,
        "currency": "TRY"
    },
    {
        "name": "Furniture Rental Fee",
        "name_en": "Furniture Rental Fee",
        "category": "equipment_rental",
        "unit": "piece",
        "default_price": 300.0,
        "currency": "TRY"
    },
    {
        "name": "Extra Services",
        "name_en": "Extra Services",
        "category": "services",
        "unit": "hour",
        "default_price": 200.0, 
        "currency": "TRY"
    },
    {
        "name": "Support Staff Fees",
        "name_en": "Support Staff Fees",
        "category": "services",
        "unit": "day",
        "default_price": 800.0,
        "currency": "TRY"
    },
    {
        "name": "Service Fee",
        "name_en": "Service Fee",
        "category": "services",
        "unit": "piece",
        "default_price": 1000.0,
        "currency": "TRY"
    },
    {
        "name": "Transfer Fees", 
        "name_en": "Transfer Fees",
        "category": "transportation",
        "unit": "piece",
        "default_price": 150.0,
        "currency": "TRY"
    },
    {
        "name": "Event and Organization Fee",
        "name_en": "Event and Organization Fee",
        "category": "events",
        "unit": "piece",
        "default_price": 2500.0,
        "currency": "TRY"
    },
    {
        "name": "Accommodation Fee",
        "name_en": "Accommodation Fee", 
        "category": "accommodation",
        "unit": "night",
        "default_price": 200.0,
        "currency": "EUR"
    },
    {
        "name": "Transportation Fee",
        "name_en": "Transportation Fee",
        "category": "transportation",
        "unit": "piece",
        "default_price": 500.0,
        "currency": "TRY"
    }
]

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client.vitingo_crm
        # Test connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {MONGO_URL}")
        return db
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

async def seed_products(db, reset=False):
    """Seed products data"""
    logger.info("Seeding products/services data...")
    
    if reset:
        logger.info("Clearing existing products...")
        await db.products.delete_many({})
    
    # Create indexes
    await db.products.create_index("name", unique=True)
    await db.products.create_index("category")
    await db.products.create_index("is_active")
    
    seeded_count = 0
    updated_count = 0
    
    for product_data in PRODUCTS_DATA:
        product_doc = {
            "id": str(uuid.uuid4()),
            "name": product_data["name"],
            "name_en": product_data["name_en"],
            "category": product_data["category"],
            "unit": product_data["unit"],
            "default_price": product_data["default_price"],
            "currency": product_data["currency"],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        try:
            # Upsert by name
            result = await db.products.update_one(
                {"name": product_data["name"]},
                {"$setOnInsert": product_doc},
                upsert=True
            )
            
            if result.upserted_id:
                seeded_count += 1
                logger.info(f"✓ Added product: {product_data['name']}")
            else:
                updated_count += 1
                
        except Exception as e:
            logger.error(f"✗ Failed to seed product {product_data['name']}: {e}")
    
    logger.info(f"Products seeding completed: {seeded_count} added, {updated_count} existing")

async def main():
    parser = argparse.ArgumentParser(description='Seed products data into MongoDB')
    parser.add_argument('--reset', action='store_true', help='Clear and reseed all data')
    parser.add_argument('--update', action='store_true', help='Update existing data (upsert)')
    
    args = parser.parse_args()
    
    # Default to update mode if no specific action
    if not any([args.reset, args.update]):
        args.update = True
    
    db = await connect_to_mongo()
    
    try:
        await seed_products(db, reset=args.reset)
        logger.info("🎉 Products data seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())