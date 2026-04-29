import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from '../settings/settings.service';
import { CooldownService } from '../signals/cooldown.service';
import { SignalDirection } from '../signals/entities/signal.entity';
import { SignalFormatterService } from '../signals/signal-formatter.service';
import { SignalService } from '../signals/signal.service';
import { BinanceService } from '../symbols/binance.service';
import { StrategyRunnerService } from '../strategies/engine/strategy-runner.service';
import { StrategySignal } from '../strategies/engine/strategy.types';
import { StrategyConfigService } from '../strategies/strategy-config.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  WatchlistEntity,
  WatchlistStatus,
  WatchlistTimeframe,
} from '../watchlist/entities/watchlist.entity';
import { WatchlistService } from '../watchlist/watchlist.service';

const DEFAULT_CANDLE_LIMIT = 200;

@Injectable()
export class SignalSchedulerService {
  private readonly logger = new Logger(SignalSchedulerService.name);

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly binanceService: BinanceService,
    private readonly strategyConfigService: StrategyConfigService,
    private readonly strategyRunnerService: StrategyRunnerService,
    private readonly cooldownService: CooldownService,
    private readonly signalFormatterService: SignalFormatterService,
    private readonly signalService: SignalService,
    private readonly telegramService: TelegramService,
    private readonly settingsService: SettingsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    try {
      const watchlist = await this.watchlistService.getWatchlist();
      const now = new Date();

      for (const watchItem of watchlist) {
        if (!this.isCandleCloseTime(watchItem.timeframe, now)) {
          continue;
        }

        await this.processWatchItem(watchItem);
      }
    } catch (error) {
      this.logger.error(
        `Signal scheduler failed: ${this.readErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  isCandleCloseTime(timeframe: WatchlistTimeframe, date = new Date()): boolean {
    const minute = date.getUTCMinutes();
    const hour = date.getUTCHours();

    switch (timeframe) {
      case WatchlistTimeframe.FIVE_MINUTES:
        return minute % 5 === 0;
      case WatchlistTimeframe.FIFTEEN_MINUTES:
        return minute % 15 === 0;
      case WatchlistTimeframe.ONE_HOUR:
        return minute === 0;
      case WatchlistTimeframe.FOUR_HOURS:
        return minute === 0 && hour % 4 === 0;
      default:
        return false;
    }
  }

  private async processWatchItem(watchItem: WatchlistEntity): Promise<void> {
    let signals: StrategySignal[];

    try {
      const candles = await this.binanceService.fetchOHLCV(
        watchItem.symbol,
        watchItem.timeframe,
        DEFAULT_CANDLE_LIMIT,
      );
      const configs =
        await this.strategyConfigService.getEnabledStrategiesByWatchlistId(
          watchItem.id,
        );

      signals = this.strategyRunnerService.runStrategies(
        watchItem,
        candles,
        configs,
      );
    } catch (error) {
      await this.updateStatus(watchItem, WatchlistStatus.FETCH_ERROR);
      this.logWatchItemError(watchItem, 'fetch or strategy execution', error);
      return;
    }

    if (signals.length === 0) {
      await this.updateStatus(watchItem, WatchlistStatus.NO_SIGNAL);
      return;
    }

    const settings = await this.settingsService.getAppSettings();
    let sentSignals = 0;

    for (const signal of signals) {
      const canSend = await this.cooldownService.canSendSignal(
        watchItem.symbol,
        watchItem.timeframe,
        signal.strategyKey,
      );

      if (!canSend) {
        continue;
      }

      const message = this.signalFormatterService.formatTelegramMessage({
        signal,
        symbol: watchItem.symbol,
        timeframe: watchItem.timeframe,
        cooldownMinutes: settings.cooldown_minutes,
      });

      try {
        await this.telegramService.sendMessage(message);
      } catch (error) {
        await this.updateStatus(watchItem, WatchlistStatus.TELEGRAM_ERROR);
        this.logWatchItemError(watchItem, 'telegram send', error);
        return;
      }

      await this.signalService.saveSignal({
        symbol: watchItem.symbol,
        timeframe: watchItem.timeframe,
        strategyKey: signal.strategyKey,
        direction: signal.direction as SignalDirection,
        price: String(signal.price),
        message,
        metaJson: signal.meta ?? null,
      });
      sentSignals += 1;
    }

    await this.updateStatus(
      watchItem,
      sentSignals > 0 ? WatchlistStatus.SIGNAL_SENT : WatchlistStatus.NO_SIGNAL,
    );
  }

  private updateStatus(
    watchItem: WatchlistEntity,
    status: WatchlistStatus,
  ): Promise<WatchlistEntity> {
    return this.watchlistService.updateStatus(watchItem.id, status);
  }

  private logWatchItemError(
    watchItem: WatchlistEntity,
    step: string,
    error: unknown,
  ): void {
    this.logger.error(
      `Signal scheduler ${step} failed for ${watchItem.symbol} ${watchItem.timeframe}: ${this.readErrorMessage(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
  }

  private readErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
