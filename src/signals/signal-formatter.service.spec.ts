import { StrategySignal } from '../strategies/engine/strategy.types';
import { SignalFormatterService } from './signal-formatter.service';

function createSignal(overrides: Partial<StrategySignal> = {}): StrategySignal {
  return {
    strategyKey: 'EMA_CROSS',
    direction: 'LONG',
    price: 98420,
    reason: 'EMA 9 crossed above EMA 21',
    ...overrides,
  };
}

describe('SignalFormatterService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-28T14:32:00.000'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats LONG signal for Telegram', () => {
    const service = new SignalFormatterService();

    const message = service.formatTelegramMessage({
      signal: createSignal(),
      symbol: 'BTCUSDT',
      timeframe: '1h',
      cooldownMinutes: 30,
    });

    expect(message).toBe(
      [
        '🟢 LONG — BTCUSDT PERP',
        '⏱ Timeframe: 1H',
        '📌 Strategy: EMA Cross',
        '📍 Price: $98,420',
        '💡 Reason: EMA 9 crossed above EMA 21',
        '',
        '🕐 14:32 | Cooldown: 30 phút',
      ].join('\n'),
    );
  });

  it('formats SHORT signal with red icon', () => {
    const service = new SignalFormatterService();

    const message = service.formatTelegramMessage({
      signal: createSignal({
        direction: 'SHORT',
        strategyKey: 'MACD_CROSS',
        price: 98420.125,
        reason: 'MACD crossed below signal line',
      }),
      symbol: 'ETHUSDT',
      timeframe: '15m',
      cooldownMinutes: 45,
    });

    expect(message).toContain('🔴 SHORT — ETHUSDT PERP');
    expect(message).toContain('⏱ Timeframe: 15M');
    expect(message).toContain('📌 Strategy: MACD Cross');
    expect(message).toContain('📍 Price: $98,420.125');
    expect(message).toContain('💡 Reason: MACD crossed below signal line');
    expect(message).toContain('🕐 14:32 | Cooldown: 45 phút');
  });

  it('converts unknown strategy keys to readable title case', () => {
    const service = new SignalFormatterService();

    const message = service.formatTelegramMessage({
      signal: createSignal({ strategyKey: 'SUPER_TREND_FAST' }),
      symbol: 'BNBUSDT',
      timeframe: '4h',
      cooldownMinutes: 30,
    });

    expect(message).toContain('📌 Strategy: Super Trend Fast');
  });

  it('formats prices with thousands separators and trims trailing decimals', () => {
    const service = new SignalFormatterService();

    const wholeNumberMessage = service.formatTelegramMessage({
      signal: createSignal({ price: 1000000 }),
      symbol: 'BTCUSDT',
      timeframe: '1h',
      cooldownMinutes: 30,
    });
    const decimalMessage = service.formatTelegramMessage({
      signal: createSignal({ price: 1234.5 }),
      symbol: 'BTCUSDT',
      timeframe: '1h',
      cooldownMinutes: 30,
    });

    expect(wholeNumberMessage).toContain('📍 Price: $1,000,000');
    expect(decimalMessage).toContain('📍 Price: $1,234.5');
  });
});
