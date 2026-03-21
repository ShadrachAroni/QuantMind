# QuantMind Monorepo

> **"Where Probability Meets Investing."**

QuantMind is a high-fidelity portfolio risk analysis and simulation platform. It enables investors to run institutional-grade Monte Carlo simulations on their portfolios, visualize potential tail risks, and receive AI-driven insights via the "Portfolio Doctor" assistant.

---

## 📚 Documentation Table of Contents

We maintain comprehensive documentation for all aspects of the platform inside the [`/docs`](./docs) directory:

- **[Architecture & Modules](./docs/architecture.md)**: Deep dive into the monorepo structure, data flow, and technologies.
- **[API Integration Guide](./docs/api-usage.md)**: How we effectively use Anthropic, Alpha Vantage, Twelve Data, and more.
- **[Asterix API Integration Strategy](./docs/asterix-api.md)**: Details on our proprietary AI-Data orchestration layer.
- [x] **[Environment Setup & Credentials](./docs/env-setup.md)**: Detailed instructions on generating keys and configuring `.env` files.
- [x] **[Deployment Guide](./docs/deployment.md)**: Steps to push your project from staging to production.
- [x] **[Monorepo & Shared Packages](./docs/monorepo-packages.md)**: How we use NPM Workspaces to link shared logic.
- **[App Operational Rules](./Docs/Quantmind%20App%20Rules.md)**: The strict guidelines governing app behavior and data privacy.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+ (for simulation engine)
- **Supabase CLI**: For local Edge Function testing
- **Expo Go**: For mobile preview

### 2. Environment Configuration
Copy the root `.env.example` to `.env` and follow the [Environment Setup Guide](./docs/env-setup.md).

```bash
cp .env.example .env
```

### 3. Installation
QuantMind uses **TurboRepo** and **NPM Workspaces**.

```bash
npm install
```

### 4. Running the Project

- **Mobile App**: `npm run dev --filter quantmind`
- **Marketing Site (Web)**: `npm run dev --filter web`
- **Management Dashboard**: `npm run dev --filter dashboard`
- **Simulation Engine**: 
  ```bash
  cd apps/simulation
  pip install -r requirements.txt
  python run.py
  ```
- **Supabase Functions**: `supabase functions serve`

---

## 🏗️ Project Structure

```text
.
├── apps/
│   ├── mobile/         # React Native (Expo) - Principal UI
│   ├── simulation/     # FastAPI (Python) - Monte Carlo Engine
│   ├── dashboard/      # Next.js - Admin & Portfolio Management
│   └── web/            # Next.js - Marketing & Web Access
├── docs/               # System documentation & API guides
├── packages/
│   ├── shared-types/   # Shared TypeScript interfaces
│   ├── ui/             # Shared UI components
│   └── ai/             # AI context & prompt logic
├── supabase/
│   ├── functions/      # Deno-based Edge Functions (API Gateways)
│   └── migrations/     # PostgreSQL schema & RLS policies
└── Documents/          # PRDs, Designs, and Compliance Rules
```

---

## 🛡️ Security & Integrity

QuantMind is built with **Financial Integrity First**. We follow strict OIDC authentication patterns, employ server-side tier enforcement, and never store raw user passwords. For more details, see [Security Measures](./docs/Quantmind%20Security%20Measures.md).
