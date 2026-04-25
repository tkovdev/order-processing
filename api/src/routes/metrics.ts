import express, { Request, Response } from 'express';
import { ItemModel } from '../models/item';
import { SaleModel } from '../models/sale';
import { inventoryQuantityPrices, salesByStatus } from '../logic/metricsLogic';

const router = express.Router();

// Function to get all workers
const getOperationsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemQuantityValue = await ItemModel.aggregate([
      { 
        $group: { 
          _id: null, quantity: { $sum: "$quantity" }, value: { $sum: {$multiply: ["$price", "$quantity"]} }
        }
      },
      {
        $project: {
          _id: 0,
        }
      }
    ]);
    
    const salesStatuses = await SaleModel.aggregate([
      { 
        $group: { 
          _id: "$status", total: { $sum: 1 }
        }
      }
    ]);

    const getTotalForStatus = (status: string) => salesStatuses.find(s => s._id === status)?.total || 0;

    // const salesTotals = salesByStatus(salesStatuses);
    res.status(200).json({
      totalInventoryQuantity: itemQuantityValue[0].quantity,
      totalInventoryValue: itemQuantityValue[0].value,
      totalSales: salesStatuses.reduce((sum, s) => sum + s.total, 0),
      submittedSales: getTotalForStatus("submitted"),
      completedSales: getTotalForStatus("completed"),
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
router.get('/operations/summary', getOperationsSummary);

export default router;