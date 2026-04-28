import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings, SettingsService } from './settings.service';

type DataResponse<T> = {
  data: T;
};

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<DataResponse<AppSettings>> {
    const settings = await this.settingsService.getAppSettings();

    return { data: settings };
  }

  @Patch()
  async updateSettings(
    @Body() body: UpdateSettingsDto,
  ): Promise<DataResponse<AppSettings>> {
    const settings = await this.settingsService.updateAppSettings(body);

    return { data: settings };
  }
}
