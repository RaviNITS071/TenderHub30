import mongoose from 'mongoose';

const bidEvaluationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  contractorProfileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ContractorProfile', 
    required: true, 
    index: true 
  },
  tenderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tender', 
    required: true, 
    index: true 
  },

  // Snapshot of Tender Parameters at evaluation time
  tenderSnapshot: {
    sourceTenderId: { type: String, required: true },
    title: { type: String, required: true },
    departmentName: { type: String },
    estimatedValue: { type: Number, default: 0 },
    tendererClass: { type: String },
    periodOfWorkDays: { type: Number, default: 180 },
    location: { type: String },
    sourcePortal: { type: String, default: 'JK_TENDERS' },
  },

  // Contractor Inputs evaluated
  inputs: {
    registrationClass: { type: String, default: 'Class A Works' },
    maxAnnualTurnover: { type: Number, default: 0 },
    ongoingCommitments: { type: Number, default: 0 },
    largestSimilarWork: { type: Number, default: 0 },
    proposedQuotePercentage: { type: Number, default: -5.0 }, // e.g. -8.5 means 8.5% below advertised cost
    hasMachineryEquipment: { type: Boolean, default: true },
    hasValidGstClearance: { type: Boolean, default: true },
    hasRegistrationCardRenewal: { type: Boolean, default: true },
    hasActiveCdrFdrFacility: { type: Boolean, default: true },
  },

  // Evaluated Metrics & Scores
  results: {
    totalScore: { type: Number, required: true }, // 0 to 100
    allocationProbability: { 
      type: String, 
      enum: ['High', 'Moderate', 'Low', 'Disqualified / Critical Risk'],
      required: true 
    },
    probabilityPercentage: { type: Number, required: true },
    assessedBidCapacity: { type: Number, default: 0 },
    bidCapacitySurplus: { type: Number, default: 0 },
    isBidCapacityEligible: { type: Boolean, default: true },
    isCover1Eligible: { type: Boolean, default: true },
    
    // Category Breakdown
    categoryScores: {
      bidCapacityScore: { type: Number, default: 0 },       // Max 30
      technicalExperienceScore: { type: Number, default: 0 },// Max 25
      pricingCompetitivenessScore: { type: Number, default: 0 }, // Max 25
      statutoryComplianceScore: { type: Number, default: 0 },   // Max 20
    },

    riskFlags: [{ type: String }],
    actionableInsights: [{ type: String }],
    jkSpecificGuidelines: [{ type: String }],
  }
}, { 
  timestamps: true 
});

// Index for rapid history lookup per user
bidEvaluationSchema.index({ userId: 1, createdAt: -1 });
bidEvaluationSchema.index({ contractorProfileId: 1, tenderId: 1 });

export default mongoose.model('BidEvaluation', bidEvaluationSchema);
