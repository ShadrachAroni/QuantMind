import asyncio
from fastapi import APIRouter, HTTPException, Header, Depends, BackgroundTasks
from app.models.simulation import SimulationJob
from app.models.mirofish import MiroFishJob
from app.engine.monte_carlo import process_simulation, executor
from app.core.simulation import run_market_evolution
import os

router = APIRouter()

from dotenv import dotenv_values
from app.core.security import secure_endpoint

env_config = dotenv_values(".env")

SIMULATION_SECRET = env_config.get("SIMULATION_SECRET_KEY", "")
SUPABASE_URL = env_config.get("SUPABASE_URL", "https://qvqczzyghhgzaesiwtkj.supabase.co")
SUPABASE_SERVICE_KEY = env_config.get("SUPABASE_SERVICE_ROLE_KEY", "")

@router.post("/simulate")
async def run_simulation(
    job: SimulationJob,
    token_payload: dict = Depends(secure_endpoint),
):
    """Accept a simulation job and process it in a separate process pool."""
    loop = asyncio.get_event_loop()
    # Offload the entire CPU-bound process_simulation to the process pool
    # This prevents the GIL from blocking the FastAPI event loop
    loop.run_in_executor(executor, lambda: asyncio.run(process_simulation(job)))
    return {"accepted": True, "simulation_id": job.simulation_id}

@router.post("/simulate/mirofish")
async def run_mirofish(
    job: MiroFishJob,
    token_payload: dict = Depends(secure_endpoint),
):
    """Execute a MiroFish swarm simulation and persist result to Supabase Storage."""
    from datetime import datetime, timezone
    from supabase import create_client, Client
    import json
    
    results = await run_market_evolution(job.seed_context, job.steps)
    
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # 1. Upload results to Storage
    storage_path = f"{job.user_id}/{job.simulation_id}_mirofish.json"
    try:
        # Convert results to JSON string
        result_json = json.dumps({
            "interactions_log": results,
            "metadata": {
                "seed_context": job.seed_context,
                "steps": job.steps,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        })
        
        # Upload to bucket
        supabase.storage.from_("mirofish-snapshots").upload(
            path=storage_path,
            file=result_json.encode('utf-8'),
            file_options={"content-type": "application/json"}
        )
    except Exception as e:
        print(f"Failed to upload MiroFish result to storage: {e}")
        # Fallback is to proceed but storage_path will be logged as failed or handled later
    
    # 2. Persist to database for dashboard sync
    try:
        payload = {
            "id": job.simulation_id,
            "user_id": job.user_id,
            "portfolio_snapshot": {},  # Assuming empty for now or extract from context
            "news_seed": job.seed_context,
            "storage_path": storage_path,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Use supabase client instead of raw httpx for better error handling/types
        supabase.table("simulation_runs").insert(payload).execute()
        
    except Exception as e:
        print(f"Failed to persist MiroFish record to DB: {e}")

    return {
        "simulation_id": job.simulation_id,
        "storage_path": storage_path,
        "interactions_log": results,
        "status": "completed"
    }

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "quantmind-simulation",
        "version": "1.0.0",
    }
