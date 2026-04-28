import { Repository } from 'typeorm';
import { SignalDirection, SignalEntity } from './entities/signal.entity';
import { SignalService } from './signal.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

function createRepository(): MockRepository<SignalEntity> {
  return {
    create: jest.fn((input: Partial<SignalEntity>) => input),
    save: jest.fn((input: Partial<SignalEntity>) => Promise.resolve(input)),
    find: jest.fn(),
    findOne: jest.fn(),
  };
}

describe('SignalService', () => {
  it('saves a signal', async () => {
    const repository = createRepository();
    const service = new SignalService(
      repository as unknown as Repository<SignalEntity>,
    );
    const input = {
      symbol: 'BTCUSDT',
      timeframe: '5m',
      strategyKey: 'rsi',
      direction: SignalDirection.LONG,
      price: '100.00000000',
      message: 'Long signal',
      metaJson: null,
    };

    await service.saveSignal(input);

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(repository.save).toHaveBeenCalledWith(input);
  });

  it('gets recent signals with default limit', async () => {
    const repository = createRepository();
    const service = new SignalService(
      repository as unknown as Repository<SignalEntity>,
    );

    await service.getRecentSignals();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  });

  it('gets last signal by symbol timeframe and strategy', async () => {
    const repository = createRepository();
    const service = new SignalService(
      repository as unknown as Repository<SignalEntity>,
    );

    await service.getLastSignalBySymbolTimeframeStrategy(
      'BTCUSDT',
      '5m',
      'rsi',
    );

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        symbol: 'BTCUSDT',
        timeframe: '5m',
        strategyKey: 'rsi',
      },
      order: { createdAt: 'DESC' },
    });
  });
});
