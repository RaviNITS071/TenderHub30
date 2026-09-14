export const calculateMatchScore = (tender, companyProfile) => {
  let score = 0;

  // Simplified deterministic scoring engine
  // Score = (Category*0.25) + (Eligibility*0.25) + (Experience*0.20) + (Turnover*0.15) + (Location*0.10) + (Size*0.05)

  if (tender.tenderCategory === companyProfile.primaryCategory || tender.category === companyProfile.primaryCategory) score += 25;
  if (tender.location === companyProfile.location || tender.state === companyProfile.state) score += 10;
  // ... apply other business rules based on requirements vs profile

  return {
    score,
    isHighMatch: score >= 85,
  };
};
