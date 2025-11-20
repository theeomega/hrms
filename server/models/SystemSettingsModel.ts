import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  signupEnabled: { type: Boolean, default: true },
  defaultSickLeave: { type: Number, default: 12 },
  defaultVacationLeave: { type: Number, default: 15 },
  defaultPersonalLeave: { type: Number, default: 5 },
  updatedAt: { type: Date, default: Date.now }
});

// We will ensure there is only one document in this collection
export const SystemSettingsModel = mongoose.model('SystemSettings', systemSettingsSchema);
