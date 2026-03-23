import numpy as np
import time
import sys
import os

# Add the app directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.engine.monte_carlo import compute_risk_metrics

def compute_risk_metrics_legacy(returns, initial_value=1.0):
    num_paths, num_days = returns.shape
    ending_values = initial_value * np.exp(np.sum(np.log(1 + returns), axis=1))
    path_returns = (ending_values / initial_value) - 1
    
    expected_return = np.mean(path_returns)
    volatility = np.std(path_returns)
    
    sorted_returns = np.sort(path_returns)
    var_95 = sorted_returns[int(num_paths * 0.05)]
    cvar_95 = np.mean(sorted_returns[:int(num_paths * 0.05)])
    
    max_drawdowns = []
    for i in range(num_paths):
        path = initial_value * np.cumprod(1 + returns[i])
        peak = path[0]
        max_dd = 0
        for val in path:
            if val > peak: peak = val
            dd = (peak - val) / peak
            if dd > max_dd: max_dd = dd
        max_drawdowns.append(max_dd)
    
    max_drawdown = np.mean(max_drawdowns)
    return {"max_drawdown": max_drawdown}

def run_benchmark(num_paths=1000, num_days=252):
    print(f"\n--- BENCHMARK: {num_paths} PATHS ---")
    # Simulation paths starting at 1.0
    returns = np.random.normal(0.0005, 0.01, (num_paths, num_days))
    paths = 1.0 * np.cumprod(1 + returns, axis=1)
    
    start = time.time()
    legacy = compute_risk_metrics_legacy(returns)
    legacy_time = time.time() - start
    print(f"Legacy (Loops): {legacy_time:.4f}s")
    
    start = time.time()
    vectorized = compute_risk_metrics(paths, initial_value=1.0, time_horizon_years=1.0, risk_free_rate=0.045)
    vectorized_time = time.time() - start
    print(f"Vectorized (NumPy): {vectorized_time:.4f}s")
    
    speedup = legacy_time / (vectorized_time + 1e-9)
    print(f"Speedup: {speedup:.1f}x")
    # Compare with vectorized.max_drawdown (Pydantic attribute)
    print(f"Accuracy (Max DD Delta): {abs(legacy['max_drawdown'] - vectorized.max_drawdown):.2e}")

if __name__ == "__main__":
    run_benchmark(1000)
    run_benchmark(5000)
    run_benchmark(10000)
