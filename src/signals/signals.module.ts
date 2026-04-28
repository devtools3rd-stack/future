import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalEntity } from './entities/signal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SignalEntity])],
})
export class SignalsModule {}
