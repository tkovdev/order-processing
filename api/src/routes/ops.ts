import express, { Request, Response } from 'express';
import { docker } from '../docker/client';
import { kafka } from '../kafka/client';
import { getRecentMessages } from '../kafka/utilities';
import z from 'zod';

const router = express.Router();

// Function to get all workers
const getContianerStatuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const summaries = await docker.listContainers({
      all: true,
      filters: {
        label: ['com.docker.compose.project=order-processing']
      }
    });

    const containers = await Promise.all(
      summaries.map(async (summary) => {
        const inspect = await docker.getContainer(summary.Id).inspect();
        return {
          name: inspect.Name.replace('/', ''),
          status: inspect.State.Status,
          startedAt: new Date(inspect.State.StartedAt),
          health: inspect.State.Health?.Status ?? "unknown"
        }
      })
    );

    res.status(200).json({
      services: containers,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      error: 'Failed to fetch items from database',
      message: 'An internal server error occurred'
    });
  }
};

// Function to get recent kafka messages
const getRecentKafkaMessages = async (req: Request, res: Response): Promise<void> => {
  const schema = z.coerce.number().int().positive().max(100);
  const parsedSchema = schema.safeParse(req.query.limit);
  if (!parsedSchema.success) {
    res.status(400).json(z.treeifyError(parsedSchema.error));
    return;
  }
  try {
    const messages = getRecentMessages()
                      .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .slice(0, parsedSchema.data);
    res.status(200).json({ messages, updatedAt: new Date() });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      error: 'Failed to fetch items from database',
      message: 'An internal server error occurred'
    });
  }
};

// Register routes
router.get('/containers', getContianerStatuses);
router.get('/kafka', getRecentKafkaMessages);

export default router;