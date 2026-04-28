# Watchlist API Design

## Goal

Expose Watchlist CRUD endpoints through a controller while keeping all database access inside `WatchlistService`.

## Endpoints

- `GET /api/watchlist`
- `POST /api/watchlist`
- `PATCH /api/watchlist/:id`
- `DELETE /api/watchlist/:id`

## Request DTOs

`POST /api/watchlist` accepts:

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h"
}
```

Validation:

- `symbol` must be a non-empty string.
- `timeframe` must be one of `5m`, `15m`, `1h`, `4h`.
- `status` is not accepted on create; service defaults it to `WATCHING`.

`PATCH /api/watchlist/:id` accepts `timeframe` and `status` only.

## Response Shape

All endpoints return a clear data envelope:

```json
{
  "data": {}
}
```

Delete returns:

```json
{
  "data": {
    "deleted": true
  }
}
```

## Duplicate Handling

Duplicate `symbol + timeframe` remains enforced by the database unique index and mapped by `WatchlistService` to `ConflictException`.

## Validation Setup

Enable Nest global `ValidationPipe` with whitelist and transform enabled in `main.ts`.

## Testing

Add DTO validation tests and controller unit tests. Controller tests assert only service calls and response shape; no controller directly queries repositories.
