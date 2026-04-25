import express, { Request, Response } from 'express';
import { z } from 'zod';
import { SaleModel } from '../models/sale';

const router = express.Router();

const getCustomerValueRank = async (req: Request, res: Response): Promise<void> => {
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
            { $unwind: "$itemDocs" },
            {
                $group: {
                    _id: "$customer.email",
                    customerName: { $first: "$customer.name" },
                    saleIds: { $addToSet: "$_id" },
                    totalUnits: { $sum: "$itemDocs.saleItem.quantity" },
                    totalValue: { $sum: "$itemDocs.lineTotal" }
                }
            },
            {
                $addFields: {
                    salesCount: { $size: "$saleIds" }
                }
            },
            {
                $project: {
                    _id: 0,
                    customerName: "$customerName",
                    customerEmail: "$_id",
                    salesCount: 1,
                    totalUnits: 1,
                    totalValue: 1
                }
            },
            {
                $sort: { quantity: -1 }  // -1 = descending, 1 = ascending
            },
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

}

// Register routes
router.get('/value-ranking', getCustomerValueRank);

export default router;