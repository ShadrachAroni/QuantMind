---
title: Simulation Engine
emoji: 📉
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Institutional-grade Monte Carlo simulation engine
---

# QuantMind Simulation Engine

[![Service Status](https://img.shields.io/badge/Service-Active-success?style=for-the-badge&logo=fastapi)](https://github.com/ShadrachAroni/QuantMind)
[![Tier](https://img.shields.io/badge/Tier-Pro-blueviolet?style=for-the-badge)](https://github.com/ShadrachAroni/QuantMind)

An institutional-grade Monte Carlo simulation engine designed for high-fidelity portfolio risk modeling, asset allocation optimization, and multi-scenario stress testing.

## 🚀 Core Capabilities

The QuantMind Simulation Engine leverages advanced stochastic calculus and machine learning to project portfolio performance across thousands of potential market paths.

- **Monte Carlo GBM**: High-performance Geometric Brownian Motion simulation for standard volatility modeling.
- **Jump Diffusion Modeling (Pro)**: Advanced Merton Jump Diffusion to account for "black swan" events and market discontinuities.
- **Portfolio Optimization (Pro)**: Integrated Mean-Variance and Risk Parity algorithms to suggest weight rebalancing during simulations.
- **Institutional Risk Telemetry**:
  - **VaR/CVaR (95/99)**: Granular Tail Risk and Conditional Value at Risk metrics.
  - **Drawdown Statistics**: Median recovery time and peak-to-trough duration analysis.
  - **Sector Attribution**: Quantitative breakdown of risk contribution by industry and asset class.
  - **Volatility Regimes**: Multi-state analysis of market conditions (high/low/stable).

## 📥 API Integration

### Base URL
`http://localhost:7860` (Default) or defined via `PORT` environment variable.

### Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Service meta-information & versioning. | No |
| `GET` | `/health` | Liveness / Readiness probe. | No |
| `POST` | `/simulate` | Submit a simulation job (Async). | `X-Simulation-Secret` |

## 🏗 Setup & Installation

### Local Development
1. **Prepare Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. **Environment Variables**:
   Create a `.env` file from `.env.example`:
   ```env
   SIMULATION_SECRET_KEY=your_secure_terminal_key
   PORT=7860
   ```
3. **Run Service**:
   ```bash
   python -m uvicorn app.main:app --reload --port 7860
   ```

### Docker
```bash
docker build -t quantmind-simulation .
docker run -p 7860:7860 quantmind-simulation
```

## 🧪 Testing

Run the institutional test suite (unit + integration):
```bash
pytest
```

---
© 2026 QuantMind Institutional Intelligence. All rights reserved.
