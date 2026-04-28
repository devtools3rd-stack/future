# Database-Aware Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `GET /health` so it reports database connectivity and environment.

**Architecture:** `HealthService` owns health checks and response shaping. `HealthController` delegates to it. The database check uses TypeORM `DataSource.query('SELECT 1')`.

**Tech Stack:** NestJS 11, TypeORM 0.3, Jest, Supertest.

---

### Task 1: Health Service Tests

**Files:**
- Create: `src/health/health.service.spec.ts`
- Create: `src/health/health.service.ts`
- Modify: `src/health/health.controller.ts`
- Modify: `src/health/health.module.ts`

- [ ] **Step 1: Write RED tests**

Test connected database returns `status: "ok"` and `database: "connected"`. Test failed query returns `status: "degraded"`, `database: "error"`, and `error: "database_unavailable"`.

- [ ] **Step 2: Run RED**

Run: `npm test -- health.service.spec.ts`

Expected: fail because `HealthService` does not exist.

- [ ] **Step 3: Implement service and controller wiring**

Inject `DataSource` and `ConfigService`, run `SELECT 1`, and return the approved response shape.

### Task 2: E2E Contract

**Files:**
- Modify: `test/app.e2e-spec.ts`
- Modify: `src/health/health.controller.spec.ts`

- [ ] **Step 1: Update tests**

Expect `status`, `database`, `timestamp`, and `env` fields. Remove the old `app` expectation.

- [ ] **Step 2: Verify**

Run `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`.
