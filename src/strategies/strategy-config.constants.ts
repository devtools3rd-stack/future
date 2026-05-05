export enum StrategyKey {
  SMC = 'SMC',
  ICT = 'ICT',
}

export type StrategyConfigView = {
  strategyKey: StrategyKey;
  enabled: boolean;
  paramsJson: Record<string, unknown>;
};

export const DEFAULT_STRATEGY_CONFIGS: StrategyConfigView[] = [
  {
    strategyKey: StrategyKey.SMC,
    enabled: false,
    paramsJson: {
      swingLookback: 5,
      liquidityLookback: 20,
      minDisplacementPercent: 0.3,
      requireFairValueGap: true,
      usePremiumDiscount: true,
      minRiskReward: 2,
    },
  },
  {
    strategyKey: StrategyKey.ICT,
    enabled: false,
    paramsJson: {
      swingLookback: 5,
      liquidityLookback: 20,
      minDisplacementPercent: 0.25,
      killZone: 'any',
      requireFairValueGap: true,
      minRiskReward: 2,
    },
  },
];
