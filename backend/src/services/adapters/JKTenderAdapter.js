import { TenderSourceAdapter } from './TenderSourceAdapter.js';
import { chromium } from 'playwright';
import { uploadPdfToR2 } from '../../utils/r2Storage.js';
import fs from 'fs';
import os from 'os'; // Added for OS detection
import { exec } from 'child_process'; // Added for Ghostscript execution
import util from 'util'; // Added to promisify exec
import pino from 'pino';

const logger = pino();
const execPromise = util.promisify(exec); // Promisify exec for async/await usage

/**
 * Helper Function: Compresses a PDF file using Ghostscript to reduce storage footprint.
 * Includes a 2-minute timeout to prevent the worker from hanging on corrupted PDFs.
 * Targets approx. 50% size reduction using the /ebook preset (150 DPI).
 * 
 * @param {string} inputPath - The absolute file path of the original downloaded PDF.
 * @param {string} outputPath - The absolute file path where the compressed PDF will be saved.
 * @returns {Promise<boolean>} - Returns true if compression succeeds, false otherwise.
 */
async function compressPDF(inputPath, outputPath) {
  try {
    // Dynamically select the Ghostscript command based on the host OS
    const gsCommand = os.platform() === 'win32' ? 'gswin64c' : 'gs';

    // Build the Ghostscript execution command
    const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
    
    // Execute with a 120000ms (2 mins) timeout kill-switch
    await execPromise(command, { timeout: 120000 }); 
    return true;
  } catch (err) {
    logger.error(`[Compression] Ghostscript failed or timed out for ${inputPath}: ${err.message}`);
    return false; // Safely fallback to uploading the original uncompressed file
  }
}

export class JKTenderAdapter extends TenderSourceAdapter {
  constructor() {
    super('JK_TENDERS');
    this.rootUrl = 'https://jktenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page';
  }

  async fetchList(pageNumber = 1, filters = { syncMode: 'FULL' }, onPageScraped = null) {
    logger.info(`[Playwright HITL] Launching browser for Full-Metadata Multi-Department Crawl...`);

    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
      await page.goto(this.rootUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const departmentLinks = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.list_table tbody tr'));
        const links = [];
        rows.forEach((row, index) => {
          if (index === 0) return; 
          const aTag = row.querySelector('td a');
          if (aTag && aTag.href) links.push(aTag.href);
        });
        return links;
      });

      logger.info(`✅ Found ${departmentLinks.length} total departments to crawl.`);
      let globalTenderCount = 0;

