import mongoose, { Schema } from 'mongoose';

// Interface for Worker document
export interface IItem {
  name: string;
  price: number;
  quantity: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  location: string;
  type: ItemType;
}

export enum ItemType {
  raw_material = 'raw_material',
  component = 'component',
  finished_good = 'finished_good'
}

const ItemSchema: Schema = new Schema(
  {
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  dimensions: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  location: { type: String },
  type: { type: String, enum: Object.values(ItemType), required: true }
  });

// Create and export the Item model
export const ItemModel = mongoose.model<IItem>('Item', ItemSchema);