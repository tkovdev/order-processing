import { start as startExternalStateHandler, stop as stopExternalStateHandler } from './externalStateHandler';
import { start as startInternalStateHandler, stop as stopInternalStateHandler } from './internalStateHandler';

async function start(): Promise<void> {
  await startExternalStateHandler();
  await startInternalStateHandler();

  console.log(`Orders process started, listening for events...`);
}

start().catch(err => {
  console.error('Orders process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await stopExternalStateHandler();
  await stopInternalStateHandler();
  process.exit(0);
});
