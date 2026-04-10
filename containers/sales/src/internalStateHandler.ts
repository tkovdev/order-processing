import { randomUUID } from 'crypto';
import { Kafka } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:29092';

const topic = `sales.state`;

const kafka = new Kafka({ clientId: `sales-state`, brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: `sales-state` });
const producer = kafka.producer();

export async function publishState(type: string, payload?: string): Promise<void> {
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
    }).catch((error) => {
        console.error(`Failed to publish state: ${error}`);
    });
}

export async function start(): Promise<void> {
    try {
        await consumer.connect();
        await producer.connect();
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

            if (event.type === 'SALE_IN_PROGRESS') {
                console.log(`Sale processing...`);
                await publishState('SALE_COMPLETED');
            }

            if (event.type === 'SALE_COMPLETED') {
                console.log(`Sale completed`);
                await publishState('PROCEED_TO_ORDER');
            }
        }
    }).catch((error) => {
        console.error(`Failed to run consumer: ${error}`);
    });
}

export async function stop(): Promise<void> {
    try {
        await consumer.stop();
        await consumer.disconnect();
        await producer.disconnect();
    } catch (error) {
        console.error(`Failure occurred on stop: ${error}`);
        process.exit(1);
    }
}