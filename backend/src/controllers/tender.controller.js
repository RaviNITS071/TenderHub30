/**
 * @file backend/src/controllers/tender.controller.js
 * @description Handles all business logic for Tender retrieval, filtering, AI analysis queuing, and dashboard statistics.
 */

import Tender from '../models/Tender.js';
import { aiQueue } from '../workers/queue.js';

/**
 * Fetch a paginated list of tenders from the database with advanced filtering.
 * Maps incoming query parameters (search, organisation, department, location, closingDays) 
 * directly to the MongoDB schema.
 * 
 * @route GET /api/v1/tenders
 * @param {Object} req.query - URL query parameters passed from the frontend
 */
export const getTenders = async (req, res, next) => {
  try {
    // 1. Extract query parameters with defaults for pagination
    const { 
      page = 1, 
      limit = 10, 
      search, 
      organisation, 
      department, 
      location, 
      closingDays 
    } = req.query;
    
    // Initialize an empty query object
    const query = {};
    
    // 2. Advanced Search Filter (Matches Title, Description, or Tender IDs)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }, // 'i' makes it case-insensitive
        { workDescription: { $regex: search, $options: 'i' } },
        { tenderReferenceNumber: { $regex: search, $options: 'i' } },
        { sourceTenderId: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Organisation & Department Filter (Searches inside organisationChain)
    // If both are provided, we use $and to ensure both words exist in the chain
    if (organisation || department) {
      if (organisation && department) {
        query.$and = [
          { organisationChain: { $regex: organisation, $options: 'i' } },
          { organisationChain: { $regex: department, $options: 'i' } }
        ];
      } else {
        query.organisationChain = { $regex: organisation || department, $options: 'i' };
      }
    }

    // 4. Location Filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // 5. Closing Date Timeline Filter
    // Example: If closingDays = 7, find tenders closing between right now and 7 days from now
    if (closingDays) {
      const days = parseInt(closingDays, 10);
      if (!isNaN(days)) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        
        query.closingDate = {
          $gte: new Date(), // Must be active (closing date is in the future)
          $lte: targetDate  // Must close on or before the target deadline
        };
      }
    }

    // 6. Execute Database Query
    // Fetch matching documents, sort by deadline (closest first), and apply pagination
    const tenders = await Tender.find(query)
      .sort({ closingDate: 1 }) // 1 for ascending (closest deadlines show first)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Get the total count of documents matching the query for frontend pagination controls
    const total = await Tender.countDocuments(query);

    // 7. Send Response Payload
    res.status(200).json({
      data: tenders,
      meta: { 
        total, 
        page: Number(page), 
        limit: Number(limit) 
      }
    });
  } catch (error) {
    // Pass errors to the global error handler middleware
    next(error);
  }
};

/**
 * Fetch a single tender document by its unique database ID.
 * 
 * @route GET /api/v1/tenders/:id
 * @param {string} req.params.id - The MongoDB ObjectId of the tender
 */
export const getTenderById = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    
    // Handle case where ID format is valid but the record does not exist
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    
    res.status(200).json(tender);
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatch an asynchronous background job to analyze a tender document using AI.
 * Pushes the task into a BullMQ message queue for decoupled background processing.
 * 
 * @route POST /api/v1/tenders/:id/analyze
 * @param {string} req.params.id - The ID of the tender being analyzed
 */
export const triggerAiAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // NOTE: In production, these variables should be dynamically extracted 
    // from the actual PDF file stored in an S3 bucket or equivalent.
    const mockDocumentText = "Extracted text from the tender PDF goes here...";
    const mockDocumentHash = "abc123hash"; 

    // Add the AI extraction task to the Redis worker queue
    const job = await aiQueue.add('analyze-tender', {
      tenderId: id,
      documentText: mockDocumentText,
      documentHash: mockDocumentHash
    });

    // Return a 202 Accepted status indicating the job is queued
    res.status(202).json({ message: 'AI Analysis queued successfully', jobId: job.id });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate and fetch real-time aggregated statistics for the platform dashboard.
 * Utilizes MongoDB aggregation pipelines for optimal querying performance.
 * 
 * @route GET /api/v1/tenders/stats
 */
export const getTenderStats = async (req, res, next) => {
  try {
    // 1. Total active tenders count
    const activeTendersCount = await Tender.countDocuments();

    // 2. Total unique issuing authorities based on the organisationChain field
    const authorities = await Tender.distinct('organisationChain');
    const authoritiesCount = authorities.length;

    // 3. Total monetary value pipeline
    // FIXED: Changed "$value" to "$estimatedValue" to match the actual JSON schema
    const valueAggregation = await Tender.aggregate([
      { $group: { _id: null, totalValue: { $sum: "$estimatedValue" } } } 
    ]);
    const totalValue = valueAggregation.length > 0 ? valueAggregation[0].totalValue : 0;

    // Send the computed metrics to the frontend stats section
    res.status(200).json({
      activeTendersCount,
      authoritiesCount,
      totalValue
    });
  } catch (error) {
    console.error("Error calculating tender stats:", error);
    next(error);
  }
};