/**
 * @file backend/src/modules/billing/billing.routes.js
 * @description API route definitions for subscription plans and Razorpay checkout.
 */
import express from 'express';
import { 
  getPlans, 
  createCheckoutOrder, 
  verifyPayment, 
  getSubscriptionStatus 
} from './billing.controller.js';
import { verifyToken, optionalAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public: View plans
router.get('/plans', getPlans);

// Authenticated: Subscription status
router.get('/status', optionalAuth, getSubscriptionStatus);

// Authenticated: Create checkout order
router.post('/create-order', verifyToken, createCheckoutOrder);

// Authenticated: Verify signature and activate
router.post('/verify-payment', verifyToken, verifyPayment);

export default router;
