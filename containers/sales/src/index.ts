import { start as startCommandHandler, stop as stopCommandHandler } from './commandHandler';
import { start as startStateHandler, stop as stopStateHandler } from './stateHandler';

async function start(): Promise<void> {
  await startCommandHandler();
  await startStateHandler();

  console.log(`Sales process started, listening for events...`);
}

start().catch(err => {
  console.error('Sales process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await stopCommandHandler();
  await stopStateHandler();
  process.exit(0);
});
