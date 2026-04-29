"""
QuantMind FastAPI Simulation Service
Monte Carlo GBM simulation engine — modular architecture
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
import logging
import os
from dotenv import load_dotenv, dotenv_values
from app.routers.simulation import router as simulation_router
from datetime import datetime, timezone

# Load environment variables from .env
load_dotenv()

# ---------------------------------------------------------------------------
# Suppress noisy /health ping access logs
# ---------------------------------------------------------------------------
class _HealthPingFilter(logging.Filter):
    """Drop uvicorn access-log records that are just /health pings."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        msg = record.getMessage()
        return "GET /health" not in msg


logging.getLogger("uvicorn.access").addFilter(_HealthPingFilter())

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="QuantMind Simulation Service",
    description="Monte Carlo portfolio simulation engine",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Strict Endpoint Middleware
# ---------------------------------------------------------------------------
class StrictEndpointMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        allowed_endpoints = [
            "/", "/health", "/robots.txt", "/simulate", "/simulate/mirofish",
            "/docs", "/openapi.json", "/redoc"
        ]
        
        if request.url.path not in allowed_endpoints:
            logging.getLogger("quantmind.security").warning(
                f"Security Event: Blocked access to unauthorized endpoint: {request.url.path} from {request.client.host if request.client else 'unknown'}"
            )
            return JSONResponse(status_code=403, content={"detail": "Endpoint not allowed or unrecognized"})
            
        return await call_next(request)

app.add_middleware(StrictEndpointMiddleware)

# ---------------------------------------------------------------------------
# Robust CORS Policy
# ---------------------------------------------------------------------------

env_config = dotenv_values(".env")

allowed_origins_str = env_config.get("ALLOWED_ORIGINS", "https://quantmind.com")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST", "GET"],
    allow_credentials=True,
    allow_headers=["Authorization", "Content-Type", "X-HMAC-Signature", "Accept"],
)

# Include modules
app.include_router(simulation_router)

# ---------------------------------------------------------------------------
# Periodic health-log cleaner  (every 35 minutes)
# ---------------------------------------------------------------------------
_HEALTH_LOG_CLEAR_INTERVAL = 35 * 60  # seconds


async def _clear_health_ping_logs() -> None:
    """
    Periodically emit a marker to the console so that any external log
    aggregators know where to truncate /health entries.  The uvicorn access
    filter above already prevents new entries from appearing; this task
    acts as an extra safety net and provides a visible heartbeat to operators.
    """
    logger = logging.getLogger("quantmind.health_cleaner")
    while True:
        await asyncio.sleep(_HEALTH_LOG_CLEAR_INTERVAL)
        logger.info(
            "[HealthLogCleaner] /health ping logs cleared at %s",
            datetime.now(timezone.utc).isoformat(),
        )


@app.on_event("startup")
async def _start_health_log_cleaner() -> None:
    asyncio.create_task(_clear_health_ping_logs())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "service": "QuantMind Simulation Service",
        "description": "Monte Carlo portfolio risk simulation engine",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    return "User-agent: *\nDisallow: /\n"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 7860)))
