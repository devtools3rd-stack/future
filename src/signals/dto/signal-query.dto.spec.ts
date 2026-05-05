import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SignalDirection } from '../entities/signal.entity';
import { SignalQueryDto } from './signal-query.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

async function validateQuery(
  value: Record<string, unknown>,
): Promise<SignalQueryDto> {
  return (await validationPipe.transform(value, {
    type: 'query',
    metatype: SignalQueryDto,
  })) as SignalQueryDto;
}

describe('SignalQueryDto', () => {
  it('accepts and transforms limit query strings', async () => {
    await expect(
      validateQuery({
        limit: '50',
        symbol: 'BTCUSDT',
        timeframe: '1h',
        strategyKey: 'SMC',
        direction: SignalDirection.LONG,
      }),
    ).resolves.toEqual({
      limit: 50,
      symbol: 'BTCUSDT',
      timeframe: '1h',
      strategyKey: 'SMC',
      direction: SignalDirection.LONG,
    });
  });

  it('rejects non-numeric limits', async () => {
    await expect(validateQuery({ limit: 'abc' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
