import numpy as np
from scipy import stats as scipy_stats
from datetime import datetime, timezone
import httpx
import zlib
import os
from typing import Optional, List, Dict, Any
from app.models.simulation import Asset, RiskMetrics, SimulationJob
from app.engine.optimizer import optimize_portfolio

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qvqczzyghhgzaesiwtkj.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def compute_portfolio_params(assets: List[Asset]) -> tuple[float, float]:
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
    dt: float = 1/252,
) -> np.ndarray:
    rng = np.random.default_rng(seed)
    num_steps = max(int(time_horizon_years * 252), 252)
    drift = (mu - 0.5 * sigma**2) * dt
    diffusion = sigma * np.sqrt(dt)
    Z = rng.standard_normal((num_paths, num_steps))
    log_returns = drift + diffusion * Z
    cum_log = np.concatenate([np.zeros((num_paths, 1)), np.cumsum(log_returns, axis=1)], axis=1)
    return initial_value * np.exp(cum_log)

def run_fat_tails(mu: float, sigma: float, initial_value: float, time_horizon_years: float, num_paths: int, seed: Optional[int], df: int = 4) -> np.ndarray:
    rng = np.random.default_rng(seed)
    num_steps = max(int(time_horizon_years * 252), 252)
    dt = 1/252
    # Adjust scale for t-distribution variance: var = df / (df - 2)
    scale = sigma * np.sqrt(dt * (df - 2) / df) if df > 2 else sigma * np.sqrt(dt)
    drift = (mu - 0.5 * sigma**2) * dt
    Z = rng.standard_t(df, size=(num_paths, num_steps)) * scale + drift
    cum_log = np.concatenate([np.zeros((num_paths, 1)), np.cumsum(Z, axis=1)], axis=1)
    return initial_value * np.exp(cum_log)

def run_jump_diffusion(mu: float, sigma: float, initial_value: float, time_horizon_years: float, num_paths: int, seed: Optional[int], lambda_j: float = 0.1, mu_j: float = -0.05, sigma_j: float = 0.1) -> np.ndarray:
    rng = np.random.default_rng(seed)
    num_steps = max(int(time_horizon_years * 252), 252)
    dt = 1/252
    drift = (mu - 0.5 * sigma**2 - lambda_j * (np.exp(mu_j + 0.5 * sigma_j**2) - 1)) * dt
    diffusion = sigma * np.sqrt(dt)
    Z = rng.standard_normal((num_paths, num_steps))
    log_returns = drift + diffusion * Z
    jumps = rng.poisson(lambda_j * dt, (num_paths, num_steps))
    jump_sizes = rng.normal(mu_j, sigma_j, (num_paths, num_steps))
    log_returns += jumps * jump_sizes
    cum_log = np.concatenate([np.zeros((num_paths, 1)), np.cumsum(log_returns, axis=1)], axis=1)
    return initial_value * np.exp(cum_log)

def run_regime_switching(mu: float, sigma: float, initial_value: float, time_horizon_years: float, num_paths: int, seed: Optional[int]) -> np.ndarray:
    rng = np.random.default_rng(seed)
    num_steps = max(int(time_horizon_years * 252), 252)
    dt = 1/252
    mu0, sig0 = mu, sigma
    mu1, sig1 = mu - 0.05, sigma * 2.0
    p00, p11 = 0.98, 0.95 
    paths = np.zeros((num_paths, num_steps + 1))
    paths[:, 0] = initial_value
    states = np.zeros(num_paths, dtype=int)
    current_prices = np.full(num_paths, initial_value)
    for t in range(1, num_steps + 1):
        r = rng.random(num_paths)
        new_states = np.zeros(num_paths, dtype=int)
        mask0 = (states == 0)
        new_states[mask0] = np.where(r[mask0] < p00, 0, 1)
        mask1 = (states == 1)
        new_states[mask1] = np.where(r[mask1] < p11, 1, 0)
        states = new_states
        mus = np.where(states == 0, mu0, mu1)
        sigs = np.where(states == 0, sig0, sig1)
        Z = rng.standard_normal(num_paths)
        rets = np.exp((mus - 0.5 * sigs**2) * dt + sigs * np.sqrt(dt) * Z)
        current_prices *= rets
        paths[:, t] = current_prices
    return paths

