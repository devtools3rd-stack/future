import { Controller, Post } from '@nestjs/common';
import { TelegramSendResult, TelegramService } from './telegram.service';

type DataResponse<T> = {
  data: T;
};

@Controller('api/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('test')
  async testNotification(): Promise<DataResponse<TelegramSendResult>> {
    const result = await this.telegramService.sendTestMessage();

    return { data: result };
  }
}
