import { kafka } from "./client";

const GROUP_ID = `api-ops-buffer`
const TOPICS = ['api.command', 'orders.state', 'sales.state', 'shipping.state'];
const buffer: RecentKafkaMessages[] = [];
const MAX = 100;

const consumer = kafka.consumer({ groupId: GROUP_ID });


export interface RecentKafkaMessages {
    correlationId: string,
    topic: string,
    type: string,
    service: string,
    timestamp: Date
}

export const startRecentMessageBuffer = async () => {
    await consumer.connect();
    
    for (const topic of TOPICS) {
        await consumer.subscribe({ topic, fromBeginning: false });
    }
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const parsed = JSON.parse(message.value?.toString() ?? '{}');
            buffer.push({
                correlationId: parsed.commandId,
                topic,
                type: parsed.type,
                service: parsed.publisher,
                timestamp: new Date(Number(message.timestamp))
            });
            if (buffer.length > MAX) buffer.shift();
        }
    });
};

export const getRecentMessages = () => [...buffer];