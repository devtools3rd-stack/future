# Strategy Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a testable strategy engine with a registry and initial EMA, RSI, and MACD strategies.

**Architecture:** Core engine files live under `src/strategies/engine`. Strategies are plain injectable classes implementing a shared runner interface; `StrategyRegistry` manages them by `StrategyKey` and `StrategiesModule` wires them into Nest.

**Tech Stack:** NestJS 11, TypeScript, Jest, existing `Candle` and `StrategyKey` types.

---

### Task 1: RED Tests

**Files:**
- Create: `src/strategies/engine/strategy-registry.spec.ts`
- Create: `src/strategies/engine/strategies/ema-cross.strategy.spec.ts`
- Create: `src/strategies/engine/strategies/rsi-extreme.strategy.spec.ts`
- Create: `src/strategies/engine/strategies/macd-cross.strategy.spec.ts`

- [ ] Add registry tests for `get`, `getAll`, `run`, and unsupported keys.
- [ ] Add strategy tests for enough history, signal emission, null cases, direction, price, reason, and meta.
- [ ] Run targeted tests and verify RED.

### Task 2: Implementation

**Files:**
- Create: `src/strategies/engine/strategy.types.ts`
- Create: `src/strategies/engine/indicators.ts`
- Create: `src/strategies/engine/strategy-registry.ts`
- Create: `src/strategies/engine/strategies/ema-cross.strategy.ts`
- Create: `src/strategies/engine/strategies/rsi-extreme.strategy.ts`
- Create: `src/strategies/engine/strategies/macd-cross.strategy.ts`
- Modify: `src/strategies/strategies.module.ts`

- [ ] Add core strategy types.
- [ ] Add EMA, RSI, MACD indicator helpers.
- [ ] Implement three strategy classes.
- [ ] Implement registry.
- [ ] Register providers in `StrategiesModule`.

### Task 3: Verification and Commit

- [ ] Run targeted tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test -- --runInBand`.
- [ ] Run `npm run test:e2e -- --runInBand`.
- [ ] Run `npm run build`.
- [ ] Run GitNexus detect changes.
- [ ] Commit feature files only.
