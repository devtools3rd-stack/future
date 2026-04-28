# Crypto Signal Backend Design

## Goal

Create a clean NestJS + TypeScript backend scaffold for a crypto signal app directly in `d:\Future\backend`.

## Architecture

The app uses NestJS module boundaries for health, database, watchlist, symbols, settings, telegram, strategies, signals, and scheduler. `AppModule` imports all feature modules, and `ConfigModule` is global so every module can read environment variables from `.env`.

Only the health module exposes behavior in this initial scaffold. `GET /health` returns the app status, app name, and an ISO timestamp.

## Components

- `src/app.module.ts`: root module and global configuration setup.
- `src/health`: health endpoint controller and module.
- `src/database`: database boundary placeholder.
- `src/watchlist`: watchlist boundary placeholder.
- `src/symbols`: symbols boundary placeholder.
- `src/settings`: settings boundary placeholder.
- `src/telegram`: telegram integration boundary placeholder.
- `src/strategies`: signal strategy boundary placeholder.
- `src/signals`: generated signal boundary placeholder.
- `src/scheduler`: scheduled jobs boundary placeholder.

## Testing

Add an e2e test for `GET /health`. Verify the test fails before the endpoint exists, then implement the minimal health module/controller and rerun the test.
