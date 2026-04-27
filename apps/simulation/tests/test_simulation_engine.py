import numpy as np
import pytest
import sys
import os

# Add the app directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.engine.monte_carlo import (
    compute_portfolio_params,
    run_gbm,
    compute_risk_metrics,
    run_fat_tails,
    run_jump_diffusion
)
from app.models.simulation import Asset

def test_compute_portfolio_params():
    assets = [
        Asset(ticker="AAPL", name="Apple", weight=0.6, expected_return=0.1, volatility=0.2),
        Asset(ticker="MSFT", name="Microsoft", weight=0.4, expected_return=0.05, volatility=0.15)
    ]
    mu, sigma = compute_portfolio_params(assets, corr_matrix=np.eye(len(assets)))
    
    # mu = 0.6*0.1 + 0.4*0.05 = 0.06 + 0.02 = 0.08
    assert mu == pytest.approx(0.08)
    # sigma_sq = (0.6*0.2)^2 + (0.4*0.15)^2 = 0.12^2 + 0.06^2 = 0.0144 + 0.0036 = 0.018
    # sigma = sqrt(0.018) approx 0.13416
    assert sigma == pytest.approx(np.sqrt(0.018))

def test_run_gbm_shape():
    mu, sigma = 0.05, 0.2
    initial_value = 100.0
    time_horizon_years = 1.0
    num_paths = 100
    
    paths = run_gbm(
        mu=mu,
        sigma=sigma,
        initial_value=initial_value,
        time_horizon_years=time_horizon_years,
        num_paths=num_paths,
        risk_free_rate=0.05,
        seed=42
    )
    
    # num_steps = max(int(1.0 * 252), 252) + 1 (initial point)
    assert paths.shape == (100, 253)
    assert paths[0, 0] == initial_value

def test_compute_risk_metrics():
    # Create simple mock paths
    # Path 0: simple upward trend
    # Path 1: simple downward trend
    paths = np.array([
        [100, 110, 120],
        [100, 90, 80]
    ])
    initial_value = 100.0
    time_horizon_years = 1.0
    risk_free_rate = 0.05
    
    metrics = compute_risk_metrics(paths, initial_value, time_horizon_years, risk_free_rate)
    
    # Path 0 return: 0.2
    # Path 1 return: -0.2
    # Expected return: (0.2 + -0.2) / 2 = 0.0
    assert metrics.expected_return == pytest.approx(0.0)
    
    # Probability of loss (returns < 0)
    # 1 path out of 2 = 0.5
    assert metrics.probability_of_loss == 0.5

def test_run_fat_tails_shape():
    paths = run_fat_tails(
        mu=0.05, sigma=0.2, initial_value=100.0,
        time_horizon_years=1.0, num_paths=10, seed=42
    )
    assert paths.shape == (10, 253)

def test_run_jump_diffusion_shape():
    paths = run_jump_diffusion(
        mu=0.05, sigma=0.2, initial_value=100.0,
        time_horizon_years=1.0, num_paths=10, seed=42
    )
    assert paths.shape == (10, 253)
