"""
Migration Script: Migrate Customer Prospects to Leads Collection
=================================================================

This script:
1. Creates backup of customers collection
2. Finds all customers with isProspect=true
3. Copies them to leads collection
4. Deletes isProspect=true records from customers collection
5. Provides rollback capability

Usage:
    python migrate_prospects_to_leads.py [--dry-run] [--rollback]

Options:
    --dry-run: Show what would be migrated without making changes
    --rollback: Restore from backup
"""

import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import asyncio
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = 'vitingo_crm'

async def create_backup(db, collection_name):
    """Create a backup of the collection"""
    print(f"\n📦 Creating backup of '{collection_name}' collection...")
    
    collection = db[collection_name]
    backup_collection_name = f"{collection_name}_backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    backup_collection = db[backup_collection_name]
    
    # Get all documents
    docs = await collection.find({}).to_list(length=None)
    
    if docs:
        # Insert into backup
        await backup_collection.insert_many(docs)
        print(f"✅ Backup created: {backup_collection_name} ({len(docs)} documents)")
        return backup_collection_name
    else:
        print(f"⚠️  No documents to backup in {collection_name}")
        return None

async def get_prospects(db):
    """Get all customer prospects (isProspect=true)"""
    customers_collection = db["customers"]
    prospects = await customers_collection.find({"isProspect": True}).to_list(length=None)
    return prospects

async def migrate_prospects_to_leads(dry_run=False):
    """Main migration function"""
    print("\n" + "="*60)
    print("🚀 MIGRATION: Customer Prospects → Leads Collection")
    print("="*60)
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Step 1: Create backup
        if not dry_run:
            customers_backup = await create_backup(db, "customers")
            leads_backup = await create_backup(db, "leads")
        
        # Step 2: Get prospects
        print("\n🔍 Finding customer prospects (isProspect=true)...")
        prospects = await get_prospects(db)
        
        if not prospects:
            print("✅ No prospects found to migrate")
            return
        
        print(f"📊 Found {len(prospects)} prospects to migrate")
        
        # Show sample data
        print("\n📋 Sample prospect data:")
        for i, prospect in enumerate(prospects[:3]):
            print(f"  {i+1}. {prospect.get('companyName', 'N/A')} (ID: {prospect.get('id', 'N/A')})")
        
        if len(prospects) > 3:
            print(f"  ... and {len(prospects) - 3} more")
        
        if dry_run:
            print("\n✅ DRY RUN COMPLETE - No changes made")
            return
        
        # Step 3: Transform and insert into leads collection
        print("\n📤 Migrating prospects to leads collection...")
        leads_collection = db["leads"]
        leads_to_insert = []
        
        for prospect in prospects:
            # Transform prospect to lead format
            lead = {
                "id": prospect.get("id"),
                "companyName": prospect.get("companyName", ""),
                "companyTitle": prospect.get("companyTitle", ""),
                "contactPerson": prospect.get("contactPerson", ""),
                "contactMobile": prospect.get("contactMobile", ""),
                "contactEmail": prospect.get("contactEmail", ""),
                "contactPosition": prospect.get("contactPosition", ""),
                "phone": prospect.get("phone", ""),
                "email": prospect.get("email", ""),
                "address": prospect.get("address", ""),
                "contactAddress": prospect.get("contactAddress", ""),
                "country": prospect.get("country", "TR"),
                "city": prospect.get("city", ""),
                "contactCountry": prospect.get("contactCountry", ""),
                "contactCity": prospect.get("contactCity", ""),
                "sector": prospect.get("sector", ""),
                "relationshipType": prospect.get("relationshipType", ""),
                "notes": prospect.get("notes", ""),
                "tags": prospect.get("tags", []),
                "services": prospect.get("services", []),
                "iban": prospect.get("iban", ""),
                "bankName": prospect.get("bankName", ""),
                "bankBranch": prospect.get("bankBranch", ""),
                "accountHolderName": prospect.get("accountHolderName", ""),
                "swiftCode": prospect.get("swiftCode", ""),
                # Lead-specific fields
                "source": "migration",
                "potential_value": 0.0,
                "status": "new",
                "converted_at": None,
                "customer_id": None,
                "created_at": prospect.get("created_at", datetime.now(timezone.utc)),
                "created_by": None,
                "updated_at": None
            }
            
            # Remove _id if present (MongoDB will create new one)
            if "_id" in lead:
                del lead["_id"]
            
            leads_to_insert.append(lead)
        
        # Insert leads
        if leads_to_insert:
            result = await leads_collection.insert_many(leads_to_insert)
            print(f"✅ Inserted {len(result.inserted_ids)} leads")
        
        # Step 4: Delete prospects from customers collection
        print("\n🗑️  Deleting migrated prospects from customers collection...")
        customers_collection = db["customers"]
        delete_result = await customers_collection.delete_many({"isProspect": True})
        print(f"✅ Deleted {delete_result.deleted_count} prospects from customers")
        
        # Step 5: Verification
        print("\n✅ MIGRATION COMPLETE!")
        print("\n📊 Final Stats:")
        
        remaining_prospects = await customers_collection.count_documents({"isProspect": True})
        total_customers = await customers_collection.count_documents({})
        total_leads = await leads_collection.count_documents({})
        
        print(f"  • Customers (isProspect=false): {total_customers}")
        print(f"  • Customers (isProspect=true): {remaining_prospects}")
        print(f"  • Leads: {total_leads}")
        
        if remaining_prospects > 0:
            print(f"\n⚠️  WARNING: Still {remaining_prospects} prospects in customers collection!")
        
        print(f"\n💾 Backup collections created:")
        if customers_backup:
            print(f"  • {customers_backup}")
        if leads_backup:
            print(f"  • {leads_backup}")
        
    except Exception as e:
        print(f"\n❌ ERROR during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\n💡 You can restore from backup if needed")
        sys.exit(1)
    finally:
        client.close()

