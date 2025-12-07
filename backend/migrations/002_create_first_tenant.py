"""
Migration Script: Create first tenant database (quattro_stand)
Phase 2 of Multi-Tenant SaaS Migration
Created: 2025-12-07
"""

import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)

# Tenant configuration
TENANT_SLUG = "quattro_stand"
TENANT_DB_NAME = f"vitingo_t_{TENANT_SLUG}"
TENANT_ID = "ten_quattro_001"


async def create_tenant_db_structure():
    """
    Step 1: Create tenant database structure with collections and indexes
    """
    print("\n" + "="*70)
    print(f"📦 PHASE 2: Creating tenant database: {TENANT_DB_NAME}")
    print("="*70)
    
    tenant_db = client[TENANT_DB_NAME]
    
    # 1. Customers collection
    print("\n🔹 Creating 'customers' collection...")
    await tenant_db.create_collection("customers")
    await tenant_db.customers.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.customers.create_index([("email", ASCENDING)])
    await tenant_db.customers.create_index([("company", ASCENDING)])
    print("   ✅ Customers collection created with indexes")
    
    # 2. Projects collection
    print("\n🔹 Creating 'projects' collection...")
    await tenant_db.create_collection("projects")
    await tenant_db.projects.create_index([("projectNumber", ASCENDING)], unique=True)
    await tenant_db.projects.create_index([("customerId", ASCENDING)])
    await tenant_db.projects.create_index([("status", ASCENDING)])
    print("   ✅ Projects collection created with indexes")
    
    # 3. Products collection
    print("\n🔹 Creating 'products' collection...")
    await tenant_db.create_collection("products")
    await tenant_db.products.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.products.create_index([("category", ASCENDING)])
    print("   ✅ Products collection created with indexes")
    
    # 4. Leads collection
    print("\n🔹 Creating 'leads' collection...")
    await tenant_db.create_collection("leads")
    await tenant_db.leads.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.leads.create_index([("status", ASCENDING)])
    print("   ✅ Leads collection created with indexes")
    
    # 5. Calendar events collection
    print("\n🔹 Creating 'calendar_events' collection...")
    await tenant_db.create_collection("calendar_events")
    await tenant_db.calendar_events.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.calendar_events.create_index([("start_date", ASCENDING)])
    print("   ✅ Calendar events collection created with indexes")
    
    # 6. Tasks collection
    print("\n🔹 Creating 'tasks' collection...")
    await tenant_db.create_collection("tasks")
    await tenant_db.tasks.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.tasks.create_index([("status", ASCENDING)])
    await tenant_db.tasks.create_index([("assigned_to", ASCENDING)])
    print("   ✅ Tasks collection created with indexes")
    
    # 7. Documents collection
    print("\n🔹 Creating 'documents' collection...")
    await tenant_db.create_collection("documents")
    await tenant_db.documents.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.documents.create_index([("entity_type", ASCENDING)])
    await tenant_db.documents.create_index([("entity_id", ASCENDING)])
    print("   ✅ Documents collection created with indexes")
    
    # 8. Activities collection
    print("\n🔹 Creating 'activities' collection...")
    await tenant_db.create_collection("activities")
    await tenant_db.activities.create_index([("id", ASCENDING)], unique=True)
    await tenant_db.activities.create_index([("entity_type", ASCENDING)])
    await tenant_db.activities.create_index([("entity_id", ASCENDING)])
    await tenant_db.activities.create_index([("created_at", ASCENDING)])
    print("   ✅ Activities collection created with indexes")
    
    # 9. Settings collection
    print("\n🔹 Creating 'settings' collection...")
    await tenant_db.create_collection("settings")
    await tenant_db.settings.create_index([("key", ASCENDING)], unique=True)
    print("   ✅ Settings collection created with indexes")
    
    print("\n" + "="*70)
    print(f"✅ Tenant database structure created: {TENANT_DB_NAME}")
    print("="*70)


