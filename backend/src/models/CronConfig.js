/**
 * @file backend/src/models/CronConfig.js
 * @description Stores administrative configuration for scheduled scraping cycles,
 * permission toggles, and retention policies.
 */
import mongoose from 'mongoose';

const cronConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    required: true,
    unique: true,
    default: 'GLOBAL_CRON_SETTINGS',
  },
  // Master toggle: Admin can enable or disable automated scraping at any time
  isAutomatedSyncEnabled: {
    type: Boolean,
    default: true,
  },
  // Ingestion Mode: 30-min adaptive office-hours polling vs custom slots
  scheduleMode: {
    type: String,
    enum: ['POLLING_30_MIN', 'CUSTOM_SLOTS'],
    default: 'POLLING_30_MIN',
  },
  // Designated automated scraping times in 24-hr format (IST)
  scheduledSlots: {
    type: [String],
    default: ['Every 30m (09:05-19:05 IST Mon-Sat)', '19:15 Evening Catchup', '20:00 Doc Recovery'],
  },
  // Enable automated 30-day archive deletion
  isArchivePurgeEnabled: {
    type: Boolean,
    default: true,
  },
  archiveRetentionDays: {
    type: Number,
    default: 30,
  },
  lastRunAt: {
    type: Date,
  },
  lastRunStatus: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'RUNNING', 'IDLE'],
    default: 'IDLE',
  },
  lastRunDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  lastPurgedAt: {
    type: Date,
  },
  lastPurgedCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('CronConfig', cronConfigSchema);
