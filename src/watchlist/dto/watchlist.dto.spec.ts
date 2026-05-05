import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import {
  WatchlistStatus,
  WatchlistTimeframe,
} from '../entities/watchlist.entity';
import { CreateWatchlistDto } from './create-watchlist.dto';
import { UpdateWatchlistDto } from './update-watchlist.dto';

describe('Watchlist DTOs', () => {
  it('accepts valid create payload', async () => {
    const dto = new CreateWatchlistDto();
    dto.symbol = 'BTCUSDT';
    dto.timeframe = WatchlistTimeframe.ONE_HOUR;

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('accepts one minute create timeframe', async () => {
    const dto = new CreateWatchlistDto();
    dto.symbol = 'BTCUSDT';
    dto.timeframe = '1m' as WatchlistTimeframe;

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects invalid create timeframe', async () => {
    const dto = new CreateWatchlistDto();
    dto.symbol = 'BTCUSDT';
    dto.timeframe = '30m' as WatchlistTimeframe;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe('timeframe');
  });

  it('rejects empty create symbol', async () => {
    const dto = new CreateWatchlistDto();
    dto.symbol = '';
    dto.timeframe = WatchlistTimeframe.ONE_HOUR;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'symbol')).toBe(true);
  });

  it('accepts valid patch payload', async () => {
    const dto = new UpdateWatchlistDto();
    dto.timeframe = '1m' as WatchlistTimeframe;
    dto.status = WatchlistStatus.NO_SIGNAL;

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects unknown patch fields through ValidationPipe whitelist', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    await expect(
      pipe.transform(
        { symbol: 'ETHUSDT', timeframe: WatchlistTimeframe.ONE_HOUR },
        { type: 'body', metatype: UpdateWatchlistDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
