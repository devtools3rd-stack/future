import { Controller, Get, Query } from '@nestjs/common';
import { SignalQueryDto } from './dto/signal-query.dto';
import { SignalEntity } from './entities/signal.entity';
import { SignalService } from './signal.service';

type DataResponse<T> = {
  data: T;
};

@Controller('api/signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Get()
  async getSignals(
    @Query() query: SignalQueryDto,
  ): Promise<DataResponse<SignalEntity[]>> {
    const signals = await this.signalService.getRecentSignals(query);

    return { data: signals };
  }
}