async def rollback_migration(backup_collection_name):
    """Rollback migration from backup"""
    print("\n" + "="*60)
    print("↩️  ROLLBACK: Restoring from backup")
    print("="*60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        backup_collection = db[backup_collection_name]
        customers_collection = db["customers"]
        
        # Get backup data
        backup_docs = await backup_collection.find({}).to_list(length=None)
        
        if not backup_docs:
            print(f"❌ No data found in backup collection: {backup_collection_name}")
            return
        
        print(f"📦 Found {len(backup_docs)} documents in backup")
        
        # Clear current customers collection
        print("🗑️  Clearing current customers collection...")
        await customers_collection.delete_many({})
        
        # Restore from backup
        print("📥 Restoring from backup...")
        await customers_collection.insert_many(backup_docs)
        
        print("✅ ROLLBACK COMPLETE!")
        
        # Verification
        total_customers = await customers_collection.count_documents({})
        prospects_count = await customers_collection.count_documents({"isProspect": True})
        
        print(f"\n📊 Restored Stats:")
        print(f"  • Total customers: {total_customers}")
        print(f"  • Prospects (isProspect=true): {prospects_count}")
        
    except Exception as e:
        print(f"\n❌ ERROR during rollback: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

async def list_backups():
    """List available backup collections"""
    print("\n📦 Available Backup Collections:")
    print("="*60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        collections = await db.list_collection_names()
        backup_collections = [c for c in collections if 'backup' in c]
        
        if not backup_collections:
            print("No backup collections found")
        else:
            for backup in sorted(backup_collections):
                count = await db[backup].count_documents({})
                print(f"  • {backup} ({count} documents)")
    finally:
        client.close()

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate customer prospects to leads collection')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be migrated without making changes')
    parser.add_argument('--rollback', type=str, help='Rollback from backup collection name')
    parser.add_argument('--list-backups', action='store_true', help='List available backup collections')
    
    args = parser.parse_args()
    
    if args.list_backups:
        asyncio.run(list_backups())
    elif args.rollback:
        asyncio.run(rollback_migration(args.rollback))
    else:
        asyncio.run(migrate_prospects_to_leads(dry_run=args.dry_run))

if __name__ == "__main__":
    main()
