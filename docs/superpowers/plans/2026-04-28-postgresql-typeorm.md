# PostgreSQL TypeORM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostgreSQL TypeORM setup to the NestJS backend and log DB connection state during startup.

**Architecture:** `DatabaseModule` owns TypeORM setup and imports `TypeOrmModule.forRootAsync()`. A small `createTypeOrmOptions()` factory keeps config parsing testable, and `DatabaseService` logs connection status from the injected `DataSource`.

**Tech Stack:** NestJS 11, `@nestjs/typeorm` 11.0.1, TypeORM 0.3.28, PostgreSQL driver `pg` 8.20.0, Jest.

---

### Task 1: Add Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install PostgreSQL TypeORM dependencies**

Run: `npm install @nestjs/typeorm@11.0.1 typeorm@0.3.28 pg@8.20.0`

Expected: dependencies are added to `package.json` and lockfile.

### Task 2: Add Testable TypeORM Config

**Files:**
- Create: `src/database/typeorm.options.ts`
- Create: `src/database/typeorm.options.spec.ts`

- [ ] **Step 1: Write failing test**

Create a test that calls `createTypeOrmOptions()` with a mocked `ConfigService` and expects PostgreSQL host, port, username, password, database, `autoLoadEntities: true`, and `synchronize: false`.

- [ ] **Step 2: Run RED**

Run: `npm test -- typeorm.options.spec.ts`

Expected: fail because `createTypeOrmOptions()` does not exist.

- [ ] **Step 3: Implement config factory**

Create `createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions`.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- typeorm.options.spec.ts`

Expected: pass.

### Task 3: Add Startup Connection Logger

**Files:**
- Create: `src/database/database.service.ts`
- Create: `src/database/database.service.spec.ts`
- Modify: `src/database/database.module.ts`

- [ ] **Step 1: Write failing logger test**

Test that `onApplicationBootstrap()` logs a connected message when `DataSource.isInitialized` is true.

- [ ] **Step 2: Run RED**

Run: `npm test -- database.service.spec.ts`

Expected: fail because `DatabaseService` does not exist.

- [ ] **Step 3: Implement DatabaseService**

Inject `DataSource`, use Nest `Logger`, and log `Database connected: host:port/database`.

- [ ] **Step 4: Wire DatabaseModule**

Import `TypeOrmModule.forRootAsync()` and provide `DatabaseService`.

- [ ] **Step 5: Run GREEN**

Run: `npm test -- database`

Expected: database unit tests pass.

### Task 4: Update Environment

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Add PostgreSQL variables**

Use `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME`.

- [ ] **Step 2: Add Redis variables for future use**

Add `REDIS_HOST`, `REDIS_PORT`, `REDIS_TTL`, and `REDIS_PREFIX`.

### Task 5: Verify

**Files:**
- No file edits.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

- [ ] **Step 2: Run unit tests**

Run: `npm run test`

- [ ] **Step 3: Run e2e tests**

Run: `npm run test:e2e`

- [ ] **Step 4: Run build**

Run: `npm run build`

- [ ] **Step 5: Run startup check**

Run the app and confirm startup logs include the database connection status if the PostgreSQL server is reachable.
