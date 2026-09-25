import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabasePool } from './db.js';
import { PostgresTrialApplicationRepository } from './trial/repository.js';

const config = loadConfig();
const pool = createDatabasePool(config.databaseUrl);
const repository = new PostgresTrialApplicationRepository(pool);
const app = createApp({ repository, config });

const server = app.listen(config.port, () => {
  console.log(`Trial application API listening on port ${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await pool.end();
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
