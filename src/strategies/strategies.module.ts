import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import { StrategyConfigService } from './strategy-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyConfigEntity])],
  providers: [StrategyConfigService],
  exports: [StrategyConfigService],
})
export class StrategiesModule {}
