import { BadRequestException, ValidationPipe } from '@nestjs/common';
import {
  StrategyConfigParamsDto,
  UpsertStrategyConfigDto,
} from './strategy-config.dto';
import { StrategyKey } from '../strategy-config.constants';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

async function validateParams(
  value: Record<string, unknown>,
): Promise<StrategyConfigParamsDto> {
  return (await validationPipe.transform(value, {
    type: 'param',
    metatype: StrategyConfigParamsDto,
  })) as StrategyConfigParamsDto;
}

async function validateBody(
  value: Record<string, unknown>,
): Promise<UpsertStrategyConfigDto> {
  return (await validationPipe.transform(value, {
    type: 'body',
    metatype: UpsertStrategyConfigDto,
  })) as UpsertStrategyConfigDto;
}

describe('StrategyConfig DTOs', () => {
  it('accepts supported strategy keys', async () => {
    await expect(
      validateParams({
        watchlistId: 'watch-id',
        strategyKey: StrategyKey.SMC,
      }),
    ).resolves.toEqual({
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.SMC,
    });
  });

  it('rejects unsupported strategy keys', async () => {
    await expect(
      validateParams({
        watchlistId: 'watch-id',
        strategyKey: 'UNKNOWN',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts paramsJson as an object', async () => {
    await expect(
      validateBody({
        enabled: true,
        paramsJson: { period: 14 },
      }),
    ).resolves.toEqual({
      enabled: true,
      paramsJson: { period: 14 },
    });
  });

  it('rejects paramsJson arrays', async () => {
    await expect(
      validateBody({
        enabled: true,
        paramsJson: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects paramsJson null', async () => {
    await expect(
      validateBody({
        enabled: true,
        paramsJson: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-boolean enabled values', async () => {
    await expect(
      validateBody({
        enabled: 'true',
        paramsJson: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
