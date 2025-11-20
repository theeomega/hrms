import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  hours: number;
  status: 'present' | 'late' | 'absent' | 'leave';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null },
  hours: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['present', 'late', 'absent', 'leave'],
    required: true 
  },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Index for faster queries
AttendanceSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
