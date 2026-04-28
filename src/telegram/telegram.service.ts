import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

export type TelegramFetcher = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type TelegramSendResult = {
  sent: true;
};

type TelegramApiResponse = {
  ok?: unknown;
  description?: unknown;
  error_code?: unknown;
};

export const TELEGRAM_TEST_MESSAGE =
  '✅ Test notification from crypto signal app';

const TELEGRAM_DEFAULT_BASE_URL = 'https://api.telegram.org';
const TELEGRAM_FETCHER = Symbol('TELEGRAM_FETCHER');

const defaultTelegramFetcher: TelegramFetcher = (input, init) =>
  globalThis.fetch(input, init);

@Injectable()
export class TelegramService {
  private readonly fetcher: TelegramFetcher;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
    @Optional()
    @Inject(TELEGRAM_FETCHER)
    fetcher?: TelegramFetcher,
  ) {
    this.fetcher = fetcher ?? defaultTelegramFetcher;
  }

  async sendTestMessage(): Promise<TelegramSendResult> {
    return this.sendMessage(TELEGRAM_TEST_MESSAGE);
  }

  async sendMessage(message: string): Promise<TelegramSendResult> {
    const { token, chatId } = await this.getTelegramCredentials();
    const response = await this.sendTelegramRequest(token, chatId, message);
    const payload = (await response.json()) as TelegramApiResponse;

    if (payload.ok !== true) {
      this.throwTelegramError(response.status, payload);
    }

    return { sent: true };
  }

  private async getTelegramCredentials(): Promise<{
    token: string;
    chatId: string;
  }> {
    const settings = await this.settingsService.getAppSettings();
    const token = this.firstConfiguredValue(
      settings.telegram_bot_token,
      this.configService.get<string>('TELEGRAM_BOT_TOKEN'),
    );
    const chatId = this.firstConfiguredValue(
      settings.telegram_chat_id,
      this.configService.get<string>('TELEGRAM_CHAT_ID'),
    );

    if (!token) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    if (!chatId) {
      throw new BadRequestException('Telegram chat id is not configured');
    }

    return { token, chatId };
  }

  private async sendTelegramRequest(
    token: string,
    chatId: string,
    message: string,
  ): Promise<Response> {
    try {
      const response = await this.fetcher(this.buildSendMessageUrl(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as TelegramApiResponse;
        this.throwTelegramError(response.status, payload);
      }

      return response;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException('Telegram API is unavailable');
    }
  }

  private buildSendMessageUrl(token: string): string {
    return `${TELEGRAM_DEFAULT_BASE_URL}/bot${token}/sendMessage`;
  }

  private firstConfiguredValue(
    primary: string | undefined,
    fallback: string | undefined,
  ): string | undefined {
    const primaryValue = primary?.trim();

    if (primaryValue) {
      return primaryValue;
    }

    const fallbackValue = fallback?.trim();

    return fallbackValue || undefined;
  }

  private throwTelegramError(
    status: number,
    payload: TelegramApiResponse,
  ): never {
    const description =
      typeof payload.description === 'string' ? payload.description : '';
    const errorCode =
      typeof payload.error_code === 'number' ? payload.error_code : status;
    const normalizedDescription = description.toLowerCase();

    if (status === 401 || errorCode === 401) {
      throw new UnauthorizedException('Telegram bot token is invalid');
    }

    if (
      status === 400 &&
      (normalizedDescription.includes('chat not found') ||
        normalizedDescription.includes('chat_id') ||
        normalizedDescription.includes('chat id'))
    ) {
      throw new BadRequestException('Telegram chat id is invalid');
    }

    throw new BadGatewayException(description || 'Telegram API request failed');
  }
}
