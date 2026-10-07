/**
 * @file backend/src/controllers/bidScore.controller.js
 * @description Controller for calculating, storing, and reviewing J&K tender bid allocation probability scores.
 */
import mongoose from 'mongoose';
import Tender from '../models/Tender.js';
import ContractorProfile from '../models/ContractorProfile.js';
import BidEvaluation from '../models/BidEvaluation.js';
import User from '../models/User.js';
import { BidScoreService } from '../services/bidScore.service.js';

/**
 * Helper: Retrieve or create contractor profile bound to userId
 */
const getOrCreateContractorProfile = async (userId) => {
  let profile = await ContractorProfile.findOne({ userId });
  if (profile) return profile;

  const user = await User.findById(userId);
  profile = await ContractorProfile.create({
    userId,
    name: user?.name || user?.firstName || 'Contractor',
    contractorId: `NIT-${userId.toString().slice(-4).toUpperCase()}`,
    jurisdiction: 'Jammu & Kashmir / North Zone',
    affiliation: 'NIT Srinagar, J&K',
    divisionBadge: 'J&K Public Works Division',
    registrationClass: 'Class A Works',
    portalVerification: 'Active • L1 Compliant',
    status: 'Active',
    financialMetrics: {
      maxAnnualTurnover: 0,
      ongoingCommitments: 0,
      largestSimilarWork: 0,
      hasMachineryEquipment: true,
      hasValidGstClearance: true,
      hasRegistrationCardRenewal: true,
      hasActiveCdrFdrFacility: true,
    }
  });

  return profile;
};

/**
 * Evaluates bid allocation probability for a specific tender and contractor
 * @route POST /api/v1/bid-score/evaluate
 */
export const evaluateBidScore = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required. Please sign in to calculate tender bid scores.',
        requireLogin: true 
      });
    }

    const {
      tenderId,
      maxAnnualTurnover = 0,
      ongoingCommitments = 0,
      largestSimilarWork = 0,
      proposedQuotePercentage = -5.0,
      registrationClass = 'Class A Works',
      hasMachineryEquipment = true,
      hasValidGstClearance = true,
      hasRegistrationCardRenewal = true,
      hasActiveCdrFdrFacility = true,
      saveAsDefaultProfile = true,
    } = req.body;

    if (!tenderId) {
      return res.status(400).json({ error: 'Tender ID is required for contract-specific score calculation.' });
    }

    // 1. Fetch Target Tender
    let tender = null;
    if (mongoose.Types.ObjectId.isValid(tenderId)) {
      tender = await Tender.findById(tenderId);
    }
    if (!tender) {
      tender = await Tender.findOne({ sourceTenderId: tenderId });
    }

    if (!tender) {
      return res.status(404).json({ error: 'Target tender could not be found.' });
    }

    // 2. Fetch or initialize Contractor Profile
    const profile = await getOrCreateContractorProfile(userId);

    const inputData = {
      maxAnnualTurnover: Math.max(0, Number(maxAnnualTurnover) || 0),
      ongoingCommitments: Math.max(0, Number(ongoingCommitments) || 0),
      largestSimilarWork: Math.max(0, Number(largestSimilarWork) || 0),
      proposedQuotePercentage: Number(proposedQuotePercentage) ?? -5.0,
      registrationClass: registrationClass || profile.registrationClass || 'Class A Works',
      hasMachineryEquipment: Boolean(hasMachineryEquipment),
      hasValidGstClearance: Boolean(hasValidGstClearance),
      hasRegistrationCardRenewal: Boolean(hasRegistrationCardRenewal),
      hasActiveCdrFdrFacility: Boolean(hasActiveCdrFdrFacility),
    };

    // 3. Persist financial baseline in Contractor Profile for future reference & updates
    if (saveAsDefaultProfile) {
      profile.registrationClass = inputData.registrationClass;
      profile.financialMetrics = {
        maxAnnualTurnover: inputData.maxAnnualTurnover,
        ongoingCommitments: inputData.ongoingCommitments,
        largestSimilarWork: inputData.largestSimilarWork,
        hasMachineryEquipment: inputData.hasMachineryEquipment,
        hasValidGstClearance: inputData.hasValidGstClearance,
        hasRegistrationCardRenewal: inputData.hasRegistrationCardRenewal,
        hasActiveCdrFdrFacility: inputData.hasActiveCdrFdrFacility,
        lastUpdated: new Date(),
      };
      await profile.save();
    }

    // 4. Run Bid Scoring Engine
    const evaluationResults = BidScoreService.evaluateBid(tender, inputData);

    // 5. Store specific evaluation record in DB for contractor's history
    const bidEvaluation = await BidEvaluation.create({
      userId,
      contractorProfileId: profile._id,
      tenderId: tender._id,
      tenderSnapshot: {
        sourceTenderId: tender.sourceTenderId,
        title: tender.title,
        departmentName: tender.departmentName || tender.organisationChain,
        estimatedValue: tender.estimatedValue || 0,
        tendererClass: tender.tendererClass,
        periodOfWorkDays: tender.periodOfWorkDays || 180,
        location: tender.location || 'Jammu & Kashmir',
        sourcePortal: tender.sourcePortal || 'JK_TENDERS',
      },
      inputs: inputData,
      results: evaluationResults,
    });

    // Add to profile evaluation array if not already present
    if (!profile.evaluations.includes(bidEvaluation._id)) {
      profile.evaluations.push(bidEvaluation._id);
      await profile.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Bid allocation probability evaluated successfully.',
      data: {
        evaluationId: bidEvaluation._id,
        tender: bidEvaluation.tenderSnapshot,
        inputs: bidEvaluation.inputs,
        results: evaluationResults,
        savedToProfile: true,
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Returns saved contractor financial metrics to pre-populate the check form
 * @route GET /api/v1/bid-score/metrics
 */
export const getContractorFinancialMetrics = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.', requireLogin: true });
    }

    const profile = await getOrCreateContractorProfile(userId);

    return res.status(200).json({
      success: true,
      data: {
        registrationClass: profile.registrationClass || 'Class A Works',
        financialMetrics: profile.financialMetrics || {
          maxAnnualTurnover: 0,
          ongoingCommitments: 0,
          largestSimilarWork: 0,
          hasMachineryEquipment: true,
          hasValidGstClearance: true,
          hasRegistrationCardRenewal: true,
          hasActiveCdrFdrFacility: true,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns past evaluated bids for the authenticated contractor
 * @route GET /api/v1/bid-score/history
 */
export const getBidScoreHistory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.', requireLogin: true });
    }

    const evaluations = await BidEvaluation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      data: evaluations,
      count: evaluations.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a single evaluation record from history
 * @route DELETE /api/v1/bid-score/history/:id
 */
export const deleteBidEvaluation = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const evaluation = await BidEvaluation.findOneAndDelete({ _id: id, userId });
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation record not found.' });
    }

    // Pull from profile array
    await ContractorProfile.updateOne(
      { userId },
      { $pull: { evaluations: id } }
    );

    return res.status(200).json({
      success: true,
      message: 'Evaluation record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
