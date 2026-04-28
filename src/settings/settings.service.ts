import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { SettingEntity } from './entities/setting.entity';

export type AppSettings = {
  telegram_bot_token: string;
  telegram_chat_id: string;
  cooldown_minutes: number;
};

export type UpdateAppSettingsInput = Partial<AppSettings>;

const DEFAULT_APP_SETTINGS: AppSettings = {
  telegram_bot_token: '',
  telegram_chat_id: '',
  cooldown_minutes: 30,
};

const ENV_KEYS: Record<keyof AppSettings, string> = {
  telegram_bot_token: 'TELEGRAM_BOT_TOKEN',
  telegram_chat_id: 'TELEGRAM_CHAT_ID',
  cooldown_minutes: 'COOLDOWN_MINUTES',
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingEntity)
    private readonly settingsRepository: Repository<SettingEntity>,
    private readonly configService: ConfigService,
  ) {}

  getSettings(): Promise<SettingEntity[]> {
    return this.settingsRepository.find({ order: { key: 'ASC' } });
  }

  async getSetting(key: string): Promise<SettingEntity> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async setSetting(key: string, value: string): Promise<SettingEntity> {
    const existing = await this.settingsRepository.findOne({
      where: { key },
    });
    const setting = existing
      ? { ...existing, value }
      : this.settingsRepository.create({ key, value });

    try {
      return await this.settingsRepository.save(setting);
    } catch (error) {
      mapRepositoryError(error, 'Setting already exists');
    }
  }

  async getAppSettings(): Promise<AppSettings> {
    const rows = await this.getSettings();
    const databaseSettings = new Map(
      rows.map(({ key, value }) => [key, value]),
    );

    return {
      telegram_bot_token: this.getStringSetting(
        'telegram_bot_token',
        databaseSettings,
      ),
      telegram_chat_id: this.getStringSetting(
        'telegram_chat_id',
        databaseSettings,
      ),
      cooldown_minutes: this.getNumberSetting(
        'cooldown_minutes',
        databaseSettings,
      ),
    };
  }

  async updateAppSettings(input: UpdateAppSettingsInput): Promise<AppSettings> {
    const updates: Array<Promise<SettingEntity>> = [];

    if (input.telegram_bot_token !== undefined) {
      updates.push(
        this.setSetting('telegram_bot_token', input.telegram_bot_token),
      );
    }

    if (input.telegram_chat_id !== undefined) {
      updates.push(this.setSetting('telegram_chat_id', input.telegram_chat_id));
    }

    if (input.cooldown_minutes !== undefined) {
      updates.push(
        this.setSetting('cooldown_minutes', String(input.cooldown_minutes)),
      );
    }

    await Promise.all(updates);

    return this.getAppSettings();
  }

  private getStringSetting(
    key: Extract<keyof AppSettings, 'telegram_bot_token' | 'telegram_chat_id'>,
    databaseSettings: Map<string, string>,
  ): string {
    return (
      databaseSettings.get(key) ??
      this.configService.get<string>(ENV_KEYS[key]) ??
      DEFAULT_APP_SETTINGS[key]
    );
  }

  private getNumberSetting(
    key: Extract<keyof AppSettings, 'cooldown_minutes'>,
    databaseSettings: Map<string, string>,
  ): number {
    const rawValue =
      databaseSettings.get(key) ??
      this.configService.get<string | number>(ENV_KEYS[key]) ??
      DEFAULT_APP_SETTINGS[key];
    const parsedValue =
      typeof rawValue === 'number' ? rawValue : Number(rawValue);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : DEFAULT_APP_SETTINGS[key];
  }
}
