/**
 * One-time audit + fix script:
 * Finds tenders wrongly marked EXPIRED where bidOpeningDate is still in the future,
 * and restores them to ACTIVE status.
 * 
 * Run with: node src/scripts/auditWrongExpiry.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Tender from '../models/Tender.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB.\n');

const now = new Date();

// 1. Find tenders marked EXPIRED but with a future bidOpeningDate
const wronglyExpired = await Tender.find({
  status: 'EXPIRED',
  bidOpeningDate: { $gt: now }
}).select('sourceTenderId closingDate closingDateStr bidOpeningDate bidSubmissionEndDate bidSubmissionEndDateStr title').lean();

console.log(`🔍 Found ${wronglyExpired.length} wrongly-expired tender(s) with future bidOpeningDate:\n`);

if (wronglyExpired.length === 0) {
  console.log('✅ No wrongly-expired tenders found. Your data is clean.');
  await mongoose.disconnect();
  process.exit(0);
}

for (const t of wronglyExpired) {
  console.log(`  ❌ ${t.sourceTenderId}`);
  console.log(`     Title:           "${t.title?.slice(0, 70)}"`);
  console.log(`     closingDate DB:  ${t.closingDate?.toISOString()} ("${t.closingDateStr}")`);
  console.log(`     bidOpeningDate:  ${t.bidOpeningDate?.toISOString()}`);
  console.log(`     bidSubmitEnd:    ${t.bidSubmissionEndDate?.toISOString()} ("${t.bidSubmissionEndDateStr}")`);
  console.log('');
}

// 2. Restore them to ACTIVE — use bidSubmissionEndDate as the real closingDate if available and in future
let restoredCount = 0;
for (const t of wronglyExpired) {
  const correctClosingDate = t.bidSubmissionEndDate && t.bidSubmissionEndDate > now
    ? t.bidSubmissionEndDate
    : null;

  const updateFields = {
    status: 'ACTIVE',
    // Restore correct closingDate if bidSubmissionEndDate is future and different
    ...(correctClosingDate && correctClosingDate.getTime() !== (t.closingDate?.getTime() || 0)
      ? {
          closingDate: correctClosingDate,
          closingDateStr: t.bidSubmissionEndDateStr,
        }
      : {})
  };

  await Tender.updateOne({ _id: t._id }, { $set: updateFields });
  restoredCount++;
  console.log(`  ✅ Restored ${t.sourceTenderId} → ACTIVE${correctClosingDate ? ` (closingDate corrected to ${correctClosingDate.toISOString()})` : ''}`);
}

console.log(`\n🎉 Done. Restored ${restoredCount} tender(s) to ACTIVE status.`);
await mongoose.disconnect();
