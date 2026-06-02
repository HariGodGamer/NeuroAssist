import asyncio
import datetime
import json
import logging
from bson import ObjectId
from database import (
    users_col,
    patients_col,
    scans_col,
    review_queue_col,
    audit_logs_col,
    settings_col,
    init_db
)
from auth import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_mongo_db():
    logger.info("Initializing MongoDB Database for NeuroAssist V3...")
    
    # 1. Initialize MongoDB Indexes
    await init_db()
    
    # 2. Clear existing collections to ensure a clean state
    logger.info("Clearing existing database collections...")
    await users_col.delete_many({})
    await patients_col.delete_many({})
    await scans_col.delete_many({})
    await review_queue_col.delete_many({})
    await audit_logs_col.delete_many({})
    await settings_col.delete_many({})

    # 3. Create Demo Users
    logger.info("Seeding users...")
    
    # Doctors
    doc1_password = get_password_hash("Demo@2024")
    doc1_dict = {
        "email": "doctor@neuroassist.ai",
        "hashed_password": doc1_password,
        "full_name": "Dr. Sarah Smith",
        "role": "doctor",
        "created_at": datetime.datetime.utcnow()
    }
    doc1_res = await users_col.insert_one(doc1_dict)
    doc1_id = str(doc1_res.inserted_id)
    logger.info(f"Created Doctor: {doc1_dict['email']} ({doc1_id})")

    doc2_password = get_password_hash("doctor123")
    doc2_dict = {
        "email": "dr.smith@neuroassist.com",
        "hashed_password": doc2_password,
        "full_name": "Dr. Anita Verma",
        "role": "doctor",
        "created_at": datetime.datetime.utcnow()
    }
    doc2_res = await users_col.insert_one(doc2_dict)
    doc2_id = str(doc2_res.inserted_id)
    logger.info(f"Created Doctor: {doc2_dict['email']} ({doc2_id})")

    # Admin
    admin_password = get_password_hash("neuroadmin@2026")
    admin_dict = {
        "email": "admin@neuroassist.ai",
        "hashed_password": admin_password,
        "full_name": "System Administrator",
        "role": "admin",
        "created_at": datetime.datetime.utcnow()
    }
    admin_res = await users_col.insert_one(admin_dict)
    admin_id = str(admin_res.inserted_id)
    logger.info(f"Created Admin: {admin_dict['email']} ({admin_id})")

    # 4. Seed Settings
    logger.info("Seeding default system settings...")
    await settings_col.insert_one({
        "active_model": "resnet10-v3",
        "auto_archive": False,
        "notifications_enabled": True,
        "updated_at": datetime.datetime.utcnow()
    })

    print(f"\n{'='*60}")
    print("Database seeding completed successfully.")
    print("Demo Credentials:")
    print("  Doctor:  doctor@neuroassist.ai  /  Demo@2024")
    print("  Alt:     dr.smith@neuroassist.com /  doctor123")
    print("  Admin:   admin@neuroassist.ai   /  neuroadmin@2026")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(seed_mongo_db())
