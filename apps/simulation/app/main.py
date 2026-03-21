"""
QuantMind FastAPI Simulation Service
Monte Carlo GBM simulation engine — modular architecture
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routers.simulation import router as simulation_router
from datetime import datetime, timezone

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
