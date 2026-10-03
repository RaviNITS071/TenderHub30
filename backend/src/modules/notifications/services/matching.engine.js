/**
 * @file backend/src/modules/notifications/services/matching.engine.js
 * @description High-performance matching engine matching incoming tenders against contractor preference filters.
 */

export class MatchingEngine {
  /**
   * Determine if a tender satisfies a contractor's preference criteria.
   * @param {Object} tender - Normalized tender document
   * @param {Object} preference - Contractor preference document
   * @returns {boolean}
   */
  matches(tender, preference) {
    if (!preference.whatsappEnabled || !preference.whatsappPhone) {
      return false;
    }

    const searchableText = `${tender.title || ''} ${tender.workDescription || ''} ${tender.department || ''} ${tender.organisationChain || ''} ${tender.location || ''} ${tender.district || ''}`.toLowerCase();

    // 1. Department Filter (if specified, tender must match at least one selected department)
    if (preference.departments && preference.departments.length > 0) {
      const tenderDept = (tender.department || tender.organisationChain || '').toLowerCase();
      const deptMatches = preference.departments.some((dept) => 
        tenderDept.includes(dept.toLowerCase()) || searchableText.includes(dept.toLowerCase())
      );
      if (!deptMatches) return false;
    }

    // 2. District / Location Filter
    if (preference.districts && preference.districts.length > 0) {
      const districtMatches = preference.districts.some((dist) =>
        searchableText.includes(dist.toLowerCase())
      );
      if (!districtMatches) return false;
    }

    // 3. Minimum Tender Value Filter (in INR)
    if (preference.minValue && preference.minValue > 0) {
      const tVal = Number(tender.tenderValue) || 0;
      // If tender has an explicit value and it is strictly below the contractor's minimum, skip
      if (tVal > 0 && tVal < preference.minValue) {
        return false;
      }
    }

    // 4. Maximum Tender Value Filter (if set)
    if (preference.maxValue && preference.maxValue > 0) {
      const tVal = Number(tender.tenderValue) || 0;
      if (tVal > preference.maxValue) {
        return false;
      }
    }

    // 5. Custom Keywords Filter (if specified, tender must contain at least one keyword)
    if (preference.keywords && preference.keywords.length > 0) {
      const keywordMatches = preference.keywords.some((kw) =>
        searchableText.includes(kw.trim().toLowerCase())
      );
      if (!keywordMatches) return false;
    }

    return true;
  }
}

export const matchingEngine = new MatchingEngine();
