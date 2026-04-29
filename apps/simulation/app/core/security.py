import os
import hmac
import hashlib
import jwt
import logging
from dotenv import dotenv_values
from fastapi import Request, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.status import HTTP_401_UNAUTHORIZED

logger = logging.getLogger("quantmind.security")

security_scheme = HTTPBearer()

# Load secrets explicitly from the .env file instead of os.environ
env_config = dotenv_values(".env")

SUPABASE_JWT_SECRET = env_config.get("SUPABASE_JWT_SECRET", "your-super-secret-jwt-token-with-at-least-32-characters-long")
HMAC_SECRET_KEY = env_config.get("HMAC_SECRET_KEY", "your-hmac-secret-key")

async def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    """Verify JWT token (e.g., from Supabase) to ensure the user is authenticated."""
    if not SUPABASE_JWT_SECRET:
        logger.error("SUPABASE_JWT_SECRET is not configured.")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Authentication configuration error",
        )
        
    token = credentials.credentials
    try:
        # Supabase uses HS256 for their JWTs by default
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Security Event: Expired JWT token presented.")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Security Event: Invalid JWT token presented. Error: {e}")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def verify_hmac_signature(request: Request):
    """Verify the request integrity using HMAC signature to prevent spoofing."""
    if not HMAC_SECRET_KEY:
        logger.error("HMAC_SECRET_KEY is not configured.")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Signature configuration error",
        )
        
    signature = request.headers.get("X-HMAC-Signature")
    if not signature:
        logger.warning(f"Security Event: Missing X-HMAC-Signature header from {request.client.host if request.client else 'unknown'}.")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Missing signature")
        
    try:
        body = await request.body()
        expected_signature = hmac.new(
            HMAC_SECRET_KEY.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning(f"Security Event: HMAC signature mismatch from {request.client.host if request.client else 'unknown'}.")
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Security Event: Error verifying HMAC signature: {e}")
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Signature verification failed")
        
    return True

async def secure_endpoint(
    request: Request,
    token_payload: dict = Depends(verify_jwt_token),
    hmac_valid: bool = Depends(verify_hmac_signature)
):
    """Combined dependency for full security verification."""
    # The user payload is now extracted from the JWT token
    return token_payload
