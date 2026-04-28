import {
  BinanceService,
  type BinanceSymbolSearchResult,
} from './binance.service';
import { SymbolsController } from './symbols.controller';

describe('SymbolsController', () => {
  it('returns search results in a data envelope', async () => {
    const symbols: BinanceSymbolSearchResult[] = [
      {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      },
    ];
    const searchSymbols = jest.fn().mockResolvedValue(symbols);
    const controller = new SymbolsController({
      searchSymbols,
    } as unknown as BinanceService);

    const response = await controller.search('btc');

    expect(searchSymbols).toHaveBeenCalledWith('btc');
    expect(response).toEqual({ data: symbols });
  });

  it('returns an empty data list when service returns no matches', async () => {
    const searchSymbols = jest.fn().mockResolvedValue([]);
    const controller = new SymbolsController({
      searchSymbols,
    } as unknown as BinanceService);

    const response = await controller.search(undefined);

    expect(searchSymbols).toHaveBeenCalledWith(undefined);
    expect(response).toEqual({ data: [] });
  });
});
