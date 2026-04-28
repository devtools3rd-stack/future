# Binance Symbols Design

## Goal

Add a `SymbolsModule` API for searching Binance USD-M Futures USDT perpetual symbols.

## API

`GET /api/symbols/search?q=btc`

Response:

```json
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT"
    }
  ]
}
```

## Behavior

- Read `BINANCE_FUTURES_BASE_URL` from `ConfigService`.
- Default base URL to `https://fapi.binance.com` when env is not configured.
- Call `/fapi/v1/exchangeInfo`.
- Keep only symbols where:
  - `quoteAsset` is `USDT`
  - `contractType` is `PERPETUAL`
  - `status` is `TRADING`
- Search by user query case-insensitively against `symbol`.
- Return an empty `data` array for empty or missing query.
- Cache the filtered symbol list in memory for 10 minutes.

## Error Handling

- Binance non-2xx response: throw `BadGatewayException`.
- Invalid Binance payload shape: throw `BadGatewayException`.
- Network/fetch failure: throw `ServiceUnavailableException`.

## Testing

- Unit test filtering, search, cache hit, cache expiry, non-2xx errors, invalid payload, and network errors.
- Unit test controller response wrapping and empty query behavior through service delegation.
