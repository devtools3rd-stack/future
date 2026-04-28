import { StrategyConfigController } from './strategy-config.controller';
import { StrategyKey } from './strategy-config.constants';
import { StrategyConfigService } from './strategy-config.service';

describe('StrategyConfigController', () => {
  it('returns strategy configs in a data envelope', async () => {
    const configs = [
      {
        strategyKey: StrategyKey.EMA_CROSS,
        enabled: false,
        paramsJson: {},
      },
    ];
    const getConfigsWithDefaultsByWatchlistId = jest
      .fn()
      .mockResolvedValue(configs);
    const controller = new StrategyConfigController({
      getConfigsWithDefaultsByWatchlistId,
    } as unknown as StrategyConfigService);

    const response = await controller.getStrategies({
      watchlistId: 'watch-id',
    });

    expect(getConfigsWithDefaultsByWatchlistId).toHaveBeenCalledWith(
      'watch-id',
    );
    expect(response).toEqual({ data: configs });
  });

  it('upserts one strategy config and returns a data envelope', async () => {
    const config = {
      id: 'config-id',
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.MACD_CROSS,
      enabled: true,
      paramsJson: { fast: 12 },
    };
    const upsertStrategyConfig = jest.fn().mockResolvedValue(config);
    const controller = new StrategyConfigController({
      upsertStrategyConfig,
    } as unknown as StrategyConfigService);

    const response = await controller.upsertStrategy(
      {
        watchlistId: 'watch-id',
        strategyKey: StrategyKey.MACD_CROSS,
      },
      {
        enabled: true,
        paramsJson: { fast: 12 },
      },
    );

    expect(upsertStrategyConfig).toHaveBeenCalledWith({
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.MACD_CROSS,
      enabled: true,
      paramsJson: { fast: 12 },
    });
    expect(response).toEqual({ data: config });
  });
});
