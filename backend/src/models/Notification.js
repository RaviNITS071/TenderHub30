import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'tender_update'], default: 'info' },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object }
}, { timestamps: true });

notificationSchema.index({ organizationId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
