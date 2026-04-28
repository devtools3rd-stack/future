import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategyConfigEntity } from './entities/strategy-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyConfigEntity])],
})
export class StrategiesModule {}
