# Watchlist API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add validated Watchlist REST endpoints using DTOs and the existing `WatchlistService`.

**Architecture:** `WatchlistController` delegates to `WatchlistService`. DTOs use `class-validator`; global `ValidationPipe` applies whitelist/transform behavior.

**Tech Stack:** NestJS 11, class-validator, class-transformer, Jest.

---

### Task 1: DTO Validation

**Files:**
- Create: `src/watchlist/dto/create-watchlist.dto.ts`
- Create: `src/watchlist/dto/update-watchlist.dto.ts`
- Create: `src/watchlist/dto/watchlist.dto.spec.ts`

- [ ] **Step 1: Write RED tests**

Test valid create, invalid timeframe, invalid symbol, valid patch, and unknown-field stripping through `ValidationPipe`.

- [ ] **Step 2: Implement DTOs**

Use `@IsString`, `@IsNotEmpty`, `@IsEnum`, and `@IsOptional`.

### Task 2: Controller

**Files:**
- Create: `src/watchlist/watchlist.controller.ts`
- Create: `src/watchlist/watchlist.controller.spec.ts`
- Modify: `src/watchlist/watchlist.module.ts`

- [ ] **Step 1: Write RED controller tests**

Test each route method delegates to the service and wraps response in `{ data }`.

- [ ] **Step 2: Implement controller**

Add `@Controller('api/watchlist')` with GET, POST, PATCH, DELETE.

### Task 3: Validation Pipe and Dependencies

**Files:**
- Modify: `src/main.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependencies**

Install `class-validator@0.15.1` and `class-transformer@0.5.1`.

- [ ] **Step 2: Enable global ValidationPipe**

Use `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.

### Task 4: Verify

Run `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`. Re-index GitNexus and commit.
