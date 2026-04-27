# MiroFish Integration Guide

**Version:** 1.0.0 **Target Environment:** Hugging Face Spaces (Backend) &
Next.js/Vercel (Frontend)

This document provides a comprehensive overview of the MiroFish swarm
intelligence integration into the QuantMind platform.

## 1. System Architecture

MiroFish has been integrated to provide a "God's-Eye View" Sandbox where users
can inject macro-economic events into a multi-agent social network and observe
the reflexive outcomes.

The architecture comprises:

- **Frontend**: Next.js 15 (QuantMind Web App)
- **Backend / Simulation Engine**: FastAPI hosted on Hugging Face Spaces
- **Agent Framework**: `camel-oasis` and `camel-ai`
- **Knowledge Graph**: Neo4j (via GraphRAG)
- **Agent Memory**: Zep
- **Data Persistence**: Supabase (PostgreSQL)

## 2. Component Implementation Details

### 2.1 Backend (Hugging Face Space)

Path: `apps/simulation`

- **`app/main.py`**: The FastAPI entry point. It is configured to run on port
  `7860` natively, ensuring out-of-the-box compatibility with Hugging Face
  Docker/FastAPI Spaces.
- **`app/core/simulation.py`**: Houses the `run_market_evolution` function. It
  initializes the `Platform` environment and steps the heterogeneous agents
  through the interactions.
- **`app/services/knowledge.py`**: The `KnowledgeIngestor` class. It takes news
  text and extracts entities/relationships using `graphrag`, linking
  organizations to market tickers.
- **`packages/ai/src/personas/market_agents.json`**: Contains over 15 distinct
  agent personas (e.g., Retail Trader, Value Investor, Crypto Degen) with
  specific `traits` and `behavior_rules` that dictate their trading logic based
  on sentiment and price momentum.

### 2.2 Frontend (Next.js)

Path: `apps/web/src`

- **`VariableInjector.tsx`**: A dashboard UI component that allows the operator
  to inject "seed text" (news events). It provides visual feedback while the
  simulation backend processes the ingestion.
- **`InteractionWeb.tsx`**: A D3.js compatible canvas designed to visualize the
  complex network of agent interactions and sentiment propagation during the
  simulation ticks.
- **`mirofish/page.tsx`**: The main "God's-Eye View" dashboard. It orchestrates
  the injector, the interaction web, and the trajectory log, gated behind the
  `Pro` tier.
- **`Sidebar.tsx`**: Navigation menu updated with the `MiroFish_Engine` route.

### 2.3 Database Layer

Path: `supabase/migrations/20260427_mirofish_results.sql` A SQL migration is
provided to track the simulation outputs natively.

- **`simulation_runs` Table**: Stores the snapshot, news seed, interaction graph
  output, and trajectory metrics.
- **`portfolios` Table Update**: Adds a foreign key (`last_sim_id`) to link a
  user's portfolio directly to their most recent simulation run.

## 3. Database Configurations

To properly persist simulation results, the Supabase PostgreSQL database must be
configured with the new schema.

> **Important Note:** The migration script located at
> `supabase/migrations/20260427_mirofish_results.sql` needs to be applied to the
> primary database instance.

## 4. Deployment Instructions (Hugging Face)

### 4.1 Cloud Services Provisioning

Since the simulation engine is deployed on Hugging Face Spaces (which does not
utilize Docker Compose natively), you will need cloud-managed instances for the
graph and memory layers:

- **Neo4j AuraDB**: Provision a free instance and retrieve the `NEO4J_URI` and
  `NEO4J_AUTH` credentials.
- **Zep Cloud**: Provision a Zep Cloud instance and retrieve the `ZEP_API_URL`
  and `ZEP_API_KEY`.

### 4.2 Hugging Face Configuration

1. Create a new Space on Hugging Face using the **Docker** (FastAPI) or
   **Blank** template.
2. Push the contents of `apps/simulation` to the root of the Space repository.
3. In the Hugging Face Space Settings, add the following to the **Secrets**:
   - `NEO4J_URI`
   - `NEO4J_AUTH`
   - `ZEP_API_URL`
   - `ZEP_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

### 4.3 Frontend Connection

In your Next.js deployment (e.g., Vercel), ensure the following environment
variable points to your live Hugging Face Space:
`NEXT_PUBLIC_SIMULATION_API_URL=https://your-username-spacename.hf.space`