      for (let i = 0; i < departmentLinks.length; i++) {
        if (globalTenderCount >= 30) break;

        const deptUrl = departmentLinks[i];
        logger.info(`\n🏢 Entering Department ${i + 1} of ${departmentLinks.length}...`);
        
        await page.goto(deptUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        
        let currentPage = 1;
        let hasDepartmentMorePages = true;

        while (hasDepartmentMorePages && globalTenderCount < 30) {
          logger.info(`Extracting list data from Department ${i + 1}, Page ${currentPage}...`);
          
          try {
            await page.waitForSelector('table.list_table tbody tr', { visible: true, timeout: 5000 });
          } catch (e) {
            logger.warn(`No tenders table found on this page. Moving to next department.`);
            break; 
          }

          const listData = await page.evaluate((currPg) => {
            const extracted = [];
            const rows = document.querySelectorAll('table.list_table tbody tr');
            rows.forEach((row, index) => {
              if (index === 0) return;
              const tds = row.querySelectorAll('td');
              if (tds.length >= 6) {
                const titleAnchor = tds[4].querySelector('a');
                const bracketMatches = tds[4].innerText.trim().match(/\[(.*?)\]/g) || [];
                const tenderId = bracketMatches.length >= 2 ? bracketMatches[bracketMatches.length - 1].replace(/[\[\]]/g, '') : '';
                extracted.push({
                  title: titleAnchor ? titleAnchor.innerText.trim() : tds[4].innerText.trim(),
                  detailsUrl: titleAnchor ? titleAnchor.href : null,
                  sourceTenderId: tenderId || `JK-TENDER-${currPg}-${index}`,
                  publishedDate: tds[1].innerText.trim(),
                  closingDate: tds[2].innerText.trim(),
                  openingDate: tds[3].innerText.trim(),
                });
              }
            });
            return extracted;
          }, currentPage);

          for (const item of listData) {
            if (globalTenderCount >= 30) break;
            if (!item.detailsUrl) continue;

            logger.info(`[${globalTenderCount + 1}/30] Fetching Detailed Data: ${item.sourceTenderId}`);
            const itemPage = await context.newPage();

            try {
              await itemPage.goto(item.detailsUrl, { waitUntil: 'domcontentloaded' });
              await itemPage.waitForTimeout(1000);

              const detailedData = await itemPage.evaluate(() => {
                const pageText = document.body.innerText;
                const isDocumentAvailable = !pageText.includes('Document download date is not begun yet');

                const getTableVal = (labelText) => {
                  const tds = Array.from(document.querySelectorAll('td'));
                  for (const td of tds) {
                    if (td.querySelector('table')) continue; 
                    const text = td.textContent.trim().replace(/\s+/g, ' ');
                    if (text === labelText || text.startsWith(labelText)) {
                      let next = td.nextElementSibling;
                      if (next && next.tagName === 'TD') {
                        return next.textContent.trim().replace(/\s+/g, ' ');
                      }
                    }
                  }
                  return "";
                };

                const parseNum = (str) => {
                  const val = parseFloat(str.replace(/,/g, '').replace(/[^0-9.]/g, ''));
                  return isNaN(val) ? 0 : val;
                };

                const data = {
                  isDocumentAvailable: isDocumentAvailable,
                  organisationChain: getTableVal('Organisation Chain'),
                  tenderReferenceNumber: getTableVal('Tender Reference Number'),
                  withdrawalAllowed: getTableVal('Withdrawal Allowed'),
                  tenderType: getTableVal('Tender Type'),
                  formOfContract: getTableVal('Form Of Contract'),
                  tenderCategory: getTableVal('Tender Category'),
                  noOfCovers: parseInt(getTableVal('No. of Covers')) || 2,
                  generalTechnicalEvaluationAllowed: getTableVal('General Technical Evaluation Allowed'),
                  itemWiseTechnicalEvaluationAllowed: getTableVal('ItemWise Technical Evaluation Allowed'),
                  paymentMode: getTableVal('Payment Mode'),
                  isMultiCurrencyAllowedForBOQ: getTableVal('Is Multi Currency Allowed For BOQ'),
                  isMultiCurrencyAllowedForFee: getTableVal('Is Multi Currency Allowed For Fee'),
                  allowTwoStageBidding: getTableVal('Allow Two Stage Bidding'),

                  // ✅ FIX: Changed to 'Tender Fee in' to accurately grab the fee amount
                  tenderFee: parseNum(getTableVal('Tender Fee in')),
                  feePayableTo: getTableVal('Fee Payable To'),
                  feePayableAt: getTableVal('Fee Payable At'),
                  tenderFeeExemptionAllowed: getTableVal('Tender Fee Exemption Allowed'),

                  // ✅ FIX: Changed to 'EMD Amount in' to accurately grab the EMD amount
                  emdAmount: parseNum(getTableVal('EMD Amount in')),
                  emdExemptionAllowed: getTableVal('EMD Exemption Allowed'),
                  emdFeeType: getTableVal('EMD Fee Type'),
                  emdPercentage: getTableVal('EMD Percentage'),
                  emdPayableTo: getTableVal('EMD Payable To'),
                  emdPayableAt: getTableVal('EMD Payable At'),

                  workDescription: getTableVal('Work Description'),
                  ndaPreQualification: getTableVal('NDA/Pre Qualification'),
                  independentExternalMonitorRemarks: getTableVal('Independent External Monitor/Remarks'),
                  estimatedValue: parseNum(getTableVal('Tender Value')),
                  productCategory: getTableVal('Product Category'),
                  subCategory: getTableVal('Sub category'),
                  contractType: getTableVal('Contract Type'),
                  bidValidityDays: parseInt(getTableVal('Bid Validity(Days)')) || 0,
                  periodOfWorkDays: parseInt(getTableVal('Period Of Work(Days)')) || 0,
                  location: getTableVal('Location'),
                  pincode: getTableVal('Pincode'),
                  preBidMeetingPlace: getTableVal('Pre Bid Meeting Place'),
                  preBidMeetingAddress: getTableVal('Pre Bid Meeting Address'),
                  preBidMeetingDate: getTableVal('Pre Bid Meeting Date'),
                  bidOpeningPlace: getTableVal('Bid Opening Place'),
                  shouldAllowNDATender: getTableVal('Should Allow NDA Tender'),
                  allowPreferentialBidder: getTableVal('Allow Preferential Bidder'),

                  publishedDate: getTableVal('Published Date'),
                  bidOpeningDate: getTableVal('Bid Opening Date'),
                  documentDownloadStartDate: getTableVal('Document Download / Sale Start Date'),
                  documentDownloadEndDate: getTableVal('Document Download / Sale End Date'),
                  clarificationStartDate: getTableVal('Clarification Start Date'),
                  clarificationEndDate: getTableVal('Clarification End Date'),
                  bidSubmissionStartDate: getTableVal('Bid Submission Start Date'),
                  bidSubmissionEndDate: getTableVal('Bid Submission End Date'),
                  closingDate: getTableVal('Bid Submission End Date') || getTableVal('Document Download / Sale End Date'),

                  invitingAuthorityName: getTableVal('Name'),
                  invitingAuthorityAddress: getTableVal('Address')
                };

                data.offlineInstruments = [];
                const instRows = document.querySelectorAll('#offlineInstrumentsTableView tbody tr');
                instRows.forEach((tr, idx) => {
                  if (idx === 0) return;
                  const tds = tr.querySelectorAll('td');
                  if (tds.length >= 2) {
                    data.offlineInstruments.push({
                      sNo: parseInt(tds[0].innerText.trim()) || idx,
                      instrumentType: tds[1].innerText.trim()
                    });
                  }
                });

                data.coversInfo = [];
                const coverRows = document.querySelectorAll('#packetTableView tbody tr');
                coverRows.forEach((tr, idx) => {
                  if (idx === 0) return;
                  const tds = tr.querySelectorAll('td');
                  if (tds.length >= 4) {
                    data.coversInfo.push({
                      coverNo: parseInt(tds[0].innerText.trim()) || idx,
                      coverType: tds[1].innerText.trim(),
                      description: tds[2].innerText.trim(),
                      documentType: tds[3].innerText.trim()
                    });
                  }
                });

                return data;
              });

              Object.assign(item, detailedData);
              item.pdfUrls = [];
              item.nitDocuments = [];
              item.workItemDocuments = [];

              if (item.isDocumentAvailable) {
                  const pdfCount = await itemPage.locator("a:has-text('.pdf')").count();
                  
                  // ✅ DEDUPLICATION TRACKER: Keeps track of downloaded filenames for the current tender
                  const processedFileNames = new Set();
                  
                  for (let j = 0; j < pdfCount; j++) {
                    if (!itemPage.url().includes('FrontEndTenderDetails')) {
                        await itemPage.goto(item.detailsUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
                        await itemPage.waitForTimeout(1000);
                    }

                    const pdfLink = itemPage.locator("a:has-text('.pdf')").nth(j);
                    
                    // ✅ NATIVE POPUP INTERCEPT
                    const popupPromise = itemPage.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
                    const directDownloadPromise = itemPage.waitForEvent('download', { timeout: 15000 }).catch(() => null);
                    
                    await pdfLink.click().catch(() => {});
                    
                    const raceResult = await Promise.race([
                        popupPromise.then(p => p ? { type: 'popup', page: p } : null),
                        directDownloadPromise.then(d => d ? { type: 'download', dl: d } : null),
                        itemPage.waitForTimeout(15000).then(() => null)
                    ]);

                    let finalDownload = null;
                    let popupPage = null;

                    if (raceResult && raceResult.type === 'download') {
                        finalDownload = raceResult.dl;
                    } else if (raceResult && raceResult.type === 'popup') {
                        popupPage = raceResult.page;
                        await popupPage.waitForLoadState('domcontentloaded').catch(() => {});

                        const popupDownloadPromise = popupPage.waitForEvent('download', { timeout: 300000 }).catch(() => null);

                        const hasCaptcha = await popupPage.locator("input[name*='captcha'], img[src*='captcha']").isVisible().catch(() => false);
                        const isCaptchaUrl = popupPage.url().toLowerCase().includes('captcha') || popupPage.url().toLowerCase().includes('directlink');

                        if (hasCaptcha || isCaptchaUrl) {
                           logger.warn(`⚠️ CAPTCHA Intercepted for PDF ${j + 1}! Please solve it in the NEW POPUP TAB and hit Submit.`);
                        }

                        finalDownload = await popupDownloadPromise;
                    }

                    if (finalDownload) {
                      try {
                        const tempPath = await finalDownload.path().catch(() => null);
                        if (tempPath) {
                            const fileName = finalDownload.suggestedFilename();
                            
                            // ✅ THE FIX: Check if we already processed this exact file in this tender
                            if (processedFileNames.has(fileName)) {
                                logger.info(`[Optimizer] Duplicate link found for "${fileName}". Skipping to save DB & R2 space.`);
                                // Delete the redundant temp file instantly
                                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                                // Close the popup if it was opened for this duplicate
                                if (popupPage && !popupPage.isClosed()) {
                                    await popupPage.close().catch(() => {});
                                }
                                continue; // Safely skip to the next loop iteration
                            }
                            
                            // Register the filename so it doesn't get processed again
                            processedFileNames.add(fileName);

                            let pathToUpload = tempPath;
                            
                            const stats = fs.statSync(tempPath);
                            const fileSizeMB = stats.size / (1024 * 1024);

                            // Conditional Compression
                            if (fileSizeMB > 5) {
                                logger.info(`[Optimizer] File ${fileName} is ${fileSizeMB.toFixed(2)} MB. Initiating 50% compression...`);
                                
                                const compressedPath = `${tempPath}_compressed.pdf`;
                                const isCompressed = await compressPDF(tempPath, compressedPath);
                                
                                if (isCompressed) {
                                    const newSizeMB = fs.statSync(compressedPath).size / (1024 * 1024);
                                    logger.info(`[Optimizer] Compression successful! Size reduced to ${newSizeMB.toFixed(2)} MB.`);
                                    pathToUpload = compressedPath;
                                }
                            }

                            const r2Url = await uploadPdfToR2(pathToUpload, fileName);
                            
                            if (r2Url) {
                                const finalSizeKb = Math.round(fs.statSync(pathToUpload).size / 1024);

                                item.pdfUrls.push(r2Url);
                                item.nitDocuments.push({
                                    documentName: fileName,
                                    description: "Tender Notice Document",
                                    documentSizeKb: finalSizeKb, 
                                    fileUrl: r2Url
                                });
                                logger.info(`[Storage] Successfully secured document (${finalSizeKb} KB) to R2 storage.`);
                            }
                            
                            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                            if (pathToUpload !== tempPath && fs.existsSync(pathToUpload)) fs.unlinkSync(pathToUpload);
                        }
                      } catch (err) {
                        logger.error(`Error processing PDF download: ${err.message}`);
                      }
                    }

                    if (popupPage && !popupPage.isClosed()) {
                        await popupPage.close().catch(() => {});
                    }
                  }
              } else {
                  logger.warn(`ℹ️ Documents not yet available for download for Tender: ${item.sourceTenderId}. Skipping PDF fetch.`);
              }

              // REAL-TIME SAVING
              if (onPageScraped) {
                await onPageScraped([item]); 
                logger.info(`✅ Tender ${item.sourceTenderId} completely processed and saved to DB in real-time.`);
              }

            } catch (err) {
              logger.error(`Error on detail fetch for ${item.sourceTenderId}: ${err.message}`);
            } finally {
              await itemPage.close().catch(() => {});
            }
            
            globalTenderCount++;
          }

          const nextTargetPage = currentPage + 1;
          try {
            hasDepartmentMorePages = await page.evaluate((targetPg) => {
              const links = Array.from(document.querySelectorAll('a'));
              let targetLink = links.find(l => l.textContent.trim() === String(targetPg));
              if (targetLink) { targetLink.click(); return true; }
              return false;
            }, nextTargetPage);
          } catch (navErr) {
            hasDepartmentMorePages = false;
          }

          if (hasDepartmentMorePages) {
            currentPage++;
            await page.waitForTimeout(3000);
          }
        }
      }

      logger.info(`🎉 Multi-Department Full Metadata Crawl Complete! Reached ${globalTenderCount} tenders.`);
      await browser.close();
      return [];
    } catch (error) {
      logger.error(`Adapter Error: ${error.message}`);
      await browser.close();
      throw error;
    }
  }

