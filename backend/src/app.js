import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import pino from 'pino';
import { env } from './config/env.js';

// --- Import All Routes ---
import authRoutes from './routes/auth.routes.js';
import tenderRoutes from './routes/tender.routes.js';  
import bidRoutes from './routes/bid.routes.js';        
import organizationRoutes from './routes/organization.routes.js';
import documentRoutes from './routes/document.routes.js';
import contractorRoutes from './routes/contractor.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { globalErrorHandler } from './middleware/errorHandler.middleware.js';

import { apiLimiter } from './middleware/rateLimiter.middleware.js';

const app = express();
const logger = pino({
  transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

// 1. Security & Parsers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const configuredOrigins = env.CORS_ORIGIN 
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim()) 
  : [];

if (env.FRONTEND_URL && !configuredOrigins.includes(env.FRONTEND_URL)) {
  configuredOrigins.push(env.FRONTEND_URL.trim());
}

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = [
  ...(env.NODE_ENV !== 'production' ? defaultDevOrigins : []),
  ...configuredOrigins
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);

    const isDevLocalhost = (
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    );

    const isExplicitlyAllowed = allowedOrigins.some((allowed) => {
      if (allowed === '*' || allowed === origin) return true;
      if (allowed.startsWith('*.')) {
        const rootDomain = allowed.slice(2);
        try {
          const originHost = new URL(origin).hostname;
          return originHost === rootDomain || originHost.endsWith(`.${rootDomain}`);
        } catch {
          return false;
        }
      }
      return false;
    });

    if (isExplicitlyAllowed || isDevLocalhost) {
      return callback(null, true);
    }

    // Cleanly reject unauthorized origins without throwing 500 exceptions
    return callback(null, false);
  },
  credentials: true, // Required for httpOnly cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Apply rate limiting to all /api/ endpoints to prevent DoS attacks
app.use('/api/', apiLimiter);

// 2. Base Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 🚀 3. Mount Business Logic Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenders', tenderRoutes);
app.use('/api/v1/bids', bidRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/contractor', contractorRoutes);
app.use('/api/v1/admin', adminRoutes);

// Fallback aliases (ensures frontend works whether VITE_API_URL includes /api/v1 or just the domain)
app.use('/auth', authRoutes);
app.use('/tenders', tenderRoutes);
app.use('/bids', bidRoutes);
app.use('/organizations', organizationRoutes);
app.use('/documents', documentRoutes);
app.use('/contractor', contractorRoutes);
app.use('/admin', adminRoutes);

// 4. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// 5. Global Error Handler (must be last)
app.use(globalErrorHandler);

export default app;