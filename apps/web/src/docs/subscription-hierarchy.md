# QuantMind Subscription Hierarchy

The QuantMind platform utilizes a tiered access model to balance retail accessibility with institutional-grade computational requirements.

## Tier Structure

| Tier | Name | Price | Core Focus |
| :--- | :--- | :--- | :--- |
| **FREE** | Explorer | $0/mo | Individuals learning basic risk modeling. |
| **STUDENT** | Academic | $5/mo | Verified students & researchers. |
| **PLUS** | QuantMind Plus | $9.99/mo | Active investors requiring AI assistance. |
| **PRO** | QuantMind Pro | $24.99/mo | Institutional-grade power users. |

---

## Feature Matrix

### 1. Portfolio Management (Vaults)
- **Free**: 1 Institutional Portfolio.
- **Student**: 3 Institutional Portfolios.
- **Plus**: 5 Institutional Portfolios.
- **Pro**: **Unlimited** Institutional Portfolios.

### 2. Computational Capacity (QuantCore)
- **Free**: Basic Monte Carlo (Standard Pathing).
- **Student**: Standard Simulations + Educational Datasets.
- **Plus**: Advanced Risk Metrics (VaR, CVaR, Tail Risk).
- **Pro**: Custom Model Deployment + 100k+ Pathing Simulations.

### 3. AI Oracle Integration
- **Free**: No Access.
- **Student**: Limited Educational Query Support.
- **Plus**: AI Insights (Strategy Refinement suggestions only).
- **Pro**: **Full Interactive Integration** (Strategy backtesting & direct relay).

---

## Upgrade & Transition Protocols

### Upgrade Path
- **Immediate Deployment**: Upgrades are processed instantly. If upgrading from a paid tier, the remaining balance is credited toward the new tier (Pro-rata).
- **Onboarding**: New users default to the **Free** tier. Upgrading to a paid tier initiates the Billing Protocol (Paystack).

### Downgrade & Revocation
- **Billing Cycle Integrity**: Downgrades take effect at the *end* of the current billing period.
- **Data Preservation**: If a user downgrades to a tier with lower Portfolio limits, their existing data is preserved, but excess modules are placed in **ARCHIVED/READ-ONLY** mode. No data is deleted.
- **Payment Failure**: Access is revoked after three (3) unsuccessful billing attempts. The profile reverts to the **Free** tier.

---

## Decision Logic & Gating
1. **Tier Check**: Every high-compute request (Monte Carlo, AI Oracle) validates the `user_profiles.tier` claim.
2. **Usage Quotas**: Portfolios are counted at the database level before initialization in the `Portfolio_Registry`.
3. **Conditional UI**: Interface elements for gated features (e.g., "Full AI Interactivity") will display a **PROTOCOL_LOCKED** status for unauthorized users.
