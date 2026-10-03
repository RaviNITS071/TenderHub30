/**
 * @file backend/src/modules/billing/models/Subscription.js
 * @description Subscription domain model storing contractor membership status,
 * plan tiers, payment lifecycle, and feature entitlements.
 */
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planId: {
    type: String,
    enum: ['pro_monthly', 'pro_quarterly', 'pro_annual'],
    required: true,
    default: 'pro_monthly',
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'expired', 'trialing'],
    default: 'active',
    index: true,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'monthly',
  },
  amount: {
    type: Number,
    required: true,
    default: 10,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    index: true,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  // Payment Gateway references (isolated for multi-provider support)
  gateway: {
    type: String,
    enum: ['razorpay', 'cashfree', 'manual_admin', 'mock_test'],
    default: 'razorpay',
  },
  gatewayOrderId: {
    type: String,
    sparse: true,
    index: true,
  },
  gatewayPaymentId: {
    type: String,
    sparse: true,
    index: true,
  },
  gatewaySubscriptionId: {
    type: String,
    sparse: true,
    index: true,
  },
  // Feature Entitlements Snapshot
  features: {
    unlimitedViews: { type: Boolean, default: true },
    unlimitedSaves: { type: Boolean, default: true },
    whatsappAlerts: { type: Boolean, default: true },
    instantBoqDownload: { type: Boolean, default: true },
    corrigendumAlerts: { type: Boolean, default: true },
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  }
}, { timestamps: true });

// Check if subscription is actively valid
subscriptionSchema.methods.isValid = function () {
  return (this.status === 'active' || this.status === 'trialing') && this.currentPeriodEnd > new Date();
};

export default mongoose.model('Subscription', subscriptionSchema);
