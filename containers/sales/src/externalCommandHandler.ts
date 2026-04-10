import { Kafka } from 'kafkajs';
import { publishState } from './internalStateHandler';

/**
 * This module handles incoming commands from the API and updates the sales state accordingly. 
 * It listens for commands on the `api.command` topic and reacts to relevant events such as `SALE_SUBMITTED`. 
 * When a sale is submitted, it publishes a `SALE_IN_PROGRESS` state.
 */

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `api.command`;

const kafka = new Kafka({ clientId: `sales-command`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `sales-command` });

export async function start(): Promise<void> {
  console.info(`commandHandler.start: START`);
  console.info(`commandHandler.start: connect to consumer for: '${topic}'`);
  await consumer.connect();
    console.info(`commandHandler.start: subscribe to consumer for: '${topic}'`);
  await consumer.subscribe({ topic, fromBeginning: false });
  
  console.info(`commandHandler.start: process messages from consumer for: '${topic}'`);
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());

      console.log(`[api.command: received: ${event.type}]`);

      if (event.type === 'SALE_SUBMITTED') {
        await publishState('SALE_IN_PROGRESS', event.payload);
      }
    },
  });
}

export async function stop(): Promise<void> {
    console.info(`commandHandler.stop: STOP`);
    await consumer.stop();
    console.info(`commandHandler.stop: Disconnect consumer for: '${topic}'`);
    await consumer.disconnect();
    console.info(`commandHandler.stop: END`);
}