# Strategy Config API Design

## Goal

Expose strategy configuration APIs nested under watchlist items.

## API

`GET /api/watchlist/:watchlistId/strategies`

Returns all supported strategy configs. Missing database rows are represented by default configs.

`PUT /api/watchlist/:watchlistId/strategies/:strategyKey`

Upserts one strategy config by `watchlistId + strategyKey`.

## Supported Strategies

- `EMA_CROSS`
- `RSI_EXTREME`
- `MACD_CROSS`

## Default Configs

If a watchlist item has no saved config for a supported strategy, the API returns:

```json
{
  "strategyKey": "EMA_CROSS",
  "enabled": false,
  "paramsJson": {}
}
```

Saved database configs override defaults by `strategyKey`.

## Validation

- `strategyKey` must be one of the supported strategy keys.
- `enabled` must be boolean.
- `paramsJson` must be a plain object, not an array or null.
- `watchlistId` must reference an existing watchlist item before GET or PUT proceeds.

## Testing

- Service tests cover watchlist existence checks, default config responses, DB/default merge, and upsert behavior.
- Controller tests cover response envelopes and parameter/body delegation.
- DTO tests cover valid strategy keys and object-only `paramsJson`.
