import mongoose, { Schema } from 'mongoose';
import { required } from 'zod/mini';

// Interface for Worker document
export interface ISale {
  items: [{
    itemId: mongoose.Types.ObjectId;
    quantity: number;
  }],
  status: 'submitted' | 'completed';
  customer: {
    name: string;
    address: string;
    email: string;
  },
  createdAt?: Date;
  updatedAt?: Date;
}

const SaleSchema: Schema = new Schema(
{
  items: [{
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Number, required: true }
  }],
  customer: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true }
  },
  status: { type: String, required: true },
}, { timestamps: true });

// Create and export the Sale model
export const SaleModel = mongoose.model<ISale>('Sale', SaleSchema);