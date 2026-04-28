type QueryableDataSource = {
  query: (query: string, parameters?: unknown[]) => Promise<unknown[]>;
};

export type DefaultSetting = {
  key: string;
  value: string;
};

export type SeedDefaultSettingsResult = {
  inserted: number;
  skipped: number;
};

export const DEFAULT_SETTINGS: DefaultSetting[] = [
  { key: 'telegram_bot_token', value: '' },
  { key: 'telegram_chat_id', value: '' },
  { key: 'cooldown_minutes', value: '30' },
];

export async function seedDefaultSettings(
  dataSource: QueryableDataSource,
): Promise<SeedDefaultSettingsResult> {
  const valuesSql = DEFAULT_SETTINGS.map(
    (_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`,
  ).join(', ');
  const parameters = DEFAULT_SETTINGS.flatMap(({ key, value }) => [key, value]);
  const insertedRows = await dataSource.query(
    `
      INSERT INTO "settings" ("key", "value")
      VALUES ${valuesSql}
      ON CONFLICT ("key") DO NOTHING
      RETURNING "key"
    `,
    parameters,
  );
  const inserted = insertedRows.length;

  return {
    inserted,
    skipped: DEFAULT_SETTINGS.length - inserted,
  };
}
