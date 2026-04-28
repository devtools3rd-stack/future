# Telegram Test API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Telegram test notification endpoint using SettingsService-backed credentials.

**Architecture:** `TelegramController` exposes `/api/telegram/test`; `TelegramService` owns settings resolution, Telegram API request construction, and error mapping. Fetch is injectable for deterministic unit tests.

**Tech Stack:** NestJS 11, TypeScript, ConfigService, native fetch, Jest.

---

### Task 1: RED Tests

**Files:**
- Create: `src/telegram/telegram.service.spec.ts`
- Create: `src/telegram/telegram.controller.spec.ts`

- [ ] Add service tests for successful send, env fallback, missing config, wrong token, wrong chat id, generic API error, and network error.
- [ ] Add controller tests for `POST /api/telegram/test` response and delegation.
- [ ] Run `npm test -- telegram.service.spec.ts telegram.controller.spec.ts --runInBand` and verify RED.

### Task 2: Implementation

**Files:**
- Create: `src/telegram/telegram.service.ts`
- Create: `src/telegram/telegram.controller.ts`
- Modify: `src/telegram/telegram.module.ts`

- [ ] Implement `TelegramService.sendMessage()` and `sendTestMessage()`.
- [ ] Implement error mapping using Nest exceptions.
- [ ] Register `SettingsModule`, controller, provider, and service export.

### Task 3: Verification and Commit

- [ ] Run targeted tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test -- --runInBand`.
- [ ] Run `npm run test:e2e -- --runInBand`.
- [ ] Run `npm run build`.
- [ ] Run GitNexus detect changes.
- [ ] Commit feature files only.
