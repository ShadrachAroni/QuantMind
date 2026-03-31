// Mobile Market Data Service
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class MobileMarketDataService {
  async get24hTicker(symbol: string = 'BTCUSDT') {
    try {
      const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`);
      const data = await response.json();
      return {
        symbol: data.symbol,
        lastPrice: parseFloat(data.lastPrice),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
      };
    } catch (error) {
      console.error('[MarketData] Fetch failed:', error);
      return null;
    }
  }

  async getKlines(symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 30): Promise<KlineData[]> {
    try {
      const response = await fetch(`${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      const data = await response.json();
      return data.map((d: any[]) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }));
    } catch (error) {
      console.error('[MarketData] Klines failed:', error);
      return [];
    }
  }
}

export const marketDataService = new MobileMarketDataService();
