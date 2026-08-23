import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Fetch MongoDB URI from environment variables or use a default local connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/neuroassist")

# Parse DB name from the connection string if present
db_name = "neuroassist"
try:
    if "://" in MONGODB_URI:
        parts = MONGODB_URI.split("://")[1].split("/")
        if len(parts) > 1 and parts[1]:
            db_name = parts[1].split("?")[0]
except Exception as e:
    logger.warning(f"Could not parse DB name from MONGODB_URI: {e}. Defaulting to '{db_name}'.")

client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = client[db_name]

# Expose collection handles
users_col = db["users"]
patients_col = db["patients"]
scans_col = db["scans"]
reports_col = db["reports"]
review_queue_col = db["reviewQueue"]
notifications_col = db["notifications"]
audit_logs_col = db["auditLogs"]
settings_col = db["settings"]

async def init_db():
    """Create unique indexes and compound query indexes in MongoDB Atlas."""
    try:
        # Fast connection check
        await client.admin.command('ping')
        
        # Unique constraints
        await users_col.create_index("email", unique=True)
        await patients_col.create_index("patient_code", unique=True)
        await scans_col.create_index("scan_id_string", unique=True)
        await review_queue_col.create_index("scan_id_string", unique=True)
        
        # Performance indexes for lookups
        await patients_col.create_index("doctor_id")
        await patients_col.create_index("user_id")
        await scans_col.create_index("patient_id")
        await audit_logs_col.create_index("timestamp")
        
        logger.info("MongoDB collections and indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"MongoDB not connected yet ({e}). Running with fallback memory state. Add MONGODB_URI to Space secrets to enable persistence.")

async def get_db():
    """Dependency provider yielding the MongoDB database instance."""
    yield db

async def generate_unique_patient_code() -> str:
    """Generate a collision-free unique patient code (NA-YYYY-NNNN)."""
    from datetime import datetime
    year = datetime.utcnow().year
    prefix = f"NA-{year}-"
    
    cursor = patients_col.find({"patient_code": {"$regex": f"^{prefix}"}}, {"patient_code": 1})
    existing = await cursor.to_list(length=10000)
    max_num = 0
    for doc in existing:
        p_code = doc.get("patient_code", "")
        parts = p_code.split("-")
        if len(parts) == 3 and parts[2].isdigit():
            num = int(parts[2])
            if num > max_num:
                max_num = num
                
    num = max_num + 1
    while True:
        candidate = f"{prefix}{str(num).zfill(4)}"
        if not await patients_col.find_one({"patient_code": candidate}):
            return candidate
        num += 1

