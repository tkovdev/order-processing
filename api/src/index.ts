import express, { Request, Response } from 'express';
import routes from './routes';
import { connectToDatabase } from './db/connection';
import { connectProducer, disconnectProducer } from './kafka/producer';
import { initializeTopics } from './kafka/topics';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4300;
const hosted = process.env.HOSTED || false;

const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

app.use(express.json());

// Simple health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'api' });
});

// Mount all routes
app.use(routes);

async function start(): Promise<void> {
  await connectToDatabase().catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

  if (hosted) {
    await initializeTopics().catch(err => {
      console.error('Failed to initialize Kafka topics', err);
      process.exit(1);
    });
    
    await connectProducer().catch(err => {
      console.error('Failed to connect Kafka producer', err);
      process.exit(1);
    });
  }
  
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start();

process.on('SIGTERM', async () => {
  await disconnectProducer();
  process.exit(0);
});

export default app;
