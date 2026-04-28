# TypeORM Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TypeORM CLI migration support and an initial migration for crypto signal tables.

**Architecture:** `src/database/data-source.ts` exports a TypeORM `DataSource` for CLI commands. Config parsing is testable and shared conceptually with Nest runtime options, both keeping `synchronize: false`.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, dotenv, Jest.

---

### Task 1: Data Source Config

**Files:**
- Create: `src/database/data-source.spec.ts`
- Create: `src/database/data-source.ts`
- Modify: `src/database/typeorm.options.ts`

- [ ] **Step 1: Write RED tests**

Test `createDataSourceOptions()` with `DATABASE_URL`, host/port/user/password/name config, and `DATABASE_SSL=true`.

- [ ] **Step 2: Run RED**

Run: `npm test -- data-source.spec.ts`

Expected: fail because `data-source.ts` does not exist.

- [ ] **Step 3: Implement data source**

Create `createDataSourceOptions()` and default export `new DataSource(createDataSourceOptions())`.

- [ ] **Step 4: Update runtime TypeORM options**

Add `DATABASE_URL` and `DATABASE_SSL=true` support to `createTypeOrmOptions()`.

### Task 2: Initial Migration

**Files:**
- Create: `src/database/migrations/1777351200000-CreateCryptoSignalTables.ts`
- Create: `src/database/migrations/create-crypto-signal-tables.spec.ts`

- [ ] **Step 1: Write RED migration test**

Test migration `up()` emits SQL for tables and indexes, and `down()` drops tables and enum types.

- [ ] **Step 2: Run RED**

Run: `npm test -- create-crypto-signal-tables.spec.ts`

Expected: fail because migration does not exist.

- [ ] **Step 3: Implement migration**

Create PostgreSQL enum types, tables, FK, unique indexes, and query index. Implement reverse drops in `down()`.

### Task 3: Scripts and Verification

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `.env`

- [ ] **Step 1: Add CLI scripts**

Add `typeorm`, `migration:generate`, `migration:run`, and `migration:revert`.

- [ ] **Step 2: Add env examples**

Document `DATABASE_URL` and `DATABASE_SSL`.

- [ ] **Step 3: Verify**

Run `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`. Do not run migrations against the server database unless explicitly requested.
