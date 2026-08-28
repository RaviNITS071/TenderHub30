import { Worker } from 'bullmq';
import pino from 'pino';
import { env } from '../config/env.js';
import { analyzeTenderDocument } from '../services/ai.service.js';
import AiAnalysis from '../models/AiAnalysis.js';

const logger = pino();
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  tls: { rejectUnauthorized: false },
  family: 4
};

export const aiSummaryWorker = new Worker('AIQueue', async (job) => {
  logger.info(`Processing AI Summary Job: ${job.id}`);

  const { tenderId, documentText, documentHash } = job.data;

  try {
    const analysis = await analyzeTenderDocument(documentText);

    await AiAnalysis.create({
      tenderId,
      documentHash,
      summary: analysis.summary,
      extractedEligibility: analysis.extractedEligibility,
      rawOpenAiResponse: analysis.rawOpenAiResponse
    });

  } catch (error) {
    logger.error(`AI Worker Failed: ${error.message}`);
    throw error;
  }
}, { connection });