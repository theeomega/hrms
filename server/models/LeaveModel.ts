import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'Sick Leave' | 'Vacation' | 'Personal Leave';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: Date;
  approvedBy: mongoose.Types.ObjectId | null;
  approvalDate: Date | null;
  rejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['Sick Leave', 'Vacation', 'Personal Leave'],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' 
  },
  appliedOn: { type: Date, default: Date.now },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvalDate: { type: Date, default: null },
  rejectionReason: { type: String, default: '' }
}, {
  timestamps: true
});

// Index for faster queries
LeaveSchema.index({ userId: 1, appliedOn: -1 });

export default mongoose.model<ILeave>('Leave', LeaveSchema);
