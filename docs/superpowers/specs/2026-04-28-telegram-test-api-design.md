# Telegram Test API Design

## Goal

Add a Telegram test notification endpoint backed by app settings and the Telegram Bot API.

## API

`POST /api/telegram/test`

Sends:

```text
✅ Test notification from crypto signal app
```

Response:

```json
{
  "data": {
    "sent": true
  }
}
```

## Behavior

- `TelegramService` reads settings through `SettingsService.getAppSettings()`.
- If `telegram_bot_token` or `telegram_chat_id` from settings is an empty string, it falls back to env:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CHAT_ID`
- Sends a JSON POST request to Telegram Bot API `sendMessage`.
- Does not write secrets back into `.env`.

## Error Handling

- Missing token or chat id: `BadRequestException`.
- HTTP 401 or Telegram unauthorized response: `UnauthorizedException`.
- HTTP 400 with chat-related description: `BadRequestException`.
- Other Telegram non-2xx or `ok: false`: `BadGatewayException`.
- Network/fetch failure: `ServiceUnavailableException`.

All errors are handled through Nest exceptions so Telegram failures do not crash the backend process.

## Testing

- Unit tests cover DB setting usage, env fallback when DB values are empty, request URL/body, controller response envelope, missing settings, invalid token, invalid chat id, Telegram API errors, and network errors.
