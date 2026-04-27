/**
 * Market Data Service — Unified interface for financial data from multiple providers.
 * Alpha Vantage, Twelve Data, and Finnhub.
 */

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY || '';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || '';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  date: string;
  value: number;
}

export interface CompanyOverview {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  beta: number;
  high52w: number;
  low52w: number;
  revenueGrowth: number;
  profitMargin: number;
  debtToEquity: number;
}

// ---- Alpha Vantage ----

export async function getQuoteAlphaVantage(symbol: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    const q = data['Global Quote'];
    if (!q) return null;
    return {
      symbol: q['01. symbol'],
      price: parseFloat(q['05. price']),
      change: parseFloat(q['09. change']),
      changePercent: parseFloat(q['10. change percent']?.replace('%', '')),
      volume: parseInt(q['06. volume']),
      high: parseFloat(q['03. high']),
      low: parseFloat(q['04. low']),
      open: parseFloat(q['02. open']),
      previousClose: parseFloat(q['08. previous close']),
      timestamp: q['07. latest trading day'],
    };
  } catch {
    return null;
  }
}

export async function getHistoricalData(
  symbol: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  outputSize: 'compact' | 'full' = 'compact'
): Promise<HistoricalDataPoint[]> {
  try {
    const funcMap = { daily: 'TIME_SERIES_DAILY', weekly: 'TIME_SERIES_WEEKLY', monthly: 'TIME_SERIES_MONTHLY' };
    const keyMap = { daily: 'Time Series (Daily)', weekly: 'Weekly Time Series', monthly: 'Monthly Time Series' };
    
    const res = await fetch(
      `https://www.alphavantage.co/query?function=${funcMap[interval]}&symbol=${symbol}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_KEY}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    const ts = data[keyMap[interval]];
    if (!ts) return [];
    
    return Object.entries(ts).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    })).slice(0, 252); // 1 year of trading days
  } catch {
    return [];
  }
}

export async function getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const d = await res.json();
    if (!d.Symbol) return null;
    return {
      symbol: d.Symbol,
      name: d.Name,
      sector: d.Sector,
      industry: d.Industry,
      marketCap: parseFloat(d.MarketCapitalization) || 0,
      peRatio: parseFloat(d.PERatio) || 0,
      eps: parseFloat(d.EPS) || 0,
      dividendYield: parseFloat(d.DividendYield) || 0,
      beta: parseFloat(d.Beta) || 0,
      high52w: parseFloat(d['52WeekHigh']) || 0,
      low52w: parseFloat(d['52WeekLow']) || 0,
      revenueGrowth: parseFloat(d.QuarterlyRevenueGrowthYOY) || 0,
      profitMargin: parseFloat(d.ProfitMargin) || 0,
      debtToEquity: parseFloat(d.DebtToEquityRatio) || 0,
    };
  } catch {
    return null;
  }
}

// ---- Technical Indicators via Twelve Data ----

export async function getTechnicalIndicator(
  symbol: string,
  indicator: 'rsi' | 'macd' | 'sma' | 'ema' | 'bbands' | 'atr',
  interval: string = '1day',
  timePeriod: number = 14
): Promise<any> {
  try {
    const res = await fetch(
      `https://api.twelvedata.com/${indicator}?symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&apikey=${TWELVE_DATA_KEY}`,
      { next: { revalidate: 300 } }
    );
    return await res.json();
  } catch {
    return null;
  }
}

// ---- Finnhub for Company News & Earnings ----

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<any[]> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 300 } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

export async function getEarnings(symbol: string): Promise<any> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 3600 } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

export async function getEarningsCalendar(from: string, to: string): Promise<any> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 3600 } }
    );
    return await res.json();
  } catch {
    return null;
  }
}

// ---- Risk Calculation Utilities ----

export function calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sorted.length);
  return sorted[index] || 0;
}

export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.04): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length);
  return std === 0 ? 0 : (mean - riskFreeRate / 252) / std * Math.sqrt(252);
}

export function calculateMaxDrawdown(prices: number[]): number {
  let maxDD = 0;
  let peak = prices[0];
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calculateBeta(stockReturns: number[], benchmarkReturns: number[]): number {
  const n = Math.min(stockReturns.length, benchmarkReturns.length);
  const meanStock = stockReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanBench = benchmarkReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let cov = 0, varBench = 0;
  for (let i = 0; i < n; i++) {
    const ds = stockReturns[i] - meanStock;
    const db = benchmarkReturns[i] - meanBench;
    cov += ds * db;
    varBench += db * db;
  }
  return varBench === 0 ? 1 : cov / varBench;
}

export function calculateATR(data: { high: number; low: number; close: number }[], period: number = 14): number {
  if (data.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    trs.push(tr);
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

// Generate mock data for demo/preview
export function generateMockHistoricalData(days: number = 252, basePrice: number = 150): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  let price = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const change = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    price = Math.max(price + change, 1);
    const high = Math.max(open, price) * (1 + Math.random() * 0.015);
    const low = Math.min(open, price) * (1 - Math.random() * 0.015);
    data.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume: Math.floor(Math.random() * 50000000) + 5000000,
    });
  }
  return data;
}
