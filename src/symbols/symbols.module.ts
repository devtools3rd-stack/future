import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { SymbolsController } from './symbols.controller';

@Module({
  controllers: [SymbolsController],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class SymbolsModule {}
