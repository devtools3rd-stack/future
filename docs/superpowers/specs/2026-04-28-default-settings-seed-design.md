# Default Settings Seed Design

## Goal

Add an idempotent seed command for default rows in the `settings` table.

## Defaults

Seed these settings when missing:

- `telegram_bot_token` with an empty string
- `telegram_chat_id` with an empty string
- `cooldown_minutes` with `30`

## Behavior

The seed must be safe to run repeatedly and must not overwrite settings that users already configured. It uses PostgreSQL `INSERT ... ON CONFLICT ("key") DO NOTHING`.

## Execution

Add `src/database/seeds/run-seed.ts` as a CLI entrypoint using the existing TypeORM `AppDataSource`. Add `npm run seed` to execute it through `ts-node`.

## Testing

Unit tests verify that the seed emits the correct default key/value pairs and uses `ON CONFLICT ("key") DO NOTHING`.
