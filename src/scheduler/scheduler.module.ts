import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from '../settings/settings.module';
import { SignalsModule } from '../signals/signals.module';
import { StrategiesModule } from '../strategies/strategies.module';
import { SymbolsModule } from '../symbols/symbols.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { SignalSchedulerService } from './signal-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WatchlistModule,
    SymbolsModule,
    StrategiesModule,
    SignalsModule,
    TelegramModule,
    SettingsModule,
  ],
  providers: [SignalSchedulerService],
})
export class SchedulerModule {}
