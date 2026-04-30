import { Producer } from 'kafkajs';
import { randomUUID } from 'crypto';
import { kafka } from './client';

export const COMMAND_TOPIC = 'api.command';

export interface ServiceCommand {
  commandId: string;
  type: string;
  publisher: string;
  payload?: unknown;
  timestamp: string;
}

let producer: Producer;

export const connectProducer = async (): Promise<void> => {
  producer = kafka.producer();
  await producer.connect();
  console.log('Kafka producer connected');
};

export const disconnectProducer = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
  }
};

export const publishCommand = async (
  type: string,
  payload?: unknown
): Promise<ServiceCommand> => {
  
  const command: ServiceCommand = {
    commandId: randomUUID(),
    type,
    payload,
    publisher: 'api',
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: COMMAND_TOPIC,
    messages: [{ key: command.commandId, value: JSON.stringify(command) }],
  });

  return command;
};