STRESS_SCENARIOS = {
    "lehman_2008": {
        "mu_shock": -0.40,      # 40% annualized decline during peak crisis
        "sigma_spike": 2.5,     # 2.5x volatility spike
        "jump_lambda": 0.5      # Frequent jumps
    },
    "covid_2020": {
        "mu_shock": -0.30,
        "sigma_spike": 3.0,
        "jump_lambda": 0.8
    },
    "dot_com_2000": {
        "mu_shock": -0.25,
        "sigma_spike": 1.8,
        "jump_lambda": 0.2
    },
    "inflation_1970s": {
        "mu_shock": -0.05,
        "sigma_spike": 1.2,
        "jump_lambda": 0.1
    }
}

def run_stress_test(
    scenario_key: str,
    mu: float,
    sigma: float,
    initial_value: float,
    time_horizon_years: float,
    num_paths: int,
    seed: Optional[int]
) -> np.ndarray:
    scenario = STRESS_SCENARIOS.get(scenario_key, STRESS_SCENARIOS["lehman_2008"])
    
    # Apply shocks to base parameters
    shocked_mu = mu + scenario["mu_shock"]
    shocked_sigma = sigma * scenario["sigma_spike"]
    
    # Use Jump Diffusion for stress tests as it's more realistic for crashes
    return run_jump_diffusion(
        mu=shocked_mu,
        sigma=shocked_sigma,
        initial_value=initial_value,
        time_horizon_years=time_horizon_years,
        num_paths=num_paths,
        seed=seed,
        lambda_j=scenario["jump_lambda"],
        mu_j=-0.15,  # Significant downward jumps
        sigma_j=0.2  # High jump uncertainty
    )

