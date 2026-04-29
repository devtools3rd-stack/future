import { AppSettings, SettingsService } from '../settings/settings.service';
import { SignalEntity, SignalDirection } from './entities/signal.entity';
import { SignalService } from './signal.service';
import { CooldownService } from './cooldown.service';

function createSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    telegram_bot_token: '',
    telegram_chat_id: '',
    cooldown_minutes: 30,
    ...overrides,
  };
}

function createSignal(overrides: Partial<SignalEntity> = {}): SignalEntity {
  return {
    id: 'signal-id',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    strategyKey: 'EMA_CROSS',
    direction: SignalDirection.LONG,
    price: '100000.00000000',
    message: 'signal message',
    metaJson: null,
    createdAt: new Date('2026-04-28T10:00:00.000Z'),
    ...overrides,
  };
}

function createService(
  options: {
    settings?: Partial<AppSettings>;
    lastSignal?: SignalEntity | null;
  } = {},
): {
  service: CooldownService;
  settingsService: Pick<SettingsService, 'getAppSettings'>;
  signalService: Pick<SignalService, 'getLastSignalBySymbolTimeframeStrategy'>;
} {
  const settingsService = {
    getAppSettings: jest
      .fn()
      .mockResolvedValue(createSettings(options.settings)),
  };
  const signalService = {
    getLastSignalBySymbolTimeframeStrategy: jest
      .fn()
      .mockResolvedValue(options.lastSignal ?? null),
  };

  return {
    service: new CooldownService(
      settingsService as unknown as SettingsService,
      signalService as unknown as SignalService,
    ),
    settingsService,
    signalService,
  };
}

describe('CooldownService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-28T10:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows sending when there is no previous signal', async () => {
    const { service, signalService } = createService();

    await expect(
      service.canSendSignal('BTCUSDT', '1h', 'EMA_CROSS'),
    ).resolves.toBe(true);
    expect(
      signalService.getLastSignalBySymbolTimeframeStrategy,
    ).toHaveBeenCalledWith('BTCUSDT', '1h', 'EMA_CROSS');
  });

  it('skips sending when the last signal is still inside cooldown', async () => {
    const { service } = createService({
      settings: { cooldown_minutes: 30 },
      lastSignal: createSignal({
        createdAt: new Date('2026-04-28T10:10:00.000Z'),
      }),
    });

    await expect(
      service.canSendSignal('BTCUSDT', '1h', 'EMA_CROSS'),
    ).resolves.toBe(false);
  });

  it('allows sending when the last signal has passed cooldown', async () => {
    const { service } = createService({
      settings: { cooldown_minutes: 30 },
      lastSignal: createSignal({
        createdAt: new Date('2026-04-28T09:59:59.000Z'),
      }),
    });

    await expect(
      service.canSendSignal('BTCUSDT', '1h', 'EMA_CROSS'),
    ).resolves.toBe(true);
  });

  it('uses 30 minutes as default when cooldown setting is invalid', async () => {
    const { service } = createService({
      settings: {
        cooldown_minutes: Number.NaN,
      },
      lastSignal: createSignal({
        createdAt: new Date('2026-04-28T10:05:00.000Z'),
      }),
    });

    await expect(
      service.canSendSignal('BTCUSDT', '1h', 'EMA_CROSS'),
    ).resolves.toBe(false);
  });

  it('allows sending when default cooldown has elapsed after invalid setting', async () => {
    const { service } = createService({
      settings: {
        cooldown_minutes: Number.NaN,
      },
      lastSignal: createSignal({
        createdAt: new Date('2026-04-28T09:59:00.000Z'),
      }),
    });

    await expect(
      service.canSendSignal('BTCUSDT', '1h', 'EMA_CROSS'),
    ).resolves.toBe(true);
  });
});
