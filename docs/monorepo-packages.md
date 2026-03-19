# QuantMind — Monorepo Shared Packages

## Overview
The `/packages` directory is the core of the QuantMind monorepo's shared logic. It contains reusable code that is consumed by multiple applications (`mobile`, `web`, `dashboard`) to ensure consistency, reduce code duplication, and enforce a "Single Source of Truth."

---

## 🏗️ The Three Pillars of Shared Logic

### 1. [`@quantmind/shared-types`](../packages/shared-types)
**Purpose**: Centralized TypeScript definitions.
- **Why it matters**: It ensures that a `Portfolio` object in the Mobile app has the exact same structure as the one in the Web dashboard.
- **Content**: Interfaces for Database schemas, API responses, and simulation results.

### 2. [`@quantmind/ui`](../packages/ui)
**Purpose**: Shared UI components and layout foundations.
- **Why it matters**: Maintains a consistent "Institutional-Grade" brand aesthetic across platforms. It defines the typography, color palettes (Inter, Cyan-to-Purple gradients), and common visual patterns like `SimulationDemo`.
- **Content**: Reusable React/React Native components, theme constants, and visual assets.

### 3. [`@quantmind/ai`](../packages/ai)
**Purpose**: AI context orchestration and prompt logic.
- **Why it matters**: This package houses the proprietary logic used to format portfolio data into the exact string representation expected by Claude. 
- **Content**: Context builders and model interfaces for the "Portfolio Doctor."

---

## 🔗 Linking Mechanism

### NPM Workspaces
The monorepo uses **NPM Workspaces** to link these packages. In the root `package.json`, we define:
```json
"workspaces": [
  "apps/*",
  "packages/*"
]
```
This tells Node.js to look inside `packages/` whenever an app tries to import a package starting with `@quantmind/`.

### How to Import
When working in an app (e.g., `apps/mobile`), you can import shared logic as if it were a standard library:
```typescript
import { Portfolio } from '@quantmind/shared-types';
import { buildContext } from '@quantmind/ai';
```

### Why no `npm publish`?
Because of the workspace linking, you don't need to publish these packages to the public NPM registry. When you run `npm install` at the root, Node.js creates **symlinks** in `node_modules`, allowing for instantaneous updates—changes made in `shared-types` are immediately reflected in `mobile` and `web`.

---

## 🚀 Orchestration with TurboRepo
The monorepo uses **TurboRepo** (`turbo.json`) to manage the build order and caching.
- If `apps/mobile` depends on `@quantmind/shared-types`, Turbo ensures that the types are validated before the mobile build starts.
- Turbo also caches successful builds, so shared packages are only re-verified when their code actually changes.
