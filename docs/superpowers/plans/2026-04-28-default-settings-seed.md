# Default Settings Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an idempotent settings seed command that does not overwrite existing user settings.

**Architecture:** A pure seed function receives a query-capable data source and executes one parameterized PostgreSQL insert with `ON CONFLICT ("key") DO NOTHING`. A small CLI runner initializes and destroys the existing TypeORM data source.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, ts-node, Jest.

---

### Task 1: Seed Function

**Files:**
- Create: `src/database/seeds/default-settings.seed.spec.ts`
- Create: `src/database/seeds/default-settings.seed.ts`

- [ ] **Step 1: Write RED test**

Test that `seedDefaultSettings()` inserts the three required settings through a parameterized query and includes `ON CONFLICT ("key") DO NOTHING`.

- [ ] **Step 2: Run RED**

Run: `npm test -- default-settings.seed.spec.ts`

Expected: fail because the seed file does not exist.

- [ ] **Step 3: Implement seed function**

Export `DEFAULT_SETTINGS` and `seedDefaultSettings(dataSource)`.

### Task 2: CLI Runner and Script

**Files:**
- Create: `src/database/seeds/run-seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Add runner**

Initialize `AppDataSource`, run `seedDefaultSettings()`, log inserted/skipped counts, and always destroy the data source if initialized.

- [ ] **Step 2: Add npm script**

Add `"seed": "ts-node -r tsconfig-paths/register src/database/seeds/run-seed.ts"`.

### Task 3: Verify

**Files:**
- No additional edits.

- [ ] **Step 1: Run verification**

Run `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e`. Do not run `npm run seed` against the server database unless explicitly requested.
