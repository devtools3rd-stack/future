# Service Layer Design

## Goal

Add a database service layer for watchlist, strategy config, signals, and settings so controllers do not query repositories directly.

## Architecture

Each domain module owns one service and registers it as a provider/export:

- `WatchlistService`
- `StrategyConfigService`
- `SignalService`
- `SettingsService`

Each service injects its TypeORM repository through `@InjectRepository`.

## Error Handling

Services convert database and not-found cases into Nest HTTP exceptions:

- `NotFoundException` for missing rows on update/delete/get single setting.
- `ConflictException` for PostgreSQL unique constraint errors (`23505`).
- `InternalServerErrorException` for unknown repository/database errors.

## Controllers

No new controllers are added in this task. Future controllers must call these services and must not inject repositories directly.

## Testing

Unit tests use mocked repositories and cover key happy paths, not-found handling, conflict handling, and query filters/order.
