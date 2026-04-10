import axios from 'axios';
import { storage } from './storage/mmkv';

export interface AssetPosition {
  id: string;
  type: 'stock' | 'crypto' | 'other';
  symbol: string; // e.g., 'AAPL', 'BTC'
  provider: 'finage' | 'marketstack';
  balance: number;
  metadata?: Record<string, any>;
}

export interface ValuationResult {
  totalUSD: number;
  positions: {
    id: string;
    usdValue: number;
    localValue: number;
    quoteCurrency: string;
  }[];
}

/**
 * Mobile Financial Engine
 * Multi-asset price aggregation and currency normalization.
 * Includes resilient storage caching for exchange rates.
 */
class MobileFinancialEngine {
  private static instance: MobileFinancialEngine;
  private exchangeRateCacheKey = '@quantmind:exchange_rates';

  private constructor() {}

  public static getInstance(): MobileFinancialEngine {
    if (!MobileFinancialEngine.instance) {
      MobileFinancialEngine.instance = new MobileFinancialEngine();
    }
    return MobileFinancialEngine.instance;
  }

  /**
   * Main orchestrator for valuing a portfolio.
   */
  async valuePortfolio(positions: AssetPosition[]): Promise<ValuationResult> {
    const valuation: ValuationResult = {
      totalUSD: 0,
      positions: [],
    };

    for (const position of positions) {
      let priceInUSD = 0;

      switch (position.type) {
        case 'stock':
          priceInUSD = await this.fetchStockPrice(position.symbol);
          break;
        case 'crypto':
          priceInUSD = await this.fetchCryptoPrice(position.symbol);
          break;
        default:
          priceInUSD = position.balance;
      }

      const usdValue = position.balance * priceInUSD;
      valuation.totalUSD += usdValue;

      valuation.positions.push({
        id: position.id,
        usdValue,
        localValue: position.balance,
        quoteCurrency: 'USD',
      });
    }

    return valuation;
  }

  private async fetchStockPrice(symbol: string): Promise<number> {
    try {
      const apiKey = process.env.MARKETSTACK_API_KEY;
      const response = await axios.get(`http://api.marketstack.com/v1/eod/latest`, {
        params: { access_key: apiKey, symbols: symbol }
      });
      return response.data.data[0].last || 0;
    } catch (e) {
      console.error(`Marketstack Fetch failed for ${symbol}`, e);
      return 0;
    }
  }

  private async fetchCryptoPrice(symbol: string): Promise<number> {
    try {
      const apiKey = process.env.FINAGE_API_KEY;
      const response = await axios.get(`https://api.finage.co.uk/last/crypto/${symbol}`, {
        params: { apikey: apiKey }
      });
      return response.data.price || 0;
    } catch (e) {
      console.error(`Finage Crypto Fetch failed for ${symbol}`, e);
      return 0;
    }
  }

  /**
   * Currency conversion helper with resilient storage caching.
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${this.exchangeRateCacheKey}:${from}_${to}`;
    
    try {
      // 1. Check local cache
      const cached = await storage.getItemAsync(cacheKey);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        // Cache for 1 hour
        if (Date.now() - timestamp < 3600000) {
          return value;
        }
      }

      // 2. Fetch fresh rate
      const apiKey = process.env.EXCHANGERATE_API_KEY;
      const response = await axios.get(`https://api.exchangerate.host/convert`, {
        params: { access_key: apiKey, from, to }
      });

      const rate = response.data.result || 1;

      // 3. Save to cache
      await storage.set(cacheKey, JSON.stringify({
        value: rate,
        timestamp: Date.now()
      }));

      return rate;
    } catch (e) {
      console.error(`Exchange rate fetch failed for ${from}->${to}`, e);
      return 1;
    }
  }
}

export const financialEngine = MobileFinancialEngine.getInstance();
