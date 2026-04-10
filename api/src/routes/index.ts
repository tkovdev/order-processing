import express from 'express';
import itemsRoute from './items';
import salesRoute from './sales';

const router = express.Router();

// Mount the items router
router.use('/items', itemsRoute);
router.use('/sales', salesRoute);

export default router;