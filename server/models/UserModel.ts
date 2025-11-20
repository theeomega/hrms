import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'employee' | 'hr_admin' | 'admin';
  employeeId: string;
  department: string;
  position: string;
  phone: string;
  location: string;
  joinDate: Date;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['employee', 'hr_admin', 'admin'], default: 'employee' },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  phone: { type: String },
  location: { type: String },
  joinDate: { type: Date, default: Date.now },
  lastActive: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
