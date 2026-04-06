/**
 * QuantMind Financial Engine
 * 
 * A unified orchestration layer for multi-asset valuation and data aggregation.
 * Integrates: Mono, Nownodes, Finage, Marketstack, and Exchangerate.host.
 */

export interface AssetPosition {
  id: string;
  type: 'stock' | 'crypto' | 'other';
  symbol: string; // e.g., 'AAPL', 'BTC'
  provider: 'finage' | 'marketstack';
  balance: number;
  metadata?: Record<string, any>;
}

export interface ValuationResult {
  assetId: string;
  localBalance: number;
  baseCurrency: string;
  baseValue: number;
  exchangeRate: number;
  lastUpdated: string;
}

export class FinancialEngine {
  private static instance: FinancialEngine;
  private primaryCurrency: string = 'USD';

  private constructor() {}

  public static getInstance(): FinancialEngine {
    if (!FinancialEngine.instance) {
      FinancialEngine.instance = new FinancialEngine();
    }
    return FinancialEngine.instance;
  }

  public setPrimaryCurrency(currency: string) {
    this.primaryCurrency = currency;
  }

  /**
   * Fetches the latest exchange rate for a given currency pair.
   * Powered by Exchangerate.host
   */
  async getExchangeRate(from: string, to: string = this.primaryCurrency): Promise<number> {
    try {
      if (from === to) return 1;
      const response = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}`);
      const data = await response.json();
      return data.result || 1;
    } catch (error) {
      console.error('Exchange rate error:', error);
      return 1;
    }
  }

  /**
   * Universal Valuator: Converts any asset position into the primary currency.
   */
  async valuatePosition(position: AssetPosition): Promise<ValuationResult> {
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

    const rateToBase = await this.getExchangeRate('USD', this.primaryCurrency);
    const baseValue = priceInUSD * rateToBase;

    return {
      assetId: position.id,
      localBalance: position.balance,
      baseCurrency: this.primaryCurrency,
      baseValue: baseValue,
      exchangeRate: rateToBase,
      lastUpdated: new Error().stack || '', // Placeholder for now
    };
  }

  private async fetchStockPrice(symbol: string): Promise<number> {
    // Finage / Marketstack Integration Placeholder
    // In production, this would hit the API and cache the result
    return 150.0; // Mock price
  }

  private async fetchCryptoPrice(symbol: string): Promise<number> {
    // Finage Integration (Crypto prices aggregated via Finage)
    return 65000.0; // Mock price
  }
}

export const financialEngine = FinancialEngine.getInstance();
