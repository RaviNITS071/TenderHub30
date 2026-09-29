import { chromium } from 'playwright';
import { connectDB, closeDB } from './src/config/db.js';
import Tender from './src/models/Tender.js';

async function main() {
  await connectDB();
  const now = new Date();

  console.log('Fetching live counts from jktenders.gov.in...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto('https://jktenders.gov.in/nicgep/app', {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  const orgLink = page.locator("a:has-text('Tenders by Organisation'), a#PageLink_0").first();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}),
    orgLink.click()
  ]);

  await page.waitForSelector("table#table tr[id^='informal'], table.list_table tr[id^='informal']", { timeout: 20000 }).catch(() => {});

  const portalOrgs = await page.evaluate(() => {
    const table = document.querySelector('table#table') || document.querySelector('table.list_table');
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll("tr[id^='informal']"));
    const list = [];
    rows.forEach((row, i) => {
      const tds = row.querySelectorAll('td');
      if (tds.length >= 3) {
        const name = tds[1]?.innerText?.trim() || '';
        const a = tds[2]?.querySelector('a');
        const count = a ? parseInt(a.innerText.trim(), 10) || 0 : 0;
        if (name && count > 0) {
          list.push({ index: i, name, count });
        }
      }
    });
    return list;
  });

  await browser.close();

  const totalPortal = portalOrgs.reduce((a, b) => a + b.count, 0);
  console.log(`Live Portal Total: ${totalPortal}`);

  console.log('\n--- COMPARING EACH DEPARTMENT ---');
  let totalMoreInDb = 0;
  let totalMoreInPortal = 0;

  const comparison = [];

  for (const org of portalOrgs) {
    const escaped = org.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dbActive = await Tender.countDocuments({
      $or: [
        { organisationChain: { $regex: escaped, $options: 'i' } },
        { departmentName: { $regex: escaped, $options: 'i' } }
      ],
      closingDate: { $gte: now }
    });

    const diff = dbActive - org.count; // positive = DB has more, negative = portal has more
    if (diff > 0) totalMoreInDb += diff;
    if (diff < 0) totalMoreInPortal += Math.abs(diff);

    comparison.push({
      name: org.name,
      portal: org.count,
      db: dbActive,
      diff
    });
  }

  // Also check if any tenders in DB belong to an organisation NOT in portal's active list
  const allDbOrgs = await Tender.distinct('organisationChain', { closingDate: { $gte: now } });
  console.log(`Total distinct organisationChains in DB: ${allDbOrgs.length}`);

  // Sort by highest diff in DB
  comparison.sort((a, b) => b.diff - a.diff);

  console.log('\nDepartments where DB has MORE active tenders than Portal:');
  for (const c of comparison.filter(c => c.diff > 0)) {
    console.log(`  +${c.diff} in DB | ${c.name.padEnd(45)} | DB: ${c.db} vs Portal: ${c.portal}`);
  }

  console.log('\nDepartments where Portal has MORE active tenders than DB:');
  for (const c of comparison.filter(c => c.diff < 0)) {
    console.log(`  -${Math.abs(c.diff)} in DB | ${c.name.padEnd(45)} | DB: ${c.db} vs Portal: ${c.portal}`);
  }

  // Inspect the extra tenders in the top department that has more in DB
  const topMore = comparison.find(c => c.diff > 0);
  if (topMore) {
    console.log(`\nInspecting closing dates for ${topMore.name} (DB: ${topMore.db}, Portal: ${topMore.portal}):`);
    const escaped = topMore.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tenders = await Tender.find({
      $or: [
        { organisationChain: { $regex: escaped, $options: 'i' } },
        { departmentName: { $regex: escaped, $options: 'i' } }
      ],
      closingDate: { $gte: now }
    })
    .sort({ closingDate: 1 })
    .select('sourceTenderId title closingDate closingDateStr publishedDateStr')
    .limit(10)
    .lean();

    console.log('Earliest closing tenders in this department in DB:');
    tenders.forEach(t => {
      console.log(`  - [${t.sourceTenderId}] Closing: "${t.closingDateStr}" (${t.closingDate}) | Pub: "${t.publishedDateStr}"`);
    });
  }

  await closeDB();
  process.exit(0);
}

main().catch(async err => {
  console.error(err);
  await closeDB();
  process.exit(1);
});
