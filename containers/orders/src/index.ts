import { promises as fs } from 'fs';
import { start as startExternalStateHandler, stop as stopExternalStateHandler } from './externalStateHandler';
import { start as startInternalStateHandler, stop as stopInternalStateHandler } from './internalStateHandler';

const HEALTHCHECK_FILE = process.env.HEALTHCHECK_FILE ?? '/tmp/healthcheck';

async function markReady(): Promise<void> {
  await fs.writeFile(HEALTHCHECK_FILE, 'ready\n', 'utf8');
}

async function clearReady(): Promise<void> {
  await fs.rm(HEALTHCHECK_FILE, { force: true });
}

async function start(): Promise<void> {
  await clearReady();

  await startExternalStateHandler();
  await startInternalStateHandler();

  await markReady();
  console.log(`Orders process started, listening for events...`);
}

start().catch(async err => {
  await clearReady().catch(() => undefined);
  console.error('Orders process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await clearReady().catch(() => undefined);
  await stopExternalStateHandler();
  await stopInternalStateHandler();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await clearReady().catch(() => undefined);
  await stopExternalStateHandler();
  await stopInternalStateHandler();
  process.exit(0);
});
