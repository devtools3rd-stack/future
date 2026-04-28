import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  StrategyConfigParamsDto,
  StrategyConfigsParamsDto,
  UpsertStrategyConfigDto,
} from './dto/strategy-config.dto';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import { StrategyConfigView } from './strategy-config.constants';
import { StrategyConfigService } from './strategy-config.service';

type DataResponse<T> = {
  data: T;
};

@Controller('api/watchlist/:watchlistId/strategies')
export class StrategyConfigController {
  constructor(private readonly strategyConfigService: StrategyConfigService) {}

  @Get()
  async getStrategies(
    @Param() params: StrategyConfigsParamsDto,
  ): Promise<DataResponse<StrategyConfigView[]>> {
    const configs =
      await this.strategyConfigService.getConfigsWithDefaultsByWatchlistId(
        params.watchlistId,
      );

    return { data: configs };
  }

  @Put(':strategyKey')
  async upsertStrategy(
    @Param() params: StrategyConfigParamsDto,
    @Body() body: UpsertStrategyConfigDto,
  ): Promise<DataResponse<StrategyConfigEntity>> {
    const config = await this.strategyConfigService.upsertStrategyConfig({
      watchlistId: params.watchlistId,
      strategyKey: params.strategyKey,
      enabled: body.enabled,
      paramsJson: body.paramsJson,
    });

    return { data: config };
  }
}
