import express, { Request, Response } from 'express';
import { ISale, SaleModel } from '../models/sale';
import { publishCommand } from '../kafka/producer';

const router = express.Router();

// Function to get all sales
const getSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await SaleModel.find();
    res.status(200).json({
      sales
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales from database',
      message: 'An internal server error occurred'
    });
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
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ 
      error: 'Failed to create sale',
      message: 'An internal server error occurred'
    });
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
  } catch (error) {
    console.error('Error processing sale:', error);
    res.status(500).json({ 
      error: 'Failed to process sale',
      message: 'An internal server error occurred'
    });
  }
};

// Register routes
router.get('/', getSales);
router.post('/', createSale);
router.post('/:id/process', processSale);

export default router;