import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SettingEntity } from './entities/setting.entity';
import { SettingsService } from './settings.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

function createRepository(): MockRepository<SettingEntity> {
  return {
    create: jest.fn((input: Partial<SettingEntity>) => input),
    save: jest.fn((input: Partial<SettingEntity>) => Promise.resolve(input)),
    find: jest.fn(),
    findOne: jest.fn(),
  };
}

function createConfigService(
  values: Record<string, string | number | undefined> = {},
): ConfigService {
  const get = jest.fn((key: string) => values[key]);

  return { get } as unknown as ConfigService;
}

function createService(
  repository: MockRepository<SettingEntity>,
  configService = createConfigService(),
): SettingsService {
  return new SettingsService(
    repository as unknown as Repository<SettingEntity>,
    configService,
  );
}

describe('SettingsService', () => {
  it('gets all settings ordered by key', async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.getSettings();

    expect(repository.find).toHaveBeenCalledWith({ order: { key: 'ASC' } });
  });

  it('gets one setting by key', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue({
      key: 'cooldown_minutes',
      value: '30',
    });
    const service = createService(repository);

    await service.getSetting('cooldown_minutes');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { key: 'cooldown_minutes' },
    });
  });

  it('throws NotFoundException when a setting is missing', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = createService(repository);

    await expect(service.getSetting('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates an existing setting', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue({
      key: 'cooldown_minutes',
      value: '30',
    });
    const service = createService(repository);

    await service.setSetting('cooldown_minutes', '60');

    expect(repository.save).toHaveBeenCalledWith({
      key: 'cooldown_minutes',
      value: '60',
    });
  });

  it('creates a missing setting', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = createService(repository);

    await service.setSetting('new_key', 'value');

    expect(repository.create).toHaveBeenCalledWith({
      key: 'new_key',
      value: 'value',
    });
  });

  it('returns app settings with database values taking priority over env values', async () => {
    const repository = createRepository();
    repository.find?.mockResolvedValue([
      { key: 'telegram_bot_token', value: 'db-token' },
      { key: 'cooldown_minutes', value: '45' },
    ]);
    const service = createService(
      repository,
      createConfigService({
        TELEGRAM_BOT_TOKEN: 'env-token',
        TELEGRAM_CHAT_ID: 'env-chat',
        COOLDOWN_MINUTES: '30',
      }),
    );

    await expect(service.getAppSettings()).resolves.toEqual({
      telegram_bot_token: 'db-token',
      telegram_chat_id: 'env-chat',
      cooldown_minutes: 45,
    });
  });

  it('uses defaults when settings are missing from both database and env', async () => {
    const repository = createRepository();
    repository.find?.mockResolvedValue([]);
    const service = createService(repository);

    await expect(service.getAppSettings()).resolves.toEqual({
      telegram_bot_token: '',
      telegram_chat_id: '',
      cooldown_minutes: 30,
    });
  });

  it('updates only provided app settings and stores values as text', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    repository.find?.mockResolvedValue([
      { key: 'telegram_bot_token', value: 'new-token' },
      { key: 'telegram_chat_id', value: '' },
      { key: 'cooldown_minutes', value: '60' },
    ]);
    const service = createService(repository);

    const result = await service.updateAppSettings({
      telegram_bot_token: 'new-token',
      cooldown_minutes: 60,
    });

    expect(repository.create).toHaveBeenCalledWith({
      key: 'telegram_bot_token',
      value: 'new-token',
    });
    expect(repository.create).toHaveBeenCalledWith({
      key: 'cooldown_minutes',
      value: '60',
    });
    expect(repository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'telegram_chat_id',
      }),
    );
    expect(result).toEqual({
      telegram_bot_token: 'new-token',
      telegram_chat_id: '',
      cooldown_minutes: 60,
    });
  });
});
