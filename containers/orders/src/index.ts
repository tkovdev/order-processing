import { Kafka } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `orders.state`;

const kafka = new Kafka({ clientId: `orders`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `orders` });
const producer = kafka.producer();

async function publish(type: string, payload?: Record<string, unknown>): Promise<void> {
  await producer.send({
    topic,
    messages: [{ key: 'orders', value: JSON.stringify({ type, payload }) }],
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

      console.log(`[orders: received: ${event.type}]`);

      if (event.type === 'ORDER_PLACED') {
        console.log(`Order placed`);
        await publish('ORDER_IN_PROGRESS');
      }

      if (event.type === 'ORDER_IN_PROGRESS') {
        console.log(`Order in progress`);
        await publish('ORDER_PROCESSING');
      }

      if (event.type === 'ORDER_COMPLETED') {
        console.log(`Order completed`);
        await publish('ORDER_DONE');
        process.exit(0);
      }
    },
  });

  console.log(`Orders process started, listening for events...`);
}

start().catch(err => {
  console.error('Orders process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});
