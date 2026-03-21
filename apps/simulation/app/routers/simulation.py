from fastapi import APIRouter, HTTPException, Header, Depends, BackgroundTasks
from app.models.simulation import SimulationJob
from app.engine.monte_carlo import process_simulation
import os

router = APIRouter()

SIMULATION_SECRET = os.getenv("SIMULATION_SECRET_KEY", "")

def verify_secret(x_simulation_secret: str = Header(...)):
    if not SIMULATION_SECRET or x_simulation_secret != SIMULATION_SECRET:
        raise HTTPException(status_code=401, detail="Invalid simulation secret")
    return x_simulation_secret

@router.post("/simulate")
async def run_simulation(
    job: SimulationJob,
    background_tasks: BackgroundTasks,
    _: str = Depends(verify_secret),
):
    """Accept a simulation job and process it asynchronously."""
    background_tasks.add_task(process_simulation, job)
    return {"accepted": True, "simulation_id": job.simulation_id}

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "quantmind-simulation",
        "version": "1.0.0",
    }
