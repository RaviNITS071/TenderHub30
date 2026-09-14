import Organization from '../models/Organization.js';

export const getOrganizationProfile = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    res.status(200).json(org);
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationProfile = async (req, res, next) => {
  try {
    const { name, gstin, website } = req.body;

    // Updates the organization tied to the logged-in user
    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      { name, gstin, website },
      { new: true, runValidators: true }
    );

    res.status(200).json(org);
  } catch (error) {
    next(error);
  }
};