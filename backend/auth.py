import os
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import users_col
import models
import hashlib

# Security configurations loaded from environment
JWT_SECRET = os.getenv("JWT_SECRET", "neuroassist-access-super-secret-key-default-v3")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "neuroassist-refresh-super-secret-key-default-v3")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour access
REFRESH_TOKEN_EXPIRE_DAYS = 7    # 7 days refresh

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify if plain text password matches hashed SHA-256 value."""
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    """Compute deterministic SHA-256 hash of password for security."""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a JWT access token valid for API requests."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a longer-lived JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Resolve user from JWT access token, throwing unauthorized if invalid."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_doc = await users_col.find_one({"email": email})
    if user_doc is None:
        raise credentials_exception
        
    return models.serialize_doc(user_doc)

def require_role(roles: List[str]):
    """Guard dependency to enforce role-based access controls (RBAC)."""
    async def dependency(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires role in {roles} (User role: {current_user.get('role')})"
            )
        return current_user
    return dependency
