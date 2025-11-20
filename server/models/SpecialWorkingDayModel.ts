import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialWorkingDay extends Document {
  date: Date;
  reason?: string;
  createdAt: Date;
}

const SpecialWorkingDaySchema: Schema = new Schema({
  date: { type: Date, required: true, unique: true },
  reason: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<ISpecialWorkingDay>('SpecialWorkingDay', SpecialWorkingDaySchema);
