import { MarketDepth, MarketTick } from '@quantmind/shared-types';

/**
 * Institutional Market Data Service
 * Orchestrates real-time and historical data fetching from public institutional feeds.
 * Optimized for rate-limit protection and high-performance React consumption.
 */

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class MarketDataService {
  private lastFetchTime: Record<string, number> = {};
  private fetchInterval = 5000; // 5 second cool-down for REST calls

  /**
   * Fetches 24-hour ticker statistics for a given symbol.
   */
  async get24hTicker(symbol: string = 'BTCUSDT') {
    const now = Date.now();
    if (this.lastFetchTime[`ticker_${symbol}`] && now - this.lastFetchTime[`ticker_${symbol}`] < this.fetchInterval) {
      return null; // Return null to indicate use of cached/loading state if too frequent
    }

    try {
      const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) throw new Error(`Binance API error: ${response.statusText}`);
      
      const data = await response.json();
      this.lastFetchTime[`ticker_${symbol}`] = now;

      return {
        symbol: data.symbol,
        lastPrice: parseFloat(data.lastPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
      };
    } catch (error) {
      console.error('[MarketDataService] Failed to fetch ticker:', error);
      throw error;
    }
  }

  /**
   * Fetches candlestick data (Klines) for high-fidelity charting.
   */
  async getKlines(symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 100): Promise<KlineData[]> {
    try {
      const response = await fetch(
        `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      if (!response.ok) throw new Error(`Binance API error: ${response.statusText}`);
      
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
      console.error('[MarketDataService] Failed to fetch klines:', error);
      throw error;
    }
  }

  /**
   * Fetches basic order book depth.
   */
  async getOrderBook(symbol: string = 'BTCUSDT', limit: number = 20): Promise<MarketDepth> {
    try {
      const response = await fetch(`${BINANCE_BASE_URL}/depth?symbol=${symbol}&limit=${limit}`);
      if (!response.ok) throw new Error(`Binance API error: ${response.statusText}`);
      
      const data = await response.json();
      
      return {
        bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
        last_price: 0, // Will be filled by ticker sync
        change_24h: 0,
      };
    } catch (error) {
      console.error('[MarketDataService] Failed to fetch order book:', error);
      throw error;
    }
  }
}

export const marketDataService = new MarketDataService();
