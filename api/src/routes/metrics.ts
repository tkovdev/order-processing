import express, { Request, Response } from 'express';
import { ItemModel } from '../models/item';
import { SaleModel } from '../models/sale';
import { inventoryQuantityPrices, salesByStatus } from '../logic/metricsLogic';

const router = express.Router();

// Function to get all workers
const getOperationsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemsQuantityPrice = (await ItemModel.find().select('quantity price')).map((x) => {
      return {_id: x._id.toString(), price: x.price, quantity: x.quantity}
    });
    const salesStatuses = (await SaleModel.find().select('status')).map((x) => {
      return {_id: x._id.toString(), status: x.status}
    });
    const inventoryTotals = inventoryQuantityPrices(itemsQuantityPrice);
    const salesTotals = salesByStatus(salesStatuses);
    res.status(200).json({
      totalInventoryQuantity: inventoryTotals.quantity,
      totalInventoryValue: inventoryTotals.price * inventoryTotals.quantity,
      totalSales: salesTotals.total,
      submittedSales: salesTotals.submitted,
      completedSales: salesTotals.completed
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