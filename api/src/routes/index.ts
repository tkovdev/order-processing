import express from 'express';
import itemsRoute from './items';
import salesRoute from './sales';
import metricsRoute from './metrics';

const router = express.Router();

// Mount the items router
router.use('/items', itemsRoute);
router.use('/sales', salesRoute);
router.use('/metrics', metricsRoute);

export default router;