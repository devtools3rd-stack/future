import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { CooldownService } from './cooldown.service';
import { SignalEntity } from './entities/signal.entity';
import { SignalService } from './signal.service';

@Module({
  imports: [TypeOrmModule.forFeature([SignalEntity]), SettingsModule],
  providers: [SignalService, CooldownService],
  exports: [SignalService, CooldownService],
})
export class SignalsModule {}
