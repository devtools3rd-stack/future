import { Controller, Get, Query } from '@nestjs/common';
import { BinanceService, BinanceSymbolSearchResult } from './binance.service';

type DataResponse<T> = {
  data: T;
};

@Controller('api/symbols')
export class SymbolsController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('search')
  async search(
    @Query('q') query?: string,
  ): Promise<DataResponse<BinanceSymbolSearchResult[]>> {
    const symbols = await this.binanceService.searchSymbols(query);

    return { data: symbols };
  }
}
