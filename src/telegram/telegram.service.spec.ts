import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppSettings, SettingsService } from '../settings/settings.service';
import {
  TELEGRAM_TEST_MESSAGE,
  TelegramFetcher,
  TelegramService,
} from './telegram.service';

const TELEGRAM_BASE_URL = 'https://api.telegram.org';

function createSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    telegram_bot_token: 'db-token',
    telegram_chat_id: 'db-chat',
    cooldown_minutes: 30,
    ...overrides,
  };
}

function createSettingsService(settings = createSettings()): SettingsService {
  return {
    getAppSettings: jest.fn().mockResolvedValue(settings),
  } as unknown as SettingsService;
}

function createConfigService(
  values: Record<string, string | undefined> = {},
): ConfigService {
  const get = jest.fn((key: string) => values[key]);

  return { get } as unknown as ConfigService;
}

function createResponse(
  body: unknown,
  overrides: Partial<Response> = {},
): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn<() => Promise<unknown>>().mockResolvedValue(body),
    ...overrides,
  } as unknown as Response;
}

describe('TelegramService', () => {
  it('sends a message using credentials from settings', async () => {
    const fetcher = jest.fn<TelegramFetcher>().mockResolvedValue(
      createResponse({
        ok: true,
        result: { message_id: 123 },
      }),
    );
    const service = new TelegramService(
      createSettingsService(),
      createConfigService(),
      fetcher,
    );

    const result = await service.sendMessage('hello');

    expect(fetcher).toHaveBeenCalledWith(
      `${TELEGRAM_BASE_URL}/botdb-token/sendMessage`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: 'db-chat', text: 'hello' }),
      }),
    );
    expect(result).toEqual({ sent: true });
  });

  it('falls back to env credentials when settings values are empty', async () => {
    const fetcher = jest.fn<TelegramFetcher>().mockResolvedValue(
      createResponse({
        ok: true,
        result: { message_id: 123 },
      }),
    );
    const service = new TelegramService(
      createSettingsService(
        createSettings({
          telegram_bot_token: '',
          telegram_chat_id: '',
        }),
      ),
      createConfigService({
        TELEGRAM_BOT_TOKEN: 'env-token',
        TELEGRAM_CHAT_ID: 'env-chat',
      }),
      fetcher,
    );

    await service.sendMessage('hello');

    expect(fetcher).toHaveBeenCalledWith(
      `${TELEGRAM_BASE_URL}/botenv-token/sendMessage`,
      expect.objectContaining({
        body: JSON.stringify({ chat_id: 'env-chat', text: 'hello' }),
      }),
    );
  });

  it('sends the standard test notification message', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ sent: true });
    const service = new TelegramService(
      createSettingsService(),
      createConfigService(),
      jest.fn<TelegramFetcher>(),
    );
    service.sendMessage = sendMessage;

    await expect(service.sendTestMessage()).resolves.toEqual({ sent: true });
    expect(sendMessage).toHaveBeenCalledWith(TELEGRAM_TEST_MESSAGE);
  });

  it('throws BadRequestException when bot token is missing', async () => {
    const service = new TelegramService(
      createSettingsService(
        createSettings({
          telegram_bot_token: '',
        }),
      ),
      createConfigService(),
      jest.fn<TelegramFetcher>(),
    );

    await expect(service.sendMessage('hello')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws BadRequestException when chat id is missing', async () => {
    const service = new TelegramService(
      createSettingsService(
        createSettings({
          telegram_chat_id: '',
        }),
      ),
      createConfigService(),
      jest.fn<TelegramFetcher>(),
    );

    await expect(service.sendMessage('hello')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws UnauthorizedException for invalid bot token responses', async () => {
    const fetcher = jest.fn<TelegramFetcher>().mockResolvedValue(
      createResponse(
        {
          ok: false,
          error_code: 401,
          description: 'Unauthorized',
        },
        { ok: false, status: 401, statusText: 'Unauthorized' },
      ),
    );
    const service = new TelegramService(
      createSettingsService(),
      createConfigService(),
      fetcher,
    );

    await expect(service.sendMessage('hello')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws BadRequestException for invalid chat id responses', async () => {
    const fetcher = jest.fn<TelegramFetcher>().mockResolvedValue(
      createResponse(
        {
          ok: false,
          error_code: 400,
          description: 'Bad Request: chat not found',
        },
        { ok: false, status: 400, statusText: 'Bad Request' },
      ),
    );
    const service = new TelegramService(
      createSettingsService(),
      createConfigService(),
      fetcher,
    );

    await expect(service.sendMessage('hello')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws BadGatewayException for generic Telegram API errors', async () => {
    const fetcher = jest.fn<TelegramFetcher>().mockResolvedValue(
      createResponse(
        {
          ok: false,
          error_code: 500,
          description: 'Internal server error',
        },
        { ok: false, status: 500, statusText: 'Internal Server Error' },
      ),
    );
    const service = new TelegramService(
      createSettingsService(),
      createConfigService(),
      fetcher,
    );

    await expect(service.sendMessage('hello')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws ServiceUnavailableException when Telegram request fails', async () => {
    const fetcher = jest
      .fn<TelegramFetcher>()
      .mockRejectedValue(new Error('network down'));
    const service = new TelegramService(
      createSettingsService(),
      createConfigService(),
      fetcher,
    );

    await expect(service.sendMessage('hello')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
