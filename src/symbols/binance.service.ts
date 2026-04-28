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
const SYMBOL_CACHE_TTL_MS = 10 * 60 * 1000;
const BINANCE_FETCHER = Symbol('BINANCE_FETCHER');
const BINANCE_NOW = Symbol('BINANCE_NOW');

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
    try {
      const response = await this.fetcher(this.buildExchangeInfoUrl(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Binance exchangeInfo request failed with status ${response.status}`,
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
    const baseUrl =
      this.configService.get<string>('BINANCE_FUTURES_BASE_URL') ??
      BINANCE_FUTURES_DEFAULT_BASE_URL;

    return `${baseUrl.replace(/\/+$/, '')}${BINANCE_EXCHANGE_INFO_PATH}`;
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
