import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { SignalService } from './signal.service';

const DEFAULT_COOLDOWN_MINUTES = 30;

@Injectable()
export class CooldownService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly signalService: SignalService,
  ) {}

  async canSendSignal(
    symbol: string,
    timeframe: string,
    strategyKey: string,
  ): Promise<boolean> {
    const [settings, lastSignal] = await Promise.all([
      this.settingsService.getAppSettings(),
      this.signalService.getLastSignalBySymbolTimeframeStrategy(
        symbol,
        timeframe,
        strategyKey,
      ),
    ]);

    if (!lastSignal) {
      return true;
    }

    const cooldownMs =
      this.readCooldownMinutes(settings.cooldown_minutes) * 60 * 1000;
    const elapsedMs = Date.now() - lastSignal.createdAt.getTime();

    return elapsedMs >= cooldownMs;
  }

  private readCooldownMinutes(value: number): number {
    return Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_COOLDOWN_MINUTES;
  }
}
