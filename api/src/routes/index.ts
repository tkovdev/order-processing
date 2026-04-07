import express from 'express';
import itemsRoute from './items';

const router = express.Router();

// Mount the items router
router.use('/items', itemsRoute);

export default router;