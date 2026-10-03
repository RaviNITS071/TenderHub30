/**
 * @file backend/src/middleware/subscription.middleware.js
 * @description Role and subscription authorization middleware gating Pro features.
 */
import Subscription from '../modules/billing/models/Subscription.js';
import { env } from '../config/env.js';

export const requireProSubscription = async (req, res, next) => {
  try {
    // 1. Dev / Test mode bypass
    if (env.NODE_ENV !== 'production' && (
      req.headers['x-bypass-auth'] === 'true' || 
      req.headers.origin?.includes(':5175') || 
      req.headers.referer?.includes(':5175')
    )) {
      return next();
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Please sign in to access this feature.',
      });
    }

    // 2. Admins and owners always have full access
    if (['admin', 'owner'].includes(req.user?.role)) {
      return next();
    }

    // 3. Query Subscription
    const subscription = await Subscription.findOne({ userId });
    if (subscription && subscription.isValid()) {
      req.subscription = subscription;
      return next();
    }

    // 4. Return paywall gating response
    return res.status(403).json({
      success: false,
      error: 'SUBSCRIPTION_REQUIRED',
      message: 'This feature requires an active TenderHub Pro subscription.',
      requireSubscription: true,
      pricingUrl: '/pricing',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
