/**
 * QuantMind Simulation Engine
 * Implements Monte Carlo methods using Geometric Brownian Motion (GBM)
 * and historical bootstrap for risk analysis.
 */

export interface SimulationResult {
  paths: number[][];
  median: number[];
  upper95: number[];
  lower95: number[];
  upper99: number[];
  lower99: number[];
  metrics: {
    expectedValue: number;
    var95: number;
    cvar99: number;
    sharpeRatio: number;
    volatility: number;
  };
}

/**
 * Generates paths using Geometric Brownian Motion
 * dS = mu * S * dt + sigma * S * dW
 */
export function generateGBMPaths(
  initialValue: number,
  annualDrift: number,
  annualVol: number,
  days: number,
  iterations: number
): SimulationResult {
  const dt = 1 / 252; // Daily time step
  const dailyDrift = (annualDrift - 0.5 * Math.pow(annualVol, 2)) * dt;
  const dailyVol = annualVol * Math.sqrt(dt);
  
  const allPaths: number[][] = [];
  
  for (let i = 0; i < iterations; i++) {
    const path = [initialValue];
    let current = initialValue;
    
    for (let t = 1; t < days; t++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      current = current * Math.exp(dailyDrift + dailyVol * z);
      path.push(current);
    }
    allPaths.push(path);
  }

  // Calculate Aggregates
  const median: number[] = [];
  const upper95: number[] = [];
  const lower95: number[] = [];
  const upper99: number[] = [];
  const lower99: number[] = [];

  for (let t = 0; t < days; t++) {
    const valuesAtT = allPaths.map(p => p[t]).sort((a, b) => a - b);
    median.push(valuesAtT[Math.floor(iterations * 0.5)]);
    lower95.push(valuesAtT[Math.floor(iterations * 0.05)]);
    upper95.push(valuesAtT[Math.floor(iterations * 0.95)]);
    lower99.push(valuesAtT[Math.floor(iterations * 0.01)]);
    upper99.push(valuesAtT[Math.floor(iterations * 0.99)]);
  }

  // Calculate Metrics from Terminal Values
  const terminalValues = allPaths.map(p => p[days - 1]).sort((a, b) => a - b);
  const expectedValue = terminalValues.reduce((a, b) => a + b, 0) / iterations;
  
  // VaR (Value at Risk) 95%
  const var95 = initialValue - terminalValues[Math.floor(iterations * 0.05)];
  
  // CVaR (Conditional Value at Risk / Expected Shortfall) 99%
  const tail99 = terminalValues.slice(0, Math.floor(iterations * 0.01));
  const cvar99 = initialValue - (tail99.reduce((a, b) => a + b, 0) / (tail99.length || 1));

  // Risk-Free Rate mocked at 4%
  const rfr = 0.04;
  const returns = terminalValues.map(v => (v - initialValue) / initialValue);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / iterations;
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (iterations - 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = (meanReturn - (rfr * (days / 252))) / (stdDev || 1);

  return {
    paths: allPaths.slice(0, 10), // Return a small subset for visual previews
    median,
    upper95,
    lower95,
    upper99,
    lower99,
    metrics: {
      expectedValue,
      var95,
      cvar99,
      sharpeRatio,
      volatility: stdDev * Math.sqrt(252 / days)
    }
  };
}
