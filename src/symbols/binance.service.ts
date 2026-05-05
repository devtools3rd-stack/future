import {
  BadGatewayException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type BinanceFetcher = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type BinanceSymbolSearchResult = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
};

export type BinanceInterval = '1m' | '5m' | '15m' | '1h' | '4h';

export type Candle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

type BinanceExchangeInfoSymbol = {
  symbol?: unknown;
  baseAsset?: unknown;
  quoteAsset?: unknown;
  contractType?: unknown;
  status?: unknown;
};

type BinanceExchangeInfoResponse = {
  symbols?: unknown;
};

type BinanceTradableSymbol = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  contractType: string;
  status: string;
};

const BINANCE_FUTURES_DEFAULT_BASE_URL = 'https://fapi.binance.com';
const BINANCE_EXCHANGE_INFO_PATH = '/fapi/v1/exchangeInfo';
const BINANCE_KLINES_PATH = '/fapi/v1/klines';
const SYMBOL_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_KLINES_LIMIT = 200;
const BINANCE_FETCHER = Symbol('BINANCE_FETCHER');
const BINANCE_NOW = Symbol('BINANCE_NOW');
const SUPPORTED_INTERVALS: readonly BinanceInterval[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
];

const defaultBinanceFetcher: BinanceFetcher = (input, init) =>
  globalThis.fetch(input, init);

@Injectable()
export class BinanceService {
  private cachedSymbols: BinanceSymbolSearchResult[] | null = null;
  private cacheExpiresAt = 0;
  private readonly fetcher: BinanceFetcher;
  private readonly now: () => number;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(BINANCE_FETCHER)
    fetcher?: BinanceFetcher,
    @Optional()
    @Inject(BINANCE_NOW)
    now?: () => number,
  ) {
    this.fetcher = fetcher ?? defaultBinanceFetcher;
    this.now = now ?? Date.now;
  }

  async searchSymbols(query?: string): Promise<BinanceSymbolSearchResult[]> {
    const normalizedQuery = query?.trim().toUpperCase();

    if (!normalizedQuery) {
      return [];
    }

    const symbols = await this.getSymbols();

    return symbols.filter((symbol) => symbol.symbol.includes(normalizedQuery));
  }

  async fetchOHLCV(
    symbol: string,
    interval: BinanceInterval,
    limit = DEFAULT_KLINES_LIMIT,
  ): Promise<Candle[]> {
    if (!SUPPORTED_INTERVALS.includes(interval)) {
      throw new BadGatewayException(`Unsupported Binance interval ${interval}`);
    }

    const response = await this.fetchBinance(
      this.buildKlinesUrl(symbol, interval, limit),
      'klines',
    );
    const payload = (await response.json()) as unknown;

    if (!Array.isArray(payload)) {
      throw new BadGatewayException('Invalid Binance klines response');
    }

    return payload.map((item) => this.normalizeKline(item));
  }

  private async getSymbols(): Promise<BinanceSymbolSearchResult[]> {
    const currentTime = this.now();

    if (this.cachedSymbols && currentTime < this.cacheExpiresAt) {
      return this.cachedSymbols;
    }

    const symbols = await this.fetchExchangeInfoSymbols();
    this.cachedSymbols = symbols;
    this.cacheExpiresAt = currentTime + SYMBOL_CACHE_TTL_MS;

    return symbols;
  }

  private async fetchExchangeInfoSymbols(): Promise<
    BinanceSymbolSearchResult[]
  > {
    const response = await this.fetchExchangeInfo();
    const payload = (await response.json()) as BinanceExchangeInfoResponse;

    if (!Array.isArray(payload.symbols)) {
      throw new BadGatewayException('Invalid Binance exchangeInfo response');
    }

    return payload.symbols
      .filter((symbol): symbol is BinanceTradableSymbol =>
        this.isTradableUsdtPerpetual(symbol),
      )
      .map((symbol) => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
      }));
  }

  private async fetchExchangeInfo(): Promise<Response> {
    return this.fetchBinance(this.buildExchangeInfoUrl(), 'exchangeInfo');
  }

  private async fetchBinance(
    url: string,
    endpointName: string,
  ): Promise<Response> {
    try {
      const response = await this.fetcher(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Binance ${endpointName} request failed with status ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new ServiceUnavailableException('Binance API is unavailable');
    }
  }

  private buildExchangeInfoUrl(): string {
    return `${this.getBaseUrl()}${BINANCE_EXCHANGE_INFO_PATH}`;
  }

  private buildKlinesUrl(
    symbol: string,
    interval: BinanceInterval,
    limit: number,
  ): string {
    const url = new URL(`${this.getBaseUrl()}${BINANCE_KLINES_PATH}`);
    url.searchParams.set('symbol', symbol.trim().toUpperCase());
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', String(limit));

    return url.toString();
  }

  private getBaseUrl(): string {
    const baseUrl =
      this.configService.get<string>('BINANCE_FUTURES_BASE_URL') ??
      BINANCE_FUTURES_DEFAULT_BASE_URL;

    return baseUrl.replace(/\/+$/, '');
  }

  private normalizeKline(item: unknown): Candle {
    if (!Array.isArray(item)) {
      throw new BadGatewayException('Invalid Binance kline item');
    }

    const candle: Candle = {
      openTime: this.toNumber(item[0], 'openTime'),
      open: this.toNumber(item[1], 'open'),
      high: this.toNumber(item[2], 'high'),
      low: this.toNumber(item[3], 'low'),
      close: this.toNumber(item[4], 'close'),
      volume: this.toNumber(item[5], 'volume'),
      closeTime: this.toNumber(item[6], 'closeTime'),
    };

    return candle;
  }

  private toNumber(value: unknown, fieldName: string): number {
    const parsedValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;

    if (!Number.isFinite(parsedValue)) {
      throw new BadGatewayException(`Invalid Binance kline ${fieldName}`);
    }

    return parsedValue;
  }

  private isTradableUsdtPerpetual(
    symbol: unknown,
  ): symbol is BinanceTradableSymbol {
    if (!this.isBinanceSymbol(symbol)) {
      return false;
    }

    return (
      symbol.quoteAsset === 'USDT' &&
      symbol.contractType === 'PERPETUAL' &&
      symbol.status === 'TRADING'
    );
  }

  private isBinanceSymbol(symbol: unknown): symbol is BinanceTradableSymbol {
    if (!symbol || typeof symbol !== 'object') {
      return false;
    }

    const candidate = symbol as BinanceExchangeInfoSymbol;

    return (
      typeof candidate.symbol === 'string' &&
      typeof candidate.baseAsset === 'string' &&
      typeof candidate.quoteAsset === 'string' &&
      typeof candidate.contractType === 'string' &&
      typeof candidate.status === 'string'
    );
  }
}
