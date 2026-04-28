# Database-Aware Health Design

## Goal

Extend `GET /health` to report app status, current timestamp, database connection status, and runtime environment.

## Response Contract

When the database check succeeds:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-04-28T10:00:00.000Z",
  "env": "development"
}
```

When the database check fails, return HTTP 200 with an explicit degraded status:

```json
{
  "status": "degraded",
  "database": "error",
  "timestamp": "...",
  "env": "development",
  "error": "database_unavailable"
}
```

## Architecture

Move health logic into `HealthService`. The service injects TypeORM `DataSource` and `ConfigService`, runs `SELECT 1`, and builds the response. The controller delegates to the service.

## Environment

Use `NODE_ENV`, defaulting to `development`.

## Testing

Unit tests cover connected and degraded database states. The e2e health test verifies the new response contract.
