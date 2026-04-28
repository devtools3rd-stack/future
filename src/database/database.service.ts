import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';

type DatabaseLogger = Pick<Logger, 'log' | 'warn'>;

@Injectable()
export class DatabaseService implements OnApplicationBootstrap {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(Logger)
    private readonly logger: DatabaseLogger = new Logger(DatabaseService.name),
  ) {}

  onApplicationBootstrap(): void {
    const options = this.dataSource.options as DataSourceOptions & {
      host?: string;
      port?: number;
      database?: string;
    };
    const connectionTarget = `${options.host ?? 'unknown'}:${options.port ?? 'unknown'}/${options.database ?? 'unknown'}`;

    if (this.dataSource.isInitialized) {
      this.logger.log(`Database connected: ${connectionTarget}`);
      return;
    }

    this.logger.warn(`Database not connected: ${connectionTarget}`);
  }
}
