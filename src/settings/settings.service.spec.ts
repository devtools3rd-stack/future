import { NotFoundException } from '@nestjs/common';
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

describe('SettingsService', () => {
  it('gets all settings ordered by key', async () => {
    const repository = createRepository();
    const service = new SettingsService(
      repository as unknown as Repository<SettingEntity>,
    );

    await service.getSettings();

    expect(repository.find).toHaveBeenCalledWith({ order: { key: 'ASC' } });
  });

  it('gets one setting by key', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue({
      key: 'cooldown_minutes',
      value: '30',
    });
    const service = new SettingsService(
      repository as unknown as Repository<SettingEntity>,
    );

    await service.getSetting('cooldown_minutes');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { key: 'cooldown_minutes' },
    });
  });

  it('throws NotFoundException when a setting is missing', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = new SettingsService(
      repository as unknown as Repository<SettingEntity>,
    );

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
    const service = new SettingsService(
      repository as unknown as Repository<SettingEntity>,
    );

    await service.setSetting('cooldown_minutes', '60');

    expect(repository.save).toHaveBeenCalledWith({
      key: 'cooldown_minutes',
      value: '60',
    });
  });

  it('creates a missing setting', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = new SettingsService(
      repository as unknown as Repository<SettingEntity>,
    );

    await service.setSetting('new_key', 'value');

    expect(repository.create).toHaveBeenCalledWith({
      key: 'new_key',
      value: 'value',
    });
  });
});