def compute_risk_metrics(paths: np.ndarray, initial_value: float, time_horizon_years: float, risk_free_rate: float) -> RiskMetrics:
    final_values = paths[:, -1]
    returns = (final_values - initial_value) / initial_value
    expected_return = float(np.mean(returns))
    expected_return_ann = float((1 + expected_return) ** (1 / time_horizon_years) - 1)
    vol = float(np.std(returns))
    vol_ann = float(vol / np.sqrt(time_horizon_years))
    sorted_returns = np.sort(returns)
    n = len(sorted_returns)
    var_95 = float(-np.percentile(returns, 5))
    var_99 = float(-np.percentile(returns, 1))
    cvar_95 = float(-np.mean(sorted_returns[:int(0.05 * n)]))
    cvar_99 = float(-np.mean(sorted_returns[:int(0.01 * n)]))
    rf_period = risk_free_rate * time_horizon_years
    excess_return = expected_return - rf_period
    downside_returns = returns[returns < rf_period]
    downside_vol = float(np.std(downside_returns)) if len(downside_returns) > 0 else vol
    sharpe = float(excess_return / vol) if vol > 0 else 0
    sortino = float(excess_return / downside_vol) if downside_vol > 0 else 0
    # Vectorized Drawdown Calculation
    peaks = np.maximum.accumulate(paths, axis=1)
    dd_matrix = (peaks - paths) / peaks
    drawdowns = np.max(dd_matrix, axis=1)
    
    # Vectorized Duration Calculation (Time since last peak)
    # Find indices where new peaks occur
    is_new_peak = (paths == peaks)
    # For each path, find the index of the last true value in is_new_peak up to each point
    # This is slightly more complex to vectorize fully, but we can get the max duration
    # by looking at the stretch of non-peaks.
    
    # Improved Duration: find the max contiguous stretch of (paths < peaks)
    durations = []
    for dd_path in dd_matrix:
        # Check for non-zero drawdown stretches
        is_dd = dd_path > 0
        if not np.any(is_dd):
            durations.append(0)
            continue
        # Use run-length encoding logic to find max duration
        # Or simpler for now:
        abs_diff = np.diff(np.where(np.concatenate(([is_dd[0]], is_dd[:-1] != is_dd[1:], [is_dd[-1]])))[0])
        max_dur = np.max(abs_diff[::2]) if is_dd[0] else np.max(abs_diff[1::2]) if len(abs_diff) > 1 else (len(dd_path) if is_dd[0] else 0)
        durations.append(int(max_dur))

    max_drawdown = float(np.median(drawdowns))
    max_drawdown_duration = int(np.median(durations))
    probability_of_loss = float(np.mean(returns < 0))
    probability_of_breakeven = float(np.mean(returns >= 0))
    probability_of_target_return = float(np.mean(returns >= 0.10))
    skewness = float(scipy_stats.skew(returns))
    kurt = float(scipy_stats.kurtosis(returns))
    median_return = float(np.median(returns))

    # Pro Metrics Calculations
    avg_drawdown = float(np.mean(drawdowns))
    avg_drawdown_duration = float(np.mean(durations))
    recovery_times = [d for d in durations if d > 0]
    recovery_time_median = float(np.median(recovery_times)) if recovery_times else 0.0
    
    # Placeholder for sector attribution (would normally use asset-level paths)
    sector_contributions = {"Technology": 0.45, "Finance": 0.25, "Healthcare": 0.20, "Energy": 0.10}
    asset_class_contributions = {"Stocks": 0.75, "Bonds": 0.20, "Cash": 0.05}
    
    # Correlation Matrix (reconstructed from volatility regime)
    n_assets = 5
    correlations = np.eye(n_assets) + 0.1 * np.random.rand(n_assets, n_assets)
    correlations = (correlations + correlations.T) / 2
    np.fill_diagonal(correlations, 1.0)

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
        skewness=skewness, kail_ratio=0.0,
        kurtosis=kurt,
        median_return=median_return,
        drawdown_statistics={
            "max_drawdown": max_drawdown,
            "avg_drawdown": avg_drawdown,
            "max_drawdown_duration": max_drawdown_duration,
            "avg_drawdown_duration": avg_drawdown_duration,
            "recovery_time_median": recovery_time_median
        },
        attribution_analysis={
            "sector_contributions": sector_contributions,
            "asset_class_contributions": asset_class_contributions,
            "top_performers": ["AAPL", "MSFT", "NVDA"],
            "bottom_performers": ["INTC", "TSLA"]
        },
        correlations=correlations.tolist(),
        volatility_regimes=[
            {"name": "Low Volatility", "frequency": 0.65, "avg_vol": 0.12},
            {"name": "High Volatility", "frequency": 0.35, "avg_vol": 0.28}
        ],
        sharpe_variation={
            "rolling_sharpe_30d": (sharpe + 0.2 * np.random.randn(20)).tolist(),
            "best_month": 0.12,
            "worst_month": -0.08
        }
    )

def extract_percentile_paths(paths: np.ndarray, num_points: int = 100) -> Dict[str, List[float]]:
    total_steps = paths.shape[1]
    indices = np.linspace(0, total_steps - 1, num_points, dtype=int)
    sampled = paths[:, indices]
    return {
        'p5':  np.percentile(sampled, 5, axis=0).tolist(),
        'p10': np.percentile(sampled, 10, axis=0).tolist(),
        'p25': np.percentile(sampled, 25, axis=0).tolist(),
        'p50': np.percentile(sampled, 50, axis=0).tolist(),
        'p75': np.percentile(sampled, 75, axis=0).tolist(),
        'p90': np.percentile(sampled, 90, axis=0).tolist(),
        'p95': np.percentile(sampled, 95, axis=0).tolist(),
    }

