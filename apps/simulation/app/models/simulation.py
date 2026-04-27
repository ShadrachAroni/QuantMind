from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any

class Asset(BaseModel):
    ticker: str
    name: str
    weight: float          # 0.0 – 1.0
    expected_return: Optional[float] = 0.07
    volatility: Optional[float] = 0.15
    asset_class: Optional[str] = "stocks"
    sector: Optional[str] = "Technology"

class AdvancedModelConfig(BaseModel):
    df: Optional[int] = 4
    lambda_j: Optional[float] = 0.1
    mu_j: Optional[float] = -0.05
    sigma_j: Optional[float] = 0.1
    lookback_periods: Optional[int] = 252
    training_iterations: Optional[int] = 100
    learning_rate: Optional[float] = 0.01

class OptimizationParams(BaseModel):
    method: str
    target_return: Optional[float] = None
    risk_tolerance: Optional[float] = 0.5
    max_weight: Optional[float] = 1.0
    min_weight: Optional[float] = 0.0

class BacktestConfig(BaseModel):
    start_date: str
    end_date: str
    multi_timeframe: str = "daily"
    use_realtime_streaming: bool = False

class SimParams(BaseModel):
    num_paths: int
    time_horizon_years: float
    initial_value: float
    risk_free_rate: Optional[float] = 0.05
    model_type: Optional[str] = "gbm"
    stress_scenario: Optional[str] = None
    seed: Optional[int] = None
    advanced_model_config: Optional[AdvancedModelConfig] = None
    optimization_params: Optional[OptimizationParams] = None
    backtest_config: Optional[BacktestConfig] = None

class SimulationJob(BaseModel):
    simulation_id: str
    user_id: str
    portfolio_id: str
    assets: List[Asset]
    correlation_matrix: Optional[List[List[float]]] = None
    sentiment_shock: Optional[float] = 0.0
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
    kail_ratio: Optional[float] = 0.0
    
    # Pro Metrics
    drawdown_statistics: Optional[Dict[str, Any]] = None
    attribution_analysis: Optional[Dict[str, Any]] = None
    correlations: Optional[List[List[float]]] = None
    volatility_regimes: Optional[List[Dict[str, Any]]] = None
    sharpe_variation: Optional[Dict[str, Any]] = None
    optimization_suggestion: Optional[Dict[str, Any]] = None
    sentiment_rebalance_suggestion: Optional[List[Dict[str, Any]]] = None