async def migrate_tenant_data():
    """
    Step 2: Migrate tenant-specific data from vitingo_crm to tenant database
    """
    print("\n" + "="*70)
    print(f"📦 PHASE 2: Migrating data from vitingo_crm to {TENANT_DB_NAME}")
    print("="*70)
    
    source_db = client["vitingo_crm"]
    target_db = client[TENANT_DB_NAME]
    
    # Collections to migrate
    collections_to_migrate = [
        "customers",
        "products", 
        "leads",
        "calendar_events"
    ]
    
    migration_stats = {}
    
    for collection_name in collections_to_migrate:
        print(f"\n🔄 Migrating {collection_name}...")
        
        # Check if source collection exists and has data
        try:
            source_count = await source_db[collection_name].count_documents({})
            if source_count == 0:
                print(f"   ⚠️  No data found in source collection: {collection_name}")
                migration_stats[collection_name] = 0
                continue
            
            # Fetch all documents (without _id to avoid conflicts)
            documents = await source_db[collection_name].find({}, {"_id": 0}).to_list(None)
            
            if documents:
                # Insert into target database
                await target_db[collection_name].insert_many(documents)
                migration_stats[collection_name] = len(documents)
                print(f"   ✅ Migrated {len(documents)} documents")
            else:
                migration_stats[collection_name] = 0
                print(f"   ⚠️  No documents to migrate")
                
        except Exception as e:
            print(f"   ❌ Error migrating {collection_name}: {str(e)}")
            migration_stats[collection_name] = 0
    
    print("\n" + "="*70)
    print("✅ Data migration completed!")
    print("\n📊 Migration Summary:")
    for col, count in migration_stats.items():
        status_icon = "✅" if count > 0 else "⚠️ "
        print(f"   {status_icon} {col}: {count} documents")
    print("="*70)
    
    return migration_stats


