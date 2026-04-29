import { BadRequestException, Logger } from '@nestjs/common';
import { Candle } from '../../symbols/binance.service';
import {
  WatchlistEntity,
  WatchlistStatus,
  WatchlistTimeframe,
} from '../../watchlist/entities/watchlist.entity';
import { StrategyConfigEntity } from '../entities/strategy-config.entity';
import { StrategyKey } from '../strategy-config.constants';
import { StrategyRegistry } from './strategy-registry';
import {
  StrategyContext,
  StrategyRunner,
  StrategySignal,
} from './strategy.types';
import { StrategyRunnerService } from './strategy-runner.service';

function createCandles(closes: number[]): Candle[] {
  return closes.map((close, index) => ({
    openTime: index,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
    closeTime: index,
  }));
}

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

function createConfig(
  overrides: Partial<StrategyConfigEntity> = {},
): StrategyConfigEntity {
  return {
    id: 'strategy-config-id',
    watchlistId: 'watchlist-id',
    strategyKey: StrategyKey.EMA_CROSS,
    enabled: true,
    paramsJson: {},
    watchlist: createWatchItem(),
    createdAt: new Date('2026-04-28T00:00:00.000Z'),
    updatedAt: new Date('2026-04-28T00:00:00.000Z'),
    ...overrides,
  };
}

function createRunner(
  strategyKey: StrategyKey,
  result: StrategySignal | null,
): { runner: StrategyRunner; run: jest.Mock<StrategySignal | null> } {
  const run = jest.fn<StrategySignal | null, [StrategyContext]>(() => result);

  return {
    runner: {
      strategyKey,
      run,
    },
    run,
  };
}

function createService(
  runnersByKey: Partial<Record<StrategyKey, StrategyRunner>>,
): {
  service: StrategyRunnerService;
  registry: Pick<StrategyRegistry, 'get'>;
} {
  const registry = {
    get: jest.fn((strategyKey: StrategyKey) => {
      const runner = runnersByKey[strategyKey];

      if (!runner) {
        throw new BadRequestException(`Unsupported strategy ${strategyKey}`);
      }

      return runner;
    }),
  };

  return {
    service: new StrategyRunnerService(registry as StrategyRegistry),
    registry: registry,
  };
}

describe('StrategyRunnerService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs enabled strategy configs and returns only emitted signals', () => {
    const candles = createCandles([10, 11, 12]);
    const emaSignal: StrategySignal = {
      strategyKey: StrategyKey.EMA_CROSS,
      direction: 'LONG',
      price: 12,
      reason: 'EMA signal',
    };
    const ema = createRunner(StrategyKey.EMA_CROSS, emaSignal);
    const rsi = createRunner(StrategyKey.RSI_EXTREME, null);
    const { service } = createService({
      [StrategyKey.EMA_CROSS]: ema.runner,
      [StrategyKey.RSI_EXTREME]: rsi.runner,
    });

    const result = service.runStrategies(createWatchItem(), candles, [
      createConfig({
        strategyKey: StrategyKey.EMA_CROSS,
        paramsJson: { slowPeriod: 34 },
      }),
      createConfig({
        strategyKey: StrategyKey.RSI_EXTREME,
        paramsJson: { oversold: 25 },
      }),
    ]);

    expect(result).toEqual([emaSignal]);
    expect(ema.run).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles,
      params: { fastPeriod: 9, slowPeriod: 34 },
    });
    expect(rsi.run).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles,
      params: { period: 14, oversold: 25, overbought: 70 },
    });
  });

  it('skips disabled strategy configs', () => {
    const ema = createRunner(StrategyKey.EMA_CROSS, null);
    const { service, registry } = createService({
      [StrategyKey.EMA_CROSS]: ema.runner,
    });

    const result = service.runStrategies(
      createWatchItem(),
      createCandles([10, 11]),
      [
        createConfig({
          strategyKey: StrategyKey.EMA_CROSS,
          enabled: false,
        }),
      ],
    );

    expect(result).toEqual([]);
    expect(registry.get).not.toHaveBeenCalled();
    expect(ema.run).not.toHaveBeenCalled();
  });

  it('continues running remaining strategies when one strategy throws', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const throwingRunner = createRunner(StrategyKey.EMA_CROSS, null);
    throwingRunner.run.mockImplementation(() => {
      throw new Error('indicator failed');
    });
    const macdSignal: StrategySignal = {
      strategyKey: StrategyKey.MACD_CROSS,
      direction: 'SHORT',
      price: 9,
      reason: 'MACD signal',
    };
    const macd = createRunner(StrategyKey.MACD_CROSS, macdSignal);
    const { service } = createService({
      [StrategyKey.EMA_CROSS]: throwingRunner.runner,
      [StrategyKey.MACD_CROSS]: macd.runner,
    });

    const result = service.runStrategies(
      createWatchItem({ symbol: 'ETHUSDT' }),
      createCandles([11, 10, 9]),
      [
        createConfig({ strategyKey: StrategyKey.EMA_CROSS }),
        createConfig({ strategyKey: StrategyKey.MACD_CROSS }),
      ],
    );

    expect(result).toEqual([macdSignal]);
    expect(macd.run).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Strategy EMA_CROSS failed for ETHUSDT 1h: indicator failed',
      ),
      expect.any(String),
    );
  });

  it('logs unsupported strategy keys and keeps processing valid strategies', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const rsiSignal: StrategySignal = {
      strategyKey: StrategyKey.RSI_EXTREME,
      direction: 'LONG',
      price: 10,
      reason: 'RSI signal',
    };
    const rsi = createRunner(StrategyKey.RSI_EXTREME, rsiSignal);
    const { service } = createService({
      [StrategyKey.RSI_EXTREME]: rsi.runner,
    });

    const result = service.runStrategies(
      createWatchItem(),
      createCandles([9, 10]),
      [
        createConfig({ strategyKey: 'UNKNOWN' }),
        createConfig({ strategyKey: StrategyKey.RSI_EXTREME }),
      ],
    );

    expect(result).toEqual([rsiSignal]);
    expect(rsi.run).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Strategy UNKNOWN failed for BTCUSDT 1h: Unsupported strategy UNKNOWN',
      ),
      expect.any(String),
    );
  });

  it('treats missing paramsJson as an empty params override', () => {
    const ema = createRunner(StrategyKey.EMA_CROSS, null);
    const { service } = createService({
      [StrategyKey.EMA_CROSS]: ema.runner,
    });

    service.runStrategies(createWatchItem(), createCandles([10, 11]), [
      createConfig({
        strategyKey: StrategyKey.EMA_CROSS,
        paramsJson: undefined as unknown as Record<string, unknown>,
      }),
    ]);

    expect(ema.run).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { fastPeriod: 9, slowPeriod: 21 },
      }),
    );
  });
});
