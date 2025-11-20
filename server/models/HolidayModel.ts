import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  description?: string;
  createdAt: Date;
}

const HolidaySchema: Schema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true, unique: true }, // Unique date to prevent duplicates
  description: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);
