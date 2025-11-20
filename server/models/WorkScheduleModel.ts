import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkSchedule extends Document {
  workDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  workStartTime: string; // "HH:mm" 24h format
  workEndTime: string; // "HH:mm" 24h format
  updatedAt: Date;
}

const WorkScheduleSchema: Schema = new Schema({
  workDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // Default Mon-Fri
  workStartTime: { type: String, default: '09:00' },
  workEndTime: { type: String, default: '17:00' },
}, {
  timestamps: true
});

// Singleton pattern: we'll typically only have one document
export default mongoose.model<IWorkSchedule>('WorkSchedule', WorkScheduleSchema);
