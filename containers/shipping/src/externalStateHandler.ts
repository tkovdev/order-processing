import { Kafka } from 'kafkajs';
import { publishState } from './internalStateHandler';

/**
 * This module handles incoming events from the sales service and updates the orders state accordingly. 
 * It listens for events on the `sales.state` topic and reacts to relevant events such as `SALE_IN_PROGRESS`. 
 * When a sale is in progress, it publishes a `SALE_COMPLETED` state.
 */

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `orders.state`;

const kafka = new Kafka({ clientId: `shipping-command`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `shipping-command` });

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

      console.log(`[orders.state: received: ${event.type}]`);

      if (event.type === 'PROCEED_TO_SHIPMENT') {
          console.log(`Starting shipment process...`);
          await publishState('PREPARE_SHIPMENT');
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