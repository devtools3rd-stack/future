# Service Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TypeORM repository-backed service classes for the app's core database modules.

**Architecture:** Each module owns one service and exports it. Services use `@InjectRepository` and translate persistence errors into clear Nest exceptions.

**Tech Stack:** NestJS 11, TypeORM 0.3, Jest.

---

### Task 1: WatchlistService

**Files:**
- Create: `src/watchlist/watchlist.service.spec.ts`
- Create: `src/watchlist/watchlist.service.ts`
- Modify: `src/watchlist/watchlist.module.ts`

- [ ] **Step 1: Write RED tests**

Test create, list, update, delete, updateStatus, not-found behavior, and unique conflict mapping.

- [ ] **Step 2: Implement service and module export**

Use `Repository<WatchlistEntity>` methods: `create`, `save`, `find`, `findOne`, `delete`.

### Task 2: StrategyConfigService

**Files:**
- Create: `src/strategies/strategy-config.service.spec.ts`
- Create: `src/strategies/strategy-config.service.ts`
- Modify: `src/strategies/strategies.module.ts`

- [ ] **Step 1: Write RED tests**

Test get by watchlist, enabled strategies, and upsert by `watchlistId + strategyKey`.

- [ ] **Step 2: Implement service and module export**

Use `find`, `findOne`, `create`, and `save`.

### Task 3: SignalService

**Files:**
- Create: `src/signals/signal.service.spec.ts`
- Create: `src/signals/signal.service.ts`
- Modify: `src/signals/signals.module.ts`

- [ ] **Step 1: Write RED tests**

Test save, recent signals limit/order, and last signal lookup by symbol/timeframe/strategy.

- [ ] **Step 2: Implement service and module export**

Use `create`, `save`, `find`, and `findOne`.

### Task 4: SettingsService

**Files:**
- Create: `src/settings/settings.service.spec.ts`
- Create: `src/settings/settings.service.ts`
- Modify: `src/settings/settings.module.ts`

- [ ] **Step 1: Write RED tests**

Test getSettings, getSetting not found, and setSetting upsert behavior.

- [ ] **Step 2: Implement service and module export**

Use `find`, `findOne`, `create`, and `save`.

### Task 5: Verify

Run `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`. Re-index GitNexus and commit service-layer changes.
