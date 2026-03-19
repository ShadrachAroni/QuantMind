"""
QuantMind FastAPI Simulation Service
Monte Carlo GBM simulation engine — deployed on Render
"""
from fastapi import FastAPI, HTTPException, Header, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import os
import asyncio
import httpx
from datetime import datetime, timezone
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
import hashlib
import json
import zlib
import base64

app = FastAPI(
    title="QuantMind Simulation Service",
    description="Monte Carlo portfolio simulation engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "https://qvqczzyghhgzaesiwtkj.supabase.co")],
    allow_methods=["POST", "GET"],
    allow_credentials=False,
    allow_headers=["*"],
)

SIMULATION_SECRET = os.getenv("SIMULATION_SECRET_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qvqczzyghhgzaesiwtkj.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class Asset(BaseModel):
    ticker: str
    name: str
    weight: float          # 0.0 – 1.0
    expected_return: Optional[float] = 0.07
    volatility: Optional[float] = 0.15
    asset_class: Optional[str] = "stocks"


class SimParams(BaseModel):
    num_paths: int
    time_horizon_years: float
    initial_value: float
    risk_free_rate: Optional[float] = 0.05
    model_type: Optional[str] = "gbm"
    seed: Optional[int] = None


class SimulationJob(BaseModel):
    simulation_id: str
    user_id: str
    portfolio_id: str
    assets: List[Asset]
    params: SimParams

    @validator("assets")
    def validate_assets(cls, v):
        if not v:
            raise ValueError("At least one asset required")
        total_weight = sum(a.weight for a in v)
        if not (0.99 <= total_weight <= 1.01):
            raise ValueError(f"Asset weights must sum to 1.0, got {total_weight:.4f}")
        return v


class RiskMetrics(BaseModel):
    expected_return: float
    expected_return_annualized: float
    volatility: float
    volatility_annualized: float
    var_95: float
    var_99: float
    cvar_95: float
    cvar_99: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    max_drawdown_duration: int
    probability_of_loss: float
    probability_of_breakeven: float
    probability_of_target_return: float
    skewness: float
    kurtosis: float
    median_return: float


def compute_portfolio_params(assets: List[Asset]) -> tuple[float, float]:
    """Compute portfolio μ and σ from weighted assets (simple variance model)."""
    mu = sum(a.weight * (a.expected_return or 0.07) for a in assets)
    sigma_sq = sum((a.weight * (a.volatility or 0.15)) ** 2 for a in assets)
    sigma = np.sqrt(sigma_sq)
    return mu, sigma


def run_gbm(
    mu: float,
    sigma: float,
    initial_value: float,
    time_horizon_years: float,
    num_paths: int,
    risk_free_rate: float,
    seed: Optional[int],
    dt: float = 1/252,  # daily steps
) -> np.ndarray:
    """
    Geometric Brownian Motion simulation.
    Returns array of shape (num_paths, num_steps + 1)
    where each row is a price path.
    """
    rng = np.random.default_rng(seed)
    num_steps = max(int(time_horizon_years * 252), 252)

    # GBM: S(t+dt) = S(t) * exp((μ - σ²/2)*dt + σ*√dt*Z)
    drift = (mu - 0.5 * sigma**2) * dt
    diffusion = sigma * np.sqrt(dt)

    Z = rng.standard_normal((num_paths, num_steps))
    log_returns = drift + diffusion * Z

    # Cumulative sum of log returns, then exponentiate
    cum_log = np.concatenate(
        [np.zeros((num_paths, 1)), np.cumsum(log_returns, axis=1)],
        axis=1
    )
    paths = initial_value * np.exp(cum_log)
    return paths


def run_fat_tails(
    mu: float,
    sigma: float,
    initial_value: float,
    time_horizon_years: float,
    num_paths: int,
    seed: Optional[int],
    df: int = 4,  # degrees of freedom for t-distribution
) -> np.ndarray:
    """Student-t returns for fat-tail simulation."""
    rng = np.random.default_rng(seed)
    num_steps = max(int(time_horizon_years * 252), 252)
    dt = 1/252

    scale = sigma * np.sqrt(dt * (df - 2) / df)
    drift = (mu - 0.5 * sigma**2) * dt

    Z = rng.standard_t(df, size=(num_paths, num_steps)) * scale + drift
    cum_log = np.concatenate(
        [np.zeros((num_paths, 1)), np.cumsum(Z, axis=1)],
        axis=1
    )
    return initial_value * np.exp(cum_log)


def compute_risk_metrics(
    paths: np.ndarray,
    initial_value: float,
    time_horizon_years: float,
    risk_free_rate: float,
) -> RiskMetrics:
    """Compute all risk metrics from the final values of simulation paths."""
    final_values = paths[:, -1]
    returns = (final_values - initial_value) / initial_value

    # Annualised metrics
    expected_return = float(np.mean(returns))
    expected_return_ann = float((1 + expected_return) ** (1 / time_horizon_years) - 1)
    vol = float(np.std(returns))
    vol_ann = float(vol / np.sqrt(time_horizon_years))

    # VaR and CVaR
    sorted_returns = np.sort(returns)
    n = len(sorted_returns)
    var_95 = float(-np.percentile(returns, 5))
    var_99 = float(-np.percentile(returns, 1))
    cvar_95 = float(-np.mean(sorted_returns[:int(0.05 * n)]))
    cvar_99 = float(-np.mean(sorted_returns[:int(0.01 * n)]))

    # Sharpe and Sortino
    rf_period = risk_free_rate * time_horizon_years
    excess_return = expected_return - rf_period
    downside_returns = returns[returns < rf_period]
    downside_vol = float(np.std(downside_returns)) if len(downside_returns) > 0 else vol
    
    sharpe = float(excess_return / vol) if vol > 0 else 0
    sortino = float(excess_return / downside_vol) if downside_vol > 0 else 0

    # Max drawdown across paths
    drawdowns = np.zeros(len(paths))
    durations = np.zeros(len(paths), dtype=int)
    
    for i, path in enumerate(paths):
        peak = path[0]
        max_dd = 0.0
        duration = 0
        temp_duration = 0
        for j in range(1, len(path)):
            if path[j] > peak:
                peak = path[j]
                temp_duration = 0
            else:
                temp_duration += 1
                dd = (peak - path[j]) / peak
                if dd > max_dd:
                    max_dd = dd
                    duration = temp_duration
        drawdowns[i] = max_dd
        durations[i] = duration

    max_drawdown = float(np.median(drawdowns))  # median across paths
    max_drawdown_duration = int(np.median(durations))

    # Probability metrics
    probability_of_loss = float(np.mean(returns < 0))
    probability_of_breakeven = float(np.mean(returns >= 0))
    probability_of_target_return = float(np.mean(returns >= 0.10))  # 10% target

    # Distribution stats
    from scipy import stats as scipy_stats
    skewness = float(scipy_stats.skew(returns))
    kurt = float(scipy_stats.kurtosis(returns))
    median_return = float(np.median(returns))

    return RiskMetrics(
        expected_return=expected_return,
        expected_return_annualized=expected_return_ann,
        volatility=vol,
        volatility_annualized=vol_ann,
        var_95=var_95,
        var_99=var_99,
        cvar_95=cvar_95,
        cvar_99=cvar_99,
        sharpe_ratio=sharpe,
        sortino_ratio=sortino,
        max_drawdown=max_drawdown,
        max_drawdown_duration=max_drawdown_duration,
        probability_of_loss=probability_of_loss,
        probability_of_breakeven=probability_of_breakeven,
        probability_of_target_return=probability_of_target_return,
        skewness=skewness,
        kurtosis=kurt,
        median_return=median_return,
    )


def extract_percentile_paths(paths: np.ndarray, num_points: int = 100) -> Dict[str, List[float]]:
    """
    Downsample paths and compute percentile envelopes for the fan chart.
    Returns p5, p10, p25, p50, p75, p90, p95 arrays.
    """
    total_steps = paths.shape[1]
    indices = np.linspace(0, total_steps - 1, num_points, dtype=int)
    sampled = paths[:, indices]

    percentiles = {
        'p5':  np.percentile(sampled, 5, axis=0).tolist(),
        'p10': np.percentile(sampled, 10, axis=0).tolist(),
        'p25': np.percentile(sampled, 25, axis=0).tolist(),
        'p50': np.percentile(sampled, 50, axis=0).tolist(),
        'p75': np.percentile(sampled, 75, axis=0).tolist(),
        'p90': np.percentile(sampled, 90, axis=0).tolist(),
        'p95': np.percentile(sampled, 95, axis=0).tolist(),
    }
    return percentiles


async def update_simulation_status(
    simulation_id: str,
    status: str,
    result: Optional[Dict] = None,
    error_message: Optional[str] = None,
    duration_ms: Optional[int] = None,
):
    """Update simulation record in Supabase via REST API."""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    
    payload: Dict[str, Any] = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if result:
        payload["result"] = result
    if error_message:
        payload["error_message"] = error_message
    if duration_ms:
        payload["duration_ms"] = duration_ms

    url = f"{SUPABASE_URL}/rest/v1/simulations?id=eq.{simulation_id}"
    
    async with httpx.AsyncClient() as client:
        await client.patch(url, json=payload, headers=headers)


async def save_simulation_paths(simulation_id: str, paths: np.ndarray):
    """
    Compress and save full simulation paths to the simulation_paths table as BYTEA.
    Standard ASTERIX-inspired optimization: Float32 (precision-sufficient) + Zlib.
    """
    try:
        # Convert to float32 for 50% space saving while preserving visual fidelity
        # 10,000 paths * 252 steps * 4 bytes = ~10MB raw. Zlib will squash this further.
        path_bytes = paths.astype(np.float32).tobytes()
        compressed = zlib.compress(path_bytes)
        
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        
        # Hex format for Postgres bytea via PostgREST
        payload = {
            "simulation_id": simulation_id,
            "paths": f"\\x{compressed.hex()}"
        }
        
        url = f"{SUPABASE_URL}/rest/v1/simulation_paths"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            
    except Exception as e:
        print(f"Error saving simulation paths: {e}")


async def process_simulation(job: SimulationJob):
    """Background task: run the Monte Carlo simulation and update DB."""
    start_time = datetime.now()
    
    try:
        await update_simulation_status(job.simulation_id, "running")
        
        mu, sigma = compute_portfolio_params(job.assets)
        params = job.params
        
        # Choose model
        if params.model_type == "fat_tails":
            paths = run_fat_tails(
                mu=mu, sigma=sigma,
                initial_value=params.initial_value,
                time_horizon_years=params.time_horizon_years,
                num_paths=params.num_paths,
                seed=params.seed,
            )
        else:  # gbm (default) or unsupported
            paths = run_gbm(
                mu=mu, sigma=sigma,
                initial_value=params.initial_value,
                time_horizon_years=params.time_horizon_years,
                num_paths=params.num_paths,
                risk_free_rate=params.risk_free_rate or 0.05,
                seed=params.seed,
            )
        
        metrics = compute_risk_metrics(
            paths=paths,
            initial_value=params.initial_value,
            time_horizon_years=params.time_horizon_years,
            risk_free_rate=params.risk_free_rate or 0.05,
        )
        
        percentile_paths = extract_percentile_paths(paths)
        
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        
        result = {
            "id": job.simulation_id,
            "user_id": job.user_id,
            "portfolio_id": job.portfolio_id,
            "params": {
                "portfolio_id": job.portfolio_id,
                "num_paths": params.num_paths,
                "time_horizon_years": params.time_horizon_years,
                "initial_value": params.initial_value,
                "risk_free_rate": params.risk_free_rate,
                "model_type": params.model_type,
            },
            "metrics": metrics.dict(),
            "percentile_paths": percentile_paths,
            "terminal_values": paths[:, -1].tolist() if len(paths) <= 1000 else np.random.choice(paths[:, -1], 1000).tolist(),
            "model_info": {
                "portfolio_mu": mu,
                "portfolio_sigma": sigma,
                "model": params.model_type,
                "model_version": "1.0.0",
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await update_simulation_status(
            job.simulation_id,
            status="completed",
            result=result,
            duration_ms=duration,
        )
        
        # ASTERIX Phase 1: Save full paths as compressed binary
        await save_simulation_paths(job.simulation_id, paths)
        
    except Exception as e:
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        await update_simulation_status(
            job.simulation_id,
            status="failed",
            error_message=str(e),
            duration_ms=duration,
        )


def verify_secret(x_simulation_secret: str = Header(...)):
    if not SIMULATION_SECRET or x_simulation_secret != SIMULATION_SECRET:
        raise HTTPException(status_code=401, detail="Invalid simulation secret")
    return x_simulation_secret


@app.post("/simulate")
async def run_simulation(
    job: SimulationJob,
    background_tasks: BackgroundTasks,
    _: str = Depends(verify_secret),
):
    """Accept a simulation job and process it asynchronously."""
    background_tasks.add_task(process_simulation, job)
    return {"accepted": True, "simulation_id": job.simulation_id}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "quantmind-simulation",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
async def root():
    return {
        "service": "QuantMind Simulation Service",
        "description": "Monte Carlo portfolio risk simulation engine",
        "version": "1.0.0",
    }
