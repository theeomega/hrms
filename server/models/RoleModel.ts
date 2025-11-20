import mongoose, { Schema, Document } from 'mongoose';

export interface IAppRole extends Document {
  name: string;
  description?: string;
  protected?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  protected: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export default mongoose.model<IAppRole>('AppRole', RoleSchema);
