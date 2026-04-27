import { NextRequest, NextResponse } from 'next/server';
import {
  getHistoricalData,
  getQuoteAlphaVantage,
  calculateVaR,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateBeta,
  generateMockHistoricalData,
} from '@/lib/market-data';

/**
 * POST /api/risk-assessment
 * Calculates risk metrics for a given portfolio or asset.
 * Pro-only endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, weights, scenario } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'symbols array is required' }, { status: 400 });
    }

    // Fetch historical data for each symbol
    const allData = await Promise.all(
      symbols.map(async (sym: string) => {
        const data = await getHistoricalData(sym, 'daily', 'compact');
        return { symbol: sym, data: data.length > 0 ? data : generateMockHistoricalData(252, 100 + Math.random() * 200) };
      })
    );

    // Calculate returns for each asset
    const assetReturns = allData.map(({ symbol, data }) => {
      const prices = data.map((d) => d.close);
      const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
      return { symbol, returns, prices, latestPrice: prices[prices.length - 1] };
    });

    // Portfolio-level metrics
    const effectiveWeights = weights && weights.length === symbols.length
      ? weights
      : symbols.map(() => 1 / symbols.length);

    // Weighted portfolio returns
    const minLen = Math.min(...assetReturns.map((a) => a.returns.length));
    const portfolioReturns: number[] = [];
    for (let i = 0; i < minLen; i++) {
      let pr = 0;
      for (let j = 0; j < assetReturns.length; j++) {
        pr += assetReturns[j].returns[i] * effectiveWeights[j];
      }
      portfolioReturns.push(pr);
    }

    // Risk metrics
    const var95 = calculateVaR(portfolioReturns, 0.95);
    const var99 = calculateVaR(portfolioReturns, 0.99);
    const sharpe = calculateSharpeRatio(portfolioReturns);
    const portfolioPrices = allData[0].data.map((_, i) => {
      let val = 0;
      for (let j = 0; j < allData.length; j++) {
        val += (allData[j].data[i]?.close || 0) * effectiveWeights[j];
      }
      return val;
    });
    const maxDrawdown = calculateMaxDrawdown(portfolioPrices);

    // Per-asset risk
    const benchmarkReturns = assetReturns[0]?.returns || [];
    const perAssetRisk = assetReturns.map(({ symbol, returns, prices }) => {
      const assetVar = calculateVaR(returns, 0.95);
      const assetSharpe = calculateSharpeRatio(returns);
      const assetDD = calculateMaxDrawdown(prices);
      const beta = calculateBeta(returns, benchmarkReturns);
      
      // Risk categorization
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (Math.abs(assetVar) > 0.05) riskLevel = 'CRITICAL';
      else if (Math.abs(assetVar) > 0.03) riskLevel = 'HIGH';
      else if (Math.abs(assetVar) > 0.015) riskLevel = 'MEDIUM';

      return { symbol, var95: assetVar, sharpeRatio: assetSharpe, maxDrawdown: assetDD, beta, riskLevel };
    });

    // What-if scenario
    let scenarioResult = null;
    if (scenario) {
      const { symbol: scenarioSymbol, changePercent } = scenario;
      const idx = symbols.indexOf(scenarioSymbol);
      if (idx >= 0) {
        const impact = (changePercent / 100) * effectiveWeights[idx];
        scenarioResult = {
          symbol: scenarioSymbol,
          changePercent,
          portfolioImpact: impact,
          newVar95: var95 * (1 + Math.abs(impact)),
          description: `If ${scenarioSymbol} moves ${changePercent}%, portfolio impact: ${(impact * 100).toFixed(2)}%`,
        };
      }
    }

    // Overall risk level
    let portfolioRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (Math.abs(var95) > 0.04) portfolioRiskLevel = 'CRITICAL';
    else if (Math.abs(var95) > 0.025) portfolioRiskLevel = 'HIGH';
    else if (Math.abs(var95) > 0.012) portfolioRiskLevel = 'MEDIUM';

    return NextResponse.json({
      portfolio: {
        var95,
        var99,
        sharpeRatio: sharpe,
        maxDrawdown,
        riskLevel: portfolioRiskLevel,
        riskScore: Math.min(Math.round(Math.abs(var95) * 1000), 100),
        totalAssets: symbols.length,
      },
      perAssetRisk,
      scenarioResult,
      historicalReturns: portfolioReturns.slice(-60),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
