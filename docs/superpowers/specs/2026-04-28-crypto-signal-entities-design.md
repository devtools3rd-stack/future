# Crypto Signal Entities Design

## Goal

Add TypeORM entities for the crypto signal domain: Watchlist, StrategyConfig, Signal, and Setting.

## Entity Placement

Entities live beside their feature modules:

- `src/watchlist/entities/watchlist.entity.ts`
- `src/strategies/entities/strategy-config.entity.ts`
- `src/signals/entities/signal.entity.ts`
- `src/settings/entities/setting.entity.ts`

The corresponding modules import `TypeOrmModule.forFeature()` so existing `autoLoadEntities: true` picks them up for the root database connection.

## Tables and Constraints

- `watchlist`: UUID primary key, symbol, timeframe enum, status enum, create/update timestamps, unique index on `symbol + timeframe`.
- `strategy_configs`: UUID primary key, many-to-one relation to watchlist through `watchlist_id`, strategy key, enabled flag, `params_json` JSONB, create/update timestamps, unique index on `watchlist_id + strategy_key`.
- `signals`: UUID primary key, symbol, timeframe, strategy key, direction enum, decimal price, text message, nullable `meta_json` JSONB, created timestamp, index on `symbol + timeframe + strategy_key + created_at`.
- `settings`: text primary key, text value, updated timestamp.

## Type Choices

`Signal.price` uses PostgreSQL `numeric(18, 8)` to preserve crypto decimal precision without JavaScript float rounding at persistence boundaries. JSON fields use `jsonb`.

## Testing

Entity metadata tests verify table names, primary keys, column names, enum values, relation join column, and indexes.
