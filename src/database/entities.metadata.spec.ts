import { DataSource, EntityMetadata } from 'typeorm';
import {
  WatchlistEntity,
  WatchlistStatus,
  WatchlistTimeframe,
} from '../watchlist/entities/watchlist.entity';
import { StrategyConfigEntity } from '../strategies/entities/strategy-config.entity';
import {
  SignalDirection,
  SignalEntity,
} from '../signals/entities/signal.entity';
import { SettingEntity } from '../settings/entities/setting.entity';

function columnNames(metadata: EntityMetadata): string[] {
  return metadata.columns.map((column) => column.databaseName);
}

function indexByColumns(
  metadata: EntityMetadata,
  columnNamesToFind: string[],
): EntityMetadata['indices'][number] | undefined {
  return metadata.indices.find((index) => {
    const names = index.columns.map((column) => column.databaseName);
    return (
      names.length === columnNamesToFind.length &&
      names.every(
        (name, indexPosition) => name === columnNamesToFind[indexPosition],
      )
    );
  });
}

describe('crypto signal entity metadata', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      database: 'metadata_test',
      entities: [
        WatchlistEntity,
        StrategyConfigEntity,
        SignalEntity,
        SettingEntity,
      ],
    });

    await dataSource.buildMetadatas();
  });

  it('maps Watchlist to watchlist with timeframe/status enums and unique symbol timeframe index', () => {
    const metadata = dataSource.getMetadata(WatchlistEntity);

    expect(metadata.tableName).toBe('watchlist');
    expect(
      metadata.primaryColumns.map((column) => column.databaseName),
    ).toEqual(['id']);
    expect(columnNames(metadata)).toEqual(
      expect.arrayContaining([
        'id',
        'symbol',
        'timeframe',
        'status',
        'created_at',
        'updated_at',
      ]),
    );
    expect(metadata.findColumnWithPropertyName('timeframe')?.enum).toEqual(
      Object.values(WatchlistTimeframe),
    );
    expect(metadata.findColumnWithPropertyName('status')?.enum).toEqual(
      Object.values(WatchlistStatus),
    );
    expect(indexByColumns(metadata, ['symbol', 'timeframe'])?.isUnique).toBe(
      true,
    );
  });

  it('maps StrategyConfig relation and unique watchlist strategy index', () => {
    const metadata = dataSource.getMetadata(StrategyConfigEntity);
    const relation = metadata.findRelationWithPropertyPath('watchlist');

    expect(metadata.tableName).toBe('strategy_configs');
    expect(columnNames(metadata)).toEqual(
      expect.arrayContaining([
        'id',
        'watchlist_id',
        'strategy_key',
        'enabled',
        'params_json',
        'created_at',
        'updated_at',
      ]),
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.joinColumns.map((column) => column.databaseName)).toEqual([
      'watchlist_id',
    ]);
    expect(
      indexByColumns(metadata, ['watchlist_id', 'strategy_key'])?.isUnique,
    ).toBe(true);
  });

  it('maps Signal to signals with direction enum and query index', () => {
    const metadata = dataSource.getMetadata(SignalEntity);
    const priceColumn = metadata.findColumnWithPropertyName('price');
    const metaColumn = metadata.findColumnWithPropertyName('metaJson');

    expect(metadata.tableName).toBe('signals');
    expect(columnNames(metadata)).toEqual(
      expect.arrayContaining([
        'id',
        'symbol',
        'timeframe',
        'strategy_key',
        'direction',
        'price',
        'message',
        'meta_json',
        'created_at',
      ]),
    );
    expect(metadata.findColumnWithPropertyName('direction')?.enum).toEqual(
      Object.values(SignalDirection),
    );
    expect(priceColumn?.precision).toBe(18);
    expect(priceColumn?.scale).toBe(8);
    expect(metaColumn?.isNullable).toBe(true);
    expect(
      indexByColumns(metadata, [
        'symbol',
        'timeframe',
        'strategy_key',
        'created_at',
      ]),
    ).toBeDefined();
  });

  it('maps Setting to settings with key primary column', () => {
    const metadata = dataSource.getMetadata(SettingEntity);

    expect(metadata.tableName).toBe('settings');
    expect(
      metadata.primaryColumns.map((column) => column.databaseName),
    ).toEqual(['key']);
    expect(columnNames(metadata)).toEqual(
      expect.arrayContaining(['key', 'value', 'updated_at']),
    );
  });
});
