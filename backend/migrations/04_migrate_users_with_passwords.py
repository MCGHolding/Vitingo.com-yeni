"""
Migration: Add password hashes to platform users
Adds password_hash field to all users in vitingo_platform.users
Password: Test123! (hashed with bcrypt)
"""
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test password for all users
TEST_PASSWORD = "Test123!"

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def main():
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017")
    platform_db = client["vitingo_platform"]
    
    print("=" * 60)
    print("USER PASSWORD MIGRATION")
    print("=" * 60)
    
    # Users to create/update
    users_config = [
        {
            "id": "usr_quattro_murb_001",
            "tenant_id": "ten_quattro_001",
            "email": "murb@quattrostand.com",
            "name": "Murat Bucak",
            "role": "admin",
            "department": "Süper Admin",
            "status": "active",
            "permissions": ["*"],  # All permissions
        },
        {
            "id": "usr_quattro_tame_002",
            "tenant_id": "ten_quattro_001",
            "email": "tame@quattrostand.com",
            "name": "Tamer Erdim",
            "role": "user",
            "department": "Müşteri Temsilcisi",
            "status": "active",
            "permissions": ["customers.read", "customers.write", "projects.read"],
        },
        {
            "id": "usr_quattro_batc_003",
            "tenant_id": "ten_quattro_001",
            "email": "batc@quattrostand.com",
            "name": "Batuhan Cücük",
            "role": "user",
            "department": "Müşteri Temsilcisi",
            "status": "active",
            "permissions": ["customers.read", "customers.write", "projects.read"],
        },
        {
            "id": "usr_quattro_vatd_004",
            "tenant_id": "ten_quattro_001",
            "email": "vatd@quattrostand.com",
            "name": "Vatan Dalkılıç",
            "role": "user",
            "department": "Müşteri Temsilcisi",
            "status": "active",
            "permissions": ["customers.read", "customers.write", "projects.read"],
        }
    ]
    
    # Generate password hash once (same for all users)
    password_hash = get_password_hash(TEST_PASSWORD)
    print(f"\n✅ Generated password hash for: '{TEST_PASSWORD}'")
    
    # Process each user
    for user_config in users_config:
        user_id = user_config["id"]
        email = user_config["email"]
        
        # Check if user exists
        existing_user = platform_db.users.find_one({"email": email})
        
        if existing_user:
            # Update existing user
            platform_db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        **user_config,
                        "password_hash": password_hash,
                        "updated_at": datetime.utcnow().isoformat(),
                        "is_active": True
                    }
                }
            )
            print(f"✅ Updated user: {email} ({user_config['name']})")
        else:
            # Create new user
            new_user = {
                **user_config,
                "password_hash": password_hash,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "last_login": None,
                "is_active": True,
                "avatar": None
            }
            platform_db.users.insert_one(new_user)
            print(f"✅ Created user: {email} ({user_config['name']})")
    
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETED")
    print("=" * 60)
    
    # Summary
    total_users = platform_db.users.count_documents({})
    active_users = platform_db.users.count_documents({"status": "active"})
    
    print(f"\nTotal users in platform: {total_users}")
    print(f"Active users: {active_users}")
    print(f"\nTest credentials:")
    print(f"  Password: {TEST_PASSWORD}")
    print(f"  Users:")
    for user in users_config:
        print(f"    - {user['email']} ({user['name']}) - Role: {user['role']}")
    
    client.close()


if __name__ == "__main__":
    main()
