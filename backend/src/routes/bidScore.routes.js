/**
 * @file backend/src/routes/bidScore.routes.js
 * @description API routes for calculating tender bid allocation probability scores and managing evaluation history.
 */
import { Router } from 'express';
import {
  evaluateBidScore,
  getContractorFinancialMetrics,
  getBidScoreHistory,
  deleteBidEvaluation,
} from '../controllers/bidScore.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// All score-checking endpoints require authentication
router.post('/evaluate', verifyToken, evaluateBidScore);
router.get('/metrics', verifyToken, getContractorFinancialMetrics);
router.get('/history', verifyToken, getBidScoreHistory);
router.delete('/history/:id', verifyToken, deleteBidEvaluation);

export default router;
