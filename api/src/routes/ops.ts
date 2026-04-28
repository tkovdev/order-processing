import express, { Request, Response } from 'express';
import { docker } from '../docker/client';

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

// Register routes
router.get('/containers', getContianerStatuses);

export default router;