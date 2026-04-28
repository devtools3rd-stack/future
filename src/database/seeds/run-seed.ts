import AppDataSource from '../data-source';
import { seedDefaultSettings } from './default-settings.seed';

async function runSeed(): Promise<void> {
  try {
    await AppDataSource.initialize();

    const result = await seedDefaultSettings(AppDataSource);

    console.log(
      `Default settings seed completed: ${result.inserted} inserted, ${result.skipped} skipped`,
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void runSeed().catch((error: unknown) => {
  console.error('Default settings seed failed', error);
  process.exitCode = 1;
});
