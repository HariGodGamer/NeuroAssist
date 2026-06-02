from datetime import datetime
from database import audit_logs_col
import logging

logger = logging.getLogger(__name__)

async def log_audit(user_id: str, email: str, action: str, details: str):
    """Insert audit trail record into MongoDB collection for HIPAA/regulatory compliance."""
    try:
        await audit_logs_col.insert_one({
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "user_email": email,
            "action": action,
            "details": details
        })
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