  normalize(rawTenderData) {
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date();
      const timestamp = Date.parse(dateStr.replace(/-/g, ' '));
      return !isNaN(timestamp) ? new Date(timestamp) : new Date();
    };

    return {
      title: rawTenderData.title || "Untitled Tender",
      sourcePortal: this.portalName,
      sourceTenderId: rawTenderData.sourceTenderId,
      detailsUrl: rawTenderData.detailsUrl,
      isDocumentAvailable: rawTenderData.isDocumentAvailable, // Mapped here
      
      organisationChain: rawTenderData.organisationChain,
      tenderReferenceNumber: rawTenderData.tenderReferenceNumber,
      withdrawalAllowed: rawTenderData.withdrawalAllowed,
      tenderType: rawTenderData.tenderType,
      formOfContract: rawTenderData.formOfContract,
      tenderCategory: rawTenderData.tenderCategory,
      noOfCovers: rawTenderData.noOfCovers,
      generalTechnicalEvaluationAllowed: rawTenderData.generalTechnicalEvaluationAllowed,
      itemWiseTechnicalEvaluationAllowed: rawTenderData.itemWiseTechnicalEvaluationAllowed,
      paymentMode: rawTenderData.paymentMode,
      isMultiCurrencyAllowedForBOQ: rawTenderData.isMultiCurrencyAllowedForBOQ,
      isMultiCurrencyAllowedForFee: rawTenderData.isMultiCurrencyAllowedForFee,
      allowTwoStageBidding: rawTenderData.allowTwoStageBidding,

      offlineInstruments: rawTenderData.offlineInstruments || [],
      coversInfo: rawTenderData.coversInfo || [],

      tenderFee: rawTenderData.tenderFee || 0,
      feePayableTo: rawTenderData.feePayableTo,
      feePayableAt: rawTenderData.feePayableAt,
      tenderFeeExemptionAllowed: rawTenderData.tenderFeeExemptionAllowed,

      emdAmount: rawTenderData.emdAmount || 0,
      emdExemptionAllowed: rawTenderData.emdExemptionAllowed,
      emdFeeType: rawTenderData.emdFeeType,
      emdPercentage: rawTenderData.emdPercentage,
      emdPayableTo: rawTenderData.emdPayableTo,
      emdPayableAt: rawTenderData.emdPayableAt,

      workDescription: rawTenderData.workDescription,
      ndaPreQualification: rawTenderData.ndaPreQualification,
      independentExternalMonitorRemarks: rawTenderData.independentExternalMonitorRemarks,
      estimatedValue: rawTenderData.estimatedValue,
      productCategory: rawTenderData.productCategory,
      subCategory: rawTenderData.subCategory,
      contractType: rawTenderData.contractType,
      bidValidityDays: rawTenderData.bidValidityDays,
      periodOfWorkDays: rawTenderData.periodOfWorkDays,
      location: rawTenderData.location,
      pincode: rawTenderData.pincode,
      preBidMeetingPlace: rawTenderData.preBidMeetingPlace,
      preBidMeetingAddress: rawTenderData.preBidMeetingAddress,
      preBidMeetingDate: rawTenderData.preBidMeetingDate ? parseDate(rawTenderData.preBidMeetingDate) : null,
      bidOpeningPlace: rawTenderData.bidOpeningPlace,
      shouldAllowNDATender: rawTenderData.shouldAllowNDATender,
      allowPreferentialBidder: rawTenderData.allowPreferentialBidder,

      publishedDate: parseDate(rawTenderData.publishedDate),
      bidOpeningDate: parseDate(rawTenderData.bidOpeningDate),
      documentDownloadStartDate: parseDate(rawTenderData.documentDownloadStartDate),
      documentDownloadEndDate: parseDate(rawTenderData.documentDownloadEndDate),
      clarificationStartDate: rawTenderData.clarificationStartDate,
      clarificationEndDate: rawTenderData.clarificationEndDate,
      bidSubmissionStartDate: parseDate(rawTenderData.bidSubmissionStartDate),
      bidSubmissionEndDate: parseDate(rawTenderData.bidSubmissionEndDate),
      closingDate: parseDate(rawTenderData.closingDate),

      nitDocuments: rawTenderData.nitDocuments || [],
      workItemDocuments: rawTenderData.workItemDocuments || [],
      pdfUrls: rawTenderData.pdfUrls || [],

      invitingAuthorityName: rawTenderData.invitingAuthorityName,
      invitingAuthorityAddress: rawTenderData.invitingAuthorityAddress,
      status: 'ACTIVE'
    };
  }
}