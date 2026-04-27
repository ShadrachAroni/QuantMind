import { Portfolio } from '@quantmind/shared-types';
import market_agents from './personas/market_agents.json';

export interface AgentConfig {
  name: string;
  persona: string;
  initial_balance: number;
}

export class AgentSeeder {
  constructor(private portfolio: Portfolio) {}

  /**
   * Generates a distribution of agents based on the portfolio assets.
   * If a portfolio has high tech concentration, it seeds more tech-focused traders.
   */
  public generateSwarm(count: number = 100): AgentConfig[] {
    const agents: AgentConfig[] = [];
    const personas = Object.keys(market_agents);
    
    for (let i = 0; i < count; i++) {
      const randomPersona = personas[Math.floor(Math.random() * personas.length)];
      agents.push({
        name: `Agent_${i}`,
        persona: randomPersona,
        initial_balance: this.calculateInitialBalance(randomPersona)
      });
    }
    
    return agents;
  }

  private calculateInitialBalance(persona: string): number {
    // Basic logic to differentiate starting capital by archetype
    const base = (this.portfolio.total_value ?? 100000) / 100;
    if (persona === 'institutional_mm' || persona === 'pension_fund') return base * 10;
    if (persona === 'retail_trader' || persona === 'crypto_degen') return base * 0.5;
    return base;
  }
}
