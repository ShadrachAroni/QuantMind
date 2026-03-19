import { Portfolio, SimulationResult } from '@quantmind/shared-types';

export interface AIContext {
  portfolio?: Portfolio;
  simulationResult?: SimulationResult;
  history?: Array<{role: string, content: string}>;
}

export function buildContextString(context: AIContext): string {
  let ctxStr = "Here is the relevant context for the user's request:\n\n";

  if (context.portfolio) {
    ctxStr += `<portfolio id="${context.portfolio.id}" name="${context.portfolio.name}">\n`;
    ctxStr += `Total Value: $${context.portfolio.total_value}\n`;
    ctxStr += `Assets Definition: ${JSON.stringify(context.portfolio.assets, null, 2)}\n`;
    ctxStr += `</portfolio>\n\n`;
  }

  if (context.simulationResult) {
    ctxStr += `<simulation_result job_id="${context.simulationResult.id}">\n`;
    ctxStr += `Status: ${context.simulationResult.status}\n`;
    ctxStr += `Expected Return: ${context.simulationResult.metrics.expected_return}\n`;
    ctxStr += `VaR (95%): ${context.simulationResult.metrics.var_95}\n`;
    ctxStr += `CVaR (95%): ${context.simulationResult.metrics.cvar_95}\n`;
    ctxStr += `Sharpe Ratio: ${context.simulationResult.metrics.sharpe_ratio}\n`;
    ctxStr += `Max Drawdown: ${context.simulationResult.metrics.max_drawdown}\n`;
    ctxStr += `</simulation_result>\n\n`;
  }

  return ctxStr;
}
