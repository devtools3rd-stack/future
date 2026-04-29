# Crypto Signal API

NestJS backend for the local crypto signal app.

## Stack

- NestJS
- TypeORM
- External PostgreSQL
- `@nestjs/schedule`
- Binance Futures public REST API
- Telegram Bot API

No Docker and no `docker-compose` are required for this backend. PostgreSQL is expected to already exist on a separate server.

## Environment

Copy `.env.example` to `.env` and fill the database values.

```env
APP_NAME=crypto-signal-api
PORT=3000

BINANCE_FUTURES_BASE_URL=https://fapi.binance.com

DATABASE_URL=
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_SSL=false
```

Database config rules:

- If `DATABASE_URL` is set, it is used first.
- If `DATABASE_URL` is empty, the app uses `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME`.
- Set `DATABASE_SSL=true` when the PostgreSQL server requires SSL.

Telegram bot token and chat ID are stored through the Settings API/table, not hard-coded in `.env`.

## Commands

```bash
npm install
npm run migration:run
npm run seed
npm run start:dev
```

Verification:

```bash
npm test
npm run build
```
