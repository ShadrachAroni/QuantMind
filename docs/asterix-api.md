# QuantMind — ASTERIX-Inspired Architecture

## 1. What is ASTERIX?

In the QuantMind project, **ASTERIX** refers to the aviation surveillance data protocol engineered for high-frequency, multi-entity real-time tracking. While we do not use the protocol itself, our architecture is **inspired by its principles** to manage the high-velocity price and simulation data.

### Concept Mapping
- **Aircraft Positions** → **Asset Prices**
- **Radar Update Ticks** → **Real-time Price Ticks**
- **Simultaneous Aircraft Tracks** → **Parallel Monte Carlo Paths**

---

## 2. Implementation Status (Updated March 2026)

Following the technical audit, the architecture is now **Fully Compliant** with the Project specifications:

| Core Principle | Requirement | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Real-time Pipeline** | Continuous positional updates via WebSockets. | ✅ **Active** | `market-stream` Edge Function ingest from Twelve Data. |
| **Radar-Sweep Batching**| Processing updates in discrete, ordered bursts. | ✅ **Active** | 1000ms batch interval implemented in market stream ingestion. |
| **Payload Efficiency** | Storage of paths as **BYTEA** (compressed binary). | ✅ **Active** | Python engine now uses `zlib` + `float32` for binary storage. |
| **Multi-Entity Tracking**| 10,000 independent "tracks" (paths) per portfolio. | ✅ **Active** | Full Monte Carlo path orchestration via FastAPI + NumPy. |

---

## 3. Technical Implementation Details

### Binary Storage (`BYTEA`)
Simulation results are now optimally stored using the ASTERIX-specified binary format.
- **Compression**: `zlib` (level 6).
- **Precision**: `float32` (converted from `float64` for 50% storage reduction).
- **Ingestion**: Asynchronous post-simulation write to the `simulation_paths` table.

### Real-Time "Radar Sweep"
The `market-stream` function maintains a persistent link to Twelve Data and buffers incoming ticks. Every 1000ms, a "Radar Sweep" flushes the deduplicated ticks to the `prices` table, triggering a single multi-symbol broadcast via Supabase Realtime. This prevents UI flicker and database write-saturation.

---

## 4. Maintenance Guide
1. **Adding Symbols**: Update the `subscribe` list in `supabase/functions/market-stream/index.ts`.
2. **Monitoring**: Check `ai_sessions` and `admin_audit_log` in the Dashboard for system health.
3. **Scaling**: If path counts exceed 100k, consider upgrading the `simulation_paths` table to a Hypertable (TimescaleDB) or utilizing Supabase's Read Replicas for path retrieval.
