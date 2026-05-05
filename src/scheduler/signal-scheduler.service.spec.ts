import { Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { Candle } from '../symbols/binance.service';
import { BinanceService } from '../symbols/binance.service';
import { StrategyRunnerService } from '../strategies/engine/strategy-runner.service';
import { StrategySignal } from '../strategies/engine/strategy.types';
import { StrategyConfigEntity } from '../strategies/entities/strategy-config.entity';
import { StrategyConfigService } from '../strategies/strategy-config.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  WatchlistEntity,
  WatchlistStatus,
  WatchlistTimeframe,
} from '../watchlist/entities/watchlist.entity';
import { WatchlistService } from '../watchlist/watchlist.service';
import { CooldownService } from '../signals/cooldown.service';
import { SignalFormatterService } from '../signals/signal-formatter.service';
import { SignalService } from '../signals/signal.service';
import { SignalSchedulerService } from './signal-scheduler.service';

function createWatchItem(
  overrides: Partial<WatchlistEntity> = {},
): WatchlistEntity {
  return {
    id: 'watchlist-id',
    symbol: 'BTCUSDT',
    timeframe: WatchlistTimeframe.ONE_HOUR,
    status: WatchlistStatus.WATCHING,
    strategyConfigs: [],
    createdAt: new Date('2026-04-28T00:00:00.000Z'),
    updatedAt: new Date('2026-04-28T00:00:00.000Z'),
    ...overrides,
  };
}

function createCandle(close = 98420): Candle {
  return {
    openTime: 1,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
    closeTime: 2,
  };
}

function createStrategyConfig(
  overrides: Partial<StrategyConfigEntity> = {},
): StrategyConfigEntity {
  return {
    id: 'strategy-config-id',
    watchlistId: 'watchlist-id',
    strategyKey: 'SMC',
    enabled: true,
    paramsJson: {},
    watchlist: createWatchItem(),
    createdAt: new Date('2026-04-28T00:00:00.000Z'),
    updatedAt: new Date('2026-04-28T00:00:00.000Z'),
    ...overrides,
  };
}

function createSignal(overrides: Partial<StrategySignal> = {}): StrategySignal {
  return {
    strategyKey: 'SMC',
    direction: 'LONG',
    price: 98420,
    stopLoss: 97200,
    takeProfit: 100860,
    reason: 'SMC bullish liquidity sweep with displacement confirmation',
    meta: { liquiditySweep: 'sell-side', fairValueGap: true },
    ...overrides,
  };
}

function createService(
  overrides: {
    watchlist?: WatchlistEntity[];
    candles?: Candle[];
    configs?: StrategyConfigEntity[];
    signals?: StrategySignal[];
    canSendSignal?: boolean;
    fetchOHLCV?: jest.Mock;
    sendMessage?: jest.Mock;
  } = {},
): {
  service: SignalSchedulerService;
  watchlistService: jest.Mocked<
    Pick<WatchlistService, 'getWatchlist' | 'updateStatus'>
  >;
  binanceService: jest.Mocked<Pick<BinanceService, 'fetchOHLCV'>>;
  strategyConfigService: jest.Mocked<
    Pick<StrategyConfigService, 'getEnabledStrategiesByWatchlistId'>
  >;
  strategyRunnerService: jest.Mocked<
    Pick<StrategyRunnerService, 'runStrategies'>
  >;
  cooldownService: jest.Mocked<Pick<CooldownService, 'canSendSignal'>>;
  signalFormatterService: jest.Mocked<
    Pick<SignalFormatterService, 'formatTelegramMessage'>
  >;
  signalService: jest.Mocked<Pick<SignalService, 'saveSignal'>>;
  telegramService: jest.Mocked<Pick<TelegramService, 'sendMessage'>>;
  settingsService: jest.Mocked<Pick<SettingsService, 'getAppSettings'>>;
} {
  const watchlistService = {
    getWatchlist: jest.fn().mockResolvedValue(overrides.watchlist ?? []),
    updateStatus: jest.fn().mockResolvedValue(undefined),
  };
  const binanceService = {
    fetchOHLCV:
      overrides.fetchOHLCV ??
      jest.fn().mockResolvedValue(overrides.candles ?? [createCandle()]),
  };
  const strategyConfigService = {
    getEnabledStrategiesByWatchlistId: jest
      .fn()
      .mockResolvedValue(overrides.configs ?? [createStrategyConfig()]),
  };
  const strategyRunnerService = {
    runStrategies: jest.fn().mockReturnValue(overrides.signals ?? []),
  };
  const cooldownService = {
    canSendSignal: jest.fn().mockResolvedValue(overrides.canSendSignal ?? true),
  };
  const signalFormatterService = {
    formatTelegramMessage: jest.fn().mockReturnValue('formatted message'),
  };
  const signalService = {
    saveSignal: jest.fn().mockResolvedValue(undefined),
  };
  const telegramService = {
    sendMessage:
      overrides.sendMessage ?? jest.fn().mockResolvedValue({ sent: true }),
  };
  const settingsService = {
    getAppSettings: jest.fn().mockResolvedValue({
      telegram_bot_token: '',
      telegram_chat_id: '',
      cooldown_minutes: 30,
    }),
  };

  return {
    service: new SignalSchedulerService(
      watchlistService as unknown as WatchlistService,
      binanceService as unknown as BinanceService,
      strategyConfigService as unknown as StrategyConfigService,
      strategyRunnerService as unknown as StrategyRunnerService,
      cooldownService as unknown as CooldownService,
      signalFormatterService as unknown as SignalFormatterService,
      signalService as unknown as SignalService,
      telegramService as unknown as TelegramService,
      settingsService as unknown as SettingsService,
    ),
    watchlistService,
    binanceService,
    strategyConfigService,
    strategyRunnerService,
    cooldownService,
    signalFormatterService,
    signalService,
    telegramService,
    settingsService,
  };
}

