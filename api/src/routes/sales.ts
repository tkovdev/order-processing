import express, { Request, Response } from 'express';
import { ISale, SaleModel } from '../models/sale';
import { publishCommand } from '../kafka/producer';
import { z } from 'zod';

const router = express.Router();

// Function to get all sales
const getSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await SaleModel.find();
    res.status(200).json({
      sales
    });
    return;
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      error: 'Failed to fetch sales from database',
      message: 'An internal server error occurred'
    });
    return;
  }
};

const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const sale: ISale = {
      items: req.body.items,
      customer: req.body.customer,
      status: 'submitted'
    };

    await SaleModel.create(sale);

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
    return;
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({
      error: 'Failed to create sale',
      message: 'An internal server error occurred'
    });
    return;
  }
};


const processSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await SaleModel.findById(req.params.id);
    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    await publishCommand('SALE_SUBMITTED', JSON.stringify(sale));

    res.status(200).json({
      message: 'Sale processed successfully',
      sale
    });
    return;
  } catch (error) {
    console.error('Error processing sale:', error);
    res.status(500).json({
      error: 'Failed to process sale',
      message: 'An internal server error occurred'
    });
    return;
  }
};


const recentSales = async (req: Request, res: Response): Promise<void> => {
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
    const items = await SaleModel.aggregate([
      {
        $lookup: {
          from: "items",
          let: { saleItems: "$items" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$saleItems.itemId"] } } },
            {
              $set: {
                saleItem: {
                  $first: {
                    $filter: {
                      input: "$$saleItems",
                      as: "si",
                      cond: { $eq: ["$$si.itemId", "$_id"] }
                    }
                  }
                }
              }
            },
            {
              $set: {
                lineTotal: { $multiply: ["$price", "$saleItem.quantity"] }
              }
            }
          ],
          as: "itemDocs"
        }
      },
      {
        $project: {
          _id: 0,
          saleId: "$_id",
          createdAt: 1,
          status: 1,
          customerName: "$customer.name",
          customerEmail: "$customer.email",
          lineCount: { $size: "$itemDocs" },
          totalUnits: { $sum: "$itemDocs.saleItem.quantity" },
          totalValue: { $sum: "$itemDocs.lineTotal" }
        }
      },

      { $sort: { createdAt: -1 } },
      ...(parsedLimit.data ? [{ $limit: parsedLimit.data }] : [])
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
router.get('/', getSales);
router.post('/', createSale);
router.post('/:id/process', processSale);
router.get('/recent', recentSales);

export default router;