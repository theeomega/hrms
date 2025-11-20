import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveBalance extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  sickLeave: { used: number; total: number };
  vacation: { used: number; total: number };
  personalLeave: { used: number; total: number };
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  year: { type: Number, required: true, default: () => new Date().getFullYear() },
  sickLeave: {
    used: { type: Number, default: 0 },
    total: { type: Number, default: 12 }
  },
  vacation: {
    used: { type: Number, default: 0 },
    total: { type: Number, default: 15 }
  },
  personalLeave: {
    used: { type: Number, default: 0 },
    total: { type: Number, default: 5 }
  }
}, {
  timestamps: true
});

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
