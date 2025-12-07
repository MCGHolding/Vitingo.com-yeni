"""
Migration: Create second tenant (demo-company) for multi-tenant testing
Tests tenant isolation and validates multi-tenant architecture
"""
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from uuid import uuid4

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def main():
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017")
    platform_db = client["vitingo_platform"]
    
    print("=" * 80)
    print("CREATING SECOND TENANT: demo-company")
    print("=" * 80)
    
    # 1. Create tenant in platform database
    tenant_id = "ten_demo_001"
    tenant_slug = "demo_company"
    db_name = f"vitingo_t_{tenant_slug}"
    
    tenant_data = {
        "id": tenant_id,
        "slug": tenant_slug,
        "name": "Demo Company",
        "database_name": db_name,
        "status": "active",
        "package": "basic",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "settings": {
            "language": "tr",
            "timezone": "Europe/Istanbul",
            "currency": "TRY"
        }
    }
    
    # Check if tenant already exists
    existing_tenant = platform_db.tenants.find_one({"slug": tenant_slug})
    if existing_tenant:
        print(f"⚠️  Tenant {tenant_slug} already exists, skipping creation")
    else:
        platform_db.tenants.insert_one(tenant_data)
        print(f"✅ Created tenant: {tenant_data['name']} (slug: {tenant_slug})")
    
    # 2. Create tenant database
    tenant_db = client[db_name]
    
    # Create collections with validation
    collections_to_create = [
        "customers",
        "projects",
        "opportunities",
        "invoices",
        "products",
        "leads",
        "suppliers",
        "banks",
        "tasks",
        "contracts",
        "proposals",
        "people",
        "fairs",
        "expense_receipts"
    ]
    
    existing_collections = tenant_db.list_collection_names()
    for collection in collections_to_create:
        if collection not in existing_collections:
            tenant_db.create_collection(collection)
    
    print(f"✅ Created tenant database: {db_name}")
    print(f"   Collections: {len(collections_to_create)}")
    
    # 3. Create test user for demo-company
    test_user_id = "usr_demo_admin_001"
    test_password = "Demo123!"
    
    test_user = {
        "id": test_user_id,
        "tenant_id": tenant_id,
        "email": "admin@democompany.com",
        "name": "Demo Admin",
        "role": "admin",
        "department": "Management",
        "status": "active",
        "password_hash": get_password_hash(test_password),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "last_login": None,
        "is_active": True,
        "avatar": None,
        "permissions": ["*"]
    }
    
    # Check if user exists
    existing_user = platform_db.users.find_one({"email": test_user["email"]})
    if existing_user:
        print(f"⚠️  User {test_user['email']} already exists, updating...")
        platform_db.users.update_one(
            {"email": test_user["email"]},
            {"$set": test_user}
        )
    else:
        platform_db.users.insert_one(test_user)
    
    print(f"✅ Created test user: {test_user['email']}")
    
    # 4. Add sample customers
    sample_customers = [
        {
            "id": str(uuid4()),
            "companyName": "Tech Solutions Ltd",
            "contactName": "Ahmet Yılmaz",
            "email": "ahmet@techsolutions.com",
            "phone": "+90 555 111 2233",
            "address": "İstanbul, Türkiye",
            "status": "active",
            "customerType": "customer",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid4()),
            "companyName": "Digital Marketing Co",
            "contactName": "Ayşe Demir",
            "email": "ayse@digitalmarketing.com",
            "phone": "+90 555 444 5566",
            "address": "Ankara, Türkiye",
            "status": "active",
            "customerType": "customer",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid4()),
            "companyName": "Global Trade Inc",
            "contactName": "Mehmet Kaya",
            "email": "mehmet@globaltrade.com",
            "phone": "+90 555 777 8899",
            "address": "İzmir, Türkiye",
            "status": "active",
            "customerType": "customer",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid4()),
            "companyName": "Innovative Systems",
            "contactName": "Zeynep Özkan",
            "email": "zeynep@innovative.com",
            "phone": "+90 555 222 3344",
            "address": "Bursa, Türkiye",
            "status": "active",
            "customerType": "customer",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid4()),
            "companyName": "Smart Business Partners",
            "contactName": "Can Arslan",
            "email": "can@smartbusiness.com",
            "phone": "+90 555 666 7788",
            "address": "Antalya, Türkiye",
            "status": "active",
            "customerType": "customer",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    if tenant_db.customers.count_documents({}) == 0:
        tenant_db.customers.insert_many(sample_customers)
        print(f"✅ Created {len(sample_customers)} sample customers")
    else:
        print(f"⚠️  Customers already exist, skipping...")
    
    # 5. Add sample projects
    sample_projects = [
        {
            "id": str(uuid4()),
            "projectName": "Website Redesign",
            "customerId": sample_customers[0]["id"],
            "customerName": sample_customers[0]["companyName"],
            "status": "in-progress",
            "startDate": "2025-01-01",
            "endDate": "2025-03-31",
            "budget": 50000,
            "currency": "TRY",
            "description": "Complete website redesign and modernization",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid4()),
            "projectName": "Mobile App Development",
            "customerId": sample_customers[1]["id"],
            "customerName": sample_customers[1]["companyName"],
            "status": "planning",
            "startDate": "2025-02-01",
            "endDate": "2025-06-30",
            "budget": 120000,
            "currency": "TRY",
            "description": "iOS and Android mobile application",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    if tenant_db.projects.count_documents({}) == 0:
        tenant_db.projects.insert_many(sample_projects)
        print(f"✅ Created {len(sample_projects)} sample projects")
    else:
        print(f"⚠️  Projects already exist, skipping...")
    
    print("\n" + "=" * 80)
    print("DEMO TENANT SETUP COMPLETE")
    print("=" * 80)
    
    # Summary
    print("\n📊 Summary:")
    print(f"  Tenant: Demo Company (demo_company)")
    print(f"  Database: {db_name}")
    print(f"  Test User: admin@democompany.com")
    print(f"  Password: {test_password}")
    print(f"  Customers: {tenant_db.customers.count_documents({})}")
    print(f"  Projects: {tenant_db.projects.count_documents({})}")
    
    print("\n🔐 Test Credentials:")
    print(f"  Email: admin@democompany.com")
    print(f"  Password: {test_password}")
    print(f"  Login URL: /login")
    print(f"  Tenant Slug: demo-company (frontend) / demo_company (backend)")
    
    client.close()


if __name__ == "__main__":
    main()
