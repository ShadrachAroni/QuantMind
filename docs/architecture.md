# QuantMind Architecture & Modules

## System Overview
QuantMind is a distributed monorepo designed for high-performance financial risk analysis. It leverages a hybrid architecture of Deno (Edge), Python (Simulation), and React Native (Mobile).

## Core Modules

### 1. Quantum Simulation Engine (`apps/simulation`)
- **Language**: Python 3.10+
- **Purpose**: Executes heavy-compute Monte Carlo paths and tail-risk calculations.
- **Integration**: Accessed via internal RPC from the Dashboard or triggered by Edge Functions for batch processing.

### 2. AI Infrastructure (`supabase/functions` & `packages/ai`)
- **Orchestration**: System-level prompt steering and context injection.
- **Secure Vault**:
  - **Table**: `user_ai_configs`
  - **Encryption**: AES-256 (pgcrypto) for user-provided keys.
  - **Dynamic Switching**: Supports Google Gemini, Anthropic, and OpenAI based on user tier and preferences.

### 3. Unified Changelog System
- **Source of Truth**: `app_changelog` table.
- **Aggregation**: Consolidates updates from Dev, Test, and Prod environments.
- **Presentation**: Hierarchical display in the mobile terminal with impact assessment (Low/Med/High/Critical).

### 4. Shared Packages (`packages/`)
- `shared-types`: Unified TypeScript interfaces for cross-platform data consistency.
- `ui`: Institutional design system components.

## Data Flow
1. **User Request**: Initiated via Mobile UI or Web Dashboard.
2. **Auth Layer**: Supabase Auth (JWT) validates user tier and entitlements.
3. **Edge Processing**: Deno functions handle dynamic model selection and key decryption.
4. **Compute**: Simulation engine processes numeric paths.
5. **Storage**: Secure PostgreSQL (Supabase) for long-term state and vault assets.
