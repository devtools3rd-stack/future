# Crypto Signal Entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TypeORM entities for watchlists, strategy configs, signals, and settings with the requested table names and indexes.

**Architecture:** Entities live beside their feature modules and are registered with `TypeOrmModule.forFeature()`. A metadata test builds TypeORM metadata without opening a database connection and verifies schema-critical decorators.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, Jest.

---

### Task 1: Entity Metadata Test

**Files:**
- Create: `src/database/entities.metadata.spec.ts`

- [ ] **Step 1: Write RED test**

Create a Jest test importing all four entity classes and asserting table names, columns, relation join columns, and indexes.

- [ ] **Step 2: Run RED**

Run: `npm test -- entities.metadata.spec.ts`

Expected: fail because entity files do not exist.

### Task 2: Entity Classes

**Files:**
- Create: `src/watchlist/entities/watchlist.entity.ts`
- Create: `src/strategies/entities/strategy-config.entity.ts`
- Create: `src/signals/entities/signal.entity.ts`
- Create: `src/settings/entities/setting.entity.ts`

- [ ] **Step 1: Implement entities**

Use TypeORM decorators, snake_case database column names, requested enum values, UUID primary keys, and requested indexes.

- [ ] **Step 2: Run GREEN**

Run: `npm test -- entities.metadata.spec.ts`

Expected: pass.

### Task 3: Module Registration

**Files:**
- Modify: `src/watchlist/watchlist.module.ts`
- Modify: `src/strategies/strategies.module.ts`
- Modify: `src/signals/signals.module.ts`
- Modify: `src/settings/settings.module.ts`

- [ ] **Step 1: Import TypeOrmModule.forFeature**

Register each module's entity so `autoLoadEntities` includes it in the root connection.

- [ ] **Step 2: Verify**

Run: `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`.
