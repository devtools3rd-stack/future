import { SignalDirection, SignalEntity } from './entities/signal.entity';
import { SignalController } from './signal.controller';
import { SignalService } from './signal.service';

function createSignal(overrides: Partial<SignalEntity> = {}): SignalEntity {
  return {
    id: 'signal-id',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    strategyKey: 'EMA_CROSS',
    direction: SignalDirection.LONG,
    price: '98420.00000000',
    message: 'Signal message',
    metaJson: { reason: 'test' },
    createdAt: new Date('2026-04-28T10:00:00.000Z'),
    ...overrides,
  };
}

describe('SignalController', () => {
  it('returns recent signals in a data response', async () => {
    const signals = [createSignal()];
    const signalService = {
      getRecentSignals: jest.fn().mockResolvedValue(signals),
    };
    const controller = new SignalController(
      signalService as unknown as SignalService,
    );

    await expect(controller.getSignals({})).resolves.toEqual({
      data: signals,
    });
    expect(signalService.getRecentSignals).toHaveBeenCalledWith({});
  });

  it('passes optional query filters to the service', async () => {
    const signalService = {
      getRecentSignals: jest.fn().mockResolvedValue([]),
    };
    const controller = new SignalController(
      signalService as unknown as SignalService,
    );

    await controller.getSignals({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      strategyKey: 'EMA_CROSS',
      direction: SignalDirection.LONG,
    });

    expect(signalService.getRecentSignals).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      strategyKey: 'EMA_CROSS',
      direction: SignalDirection.LONG,
    });
  });
});
