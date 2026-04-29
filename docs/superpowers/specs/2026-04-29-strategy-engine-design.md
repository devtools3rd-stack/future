# Strategy Engine Design

## Goal

Add a strategy engine architecture where each strategy has a `run(context)` method and is managed by a registry keyed by `strategyKey`.

## Core Types

- `StrategyDirection`: `LONG` or `SHORT`
- `StrategySignal`: strategy key, direction, price, reason, optional meta
- `StrategyContext`: symbol, timeframe, candles, params
- `StrategyRunner`: strategy contract with `strategyKey` and `run(context)`

`StrategyContext.candles` uses the existing `Candle` type from `BinanceService`.

## Registry

`StrategyRegistry` is an injectable service that:

- stores strategies by `StrategyKey`
- returns one strategy by key
- returns all strategies
- runs a strategy by key
- throws `BadRequestException` for unsupported keys

## Initial Strategies

- `EMA_CROSS`: emits LONG when fast EMA crosses above slow EMA, SHORT when it crosses below.
- `RSI_EXTREME`: emits LONG when RSI is at or below oversold, SHORT when RSI is at or above overbought.
- `MACD_CROSS`: emits LONG when MACD line crosses above signal line, SHORT when it crosses below.

Each strategy returns `null` when there is not enough candle history or no signal.

## Defaults

- EMA: `fastPeriod = 12`, `slowPeriod = 26`
- RSI: `period = 14`, `oversold = 30`, `overbought = 70`
- MACD: `fastPeriod = 12`, `slowPeriod = 26`, `signalPeriod = 9`

## Testing

- Registry tests cover lookup, run, all strategies, and invalid keys.
- Strategy tests cover not-enough-candles, signal emission, signal direction, final close price, reason, and meta.
