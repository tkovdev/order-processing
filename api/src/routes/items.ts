import express, { Request, Response } from 'express';
import { IItem, ItemModel, ItemType } from '../models/item';

const router = express.Router();

// Function to get all workers
const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await ItemModel.find();
    res.status(200).json({
      items
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items from database',
      message: 'An internal server error occurred'
    });
  }
};

const seedData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear existing data
    await ItemModel.deleteMany({});

    // Create sample items
    const items: IItem[] = [
      { name: 'Steel Rod', price: 10, quantity: 100, dimensions: { length: 100, width: 5, height: 5 }, location: 'Warehouse A', type: ItemType.raw_material },
      { name: 'Gear', price: 50, quantity: 50, dimensions: { length: 20, width: 20, height: 10 }, location: 'Warehouse B', type: ItemType.component },
      { name: 'Bicycle', price: 200, quantity: 20, dimensions: { length: 150, width: 50, height: 100 }, location: 'Warehouse C', type: ItemType.finished_good }
    ];

    await ItemModel.insertMany(items);

    res.status(201).json({
      message: 'Database seeded successfully',
      count: items.length
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ 
      error: 'Failed to seed database',
      message: 'An internal server error occurred'
    });
  }
};

// Register routes
router.get('/', getItems);
router.post('/seed', seedData);

export default router;