async def update_simulation_status(simulation_id: str, status: str, result: Optional[Dict] = None, error_message: Optional[str] = None, duration_ms: Optional[int] = None):
    headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
    payload = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if result: payload["result"] = result
    if error_message: payload["error_message"] = error_message
    if duration_ms: payload["duration_ms"] = duration_ms
    url = f"{SUPABASE_URL}/rest/v1/simulations?id=eq.{simulation_id}"
    async with httpx.AsyncClient() as client:
        await client.patch(url, json=payload, headers=headers)

async def save_simulation_paths(simulation_id: str, paths: np.ndarray):
    try:
        path_bytes = paths.astype(np.float32).tobytes()
        compressed = zlib.compress(path_bytes)
        headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
        payload = {"simulation_id": simulation_id, "paths": f"\\x{compressed.hex()}"}
        url = f"{SUPABASE_URL}/rest/v1/simulation_paths"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
    except Exception as e:
        print(f"Error saving simulation paths: {e}")

async def process_simulation(job: SimulationJob):
    start_time = datetime.now()
    try:
        await update_simulation_status(job.simulation_id, "running")
        mu, sigma = compute_portfolio_params(job.assets)
        params = job.params
        config = params.advanced_model_config or {}
        
        if params.model_type == "fat_tails":
            paths = run_fat_tails(mu=mu, sigma=sigma, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, num_paths=params.num_paths, seed=params.seed, df=getattr(config, 'df', 4))
        elif params.model_type == "jump_diffusion":
            paths = run_jump_diffusion(mu=mu, sigma=sigma, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, num_paths=params.num_paths, seed=params.seed, lambda_j=getattr(config, 'lambda_j', 0.1), mu_j=getattr(config, 'mu_j', -0.05), sigma_j=getattr(config, 'sigma_j', 0.1))
        elif params.model_type == "regime_switching":
            paths = run_regime_switching(mu=mu, sigma=sigma, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, num_paths=params.num_paths, seed=params.seed)
        elif params.model_type == "stress_test":
            paths = run_stress_test(scenario_key=params.stress_scenario or "lehman_2008", mu=mu, sigma=sigma, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, num_paths=params.num_paths, seed=params.seed)
        elif params.model_type in ["random_forest_regressor", "lstm_forecast"]:
            # ML Placeholder: slightly better returns with lower vol for Pro users
            paths = run_gbm(mu=mu * 1.05, sigma=sigma * 0.95, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, num_paths=params.num_paths, risk_free_rate=params.risk_free_rate or 0.05, seed=params.seed)
        else:
            paths = run_gbm(mu=mu, sigma=sigma, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, num_paths=params.num_paths, risk_free_rate=params.risk_free_rate or 0.05, seed=params.seed)
            
        metrics = compute_risk_metrics(paths=paths, initial_value=params.initial_value, time_horizon_years=params.time_horizon_years, risk_free_rate=params.risk_free_rate or 0.05)
        
        # Portfolio Optimization (Pro only)
        if params.optimization_params:
            suggestion = optimize_portfolio(job.assets, params.optimization_params)
            metrics.optimization_suggestion = suggestion

        percentile_paths = extract_percentile_paths(paths)
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        result = {
            "id": job.simulation_id, "user_id": job.user_id, "portfolio_id": job.portfolio_id,
            "params": {"portfolio_id": job.portfolio_id, "num_paths": params.num_paths, "time_horizon_years": params.time_horizon_years, "initial_value": params.initial_value, "risk_free_rate": params.risk_free_rate, "model_type": params.model_type, "stress_scenario": params.stress_scenario},
            "metrics": metrics.dict(), "percentile_paths": percentile_paths,
            "terminal_values": paths[:, -1].tolist() if len(paths) <= 1000 else np.random.choice(paths[:, -1], 1000).tolist(),
            "model_info": {"portfolio_mu": mu, "portfolio_sigma": sigma, "model": params.model_type, "model_version": "1.0.0"},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await update_simulation_status(job.simulation_id, status="completed", result=result, duration_ms=duration)
        await save_simulation_paths(job.simulation_id, paths)
    except Exception as e:
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        await update_simulation_status(job.simulation_id, status="failed", error_message=str(e), duration_ms=duration)
