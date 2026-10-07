/**
 * @file backend/src/services/bidScore.service.js
 * @description Bid Allocation Probability and Capacity Scoring Engine for Jammu & Kashmir Tenders.
 * Implements CPWD / J&K PWD Bid Capacity formula (A * N * 2 - B), Two-Cover statutory checks,
 * and L1 financial quoting probability distribution.
 */

export class BidScoreService {
  /**
   * Normalizes registration class rank for hierarchy checking
   */
  static getClassRank(className = '') {
    const normalized = String(className).toLowerCase();
    if (normalized.includes('special') || normalized.includes('super')) return 5;
    if (normalized.includes('class a') || normalized.includes('class-a')) return 4;
    if (normalized.includes('class b') || normalized.includes('class-b')) return 3;
    if (normalized.includes('class c') || normalized.includes('class-c')) return 2;
    if (normalized.includes('class d') || normalized.includes('class-d')) return 1;
    return 3; // Default intermediate
  }

  /**
   * Calculates comprehensive bid allocation probability and scoring breakdown
   * @param {Object} tender - Target tender document
   * @param {Object} inputs - Contractor financial and execution parameters
   * @returns {Object} Evaluation outcome
   */
  static evaluateBid(tender, inputs) {
    const estimatedValue = Number(tender.estimatedValue) || 1000000; // fallback ₹10 Lakhs if unstated
    const periodOfWorkDays = Number(tender.periodOfWorkDays) || 180;
    
    // N: Completion duration in years (e.g., 180 days = ~0.493 years)
    const N = Math.max(0.25, periodOfWorkDays / 365);
    const M = 2.0; // Standard CPWD / J&K PWD multiplier

    const A = Math.max(0, Number(inputs.maxAnnualTurnover) || 0); // Max civil turnover in 1 of last 5 years
    const B = Math.max(0, Number(inputs.ongoingCommitments) || 0); // Ongoing works to be executed during period N
    const largestSimilarWork = Math.max(0, Number(inputs.largestSimilarWork) || 0);
    const quotePercentage = Number(inputs.proposedQuotePercentage) ?? -5.0; // e.g. -8.5%

    const hasMachinery = Boolean(inputs.hasMachineryEquipment);
    const hasGst = Boolean(inputs.hasValidGstClearance);
    const hasRegCard = Boolean(inputs.hasRegistrationCardRenewal);
    const hasCdrFdr = Boolean(inputs.hasActiveCdrFdrFacility);

    const riskFlags = [];
    const actionableInsights = [];
    const jkSpecificGuidelines = [];

    // ==========================================
    // 1. CPWD / J&K PWD Assessed Bid Capacity (30 Pts)
    // Formula: Assessed Available Bid Capacity = (A * N * 2) - B
    // ==========================================
    const assessedBidCapacity = Math.round((A * N * M) - B);
    const bidCapacitySurplus = assessedBidCapacity - estimatedValue;
    const isBidCapacityEligible = assessedBidCapacity >= estimatedValue;

    let bidCapacityScore = 0;
    if (!isBidCapacityEligible) {
      bidCapacityScore = 0;
      riskFlags.push(`Bid Capacity Deficit: Available capacity (₹${(assessedBidCapacity / 100000).toFixed(2)} L) is less than tender estimated cost (₹${(estimatedValue / 100000).toFixed(2)} L). High risk of Cover 1 disqualification under J&K PWD Manual Rule 4.2.`);
    } else {
      const ratio = assessedBidCapacity / estimatedValue;
      if (ratio >= 2.0) {
        bidCapacityScore = 30;
        actionableInsights.push(`Strong Financial Headroom: Assessed Bid Capacity exceeds tender value by ${((ratio - 1) * 100).toFixed(0)}%.`);
      } else if (ratio >= 1.5) {
        bidCapacityScore = 25;
        actionableInsights.push(`Healthy Bid Capacity: Assessed capacity comfortably covers this contract with ₹${(bidCapacitySurplus / 100000).toFixed(2)} L buffer.`);
      } else if (ratio >= 1.1) {
        bidCapacityScore = 20;
        actionableInsights.push(`Adequate Bid Capacity: Meets mandatory threshold with modest surplus (₹${(bidCapacitySurplus / 100000).toFixed(2)} L).`);
      } else {
        bidCapacityScore = 15;
        riskFlags.push(`Narrow Bid Capacity Margin: Available capacity barely covers the contract value. Avoid taking new commitments before bid opening.`);
      }
    }

    // ==========================================
    // 2. Technical & Experience Fit (25 Pts)
    // ==========================================
    let technicalExperienceScore = 0;

    // A. Registration Class verification
    const contractorRank = this.getClassRank(inputs.registrationClass);
    const tenderRequiredRank = this.getClassRank(tender.tendererClass || 'Class B');

    if (contractorRank >= tenderRequiredRank) {
      technicalExperienceScore += 10;
    } else {
      technicalExperienceScore += 3;
      riskFlags.push(`Class Mismatch: Tender specifies ${tender.tendererClass || 'higher class'}, while contractor is registered as ${inputs.registrationClass || 'Unspecified'}. Verify if Joint Venture (JV) or lower-class relaxation is permissible.`);
    }

    // B. Similar Work Experience benchmark (80% / 50% / 40% criteria)
    const workRatio = largestSimilarWork / estimatedValue;
    if (workRatio >= 0.8) {
      technicalExperienceScore += 10;
      actionableInsights.push(`Top-tier Work Experience: Single completed work equals ${(workRatio * 100).toFixed(0)}% of tender value (exceeds standard 80% criteria).`);
    } else if (workRatio >= 0.5) {
      technicalExperienceScore += 7;
      actionableInsights.push(`Sufficient Work Experience: Meets 50% single work benchmark.`);
    } else if (workRatio >= 0.4) {
      technicalExperienceScore += 5;
      actionableInsights.push(`Meets minimum 40% qualification threshold.`);
    } else {
      technicalExperienceScore += 2;
      riskFlags.push(`Experience Shortfall: Single largest work completed is only ${(workRatio * 100).toFixed(0)}% of tender value. Cover 1 requires completion certificate matching minimum department criteria.`);
    }

    // C. Machinery & Equipment Availability
    if (hasMachinery) {
      technicalExperienceScore += 5;
    } else {
      riskFlags.push(`Machinery & Plant: Tender requires owned/leased equipment (Tippers, Vibratory Rollers, Hot-Mix Plant). Ensure affidavit and lease deeds are prepared.`);
    }

    // ==========================================
    // 3. Pricing Strategy & L1 Probability (25 Pts)
    // ==========================================
    let pricingCompetitivenessScore = 0;

    if (quotePercentage > 0) {
      // Quoting above advertised SSR
      pricingCompetitivenessScore = 5;
      riskFlags.push(`Above Schedule Quoting (+${quotePercentage}%): Historical J&K PWD data shows <8% tender award rate for bids above advertised SSR, unless in difficult terrain (e.g. Gurez/Karnah/Ladakh).`);
    } else if (quotePercentage >= -4.0) {
      // Moderate discount (0 to -4%)
      pricingCompetitivenessScore = 14;
      actionableInsights.push(`Conservative Quote (${quotePercentage}%): Safe profit margin, but may face competition from aggressive local contractors.`);
    } else if (quotePercentage >= -14.9) {
      // Optimal Sweet Spot (-5% to -14.9%)
      pricingCompetitivenessScore = 25;
      actionableInsights.push(`Optimal L1 Competitive Corridor (${quotePercentage}%): Fits historical winning band in J&K without triggering mandatory Additional Performance Security (APS).`);
    } else if (quotePercentage >= -25.0) {
      // Highly aggressive (< -15%) -> Triggers APS rule in J&K
      pricingCompetitivenessScore = 18;
      riskFlags.push(`Additional Performance Security (APS) Alert: Bid is ${Math.abs(quotePercentage)}% below advertised rate. Under J&K Fin Dept Order, bids below -15% require an unbalanced CDR/Bank Guarantee of 5% to 10% extra before contract signing.`);
      jkSpecificGuidelines.push(`Keep ready extra CDR/FDR pledged to Executive Engineer for Additional Performance Security (APS).`);
    } else {
      // Abnormally low (< -25%)
      pricingCompetitivenessScore = 8;
      riskFlags.push(`Abnormally Low Rate (${quotePercentage}%): Departmental scrutiny committee may seek rate analysis justification or reject for unworkable rates.`);
    }

    // ==========================================
    // 4. Statutory Compliance & J&K Gatekeeper (20 Pts)
    // ==========================================
    let statutoryComplianceScore = 0;

    if (hasRegCard) {
      statutoryComplianceScore += 5;
    } else {
      riskFlags.push(`Mandatory Registration Card Renewal: Unrenewed card causes immediate Cover 1 technical disqualification on jktenders.gov.in.`);
    }

    if (hasGst) {
      statutoryComplianceScore += 5;
    } else {
      riskFlags.push(`GST Clearance: Latest GSTR-3B return receipt is mandatory.`);
    }

    if (hasCdrFdr) {
      statutoryComplianceScore += 5;
    } else {
      riskFlags.push(`EMD / CDR Instrument: Original Treasury Challan / CDR must be uploaded before the tender closing date.`);
    }

    // Departmental & Regional adherence
    statutoryComplianceScore += 5;

    // Mandatory Cover 1 Gatekeeper check
    const isCover1Eligible = isBidCapacityEligible && hasRegCard && hasGst && hasCdrFdr;

    // Total Score (0 - 100)
    let totalScore = bidCapacityScore + technicalExperienceScore + pricingCompetitivenessScore + statutoryComplianceScore;

    // Hard ceiling if Cover 1 mandatory requirements fail
    if (!isCover1Eligible) {
      totalScore = Math.min(28, totalScore);
    }

    // Determine Qualitative Allocation Probability
    let allocationProbability = 'Low';
    if (!isCover1Eligible) {
      allocationProbability = 'Disqualified / Critical Risk';
    } else if (totalScore >= 75) {
      allocationProbability = 'High';
    } else if (totalScore >= 50) {
      allocationProbability = 'Moderate';
    } else {
      allocationProbability = 'Low';
    }

    // J&K Specific standard checklists
    jkSpecificGuidelines.push(`Ensure CDR / FDR is pledged specifically to "Executive Engineer, ${tender.departmentName || 'Concerned Division'}" as written in the NIT.`);
    jkSpecificGuidelines.push(`Upload valid Treasury Challan for Tender Document Fee (MH: 0059 / PWD Revenue Head).`);
    if (tender.tenderCategory === 'Works') {
      jkSpecificGuidelines.push(`Affidavit on Non-Judicial Stamp Paper stating no blacklisting and correct work history is mandatory.`);
    }

    return {
      totalScore,
      probabilityPercentage: totalScore,
      allocationProbability,
      assessedBidCapacity,
      bidCapacitySurplus,
      isBidCapacityEligible,
      isCover1Eligible,
      categoryScores: {
        bidCapacityScore,
        technicalExperienceScore,
        pricingCompetitivenessScore,
        statutoryComplianceScore,
      },
      riskFlags,
      actionableInsights,
      jkSpecificGuidelines,
    };
  }
}
