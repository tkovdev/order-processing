import { Kafka } from 'kafkajs';
import { publishState } from './internalStateHandler';

/**
 * This module handles incoming events from the sales service and updates the orders state accordingly. 
 * It listens for events on the `sales.state` topic and reacts to relevant events such as `SALE_IN_PROGRESS`. 
 * When a sale is in progress, it publishes a `SALE_COMPLETED` state.
 */

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `sales.state`;

const kafka = new Kafka({ clientId: `orders-command`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `orders-command` });

export async function start(): Promise<void> {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });
    } catch (error) {
        console.error(`Failed to connect to Kafka: ${error}`);
        process.exit(1);
    }

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());

      console.log(`[sales.state: received: ${event.type}]`);

      if (event.type === 'PROCEED_TO_ORDER') {
          console.log(`Starting order fulfillment...`);
          await publishState('ORDER_FULLFILMENT_STARTED');
      }
    },
  });
}

export async function stop(): Promise<void> {
    try {
        await consumer.stop();
        await consumer.disconnect();
    } catch (error) {
        console.error(`Failure occurred on stop: ${error}`);
        process.exit(1);
    }
}