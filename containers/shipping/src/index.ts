import { Kafka } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `shipping.state`;

const kafka = new Kafka({ clientId: `shipping`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `shipping` });
const producer = kafka.producer();

async function publish(type: string, payload?: Record<string, unknown>): Promise<void> {
  await producer.send({
    topic,
    messages: [{ key: 'shipping', value: JSON.stringify({ type, payload }) }],
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

      console.log(`[shipping: received: ${event.type}]`);

      if (event.type === 'SHIPPING_REQUESTED') {
        console.log(`Shipping requested`);
        await publish('SHIPPING_IN_PROGRESS');
      }

      if (event.type === 'SHIPPING_SENT') {
        console.log(`Shipping sent`);
        await publish('SHIPPING_DONE');
        process.exit(0);
      }
    },
  });

  console.log(`Shipping process started, listening for events...`);
}

start().catch(err => {
  console.error('Shipping process failed to start', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});
