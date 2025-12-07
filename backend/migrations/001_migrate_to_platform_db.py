"""
Migration Script: Create vitingo_platform database and migrate shared data
Phase 1 of Multi-Tenant SaaS Migration
Created: 2025-12-07
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)


async def create_platform_db_structure():
    """
    Step 1: Create vitingo_platform database with required collections and indexes
    """
    print("\n" + "="*70)
    print("📦 PHASE 1: Creating vitingo_platform database structure")
    print("="*70)
    
    platform_db = client["vitingo_platform"]
    
    # 1. Tenants collection
    print("\n🔹 Creating 'tenants' collection...")
    await platform_db.create_collection("tenants")
    await platform_db.tenants.create_index([("slug", ASCENDING)], unique=True)
    await platform_db.tenants.create_index([("status", ASCENDING)])
    print("   ✅ Tenants collection created with indexes")
    
    # 2. Users collection (platform-level users)
    print("\n🔹 Creating 'users' collection...")
    await platform_db.create_collection("users")
    await platform_db.users.create_index([("email", ASCENDING)], unique=True)
    await platform_db.users.create_index([("tenant_id", ASCENDING)])
    print("   ✅ Users collection created with indexes")
    
    # 3. Feature flags collection
    print("\n🔹 Creating 'feature_flags' collection...")
    await platform_db.create_collection("feature_flags")
    await platform_db.feature_flags.create_index([("key", ASCENDING)], unique=True)
    print("   ✅ Feature flags collection created")
    
    # 4. Packages collection
    print("\n🔹 Creating 'packages' collection...")
    await platform_db.create_collection("packages")
    await platform_db.packages.create_index([("key", ASCENDING)], unique=True)
    print("   ✅ Packages collection created")
    
    # 5. Global data collections
    print("\n🔹 Creating global data collections...")
    for collection_name in ["global_currencies", "global_countries", "global_cities", "global_languages"]:
        await platform_db.create_collection(collection_name)
        print(f"   ✅ {collection_name} collection created")
    
    # 6. Subscriptions collection
    print("\n🔹 Creating 'subscriptions' collection...")
    await platform_db.create_collection("subscriptions")
    await platform_db.subscriptions.create_index([("tenant_id", ASCENDING)])
    print("   ✅ Subscriptions collection created")
    
    # 7. Invoices collection
    print("\n🔹 Creating 'invoices' collection...")
    await platform_db.create_collection("invoices")
    await platform_db.invoices.create_index([("tenant_id", ASCENDING)])
    print("   ✅ Invoices collection created")
    
    print("\n" + "="*70)
    print("✅ Platform database structure created successfully!")
    print("="*70)


async def migrate_shared_data():
    """
    Step 2: Migrate shared/global data from crm_db to vitingo_platform
    """
    print("\n" + "="*70)
    print("📦 PHASE 1: Migrating shared data from crm_db to vitingo_platform")
    print("="*70)
    
    source_db = client["crm_db"]
    target_db = client["vitingo_platform"]
    
    # 1. Migrate feature_flags
    print("\n🔄 Migrating feature_flags...")
    flags = await source_db.feature_flags.find({}, {"_id": 0}).to_list(None)
    if flags:
        await target_db.feature_flags.insert_many(flags)
        print(f"   ✅ Migrated {len(flags)} feature flags")
    else:
        print("   ⚠️  No feature flags found to migrate")
    
    # 2. Migrate packages
    print("\n🔄 Migrating packages...")
    packages = await source_db.packages.find({}, {"_id": 0}).to_list(None)
    if packages:
        await target_db.packages.insert_many(packages)
        print(f"   ✅ Migrated {len(packages)} packages")
    else:
        print("   ⚠️  No packages found to migrate")
    
    # 3. Migrate global data with 'global_' prefix
    global_collections = [
        ("currencies", "global_currencies"),
        ("countries", "global_countries"),
        ("cities", "global_cities"),
        ("languages", "global_languages")
    ]
    
    for source_col, target_col in global_collections:
        print(f"\n🔄 Migrating {source_col} -> {target_col}...")
        data = await source_db[source_col].find({}, {"_id": 0}).to_list(None)
        if data:
            await target_db[target_col].insert_many(data)
            print(f"   ✅ Migrated {len(data)} documents")
        else:
            print(f"   ⚠️  No data found in {source_col}")
    
    print("\n" + "="*70)
    print("✅ Data migration completed successfully!")
    print("="*70)


async def verify_migration():
    """
    Step 3: Verify migration results
    """
    print("\n" + "="*70)
    print("🔍 PHASE 1: Verifying migration")
    print("="*70)
    
    platform_db = client["vitingo_platform"]
    
    # Get all collection names
    collections = await platform_db.list_collection_names()
    print(f"\n📊 Total collections in vitingo_platform: {len(collections)}")
    print(f"   Collections: {', '.join(collections)}")
    
    # Count documents in each collection
    print("\n📊 Document counts:")
    collection_counts = {}
    for collection_name in collections:
        count = await platform_db[collection_name].count_documents({})
        collection_counts[collection_name] = count
        status_icon = "✅" if count > 0 else "⚠️ "
        print(f"   {status_icon} {collection_name}: {count} documents")
    
    # Verification summary
    print("\n" + "="*70)
    total_docs = sum(collection_counts.values())
    print(f"✅ VERIFICATION COMPLETE")
    print(f"   - Total collections: {len(collections)}")
    print(f"   - Total documents: {total_docs}")
    print("="*70)
    
    return collection_counts


async def main():
    """
    Main migration execution
    """
    try:
        print("\n" + "="*70)
        print("🚀 MULTI-TENANT SAAS MIGRATION - PHASE 1")
        print("   Creating Platform Database (vitingo_platform)")
        print("="*70)
        
        # Step 1: Create database structure
        await create_platform_db_structure()
        
        # Step 2: Migrate data
        await migrate_shared_data()
        
        # Step 3: Verify migration
        counts = await verify_migration()
        
        print("\n" + "="*70)
        print("🎉 PHASE 1 COMPLETED SUCCESSFULLY!")
        print("="*70)
        print("\n✅ Next Steps:")
        print("   1. Verify data integrity in vitingo_platform")
        print("   2. Test global data API endpoints")
        print("   3. Proceed to Phase 2: Create first tenant database")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR during migration: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
