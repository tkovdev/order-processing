import { Kafka } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `sales.state`;

const kafka = new Kafka({ clientId: `sales`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `sales` });
const producer = kafka.producer();

async function publish(type: string, payload?: Record<string, unknown>): Promise<void> {
  await producer.send({
    topic,
    messages: [{ key: 'sales', value: JSON.stringify({ type, payload }) }],
  });
}

async function start(): Promise<void> {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());

      console.log(`[sales: received: ${event.type}]`);

      if (event.type === 'SALE_SUBMITTED') {
        console.log(`Sale submitted`);
        await publish('SALE_IN_PROGRESS');
      }

      if (event.type === 'SALE_COMPLETED') {
        console.log(`Sale completed`);
        await publish('SALE_DONE');
        process.exit(0);
      }
    },
  });

  console.log(`Sales process started, listening for events...`);
}

start().catch(err => {
  console.error('Sales process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});
