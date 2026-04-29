# Technical Indicators API Design

## Goal

Expose clear TypeScript helper functions for strategy engine technical indicators.

## API

- `calculateEMA(values: number[], period: number): number[]`
- `calculateRSI(values: number[], period: number): Array<number | null>`
- `calculateMACD(values: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): Array<MacdValue | null>`

`MacdValue`:

```ts
{
  macd: number;
  signal: number;
  histogram: number;
}
```

## Behavior

- No external indicator library.
- Invalid periods or insufficient input return `[]`.
- RSI and MACD keep output index-aligned with source values using `null` for early positions that do not have enough data.
- Helpers do not throw for missing data.
- Existing strategies will use the new helpers.

## Testing

- Unit tests cover enough data, insufficient data, invalid periods, and stable known outputs for EMA, RSI, and MACD.
- Existing strategy tests must keep passing after migrating to the new helper names.
