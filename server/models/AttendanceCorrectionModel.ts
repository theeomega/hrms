import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceCorrection extends Document {
  userId: mongoose.Types.ObjectId;
  attendanceId: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  reviewNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceCorrectionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNotes: { type: String, default: '' }
}, {
  timestamps: true
});

// Index for faster queries
AttendanceCorrectionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model<IAttendanceCorrection>('AttendanceCorrection', AttendanceCorrectionSchema);
