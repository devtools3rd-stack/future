# Settings API Design

## Goal

Expose application settings through NestJS APIs backed by the existing `settings` database table.

## API

`GET /api/settings`

Returns:

```json
{
  "data": {
    "telegram_bot_token": "",
    "telegram_chat_id": "",
    "cooldown_minutes": 30
  }
}
```

`PATCH /api/settings`

Accepts any subset of:

```json
{
  "telegram_bot_token": "token",
  "telegram_chat_id": "chat-id",
  "cooldown_minutes": 30
}
```

## Behavior

- Settings are stored in the `settings` table through TypeORM.
- Runtime PATCH writes only to the database and never edits `.env`.
- Database values have priority over environment variables.
- Environment variables are fallback values when a setting is missing in the database.
- `cooldown_minutes` is stored as text in the database and returned as a number in API responses.

## Validation

- `telegram_bot_token`: optional string on PATCH.
- `telegram_chat_id`: optional string on PATCH.
- `cooldown_minutes`: optional number on PATCH, minimum `1`.
- Unknown fields are rejected by the existing global validation pipe.

## Testing

- Unit tests cover DB/env merge precedence, partial updates, numeric conversion, DB text writes, and controller response envelopes.
- DTO validation tests cover accepted partial payloads, minimum cooldown, type checks, and unknown-field protection through decorators.
