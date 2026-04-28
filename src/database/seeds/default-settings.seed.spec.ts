import { DEFAULT_SETTINGS, seedDefaultSettings } from './default-settings.seed';

describe('seedDefaultSettings', () => {
  it('inserts default settings without overwriting existing values', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ key: 'cooldown_minutes' }]),
    };

    const result = await seedDefaultSettings(dataSource);

    expect(DEFAULT_SETTINGS).toEqual([
      { key: 'telegram_bot_token', value: '' },
      { key: 'telegram_chat_id', value: '' },
      { key: 'cooldown_minutes', value: '30' },
    ]);
    expect(dataSource.query).toHaveBeenCalledTimes(1);

    const [sql, params] = dataSource.query.mock.calls[0] as [string, string[]];

    expect(sql).toContain('INSERT INTO "settings" ("key", "value")');
    expect(sql).toContain('ON CONFLICT ("key") DO NOTHING');
    expect(sql).toContain('RETURNING "key"');
    expect(params).toEqual([
      'telegram_bot_token',
      '',
      'telegram_chat_id',
      '',
      'cooldown_minutes',
      '30',
    ]);
    expect(result).toEqual({ inserted: 1, skipped: 2 });
  });
});
