import { randomUUID } from 'crypto';
import { Kafka } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `sales.state`;

const kafka = new Kafka({ clientId: `sales-state`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `sales-state` });
const producer = kafka.producer();

export async function publishState(type: string, payload?: string): Promise<void> {
    console.info(`stateHandler.publishState: STARTED: ${type}`);
    console.info(`stateHandler.publishState: send to producer for: '${topic}'`);
    const command = {
        commandId: randomUUID(),
        type,
        payload,
        timestamp: new Date().toISOString(),
    };
    await producer.send({
        topic,
        messages: [{ key: randomUUID(), value: JSON.stringify(command) }],
    });
    console.info(`stateHandler.publishState: END: ${type}`);
}

export async function start(): Promise<void> {
    console.info(`stateHandler.start: START`);
    console.info(`stateHandler.start: connect to consumer for: '${topic}'`);
    await consumer.connect();
    console.info(`stateHandler.start: connect to producer for: '${topic}'`);
    await producer.connect();
    console.info(`stateHandler.start: subscribe to consumer for: '${topic}'`);
    await consumer.subscribe({ topic, fromBeginning: false });
    
    console.info(`stateHandler.start: process messages from consumer for: '${topic}'`);
    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;
            const event = JSON.parse(message.value.toString());

            console.log(`[sales.state: received: ${event.type}]`);

            if (event.type === 'SALE_IN_PROGRESS') {
                console.log(`Sale processing...`);
                await publishState('SALE_COMPLETED');
            }

            if (event.type === 'SALE_COMPLETED') {
                console.log(`Sale completed`);
                await publishState('SALE_DONE');
            }
        }
    });
    console.info(`stateHandler.start: END`);
}

export async function stop(): Promise<void> {
    console.info(`stateHandler.stop: STOP`);
    await consumer.stop();
    console.info(`stateHandler.stop: Disconnect consumer for: '${topic}'`);
    await consumer.disconnect();
    console.info(`stateHandler.stop: Disconnect producer for: '${topic}'`);
    await producer.disconnect();
    console.info(`stateHandler.stop: END`);
}