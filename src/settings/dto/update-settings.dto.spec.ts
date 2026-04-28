import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateSettingsDto } from './update-settings.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

async function validateBody(
  body: Record<string, unknown>,
): Promise<UpdateSettingsDto> {
  return (await validationPipe.transform(body, {
    type: 'body',
    metatype: UpdateSettingsDto,
  })) as UpdateSettingsDto;
}

describe('UpdateSettingsDto', () => {
  it('accepts a partial settings update', async () => {
    await expect(
      validateBody({
        telegram_bot_token: 'token',
      }),
    ).resolves.toEqual({
      telegram_bot_token: 'token',
    });
  });

  it('accepts cooldown_minutes as a number greater than or equal to 1', async () => {
    await expect(
      validateBody({
        cooldown_minutes: 1,
      }),
    ).resolves.toEqual({
      cooldown_minutes: 1,
    });
  });

  it('rejects cooldown_minutes lower than 1', async () => {
    await expect(
      validateBody({
        cooldown_minutes: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-string telegram settings', async () => {
    await expect(
      validateBody({
        telegram_chat_id: 123,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown fields', async () => {
    await expect(
      validateBody({
        unknown: 'value',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
