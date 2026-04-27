import json
import os
from oasis import Platform
from camel.agents import ChatAgent

from zep_python.client import Zep
from app.services.knowledge import KnowledgeIngestor

# Initialize Zep Client
zep_client = Zep(
    api_key=os.getenv("ZEP_API_KEY"),
    base_url=os.getenv("ZEP_API_URL")
)

# Initialize Knowledge Ingestor (Neo4j)
knowledge_ingestor = KnowledgeIngestor(
    uri=os.getenv("NEO4J_URI"),
    auth_str=os.getenv("NEO4J_AUTH")
)

def load_personas():
    persona_path = os.path.join(os.path.dirname(__file__), "../../../../packages/ai/src/personas/market_agents.json")
    try:
        with open(persona_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "retail_trader": {
                "traits": ["High Sentiment Bias", "Short-term Horizon"],
                "behavior_rules": [
                    "If Sentiment > 0.8 AND Price_Momentum > 0.05 THEN BUY",
                    "Panic sell if other agents in social_graph signal SELL"
                ],
                "prompt": "You are a retail investor with 5 years experience. You react strongly to social media trends."
            },
            "institutional_mm": {
                "traits": ["Low Risk", "Market Maker"],
                "behavior_rules": [
                    "Provide liquidity when spread is wide",
                    "Mean reversion strategy"
                ],
                "prompt": "You are an institutional market maker."
            }
        }

PERSONAS = load_personas()

async def run_market_evolution(seed_context: str, steps: int = 24):
    platform = Platform(name="QuantMind-Exchange")
    
    # Spawn heterogeneous agents
    agents = [
        ChatAgent(name="Aggressive_Alpha", persona=PERSONAS.get('retail_trader')),
        ChatAgent(name="Stability_Seeker", persona=PERSONAS.get('institutional_mm'))
    ]
    
    # 1. Ingest seed context into Knowledge Graph (Neo4j)
    try:
        await knowledge_ingestor.ingest_news_clipping(seed_context)
    except Exception as e:
        print(f"Failed to ingest knowledge: {e}")

    interactions_log = []
    prev_actions_summary = ""
    
    for t in range(steps):
        # Step simulation environment
        env_signal = f"Tick {t}: News: {seed_context}"
        
        # Execute multi-agent social dialogue
        agent_actions = []
        for agent in agents:
            try:
                # Ask agent for their next market action based on current signal AND previous agent behaviors
                social_context = f" Recent Peer Actions: {prev_actions_summary}" if prev_actions_summary else ""
                prompt = f"Current Market Signal: {env_signal}.{social_context} Your traits: {agent.persona.get('traits')}. What is your next move? (BUY/SELL/HOLD/SPECULATE) Give a 1-sentence reasoning."
                response = await agent.run(prompt)
                
                # Simple parser for the action
                action = "HOLD"
                if "BUY" in response.upper(): action = "BUY"
                elif "SELL" in response.upper(): action = "SELL"
                elif "SPECULATE" in response.upper(): action = "SPECULATE"
                
                agent_actions.append({
                    "agent": agent.name,
                    "action": action,
                    "reasoning": response
                })
            except Exception as e:
                print(f"Agent {agent.name} failed to act: {e}")
                agent_actions.append({"agent": agent.name, "action": "HOLD", "reasoning": "Communication error"})

        # Update social summary for next iteration
        prev_actions_summary = ", ".join([f"{a['agent']} chose {a['action']}" for a in agent_actions])

        interactions = {
            "tick": t,
            "signal": env_signal,
            "agent_actions": agent_actions,
            "social_graph": {
                "nodes": [{"id": "SIGNAL", "type": "signal"}] + [{"id": a['agent'], "type": "agent", "action": a['action']} for a in agent_actions],
                "edges": [{"from": "SIGNAL", "to": a['agent']} for a in agent_actions]
            }
        }
        interactions_log.append(interactions)
        
        # 2. Persist interactions to Agent Memory (Zep)
        try:
            # We convert interactions to a list of dicts for Zep
            await zep_client.memory.add(
                session_id=f"sim_{t}_{seed_context[:10]}",
                messages=[{
                    "role": "system",
                    "content": json.dumps(interactions)
                }]
            )
        except Exception as e:
            print(f"Failed to add memory to Zep: {e}")
    
    return interactions_log

def extract_sentiment_shock(interactions_log: list) -> float:
    """
    Analyzes the multi-agent dialogue to derive a 'Sentiment Shock' value.
    This value can be used to bias the quantitative Monte Carlo engine.
    """
    if not interactions_log:
        return 0.0
    
    total_actions = 0
    buy_count = 0
    sell_count = 0
    
    for tick in interactions_log:
        for action in tick.get("agent_actions", []):
            act = action.get("action", "HOLD").upper()
            if act == "BUY":
                buy_count += 1
            elif act == "SELL":
                sell_count += 1
            total_actions += 1
            
    if total_actions == 0:
        return 0.0
    
    # Net sentiment ratio (-1.0 to 1.0)
    net_sentiment = (buy_count - sell_count) / total_actions
    
    # Map to a reasonable market shock (e.g., max 5% annualized shift)
    sentiment_shock = net_sentiment * 0.05
    return float(sentiment_shock)
