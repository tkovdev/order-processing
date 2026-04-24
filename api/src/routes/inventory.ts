import express, { Request, Response } from 'express';
import { ItemModel } from '../models/item';
import { z } from 'zod';

const router = express.Router();

// Function to get all workers
const getLocationInventorySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await ItemModel.aggregate([
        { $group: { _id: "$location", itemCount: { $sum: 1 }, quantity: { $sum: "$quantity" }, value: { $sum: {$multiply: ["$price", "$quantity"]} } } },
        { 
            $project: {
                _id: 0,
                location: "$_id",
                itemCount: 1,
                quantity: 1,
                value: 1
            }
        }
    ]);
    res.status(200).json(items);
    return;
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items from database',
      message: 'An internal server error occurred'
    });
    return;
  }
};

const getTopValueInventoryItems = async (req: Request, res: Response): Promise<void> => {
  const schema = z.coerce.number().int().positive().default(10);
  const parsedLimit = schema.safeParse(req.query.limit);
  if (!parsedLimit.success) {
    res.status(400).json("Invalid limit");
    return;
  }
  if (parsedLimit.data! > 1000) {
    res.status(400).json("Limit must be 1000 or lower");
    return;
  }
  
  try {
    const items = await ItemModel.aggregate([
      {
        $addFields: { value: {$multiply: ['$quantity', '$price']}}
      },
      { 
          $project: {
              _id: 0,
              location: 1,
              quantity: 1,
              unitPrice: "$price",
              value: 1,
              itemId: "$_id",
              name: 1
          }
      },
      {
        $sort: { value: -1 }  // -1 = descending, 1 = ascending
      },
      ...(parsedLimit.data ? [{ $limit: parsedLimit.data }] : [])
    ])
    res.status(200).json(items);
    return;
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items from database',
      message: 'An internal server error occurred'
    });
    return;
  }

}

// Register routes
router.get('/locations/summary', getLocationInventorySummary);
router.get('/items/top-value', getTopValueInventoryItems);

export default router;