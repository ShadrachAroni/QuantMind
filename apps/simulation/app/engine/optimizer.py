import numpy as np
from typing import List, Dict, Any
from app.models.simulation import Asset, OptimizationParams

def optimize_portfolio(assets: List[Asset], params: OptimizationParams) -> Dict[str, Any]:
    """
    Performs portfolio optimization based on the requested method.
    Currently supports Mean-Variance Optimization (MVO).
    """
    n = len(assets)
    if n < 2:
        return {
            "method": params.method,
            "suggested_weights": {a.ticker: a.weight for a in assets},
            "expected_return": sum(a.weight * (a.expected_return or 0.07) for a in assets),
            "expected_volatility": sum(a.weight * (a.volatility or 0.15) for a in assets),
            "sharpe_improvement": 0.0
        }

    # Extract returns and volatilities
    returns = np.array([a.expected_return or 0.07 for a in assets])
    vols = np.array([a.volatility or 0.15 for a in assets])
    
    # Assume a simple correlation matrix (identity for now, or could be expanded)
    # real implementation would use historical correlations
    corr = np.eye(n)
    cov = np.outer(vols, vols) * corr
    
    if params.method == 'mean_variance':
        # Simple MVO: Maximize (w'r - 0.5 * gamma * w'Cov w)
        # weight = (1/gamma) * inv(Cov) * r
        # We'll use a simpler approach: Equal Risk Contribution or a fixed risk aversion for this demo
        gamma = 2.0 / (params.risk_tolerance or 0.5) # Risk aversion
        
        try:
            inv_cov = np.linalg.inv(cov + np.eye(n) * 1e-6) # Regularization
            weights = (1/gamma) * inv_cov @ returns
            
            # Normalize and apply constraints
            weights = np.clip(weights, params.min_weight or 0.0, params.max_weight or 1.0)
            weights = weights / np.sum(weights)
        except np.linalg.LinAlgError:
            weights = np.array([1.0/n] * n)
            
    elif params.method == 'risk_parity':
        # Simple inverse volatility weighting as a proxy for risk parity
        inv_vols = 1.0 / vols
        weights = inv_vols / np.sum(inv_vols)
    else:
        # Default to current weights
        weights = np.array([a.weight for a in assets])

    suggested_weights = {assets[i].ticker: float(weights[i]) for i in range(n)}
    
    # Calculate metrics for the suggested portfolio
    port_return = float(np.dot(weights, returns))
    port_vol = float(np.sqrt(weights.T @ cov @ weights))
    
    # Current portfolio metrics for comparison
    current_weights = np.array([a.weight for a in assets])
    current_return = float(np.dot(current_weights, returns))
    current_vol = float(np.sqrt(current_weights.T @ cov @ current_weights))
    
    current_sharpe = current_return / (current_vol + 1e-9)
    suggested_sharpe = port_return / (port_vol + 1e-9)
    
    return {
        "method": params.method,
        "suggested_weights": suggested_weights,
        "expected_return": port_return,
        "expected_volatility": port_vol,
        "sharpe_improvement": float(max(0, suggested_sharpe - current_sharpe))
    }
