import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SettingsModule } from './settings/settings.module';
import { SignalsModule } from './signals/signals.module';
import { StrategiesModule } from './strategies/strategies.module';
import { SymbolsModule } from './symbols/symbols.module';
import { TelegramModule } from './telegram/telegram.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    DatabaseModule,
    WatchlistModule,
    SymbolsModule,
    SettingsModule,
    TelegramModule,
    StrategiesModule,
    SignalsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
