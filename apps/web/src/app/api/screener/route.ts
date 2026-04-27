import { NextRequest, NextResponse } from 'next/server';
import { getCompanyOverview, getHistoricalData, generateMockHistoricalData } from '@/lib/market-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preset, symbols } = body;

    const presets: Record<string, any> = {
      high_growth: { minRevenueGrowth: 0.15, maxPE: 50 },
      value_picks: { maxPE: 15, minDividendYield: 0.02 },
      momentum: { minRSI: 50, maxRSI: 70, trendUp: true },
      dividend_kings: { minDividendYield: 0.03 },
      oversold: { maxRSI: 30 },
    };

    const filters = preset ? presets[preset] : body.filters || {};
    const universe = (symbols || ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM','JNJ','V','PG','HD','MA','XOM','LLY','COST','ABBV','MRK','PEP','KO']).slice(0, 20);

    const results = await Promise.all(universe.map(async (symbol: string) => {
      try {
        const [overview, history] = await Promise.all([
          getCompanyOverview(symbol),
          getHistoricalData(symbol, 'daily', 'compact'),
        ]);
        const data = history.length > 0 ? history : generateMockHistoricalData(100, 100 + Math.random() * 300);
        const prices = data.map(d => d.close);
        const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
        const latest = prices[prices.length - 1];

        // RSI
        const gains: number[] = [], losses: number[] = [];
        for (let j = 1; j < Math.min(15, prices.length); j++) {
          const ch = prices[prices.length - j] - prices[prices.length - j - 1];
          ch > 0 ? (gains.push(ch), losses.push(0)) : (gains.push(0), losses.push(Math.abs(ch)));
        }
        const rsi = 100 - 100 / (1 + (gains.reduce((a, b) => a + b, 0) / gains.length || 0.001) / (losses.reduce((a, b) => a + b, 0) / losses.length || 0.001));

        const ov = overview || { symbol, name: symbol, sector: 'N/A', peRatio: 0, eps: 0, dividendYield: 0, beta: 1, profitMargin: 0, revenueGrowth: 0, debtToEquity: 0, marketCap: 0, industry: 'N/A', high52w: latest * 1.2, low52w: latest * 0.8 };
        const weekChange = ((latest - prices[Math.max(0, prices.length - 6)]) / prices[Math.max(0, prices.length - 6)]) * 100;

        const signals = [];
        if (rsi < 30) signals.push('oversold (RSI<30)');
        else if (rsi > 70) signals.push('overbought (RSI>70)');
        if (latest > sma50) signals.push('above 50-day SMA');
        if (ov.peRatio > 0 && ov.peRatio < 15) signals.push('value P/E');
        if (ov.dividendYield > 0.03) signals.push(`${(ov.dividendYield * 100).toFixed(1)}% yield`);

        return {
          symbol, name: ov.name, sector: ov.sector, price: latest, change: weekChange,
          marketCap: ov.marketCap, pe: ov.peRatio, eps: ov.eps, dividendYield: ov.dividendYield,
          beta: ov.beta, rsi, sma50, volume: data.slice(-20).reduce((a, d) => a + d.volume, 0) / 20,
          profitMargin: ov.profitMargin, debtToEquity: ov.debtToEquity,
          sparkline: prices.slice(-30), trendUp: latest > sma50,
          aiSummary: `${ov.name} shows ${signals.slice(0, 3).join(', ') || 'neutral signals'}.`,
          matchScore: Math.min(50 + (ov.profitMargin > 0.1 ? 15 : 0) + (rsi >= 40 && rsi <= 60 ? 10 : 0) + (ov.revenueGrowth > 0.1 ? 10 : 0), 100),
        };
      } catch { return null; }
    }));

    let filtered = results.filter(Boolean);
    if (filters.maxPE) filtered = filtered.filter((r: any) => r.pe > 0 && r.pe <= filters.maxPE);
    if (filters.minRSI) filtered = filtered.filter((r: any) => r.rsi >= filters.minRSI);
    if (filters.maxRSI) filtered = filtered.filter((r: any) => r.rsi <= filters.maxRSI);
    if (filters.trendUp) filtered = filtered.filter((r: any) => r.trendUp);
    filtered.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({ results: filtered, totalScreened: universe.length, totalMatched: filtered.length, preset: preset || 'custom', timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
