# Crypto Signal Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a NestJS + TypeScript backend scaffold for a crypto signal app with clean modules and a `GET /health` endpoint.

**Architecture:** Use the NestJS CLI scaffold as the baseline, then replace the sample app controller/service with feature modules. `ConfigModule` is imported globally from `@nestjs/config`, and only `HealthModule` exposes an HTTP route.

**Tech Stack:** NestJS 11, TypeScript, Jest, Supertest, npm, `@nestjs/config`.

---

### Task 1: Scaffold Project

**Files:**
- Create: NestJS CLI project files in repository root.
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Generate the NestJS project**

Run: `npx @nestjs/cli@11.0.21 new . --package-manager npm --skip-git --skip-install`

Expected: NestJS project files are created in `d:\Future\backend`.

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `node_modules` and `package-lock.json` are created.

- [ ] **Step 3: Add config dependency**

Run: `npm install @nestjs/config@4.0.4`

Expected: `@nestjs/config` is present in `package.json`.

### Task 2: Health Endpoint With TDD

**Files:**
- Modify: `test/app.e2e-spec.ts`
- Create: `src/health/health.controller.ts`
- Create: `src/health/health.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write failing e2e test**

```ts
it('/health (GET)', () => {
  return request(app.getHttpServer())
    .get('/health')
    .expect(200)
    .expect((res) => {
      expect(res.body.status).toBe('ok');
      expect(res.body.app).toBe('crypto-signal-api');
      expect(typeof res.body.timestamp).toBe('string');
      expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e`

Expected: fails because `/health` does not exist.

- [ ] **Step 3: Implement health module**

Create `HealthController` with `@Get()` returning `{ status: 'ok', app: 'crypto-signal-api', timestamp: new Date().toISOString() }`, and import `HealthModule` from `AppModule`.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:e2e`

Expected: e2e test passes.

### Task 3: Clean Module Structure

**Files:**
- Create: `src/database/database.module.ts`
- Create: `src/watchlist/watchlist.module.ts`
- Create: `src/symbols/symbols.module.ts`
- Create: `src/settings/settings.module.ts`
- Create: `src/telegram/telegram.module.ts`
- Create: `src/strategies/strategies.module.ts`
- Create: `src/signals/signals.module.ts`
- Create: `src/scheduler/scheduler.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create skeleton modules**

Each module exports an empty NestJS module class, for example:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class DatabaseModule {}
```

- [ ] **Step 2: Import skeleton modules in AppModule**

`AppModule` imports `ConfigModule.forRoot({ isGlobal: true })`, `HealthModule`, and all skeleton feature modules.

- [ ] **Step 3: Verify compile and tests**

Run: `npm run test`
Run: `npm run test:e2e`
Run: `npm run build`

Expected: all commands exit successfully.
