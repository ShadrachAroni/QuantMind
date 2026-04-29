import os
import httpx
import json
from typing import List, Dict, Any, Optional
from app.models.simulation import Asset, RiskMetrics

class AIService:
    def __init__(self):
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = "https://integrate.api.nvidia.com/v1"
        
        self.models = {
            "risk_analyst": "nvidia/minimax-text-01", # High precision for risk
            "portfolio_strategist": "meta/llama-3.1-70b-instruct",
            "macro_analyst": "mistralai/mixtral-8x22b-instruct"
        }

    async def get_ensemble_optimization(self, assets: List[Asset], metrics: RiskMetrics) -> Dict[str, Any]:
        """
        Runs a multi-model optimization ensemble to provide sovereign intelligence.
        """
        # 1. Prepare the context
        portfolio_summary = {
            "assets": [f"{a.ticker}: {a.weight*100}%" for a in assets],
            "expected_return": metrics.expected_return_annualized,
            "volatility": metrics.volatility_annualized,
            "max_drawdown": metrics.max_drawdown,
            "sharpe": metrics.sharpe_ratio
        }

        # 2. Risk Analysis (Minimax)
        risk_report = await self._query_nvidia(
            model=self.models["risk_analyst"],
            prompt=f"Analyze this portfolio's tail risk and drawdown potential. Focus on extreme events: {json.dumps(portfolio_summary)}"
        )

        # 3. Strategy Suggestions (Llama)
        strategy_report = await self._query_nvidia(
            model=self.models["portfolio_strategist"],
            prompt=f"Suggest rebalancing weights to improve the Sharpe Ratio for this portfolio: {json.dumps(portfolio_summary)}"
        )

        return {
            "sovereign_intelligence": {
                "risk_analysis": risk_report,
                "strategic_suggestion": strategy_report,
                "model_ensemble": list(self.models.values())
            }
        }

    async def _query_nvidia(self, model: str, prompt: str) -> str:
        if not self.nvidia_api_key:
            return "NVIDIA_API_KEY_MISSING"

        headers = {
            "Authorization": f"Bearer {self.nvidia_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "top_p": 0.7,
            "max_tokens": 1024
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                return f"Error querying NVIDIA model {model}: {str(e)}"

# Global instance
ai_service = AIService()
