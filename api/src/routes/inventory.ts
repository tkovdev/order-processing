import express, { Request, Response } from 'express';
import { ItemModel } from '../models/item';
import { z } from 'zod';
import { getLocationName } from '../logic/locationLogic';

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
  const schema = z.coerce.number().int().positive().max(1000).default(10);
  const parsedSchema = schema.safeParse(req.query.limit);
  if (!parsedSchema.success) {
    res.status(400).json(z.treeifyError(parsedSchema.error));
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
      ...(parsedSchema.data ? [{ $limit: parsedSchema.data }] : [])
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


const getInventoryExposureRisk = async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    maxQty: z.coerce.number().int().positive(),
    minUnitPrice: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(1000).default(10),
  });

  const parsedSchema = schema.safeParse({
    maxQty: req.query.maxQty,
    minUnitPrice: req.query.minUnitPrice,
    limit: req.query.limit,
  });

  if (!parsedSchema.success) {
    res.status(400).json(z.treeifyError(parsedSchema.error));
    return;
  }

  const { maxQty, minUnitPrice, limit } = parsedSchema.data;
  
  try {
    const matchStage: Record<string, unknown> = {
      quantity: { $lte: maxQty },
      ...(minUnitPrice !== undefined ? { price: { $gte: minUnitPrice } } : {}),
    };

    const items = await ItemModel.aggregate([
      { $match: matchStage },
      {
        $project: {
          _id: 0,
          itemId: '$_id',
          name: 1,
          location: 1,
          quantity: 1,
          unitPrice: '$price',
          atRiskValue: { $multiply: ['$quantity', '$price'] },
        },
      },
      { $sort: { atRiskValue: -1 } },
      { $limit: limit },
    ]);

    const referencePrice = minUnitPrice ?? 100;
    const alpha = 0.5;
    const minTarget = 2;
    const maxExposure = items.reduce((max: number, item: any) => Math.max(max, item.atRiskValue), 0);

    const exposedItems = items.map((item: any) => {
      const adjustedTarget = Math.max(
        minTarget,
        Math.min(
          maxQty,
          Math.round(maxQty * Math.pow(referencePrice / Math.max(item.unitPrice, 1), alpha)),
        ),
      );
      const shortageScore = Math.max(0, 1 - item.quantity / adjustedTarget);
      const exposureScore = maxExposure > 0 ? item.atRiskValue / maxExposure : 0;
      const riskScore = Math.round((0.65 * shortageScore + 0.35 * exposureScore) * 100);
      const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

      return {
        itemId: item.itemId,
        name: item.name,
        location: item.location,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        atRiskValue: item.atRiskValue,
        targetQuantity: adjustedTarget,
        riskScore,
        riskLevel,
      };
    });

    res.status(200).json(exposedItems);
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

const getLocationOverviewByLocation = async (req: Request, res: Response): Promise<void> => {
  const schema = z.coerce.string();
  const parsedSchema = schema.safeParse(req.params.location);
  if (!parsedSchema.success) {
    res.status(400).json(z.treeifyError(parsedSchema.error));
    return;
  }
  try {
    const items = await ItemModel.aggregate([
        { $match: { location: { $regex: new RegExp(`^${getLocationName(parsedSchema.data)}$`, 'i') } } },
        { $group: { _id: "$location", itemCount: { $sum: 1 }, quantity: { $sum: "$quantity" }, value: { $sum: {$multiply: ["$price", "$quantity"]} } } },
        { 
            $project: {
                _id: 0,
                location: "$_id",
                inventorySummary: {
                  itemCount: "$itemCount",
                  totalUnits: "$quantity",
                  totalValue: "$value"
                }
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


// Register routes
router.get('/locations/summary', getLocationInventorySummary);
router.get('/locations/:location/overview', getLocationOverviewByLocation);
router.get('/items/top-value', getTopValueInventoryItems);
router.get('/risk/exposure', getInventoryExposureRisk);

export default router;