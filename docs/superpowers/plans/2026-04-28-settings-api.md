# Settings API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add database-backed settings management APIs for Telegram and cooldown configuration.

**Architecture:** Extend `SettingsService` with typed app settings methods that merge DB rows over env fallback values. Add a controller and DTO in `SettingsModule`; controllers only call the service.

**Tech Stack:** NestJS 11, TypeScript, TypeORM repositories, ConfigService, class-validator, Jest.

---

### Task 1: RED Tests

**Files:**
- Modify: `src/settings/settings.service.spec.ts`
- Create: `src/settings/settings.controller.spec.ts`
- Create: `src/settings/dto/update-settings.dto.spec.ts`

- [ ] Add service tests for DB-over-env precedence, env fallback, default values, partial update writes, and cooldown numeric response.
- [ ] Add controller tests for `GET /api/settings` and `PATCH /api/settings` response envelopes.
- [ ] Add DTO validation tests for strings, numeric cooldown `>= 1`, partial update, and unknown fields.
- [ ] Run `npm test -- settings.service.spec.ts settings.controller.spec.ts update-settings.dto.spec.ts --runInBand` and verify RED.

### Task 2: Implementation

**Files:**
- Modify: `src/settings/settings.service.ts`
- Modify: `src/settings/settings.module.ts`
- Create: `src/settings/settings.controller.ts`
- Create: `src/settings/dto/update-settings.dto.ts`

- [ ] Add typed settings constants and response/update types.
- [ ] Add `getAppSettings()` and `updateAppSettings()` to `SettingsService`.
- [ ] Add `SettingsController` for `GET /api/settings` and `PATCH /api/settings`.
- [ ] Register the controller in `SettingsModule`.

### Task 3: Verification and Commit

- [ ] Run targeted tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test -- --runInBand`.
- [ ] Run `npm run test:e2e -- --runInBand`.
- [ ] Run `npm run build`.
- [ ] Run GitNexus detect changes.
- [ ] Commit feature files only, leaving user-owned untracked files alone.
