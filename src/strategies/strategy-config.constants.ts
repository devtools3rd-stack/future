export enum StrategyKey {
  EMA_CROSS = 'EMA_CROSS',
  RSI_EXTREME = 'RSI_EXTREME',
  MACD_CROSS = 'MACD_CROSS',
}

export type StrategyConfigView = {
  strategyKey: StrategyKey;
  enabled: boolean;
  paramsJson: Record<string, unknown>;
};

export const DEFAULT_STRATEGY_CONFIGS: StrategyConfigView[] = [
  {
    strategyKey: StrategyKey.EMA_CROSS,
    enabled: false,
    paramsJson: {},
  },
  {
    strategyKey: StrategyKey.RSI_EXTREME,
    enabled: false,
    paramsJson: {},
  },
  {
    strategyKey: StrategyKey.MACD_CROSS,
    enabled: false,
    paramsJson: {},
  },
];
