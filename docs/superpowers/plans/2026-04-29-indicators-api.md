# Technical Indicators API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit technical indicator helpers for EMA, RSI, and MACD.

**Architecture:** Keep indicator math in `src/strategies/engine/indicators.ts`. Strategies call the public `calculate*` helpers and retain existing signal behavior.

**Tech Stack:** TypeScript, Jest, existing strategy engine.

---

### Task 1: RED Tests

**Files:**
- Create: `src/strategies/engine/indicators.spec.ts`

- [ ] Add tests for `calculateEMA`, `calculateRSI`, and `calculateMACD`.
- [ ] Cover insufficient data and invalid periods returning `[]`.
- [ ] Run targeted tests and verify RED.

### Task 2: Implementation

**Files:**
- Modify: `src/strategies/engine/indicators.ts`
- Modify: `src/strategies/engine/strategies/ema-cross.strategy.ts`
- Modify: `src/strategies/engine/strategies/rsi-extreme.strategy.ts`
- Modify: `src/strategies/engine/strategies/macd-cross.strategy.ts`

- [ ] Implement public `calculateEMA`, `calculateRSI`, and `calculateMACD`.
- [ ] Update strategies to use public helpers.
- [ ] Keep helper behavior non-throwing for missing data.

### Task 3: Verification and Commit

- [ ] Run targeted indicator and strategy tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test -- --runInBand`.
- [ ] Run `npm run test:e2e -- --runInBand`.
- [ ] Run `npm run build`.
- [ ] Run GitNexus detect changes.
- [ ] Commit feature files only.