async def create_tenant_record():
    """
    Step 3: Create tenant record in vitingo_platform.tenants
    """
    print("\n" + "="*70)
    print("📦 PHASE 2: Creating tenant record in vitingo_platform")
    print("="*70)
    
    platform_db = client["vitingo_platform"]
    
    tenant_record = {
        "id": TENANT_ID,
        "slug": TENANT_SLUG,
        "name": "Quattro Stand",
        "database_name": TENANT_DB_NAME,
        "status": "active",
        "subscription": {
            "package_key": "professional",
            "status": "active",
            "started_at": datetime.now(timezone.utc),
            "next_billing_date": None
        },
        "owner": {
            "email": "admin@quattrostand.com",
            "name": "Murat Bucak"
        },
        "settings": {
            "timezone": "Europe/Istanbul",
            "language": "tr",
            "currency": "TRY"
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    # Insert tenant record
    await platform_db.tenants.insert_one(tenant_record)
    print(f"   ✅ Tenant record created: {TENANT_SLUG}")
    print(f"   📋 Tenant ID: {TENANT_ID}")
    print(f"   📋 Database: {TENANT_DB_NAME}")
    print(f"   📋 Owner: {tenant_record['owner']['name']} ({tenant_record['owner']['email']})")
    
    print("\n" + "="*70)
    print("✅ Tenant record created successfully!")
    print("="*70)


async def create_admin_user():
    """
    Step 4: Create admin user in vitingo_platform.users
    """
    print("\n" + "="*70)
    print("📦 PHASE 2: Creating admin user in vitingo_platform")
    print("="*70)
    
    platform_db = client["vitingo_platform"]
    
    # Check if user already exists
    existing_user = await platform_db.users.find_one({"email": "admin@quattrostand.com"})
    if existing_user:
        print("   ⚠️  User already exists: admin@quattrostand.com")
        return
    
    admin_user = {
        "id": "usr_quattro_admin_001",
        "tenant_id": TENANT_ID,
        "email": "admin@quattrostand.com",
        "name": "Murat Bucak",
        "role": "admin",
        "status": "active",
        "permissions": [
            "customers.*",
            "projects.*",
            "products.*",
            "leads.*",
            "calendar.*",
            "reports.*",
            "settings.*"
        ],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_login": None,
        "is_active": True
    }
    
    await platform_db.users.insert_one(admin_user)
    print(f"   ✅ Admin user created: {admin_user['email']}")
    print(f"   📋 User ID: {admin_user['id']}")
    print(f"   📋 Role: {admin_user['role']}")
    print(f"   📋 Tenant: {TENANT_SLUG}")
    
    print("\n" + "="*70)
    print("✅ Admin user created successfully!")
    print("="*70)


async def verify_migration():
    """
    Step 5: Verify migration - compare source vs target counts
    """
    print("\n" + "="*70)
    print("🔍 PHASE 2: Verifying migration")
    print("="*70)
    
    source_db = client["vitingo_crm"]
    target_db = client[TENANT_DB_NAME]
    platform_db = client["vitingo_platform"]
    
    print("\n📊 Comparing document counts (Source vs Target):")
    
    collections_to_verify = ["customers", "products", "leads", "calendar_events"]
    all_match = True
    
    for collection_name in collections_to_verify:
        source_count = await source_db[collection_name].count_documents({})
        target_count = await target_db[collection_name].count_documents({})
        
        match = source_count == target_count
        status_icon = "✅" if match else "❌"
        
        if not match:
            all_match = False
        
        print(f"   {status_icon} {collection_name}: {source_count} → {target_count}")
    
    # Check tenant database collections
    print("\n📊 Tenant database collection counts:")
    tenant_collections = await target_db.list_collection_names()
    for col in tenant_collections:
        count = await target_db[col].count_documents({})
        status_icon = "✅" if count > 0 else "⚠️ "
        print(f"   {status_icon} {col}: {count} documents")
    
    # Check platform database
    print("\n📊 Platform database verification:")
    tenant_count = await platform_db.tenants.count_documents({"slug": TENANT_SLUG})
    user_count = await platform_db.users.count_documents({"tenant_id": TENANT_ID})
    print(f"   ✅ Tenant record: {tenant_count} (slug: {TENANT_SLUG})")
    print(f"   ✅ Admin users: {user_count} (tenant_id: {TENANT_ID})")
    
    print("\n" + "="*70)
    if all_match:
        print("✅ VERIFICATION PASSED - All counts match!")
    else:
        print("⚠️  VERIFICATION WARNING - Some counts don't match")
    print("="*70)
    
    return all_match


async def main():
    """
    Main migration execution for Phase 2
    """
    try:
        print("\n" + "="*70)
        print("🚀 MULTI-TENANT SAAS MIGRATION - PHASE 2")
        print(f"   Creating First Tenant: {TENANT_SLUG}")
        print("="*70)
        
        # Step 1: Create database structure
        await create_tenant_db_structure()
        
        # Step 2: Migrate tenant data
        migration_stats = await migrate_tenant_data()
        
        # Step 3: Create tenant record
        await create_tenant_record()
        
        # Step 4: Create admin user
        await create_admin_user()
        
        # Step 5: Verify migration
        verification_passed = await verify_migration()
        
        print("\n" + "="*70)
        print("🎉 PHASE 2 COMPLETED SUCCESSFULLY!")
        print("="*70)
        print("\n✅ Summary:")
        print(f"   - Tenant database created: {TENANT_DB_NAME}")
        print(f"   - Tenant slug: {TENANT_SLUG}")
        print(f"   - Tenant ID: {TENANT_ID}")
        print(f"   - Data migrated: {sum(migration_stats.values())} documents")
        print(f"   - Admin user created: admin@quattrostand.com")
        print(f"   - Verification: {'PASSED ✅' if verification_passed else 'WARNING ⚠️'}")
        print("\n✅ Next Steps:")
        print("   1. Test tenant database connectivity")
        print("   2. Proceed to Phase 3: Create tenant middleware")
        print("   3. Update API endpoints to be tenant-aware")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR during Phase 2 migration: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
