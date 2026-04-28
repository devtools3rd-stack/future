# Strategy Config API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add watchlist-nested APIs for reading and upserting strategy configs.

**Architecture:** Extend the existing `StrategiesModule`. `StrategyConfigService` owns watchlist existence checks, default config merging, and repository upsert. `StrategyConfigController` handles HTTP routes and response envelopes.

**Tech Stack:** NestJS 11, TypeScript, TypeORM repositories, class-validator, Jest.

---

### Task 1: RED Tests

**Files:**
- Modify: `src/strategies/strategy-config.service.spec.ts`
- Create: `src/strategies/strategy-config.controller.spec.ts`
- Create: `src/strategies/dto/strategy-config.dto.spec.ts`

- [ ] Add service tests for default configs, DB/default merge, missing watchlist on GET, and missing watchlist on upsert.
- [ ] Add controller tests for GET and PUT response envelopes.
- [ ] Add DTO tests for strategy key enum and `paramsJson` object validation.
- [ ] Run targeted tests and verify RED.

### Task 2: Implementation

**Files:**
- Modify: `src/strategies/strategy-config.service.ts`
- Modify: `src/strategies/strategies.module.ts`
- Create: `src/strategies/strategy-config.controller.ts`
- Create: `src/strategies/dto/strategy-config.dto.ts`
- Create: `src/strategies/strategy-config.constants.ts`

- [ ] Add supported strategy keys and defaults.
- [ ] Add `getConfigsWithDefaultsByWatchlistId()`.
- [ ] Update `upsertStrategyConfig()` to verify watchlist existence first.
- [ ] Add controller routes under `/api/watchlist/:watchlistId/strategies`.
- [ ] Import `WatchlistModule` into `StrategiesModule`.

### Task 3: Verification and Commit

- [ ] Run targeted tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test -- --runInBand`.
- [ ] Run `npm run test:e2e -- --runInBand`.
- [ ] Run `npm run build`.
- [ ] Run GitNexus detect changes.
- [ ] Commit feature files only.
