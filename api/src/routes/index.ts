import express from 'express';
import itemsRoute from './items';
import salesRoute from './sales';
import metricsRoute from './metrics';
import inventoryRoute from './inventory';
import customersRoute from './customers';

const router = express.Router();

// Mount the items router
router.use('/items', itemsRoute);
router.use('/sales', salesRoute);
router.use('/metrics', metricsRoute);
router.use('/inventory', inventoryRoute);
router.use('/customers', customersRoute);

export default router;