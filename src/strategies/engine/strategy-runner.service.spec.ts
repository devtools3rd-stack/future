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
    strategyKey: StrategyKey.SMC,
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
    const smcSignal: StrategySignal = {
      strategyKey: StrategyKey.SMC,
      direction: 'LONG',
      price: 12,
      reason: 'SMC signal',
    };
    const smc = createRunner(StrategyKey.SMC, smcSignal);
    const ict = createRunner(StrategyKey.ICT, null);
    const { service } = createService({
      [StrategyKey.SMC]: smc.runner,
      [StrategyKey.ICT]: ict.runner,
    });

    const result = service.runStrategies(createWatchItem(), candles, [
      createConfig({
        strategyKey: StrategyKey.SMC,
        paramsJson: { minDisplacementPercent: 0.5 },
      }),
      createConfig({
        strategyKey: StrategyKey.ICT,
        paramsJson: { killZone: 'london' },
      }),
    ]);

    expect(result).toEqual([smcSignal]);
    expect(smc.run).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles,
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.5,
        minRiskReward: 2,
        requireFairValueGap: true,
        usePremiumDiscount: true,
      },
    });
    expect(ict.run).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles,
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.25,
        killZone: 'london',
        requireFairValueGap: true,
        minRiskReward: 2,
      },
    });
  });

  it('skips disabled strategy configs', () => {
    const smc = createRunner(StrategyKey.SMC, null);
    const { service, registry } = createService({
      [StrategyKey.SMC]: smc.runner,
    });

    const result = service.runStrategies(
      createWatchItem(),
      createCandles([10, 11]),
      [
        createConfig({
          strategyKey: StrategyKey.SMC,
          enabled: false,
        }),
      ],
    );

    expect(result).toEqual([]);
    expect(registry.get).not.toHaveBeenCalled();
    expect(smc.run).not.toHaveBeenCalled();
  });

  it('continues running remaining strategies when one strategy throws', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const throwingRunner = createRunner(StrategyKey.SMC, null);
    throwingRunner.run.mockImplementation(() => {
      throw new Error('indicator failed');
    });
    const ictSignal: StrategySignal = {
      strategyKey: StrategyKey.ICT,
      direction: 'SHORT',
      price: 9,
      reason: 'ICT signal',
    };
    const ict = createRunner(StrategyKey.ICT, ictSignal);
    const { service } = createService({
      [StrategyKey.SMC]: throwingRunner.runner,
      [StrategyKey.ICT]: ict.runner,
    });

    const result = service.runStrategies(
      createWatchItem({ symbol: 'ETHUSDT' }),
      createCandles([11, 10, 9]),
      [
        createConfig({ strategyKey: StrategyKey.SMC }),
        createConfig({ strategyKey: StrategyKey.ICT }),
      ],
    );

    expect(result).toEqual([ictSignal]);
    expect(ict.run).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Strategy SMC failed for ETHUSDT 1h: indicator failed',
      ),
      expect.any(String),
    );
  });

  it('logs unsupported strategy keys and keeps processing valid strategies', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    const ictSignal: StrategySignal = {
      strategyKey: StrategyKey.ICT,
      direction: 'LONG',
      price: 10,
      reason: 'ICT signal',
    };
    const ict = createRunner(StrategyKey.ICT, ictSignal);
    const { service } = createService({
      [StrategyKey.ICT]: ict.runner,
    });

    const result = service.runStrategies(
      createWatchItem(),
      createCandles([9, 10]),
      [
        createConfig({ strategyKey: 'UNKNOWN' }),
        createConfig({ strategyKey: StrategyKey.ICT }),
      ],
    );

    expect(result).toEqual([ictSignal]);
    expect(ict.run).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Strategy UNKNOWN failed for BTCUSDT 1h: Unsupported strategy UNKNOWN',
      ),
      expect.any(String),
    );
  });

  it('treats missing paramsJson as an empty params override', () => {
    const smc = createRunner(StrategyKey.SMC, null);
    const { service } = createService({
      [StrategyKey.SMC]: smc.runner,
    });

    service.runStrategies(createWatchItem(), createCandles([10, 11]), [
      createConfig({
        strategyKey: StrategyKey.SMC,
        paramsJson: undefined as unknown as Record<string, unknown>,
      }),
    ]);

    expect(smc.run).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          swingLookback: 5,
          liquidityLookback: 20,
          minDisplacementPercent: 0.3,
          minRiskReward: 2,
          requireFairValueGap: true,
          usePremiumDiscount: true,
        },
      }),
    );
  });
});
