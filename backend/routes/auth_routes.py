from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt

import models
from database import users_col, patients_col, generate_unique_patient_code
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
    JWT_REFRESH_SECRET,
    ALGORITHM
)
from utils.audit import log_audit
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/register", status_code=201)
async def register_user(user: models.UserCreate):
    # ── Security: Admin accounts cannot be self-registered via API ──
    if user.role.value == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created through this endpoint. Contact your system administrator."
        )
    
    # Check if user already exists
    existing = await users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)

    user_dict = {
        "email": user.email,
        "hashed_password": hashed_password,
        "full_name": user.full_name,
        "role": user.role.value,
        "created_at": datetime.utcnow()
    }
    
    result = await users_col.insert_one(user_dict)
    new_user_id = str(result.inserted_id)

    # Automatically link pre-existing doctor-created patient profile, or create a new one
    if user.role.value == "patient":
        existing_patient = await patients_col.find_one({
            "$or": [
                {"contact": user.email},
                {"full_name": user.full_name}
            ]
        })
        if existing_patient:
            await patients_col.update_one(
                {"_id": existing_patient["_id"]},
                {"$set": {"user_id": new_user_id}}
            )
        else:
            # Create a brand new patient profile
            code = await generate_unique_patient_code()
            await patients_col.insert_one({
                "patient_code": code,
                "doctor_id": None,
                "user_id": new_user_id,
                "full_name": user.full_name,
                "date_of_birth": "1990-01-01",
                "gender": "Unknown",
                "contact": user.email,
                "medical_history": "Auto-enrolled patient account.",
                "doctor_notes": "",
                "created_at": datetime.utcnow()
            })
    
    # Audit log
    await log_audit(
        user_id=new_user_id,
        email=user.email,
        action="USER_REGISTRATION",
        details=f"Registered user with role: {user.role.value}"
    )
    
    return {
        "id": new_user_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "created_at": user_dict["created_at"]
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_doc = await users_col.find_one({"email": form_data.username})
    if not user_doc or not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = str(user_doc["_id"])
    email = user_doc["email"]
    role = user_doc["role"]
    full_name = user_doc["full_name"]

    # Retroactive account linking for patients on login
    if role == "patient":
        existing_patient = await patients_col.find_one({"user_id": user_id})
        if not existing_patient:
            matched = await patients_col.find_one({
                "$or": [
                    {"contact": email},
                    {"full_name": full_name}
                ]
            })
            if matched:
                await patients_col.update_one(
                    {"_id": matched["_id"]},
                    {"$set": {"user_id": user_id}}
                )
            else:
                code = await generate_unique_patient_code()
                await patients_col.insert_one({
                    "patient_code": code,
                    "doctor_id": None,
                    "user_id": user_id,
                    "full_name": full_name,
                    "date_of_birth": "1990-01-01",
                    "gender": "Unknown",
                    "contact": email,
                    "medical_history": "Auto-enrolled patient account.",
                    "doctor_notes": "",
                    "created_at": datetime.utcnow()
                })
    
    token_data = {"sub": email, "role": role}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    # Audit log
    await log_audit(
        user_id=user_id,
        email=email,
        action="USER_LOGIN",
        details=f"Logged in successfully. Role: {role}"
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role
        }
    }

@router.post("/refresh")
async def refresh_tokens(request: RefreshTokenRequest):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(request.refresh_token, JWT_REFRESH_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user_doc = await users_col.find_one({"email": email})
    if user_doc is None:
        raise credentials_exception
        
    user_id = str(user_doc["_id"])
    token_data = {"sub": email, "role": role}
    new_access_token = create_access_token(data=token_data)
    
    # Audit log
    await log_audit(
        user_id=user_id,
        email=email,
        action="TOKEN_REFRESH",
        details="Refreshed JWT access token."
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }
