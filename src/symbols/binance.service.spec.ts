import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BinanceService, type BinanceFetcher } from './binance.service';

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
});
