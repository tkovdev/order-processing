import express from 'express';
import itemsRoute from './items';
import salesRoute from './sales';
import metricsRoute from './metrics';
import inventoryRoute from './inventory';
import customersRoute from './customers';
import opsRoute from './ops';

const router = express.Router();

// Mount the items router
router.use('/items', itemsRoute);
router.use('/sales', salesRoute);
router.use('/metrics', metricsRoute);
router.use('/inventory', inventoryRoute);
router.use('/customers', customersRoute);
router.use('/ops', opsRoute);

export default router;