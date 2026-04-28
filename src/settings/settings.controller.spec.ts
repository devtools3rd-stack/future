import {
  AppSettings,
  SettingsService,
  UpdateAppSettingsInput,
} from './settings.service';
import { SettingsController } from './settings.controller';

function createSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    telegram_bot_token: 'token',
    telegram_chat_id: 'chat',
    cooldown_minutes: 30,
    ...overrides,
  };
}

describe('SettingsController', () => {
  it('returns app settings in a data envelope', async () => {
    const settings = createSettings();
    const getAppSettings = jest.fn().mockResolvedValue(settings);
    const controller = new SettingsController({
      getAppSettings,
    } as unknown as SettingsService);

    const response = await controller.getSettings();

    expect(getAppSettings).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ data: settings });
  });

  it('updates app settings through the service and returns a data envelope', async () => {
    const body: UpdateAppSettingsInput = {
      telegram_chat_id: 'chat-2',
      cooldown_minutes: 60,
    };
    const settings = createSettings(body);
    const updateAppSettings = jest.fn().mockResolvedValue(settings);
    const controller = new SettingsController({
      updateAppSettings,
    } as unknown as SettingsService);

    const response = await controller.updateSettings(body);

    expect(updateAppSettings).toHaveBeenCalledWith(body);
    expect(response).toEqual({ data: settings });
  });
});
