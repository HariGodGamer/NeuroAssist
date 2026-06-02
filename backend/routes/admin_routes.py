"""Admin routes for user management, learning queue, and system analytics."""
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import List
import os

import models
from database import users_col, patients_col, scans_col, review_queue_col, audit_logs_col, settings_col
from auth import get_current_user, require_role
from utils.audit import log_audit

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
async def list_all_users(current_user: dict = Depends(require_role(["admin"]))):
    cursor = users_col.find({}, {"hashed_password": 0})
    users = await cursor.to_list(length=500)
    return [models.serialize_doc(u) for u in users]


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_role(["admin"]))):
    try:
        result = await users_col.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await log_audit(current_user["id"], current_user["email"], "ADMIN_DELETE_USER", f"Deleted user {user_id}")
    return {"message": "User deleted"}


@router.get("/review-queue")
async def get_review_queue(current_user: dict = Depends(require_role(["admin"]))):
    cursor = review_queue_col.find({})
    items = await cursor.to_list(length=200)
    result = []
    for item in items:
        doc = models.serialize_doc(item)
        # Enrich with scan prediction detail
        scan = await scans_col.find_one({"scan_id_string": item.get("scan_id_string")})
        if scan:
            doc["ai_confidence"] = {
                "cn": scan.get("conf_cn"),
                "mci": scan.get("conf_mci"),
                "ad": scan.get("conf_ad"),
            }
        # Enrich with patient name
        patient_id = item.get("patient_id", "")
        try:
            patient = await patients_col.find_one({"_id": ObjectId(patient_id)})
            doc["patient_name"] = patient.get("full_name") if patient else "Unknown"
        except Exception:
            doc["patient_name"] = "Unknown"
        result.append(doc)
    return result


@router.put("/review-queue/{scan_id}/approve")
async def approve_for_training(scan_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = await review_queue_col.update_one(
        {"scan_id_string": scan_id},
        {"$set": {
            "review_status": "approved_for_training",
            "approved_for_training": True,
            "approved_by": current_user["id"],
            "approved_at": datetime.utcnow(),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in review queue")
    await log_audit(
        current_user["id"], current_user["email"],
        "ADMIN_APPROVE_TRAINING_SAMPLE",
        f"Approved scan {scan_id} for retraining dataset"
    )
    return {"message": "Learning Queue Updated", "scan_id": scan_id, "status": "approved_for_training"}


@router.put("/review-queue/{scan_id}/reject")
async def reject_from_training(scan_id: str, current_user: dict = Depends(require_role(["admin"]))):
    result = await review_queue_col.update_one(
        {"scan_id_string": scan_id},
        {"$set": {"review_status": "rejected", "approved_for_training": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in review queue")
    await log_audit(current_user["id"], current_user["email"], "ADMIN_REJECT_TRAINING_SAMPLE", f"Rejected scan {scan_id}")
    return {"message": "Scan rejected from learning queue", "scan_id": scan_id}


@router.get("/analytics")
async def get_system_analytics(current_user: dict = Depends(require_role(["admin"]))):
    total_users = await users_col.count_documents({})
    total_doctors = await users_col.count_documents({"role": "doctor"})
    total_patients = await users_col.count_documents({"role": "patient"})
    total_scans = await scans_col.count_documents({})
    pending_scans = await scans_col.count_documents({"status": "pending"})
    flagged_scans = await scans_col.count_documents({"status": "flagged"})
    analyzed_scans = await scans_col.count_documents({"status": "analyzed"})
    accepted_scans = await scans_col.count_documents({"status": "accepted"})
    queue_pending = await review_queue_col.count_documents({"review_status": "pending_admin"})
    queue_approved = await review_queue_col.count_documents({"approved_for_training": True})

    return {
        "users": {"total": total_users, "doctors": total_doctors, "patients": total_patients},
        "scans": {
            "total": total_scans, "pending": pending_scans,
            "analyzed": analyzed_scans, "flagged": flagged_scans, "accepted": accepted_scans
        },
        "review_queue": {"pending": queue_pending, "approved": queue_approved},
        "server_time": datetime.utcnow().isoformat(),
        "models_loaded": ["medicalnet_resnet10_multiclass"],
        "inference_engine": "pytorch_resnet10_simpleitk_preprocessing",
        "status": "healthy"
    }


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    current_user: dict = Depends(require_role(["admin"]))
):
    cursor = audit_logs_col.find({}).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    serialized = []
    for l in logs:
        doc = models.serialize_doc(l)
        if doc:
            doc["email"] = doc.get("user_email") or doc.get("email") or "Unknown"
        serialized.append(doc)
    return serialized
