/**
 * @file backend/src/modules/notifications/models/ContractorPreference.js
 * @description Contractor-specific notification filtering criteria for personalized WhatsApp alerts.
 */
import mongoose from 'mongoose';

const contractorPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  whatsappPhone: {
    type: String,
    trim: true,
    default: '',
  },
  whatsappEnabled: {
    type: Boolean,
    default: true,
  },
  departments: {
    type: [String],
    default: [],
  },
  districts: {
    type: [String],
    default: [],
  },
  keywords: {
    type: [String],
    default: [],
  },
  minValue: {
    type: Number,
    default: 0, // In Lakhs or absolute INR
  },
  maxValue: {
    type: Number,
    default: 0, // 0 = no maximum limit
  },
  instantAlerts: {
    type: Boolean,
    default: true,
  },
  dailyDigest: {
    type: Boolean,
    default: true,
  },
  lastNotifiedAt: {
    type: Date,
  },
  totalAlertsSent: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('ContractorPreference', contractorPreferenceSchema);
