import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalEntity } from './entities/signal.entity';
import { SignalService } from './signal.service';

@Module({
  imports: [TypeOrmModule.forFeature([SignalEntity])],
  providers: [SignalService],
  exports: [SignalService],
})
export class SignalsModule {}
