import express, { Request, Response } from 'express';
import { ItemModel } from '../models/item';

const router = express.Router();

// Function to get all workers
const getLocationInventorySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await ItemModel.aggregate([
        { $group: { _id: "$location", itemCount: { $sum: 1 }, quantity: { $sum: "$quantity" }, value: { $sum: {$multiply: ["$price", "$quantity"]} } } },
        { 
            $project: {
                _id: 0,           // Set to 0 to hide the _id field
                location: "$_id", // Rename _id to location
                itemCount: 1,     // Keep these fields
                quantity: 1,
                value: 1
            }
        }
    ]);
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items from database',
      message: 'An internal server error occurred'
    });
  }
};

// Register routes
router.get('/locations/summary', getLocationInventorySummary);

export default router;