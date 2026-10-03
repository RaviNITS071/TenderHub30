import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Tender from '../models/Tender.js';

await mongoose.connect(process.env.MONGO_URI);
const now = new Date();

console.log('--- Phase 1: Reconciling Multi-Tender Siblings ---');

const allTenders = await Tender.find({}).lean();
const groups = {};

for (const t of allTenders) {
  const id = t.sourceTenderId || '';
  const lastUnderscore = id.lastIndexOf('_');
  if (lastUnderscore > 0) {
    const base = id.substring(0, lastUnderscore);
    if (!groups[base]) groups[base] = [];
    groups[base].push(t);
  }
}

let siblingRepairs = 0;

for (const [base, items] of Object.entries(groups)) {
  if (items.length <= 1) continue;

  // Find consensus active closing date among siblings
  const activeSiblings = items.filter(t => t.closingDate && t.closingDate > now);
  if (activeSiblings.length === 0) continue;

  // Count occurrences of closingDateStr among active siblings
  const dateCounts = {};
  for (const s of activeSiblings) {
    const str = s.closingDateStr || '';
    if (str) dateCounts[str] = (dateCounts[str] || 0) + 1;
  }

  // Get most common closing date string
  const sortedDates = Object.entries(dateCounts).sort((a, b) => b[1] - a[1]);
  if (sortedDates.length === 0) continue;

  const consensusDateStr = sortedDates[0][0];
  const templateSibling = activeSiblings.find(s => s.closingDateStr === consensusDateStr);
  if (!templateSibling) continue;

  // Find any sibling in this group whose closingDate is in the past
  for (const item of items) {
    const isPast = !item.closingDate || item.closingDate < now;
    if (isPast) {
      console.log(`Fixing sibling ${item.sourceTenderId}:`);
      console.log(`  Current closing: "${item.closingDateStr}" (${item.closingDate?.toISOString()})`);
      console.log(`  Consensus sibling closing: "${templateSibling.closingDateStr}" (${templateSibling.closingDate?.toISOString()})`);

      await Tender.updateOne(
        { _id: item._id },
        {
          $set: {
            closingDate: templateSibling.closingDate,
            closingDateStr: templateSibling.closingDateStr,
            closingTime: templateSibling.closingTime,
            bidSubmissionEndDate: templateSibling.bidSubmissionEndDate || templateSibling.closingDate,
            bidSubmissionEndDateStr: templateSibling.bidSubmissionEndDateStr || templateSibling.closingDateStr,
            bidSubmissionEndTime: templateSibling.bidSubmissionEndTime || templateSibling.closingTime,
            documentDownloadEndDate: templateSibling.documentDownloadEndDate || item.documentDownloadEndDate,
            documentDownloadEndDateStr: templateSibling.documentDownloadEndDateStr || item.documentDownloadEndDateStr,
            bidOpeningDate: templateSibling.bidOpeningDate || item.bidOpeningDate,
            bidOpeningDateStr: templateSibling.bidOpeningDateStr || item.bidOpeningDateStr,
            status: 'ACTIVE',
          }
        }
      );
      siblingRepairs++;
    }
  }
}

console.log(`\nReconciled ${siblingRepairs} sibling tender(s).\n`);

console.log('--- Phase 2: Fixing Impossible Dates (closingDate < documentDownloadEndDate) ---');
let docEndRepairs = 0;
const docEndMismatches = await Tender.find({
  $expr: { $lt: ['$closingDate', '$documentDownloadEndDate'] }
}).lean();

for (const t of docEndMismatches) {
  // If documentDownloadEndDate is in future and closingDate is in past or earlier
  if (t.documentDownloadEndDate && t.documentDownloadEndDate > (t.closingDate || new Date(0))) {
    console.log(`Fixing ${t.sourceTenderId}: closing "${t.closingDateStr}" -> docEnd "${t.documentDownloadEndDateStr}"`);
    await Tender.updateOne(
      { _id: t._id },
      {
        $set: {
          closingDate: t.documentDownloadEndDate,
          closingDateStr: t.documentDownloadEndDateStr,
          bidSubmissionEndDate: t.documentDownloadEndDate,
          bidSubmissionEndDateStr: t.documentDownloadEndDateStr,
          status: t.documentDownloadEndDate > now ? 'ACTIVE' : t.status
        }
      }
    );
    docEndRepairs++;
  }
}

console.log(`\nRepaired ${docEndRepairs} tender(s) with closing < documentDownloadEndDate.\n`);

console.log('--- Phase 3: Restoring Tenders where bidOpeningDate is in Future ---');
const futureOpeningTenders = await Tender.find({
  status: 'EXPIRED',
  bidOpeningDate: { $gt: now }
}).lean();

let statusRestored = 0;
for (const t of futureOpeningTenders) {
  console.log(`Restoring ${t.sourceTenderId} to ACTIVE (bidOpeningDate is ${t.bidOpeningDateStr})`);
  await Tender.updateOne({ _id: t._id }, { $set: { status: 'ACTIVE' } });
  statusRestored++;
}
console.log(`Restored ${statusRestored} tender(s) to ACTIVE because bid opening is pending.\n`);

// Final tally
const finalActive = await Tender.countDocuments({
  status: 'ACTIVE',
  isDelisted: { $ne: true },
  closingDate: { $gte: now }
});
console.log(`Final Active count in DB (closingDate >= now): ${finalActive}`);

await mongoose.disconnect();
