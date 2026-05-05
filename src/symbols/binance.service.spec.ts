import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BinanceService,
  type BinanceFetcher,
  type BinanceInterval,
} from './binance.service';

const BASE_URL = 'https://binance.test';

function createConfigService(baseUrl = BASE_URL): ConfigService {
  const get = jest.fn((key: string) => {
    if (key === 'BINANCE_FUTURES_BASE_URL') {
      return baseUrl;
    }

    return undefined;
  });

  return { get } as unknown as ConfigService;
}

function createResponse(
  body: unknown,
  overrides: Partial<Response> = {},
): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn<() => Promise<unknown>>().mockResolvedValue(body),
    ...overrides,
  } as unknown as Response;
}

function createExchangeInfoPayload() {
  return {
    symbols: [
      {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        contractType: 'PERPETUAL',
        status: 'TRADING',
      },
      {
        symbol: 'ETHUSDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        contractType: 'PERPETUAL',
        status: 'TRADING',
      },
      {
        symbol: 'BTCBUSD',
        baseAsset: 'BTC',
        quoteAsset: 'BUSD',
        contractType: 'PERPETUAL',
        status: 'TRADING',
      },
      {
        symbol: 'BTCUSDT_260327',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        contractType: 'CURRENT_QUARTER',
        status: 'TRADING',
      },
      {
        symbol: 'OLDUSDT',
        baseAsset: 'OLD',
        quoteAsset: 'USDT',
        contractType: 'PERPETUAL',
        status: 'BREAK',
      },
    ],
  };
}

function createKlinesPayload() {
  return [
    [
      1499040000000,
      '0.01634790',
      '0.80000000',
      '0.01575800',
      '0.01577100',
      '148976.11427815',
      1499644799999,
      '2434.19055334',
      308,
      '1756.87402397',
      '28.46694368',
      '17928899.62484339',
    ],
  ];
}

describe('BinanceService', () => {
  it('filters Binance exchangeInfo to active USDT perpetual symbols and searches case-insensitively', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValue(createResponse(createExchangeInfoPayload()));
    const service = new BinanceService(createConfigService(), fetcher);

    const result = await service.searchSymbols('btc');

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE_URL}/fapi/v1/exchangeInfo`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual([
      {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      },
    ]);
  });

  it('returns an empty list for an empty query without calling Binance', async () => {
    const fetcher = jest.fn<BinanceFetcher>();
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.searchSymbols('   ')).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses cached symbols for 10 minutes', async () => {
    let now = 1_000;
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValue(createResponse(createExchangeInfoPayload()));
    const service = new BinanceService(
      createConfigService(),
      fetcher,
      () => now,
    );

    await service.searchSymbols('btc');
    now += 9 * 60 * 1_000;
    await service.searchSymbols('eth');

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refreshes cached symbols after 10 minutes', async () => {
    let now = 1_000;
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValueOnce(createResponse(createExchangeInfoPayload()))
      .mockResolvedValueOnce(
        createResponse({
          symbols: [
            {
              symbol: 'ETHUSDT',
              baseAsset: 'ETH',
              quoteAsset: 'USDT',
              contractType: 'PERPETUAL',
              status: 'TRADING',
            },
          ],
        }),
      );
    const service = new BinanceService(
      createConfigService(),
      fetcher,
      () => now,
    );

    await service.searchSymbols('btc');
    now += 10 * 60 * 1_000 + 1;
    const result = await service.searchSymbols('eth');

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      {
        symbol: 'ETHUSDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
      },
    ]);
  });

  it('throws BadGatewayException when Binance returns a non-2xx response', async () => {
    const fetcher = jest.fn<BinanceFetcher>().mockResolvedValue(
      createResponse(
        { msg: 'bad request' },
        {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        },
      ),
    );
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.searchSymbols('btc')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws BadGatewayException when Binance returns an invalid payload', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValue(createResponse({ symbols: null }));
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.searchSymbols('btc')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws ServiceUnavailableException when Binance request fails', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockRejectedValue(new Error('network down'));
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.searchSymbols('btc')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('fetches OHLCV candles and normalizes Binance string numbers', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValue(createResponse(createKlinesPayload()));
    const service = new BinanceService(createConfigService(), fetcher);

    const result = await service.fetchOHLCV('BTCUSDT', '1h', 50);

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE_URL}/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=50`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual([
      {
        openTime: 1499040000000,
        open: 0.0163479,
        high: 0.8,
        low: 0.015758,
        close: 0.015771,
        volume: 148976.11427815,
        closeTime: 1499644799999,
      },
    ]);
  });

  it('uses default limit 200 when fetching OHLCV', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValue(createResponse(createKlinesPayload()));
    const service = new BinanceService(createConfigService(), fetcher);

    await service.fetchOHLCV('ETHUSDT', '5m');

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE_URL}/fapi/v1/klines?symbol=ETHUSDT&interval=5m&limit=200`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it.each<BinanceInterval>(['1m', '5m', '15m', '1h', '4h'])(
    'supports %s OHLCV interval',
    async (interval) => {
      const fetcher = jest
        .fn<BinanceFetcher>()
        .mockResolvedValue(createResponse(createKlinesPayload()));
      const service = new BinanceService(createConfigService(), fetcher);

      await service.fetchOHLCV('BTCUSDT', interval, 1);

      expect(fetcher).toHaveBeenCalledWith(
        `${BASE_URL}/fapi/v1/klines?symbol=BTCUSDT&interval=${interval}&limit=1`,
        expect.objectContaining({ method: 'GET' }),
      );
    },
  );

  it('throws BadGatewayException when Binance OHLCV returns a non-2xx response', async () => {
    const fetcher = jest.fn<BinanceFetcher>().mockResolvedValue(
      createResponse(
        { msg: 'bad request' },
        {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        },
      ),
    );
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.fetchOHLCV('BTCUSDT', '1h')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws BadGatewayException when Binance OHLCV payload is invalid', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockResolvedValue(createResponse([['bad-open-time']]));
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.fetchOHLCV('BTCUSDT', '1h')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws ServiceUnavailableException when Binance OHLCV request fails', async () => {
    const fetcher = jest
      .fn<BinanceFetcher>()
      .mockRejectedValue(new Error('network down'));
    const service = new BinanceService(createConfigService(), fetcher);

    await expect(service.fetchOHLCV('BTCUSDT', '1h')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