describe('SignalSchedulerService', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-28T08:00:00.000Z'));
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('logs scheduler startup and cron ticks for operational visibility', async () => {
    const { service } = createService();

    (
      service as unknown as {
        onModuleInit: () => void;
      }
    ).onModuleInit();
    await service.handleCron();

    expect(logSpy).toHaveBeenCalledWith(
      'Signal scheduler active: checking closed candles every minute.',
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Signal scheduler tick: loaded 0 watch item(s).',
    );
  });

  it('logs each watch item check and no-signal result', async () => {
    const watchItem = createWatchItem({
      timeframe: WatchlistTimeframe.ONE_MINUTE,
    });
    const { service } = createService({
      watchlist: [watchItem],
      signals: [],
    });

    await service.handleCron();

    expect(logSpy).toHaveBeenCalledWith(
      'Checking BTCUSDT 1m with 1 closed candle(s) from 1 fetched candle(s) and 1 enabled strategy config(s).',
    );
    expect(logSpy).toHaveBeenCalledWith(
      'BTCUSDT 1m checked: no signal detected.',
    );
  });

  it('detects candle close time by timeframe using UTC clock', () => {
    const { service } = createService();

    expect(
      service.isCandleCloseTime(
        '1m' as WatchlistTimeframe,
        new Date('2026-04-28T08:01:00.000Z'),
      ),
    ).toBe(true);
    expect(
      service.isCandleCloseTime(
        WatchlistTimeframe.FIVE_MINUTES,
        new Date('2026-04-28T08:05:00.000Z'),
      ),
    ).toBe(true);
    expect(
      service.isCandleCloseTime(
        WatchlistTimeframe.FIFTEEN_MINUTES,
        new Date('2026-04-28T08:15:00.000Z'),
      ),
    ).toBe(true);
    expect(
      service.isCandleCloseTime(
        WatchlistTimeframe.ONE_HOUR,
        new Date('2026-04-28T08:00:00.000Z'),
      ),
    ).toBe(true);
    expect(
      service.isCandleCloseTime(
        WatchlistTimeframe.FOUR_HOURS,
        new Date('2026-04-28T08:00:00.000Z'),
      ),
    ).toBe(true);
    expect(
      service.isCandleCloseTime(
        WatchlistTimeframe.FOUR_HOURS,
        new Date('2026-04-28T10:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('skips watchlist items whose timeframe has not closed', async () => {
    jest.setSystemTime(new Date('2026-04-28T08:01:00.000Z'));
    const { service, binanceService, watchlistService } = createService({
      watchlist: [createWatchItem({ timeframe: WatchlistTimeframe.ONE_HOUR })],
    });

    await service.handleCron();

    expect(binanceService.fetchOHLCV).not.toHaveBeenCalled();
    expect(watchlistService.updateStatus).not.toHaveBeenCalled();
  });

  it('processes one minute watchlist items every minute', async () => {
    jest.setSystemTime(new Date('2026-04-28T08:01:00.000Z'));
    const { service, binanceService } = createService({
      watchlist: [createWatchItem({ timeframe: '1m' as WatchlistTimeframe })],
    });

    await service.handleCron();

    expect(binanceService.fetchOHLCV).toHaveBeenCalledWith(
      'BTCUSDT',
      '1m',
      200,
    );
  });

  it('runs strategies only with candles closed by the scheduler time', async () => {
    const closedCandle = {
      ...createCandle(98420),
      closeTime: new Date('2026-04-28T07:59:59.999Z').getTime(),
    };
    const currentCandle = {
      ...createCandle(98425),
      closeTime: new Date('2026-04-28T08:00:59.999Z').getTime(),
    };
    const watchItem = createWatchItem({
      timeframe: WatchlistTimeframe.ONE_MINUTE,
    });
    const config = createStrategyConfig();
    const { service, strategyRunnerService } = createService({
      watchlist: [watchItem],
      candles: [closedCandle, currentCandle],
      configs: [config],
    });

    await service.handleCron();

    expect(strategyRunnerService.runStrategies).toHaveBeenCalledWith(
      watchItem,
      [closedCandle],
      [config],
    );
  });

  it('saves detected signals and updates SIGNAL_SENT without sending Telegram', async () => {
    const signal = createSignal();
    const watchItem = createWatchItem();
    const config = createStrategyConfig();
    const {
      service,
      binanceService,
      strategyConfigService,
      strategyRunnerService,
      cooldownService,
      signalFormatterService,
      telegramService,
      signalService,
      settingsService,
      watchlistService,
    } = createService({
      watchlist: [watchItem],
      configs: [config],
      signals: [signal],
    });

    await service.handleCron();

    expect(binanceService.fetchOHLCV).toHaveBeenCalledWith(
      'BTCUSDT',
      '1h',
      200,
    );
    expect(
      strategyConfigService.getEnabledStrategiesByWatchlistId,
    ).toHaveBeenCalledWith(watchItem.id);
    expect(strategyRunnerService.runStrategies).toHaveBeenCalledWith(
      watchItem,
      [createCandle()],
      [config],
    );
    expect(cooldownService.canSendSignal).toHaveBeenCalledWith(
      'BTCUSDT',
      '1h',
      'SMC',
    );
    expect(settingsService.getAppSettings).toHaveBeenCalled();
    expect(signalFormatterService.formatTelegramMessage).toHaveBeenCalledWith({
      signal,
      symbol: 'BTCUSDT',
      timeframe: '1h',
      cooldownMinutes: 30,
    });
    expect(telegramService.sendMessage).not.toHaveBeenCalled();
    expect(signalService.saveSignal).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      strategyKey: 'SMC',
      direction: 'LONG',
      price: '98420',
      stopLoss: '97200',
      takeProfit: '100860',
      message: 'formatted message',
      metaJson: signal.meta,
    });
    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      watchItem.id,
      WatchlistStatus.SIGNAL_SENT,
    );
  });

  it('updates NO_SIGNAL when strategies return no signals', async () => {
    const watchItem = createWatchItem();
    const { service, telegramService, signalService, watchlistService } =
      createService({
        watchlist: [watchItem],
        signals: [],
      });

    await service.handleCron();

    expect(telegramService.sendMessage).not.toHaveBeenCalled();
    expect(signalService.saveSignal).not.toHaveBeenCalled();
    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      watchItem.id,
      WatchlistStatus.NO_SIGNAL,
    );
  });

  it('updates NO_SIGNAL when all signals are skipped by cooldown', async () => {
    const watchItem = createWatchItem();
    const { service, telegramService, signalService, watchlistService } =
      createService({
        watchlist: [watchItem],
        signals: [createSignal()],
        canSendSignal: false,
      });

    await service.handleCron();

    expect(telegramService.sendMessage).not.toHaveBeenCalled();
    expect(signalService.saveSignal).not.toHaveBeenCalled();
    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      watchItem.id,
      WatchlistStatus.NO_SIGNAL,
    );
  });

  it('updates FETCH_ERROR when Binance fetch fails', async () => {
    const watchItem = createWatchItem();
    const { service, watchlistService } = createService({
      watchlist: [watchItem],
      fetchOHLCV: jest.fn().mockRejectedValue(new Error('Binance unavailable')),
    });

    await service.handleCron();

    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      watchItem.id,
      WatchlistStatus.FETCH_ERROR,
    );
  });

  it('ignores Telegram send failures while Telegram delivery is disabled', async () => {
    const watchItem = createWatchItem();
    const { service, signalService, telegramService, watchlistService } =
      createService({
        watchlist: [watchItem],
        signals: [createSignal()],
        sendMessage: jest.fn().mockRejectedValue(new Error('Telegram failed')),
      });

    await service.handleCron();

    expect(telegramService.sendMessage).not.toHaveBeenCalled();
    expect(signalService.saveSignal).toHaveBeenCalled();
    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      watchItem.id,
      WatchlistStatus.SIGNAL_SENT,
    );
  });

  it('continues processing other watchlist items when one item fails', async () => {
    const failingItem = createWatchItem({ id: 'fail-id', symbol: 'FAILUSDT' });
    const okItem = createWatchItem({ id: 'ok-id', symbol: 'OKUSDT' });
    const fetchOHLCV = jest.fn((symbol: string) => {
      if (symbol === 'FAILUSDT') {
        return Promise.reject(new Error('Binance unavailable'));
      }

      return Promise.resolve([createCandle()]);
    });
    const { service, watchlistService } = createService({
      watchlist: [failingItem, okItem],
      fetchOHLCV,
      signals: [createSignal()],
    });

    await service.handleCron();

    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      failingItem.id,
      WatchlistStatus.FETCH_ERROR,
    );
    expect(watchlistService.updateStatus).toHaveBeenCalledWith(
      okItem.id,
      WatchlistStatus.SIGNAL_SENT,
    );
  });
});
