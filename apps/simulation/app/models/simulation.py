from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any

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
