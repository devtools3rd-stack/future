# Binance Symbols Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a NestJS Symbols API backed by Binance Futures public exchangeInfo.

**Architecture:** `SymbolsController` exposes `/api/symbols/search`; `BinanceService` owns Binance HTTP access, filtering, search, cache, and clear Nest exceptions. The module exports the service for future scheduler/strategy usage.

**Tech Stack:** NestJS 11, TypeScript, ConfigModule/ConfigService, native `fetch`, Jest.

---

### Task 1: Tests

**Files:**
- Create: `src/symbols/binance.service.spec.ts`
- Create: `src/symbols/symbols.controller.spec.ts`

- [ ] **Step 1: Write failing BinanceService tests**

Cover these behaviors:
- filters USD-M perpetual symbols to `USDT` + `PERPETUAL` + `TRADING`
- searches case-insensitively
- returns empty array for empty query
- cache hit avoids another fetch within 10 minutes
- cache expiry fetches again
- non-2xx response throws `BadGatewayException`
- invalid payload throws `BadGatewayException`
- fetch rejection throws `ServiceUnavailableException`

- [ ] **Step 2: Run service tests and verify RED**

Run: `npm test -- binance.service.spec.ts --runInBand`

Expected: fail because `src/symbols/binance.service.ts` does not exist.

- [ ] **Step 3: Write failing SymbolsController tests**

Cover these behaviors:
- `search()` returns `{ data: [...] }`
- controller passes query to service
- empty query response remains `{ data: [] }`

- [ ] **Step 4: Run controller tests and verify RED**

Run: `npm test -- symbols.controller.spec.ts --runInBand`

Expected: fail because `src/symbols/symbols.controller.ts` does not exist.

### Task 2: Implementation

**Files:**
- Create: `src/symbols/binance.service.ts`
- Create: `src/symbols/symbols.controller.ts`
- Modify: `src/symbols/symbols.module.ts`
- Modify: `.env.example`

- [ ] **Step 1: Implement BinanceService**

Add `searchSymbols(query?: string)` with native fetch, ConfigService base URL, 10-minute memory cache, Binance filtering, and Nest exceptions.

- [ ] **Step 2: Implement SymbolsController**

Expose `GET /api/symbols/search` and return `{ data: await binanceService.searchSymbols(q) }`.

- [ ] **Step 3: Wire SymbolsModule**

Register controller/provider and export `BinanceService`.

- [ ] **Step 4: Add env example**

Add `BINANCE_FUTURES_BASE_URL=https://fapi.binance.com` to `.env.example`.

### Task 3: Verification and Commit

- [ ] **Step 1: Run targeted tests**

Run:
- `npm test -- binance.service.spec.ts symbols.controller.spec.ts --runInBand`

- [ ] **Step 2: Run full checks**

Run:
- `npm run lint`
- `npm run test -- --runInBand`
- `npm run test:e2e -- --runInBand`
- `npm run build`

- [ ] **Step 3: Run GitNexus change detection**

Run `gitnexus_detect_changes({ scope: "all" })`.

- [ ] **Step 4: Commit**

Commit tracked feature files only. Keep untracked user files out of the commit.
