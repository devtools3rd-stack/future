# PostgreSQL TypeORM Design

## Goal

Add PostgreSQL support to the NestJS backend using TypeORM, with configuration read from `.env` through `ConfigModule`.

## Architecture

`DatabaseModule` owns database setup. It imports `TypeOrmModule.forRootAsync()` and reads PostgreSQL settings from `ConfigService`.

The application uses `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME` as the canonical environment variable names. The user-provided `DB_*` values are mapped into those canonical names in `.env`.

## Connection Logging

`DatabaseService` receives the TypeORM `DataSource` and logs database connection status when the Nest app bootstraps. If TypeORM fails to connect, app startup fails and TypeORM/Nest logs the connection error.

## Redis Variables

The provided Redis values are added to `.env` and `.env.example` for later use, but no Redis module or package is added in this change.

## Testing

Unit tests cover TypeORM config generation and database connection startup logging. Existing health endpoint tests continue to verify the app route.
