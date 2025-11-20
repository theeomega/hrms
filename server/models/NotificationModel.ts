import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'leave' | 'attendance' | 'system' | 'approval' | 'alert' | 'meeting' | 'reminder' | 'team';
  title: string;
  message: string;
  read: boolean;
  relatedUser: mongoose.Types.ObjectId | null;
  actor?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['leave', 'attendance', 'system', 'approval', 'alert', 'meeting', 'reminder', 'team'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  actor: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

// Index for faster queries
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
