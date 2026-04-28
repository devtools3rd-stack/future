import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { UpdateWatchlistDto } from './dto/update-watchlist.dto';
import { WatchlistEntity } from './entities/watchlist.entity';
import { WatchlistService } from './watchlist.service';

type DataResponse<T> = {
  data: T;
};

@Controller('api/watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async getWatchlist(): Promise<DataResponse<WatchlistEntity[]>> {
    const watchlist = await this.watchlistService.getWatchlist();

    return { data: watchlist };
  }

  @Post()
  async createWatchItem(
    @Body() body: CreateWatchlistDto,
  ): Promise<DataResponse<WatchlistEntity>> {
    const watchItem = await this.watchlistService.createWatchItem(body);

    return { data: watchItem };
  }

  @Patch(':id')
  async updateWatchItem(
    @Param('id') id: string,
    @Body() body: UpdateWatchlistDto,
  ): Promise<DataResponse<WatchlistEntity>> {
    const watchItem = await this.watchlistService.updateWatchItem(id, body);

    return { data: watchItem };
  }

  @Delete(':id')
  async deleteWatchItem(
    @Param('id') id: string,
  ): Promise<DataResponse<{ deleted: true }>> {
    await this.watchlistService.deleteWatchItem(id);

    return { data: { deleted: true } };
  }
}
