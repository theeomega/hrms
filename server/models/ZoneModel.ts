import mongoose, { Schema, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model<IZone>('Zone', ZoneSchema);
