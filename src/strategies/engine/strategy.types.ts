import { Candle } from '../../symbols/binance.service';
import { StrategyKey } from '../strategy-config.constants';

export type StrategyDirection = 'LONG' | 'SHORT';

export type StrategySignal = {
  strategyKey: string;
  direction: StrategyDirection;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  meta?: Record<string, unknown>;
};

export type StrategyContext = {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  params: Record<string, unknown>;
};

export interface StrategyRunner {
  strategyKey: StrategyKey;
  run(context: StrategyContext): StrategySignal | null;
}
