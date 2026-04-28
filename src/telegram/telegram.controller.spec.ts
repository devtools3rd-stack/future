import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

describe('TelegramController', () => {
  it('sends a test notification and returns a data envelope', async () => {
    const sendTestMessage = jest.fn().mockResolvedValue({ sent: true });
    const controller = new TelegramController({
      sendTestMessage,
    } as unknown as TelegramService);

    const response = await controller.testNotification();

    expect(sendTestMessage).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ data: { sent: true } });
  });
});
