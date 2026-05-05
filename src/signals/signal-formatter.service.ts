import { Injectable } from '@nestjs/common';
import { StrategySignal } from '../strategies/engine/strategy.types';

export type FormatTelegramSignalInput = {
  signal: StrategySignal;
  symbol: string;
  timeframe: string;
  cooldownMinutes: number;
};

const STRATEGY_NAMES: Record<string, string> = {
  SMC: 'SMC',
  ICT: 'ICT',
};

@Injectable()
export class SignalFormatterService {
  formatTelegramMessage(input: FormatTelegramSignalInput): string {
    const directionIcon = input.signal.direction === 'LONG' ? '🟢' : '🔴';

    return [
      `${directionIcon} ${input.signal.direction} — ${input.symbol} PERP`,
      `⏱ Timeframe: ${this.formatTimeframe(input.timeframe)}`,
      `📌 Strategy: ${this.formatStrategyName(input.signal.strategyKey)}`,
      `📍 Entry: ${this.formatPrice(input.signal.price)}`,
      ...this.formatRiskLines(input.signal),
      `💡 Reason: ${input.signal.reason}`,
      '',
      `🕐 ${this.formatLocalTime(new Date())} | Cooldown: ${input.cooldownMinutes} phút`,
    ].join('\n');
  }

  private formatPrice(price: number): string {
    return `$${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 8,
    }).format(price)}`;
  }

  private formatRiskLines(signal: StrategySignal): string[] {
    const lines: string[] = [];

    if (typeof signal.stopLoss === 'number') {
      lines.push(`🛑 Stop Loss: ${this.formatPrice(signal.stopLoss)}`);
    }

    if (typeof signal.takeProfit === 'number') {
      lines.push(`🎯 Take Profit: ${this.formatPrice(signal.takeProfit)}`);
    }

    return lines;
  }

  private formatTimeframe(timeframe: string): string {
    return timeframe.toUpperCase();
  }

  private formatStrategyName(strategyKey: string): string {
    return STRATEGY_NAMES[strategyKey] ?? this.toTitleCase(strategyKey);
  }

  private toTitleCase(value: string): string {
    return value
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatLocalTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}
