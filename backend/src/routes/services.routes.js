import express from 'express';
import {
  getAiPlans,
  getContractorProfile,
  updateContractorProfile,
  analyzeTender,
  getTenderDossier,
  postCopilotChat,
  getMyDossiers,
} from '../controllers/services.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (pricing and plan comparison)
router.get('/plans', getAiPlans);

// Authenticated / Test-bypass contractor routes
router.use(verifyToken);

router.get('/contractor-profile', getContractorProfile);
router.put('/contractor-profile', updateContractorProfile);

router.post('/analyze/:tenderId', analyzeTender);
router.get('/dossier/:tenderId', getTenderDossier);
router.post('/chat/:tenderId', postCopilotChat);
router.get('/my-dossiers', getMyDossiers);

export default router;
