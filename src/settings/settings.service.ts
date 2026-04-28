import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { SettingEntity } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingEntity)
    private readonly settingsRepository: Repository<SettingEntity>,
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
}
