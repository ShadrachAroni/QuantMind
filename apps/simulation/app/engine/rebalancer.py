from typing import List, Dict
import numpy as np
from app.models.simulation import Asset

def rebalance_by_sentiment(assets: List[Asset], sentiment_shock: float) -> List[Dict]:
    """
    Suggests a rebalanced portfolio based on the MiroFish Sentiment Shock.
    
    Rules:
    - If shock < -0.02 (Bearish): Reduce High-Beta (Tech/Growth) and move to Defensive (Cash/Bonds).
    - If shock > 0.02 (Bullish): Increase exposure to High-Beta assets.
    - Otherwise: Minor adjustments.
    """
    rebalanced = []
    
    # Defensive/Safe Assets (Simplified classification)
    defensive_sectors = ["Healthcare", "Utilities", "Consumer Staples", "Energy"]
    growth_sectors = ["Technology", "Communication Services", "Consumer Discretionary"]
    
    total_weight = sum(a.weight for a in assets)
    if total_weight == 0:
        return []

    # Bearish Shock: Shift from Growth to Defensive
    if sentiment_shock <= -0.02:
        adjustment_factor = min(abs(sentiment_shock) * 5, 0.5)  # Max 50% shift
        for asset in assets:
            new_weight = asset.weight
            if asset.sector in growth_sectors:
                new_weight = asset.weight * (1 - adjustment_factor)
            elif asset.sector in defensive_sectors or asset.asset_class in ["Bonds", "Cash"]:
                # Re-distribute the 'growth' reduction to defensive
                # This is a simple linear redistribution logic
                pass 
            rebalanced.append({"ticker": asset.ticker, "weight": new_weight})
    
    # Bullish Shock: Shift from Defensive to Growth
    elif sentiment_shock >= 0.02:
        adjustment_factor = min(sentiment_shock * 3, 0.3)
        for asset in assets:
            new_weight = asset.weight
            if asset.sector in defensive_sectors or asset.asset_class in ["Bonds", "Cash"]:
                new_weight = asset.weight * (1 - adjustment_factor)
            rebalanced.append({"ticker": asset.ticker, "weight": new_weight})
    
    else:
        # Neutral: No change
        for asset in assets:
            rebalanced.append({"ticker": asset.ticker, "weight": asset.weight})
            
    # Normalize weights to sum to 1.0
    current_total = sum(r["weight"] for r in rebalanced)
    if current_total > 0:
        for r in rebalanced:
            r["weight"] = float(np.round(r["weight"] / current_total, 4))
            
    return rebalanced
