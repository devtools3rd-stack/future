# TypeORM Migrations Design

## Goal

Configure TypeORM migrations for the NestJS backend without using `synchronize` to create tables automatically.

## CLI Data Source

Create `src/database/data-source.ts` for TypeORM CLI usage. It loads `.env` with `dotenv`, supports either `DATABASE_URL` or individual `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME` values, and enables SSL when `DATABASE_SSL=true`.

## Runtime Config

Keep Nest runtime config in `src/database/typeorm.options.ts`, still with `synchronize: false`, and add support for `DATABASE_URL` and `DATABASE_SSL=true`.

## Migration

Create the first migration under `src/database/migrations/`. It creates PostgreSQL enum types and the `watchlist`, `strategy_configs`, `signals`, and `settings` tables. Indexes and constraints match the entity schema.

The migration creates `uuid-ossp` if needed for UUID defaults. It does not drop the extension in `down()` to avoid affecting other database objects.

## Scripts

Add npm scripts for TypeORM CLI:

- `typeorm`
- `migration:generate`
- `migration:run`
- `migration:revert`

No Docker or local PostgreSQL setup is included.
