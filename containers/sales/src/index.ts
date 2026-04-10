import { start as startExternalCommandHandler, stop as stopExternalCommandHandler } from './externalCommandHandler';
import { start as startInternalStateHandler, stop as stopInternalStateHandler } from './internalStateHandler';

async function start(): Promise<void> {
  await startExternalCommandHandler();
  await startInternalStateHandler();

  console.log(`Sales process started, listening for events...`);
}

start().catch(err => {
  console.error('Sales process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await stopExternalCommandHandler();
  await stopInternalStateHandler();
  process.exit(0);
});
