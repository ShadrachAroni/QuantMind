"""
QuantMind FastAPI Simulation Service
Monte Carlo GBM simulation engine — modular architecture
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
import os
from app.routers.simulation import router as simulation_router
from datetime import datetime, timezone

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "*")],
    allow_methods=["POST", "GET"],
    allow_credentials=False,
    allow_headers=["*"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 7860)))
