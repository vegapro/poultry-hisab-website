import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ZodError } from 'zod';
import type { AppConfig } from './config.js';
import { createTrialApplicationRouter, TrialSlugConflictError } from './trial/routes.js';
import type { TrialApplicationRepository } from './trial/types.js';

interface CreateAppOptions {
  repository: TrialApplicationRepository;
  config: Pick<AppConfig, 'corsOrigin'>;
}

interface BodyParserError extends Error {
  code?: string;
  type?: string;
  status?: number;
  statusCode?: number;
}

export function createApp({ repository, config }: CreateAppOptions): express.Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use((request, response, next) => {
    const origin = request.get('origin');
    if (origin && origin !== config.corsOrigin) {
      response.status(403).json({ message: 'Request origin is not allowed.' });
      return;
    }
    next();
  });
  app.use(cors({ origin: config.corsOrigin, methods: ['POST'] }));
  app.use(express.json({ limit: '64kb' }));
  app.use('/api/trial-applications', rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/trial-applications', createTrialApplicationRouter(repository));

  app.use((_request, response) => {
    response.status(404).json({ message: 'Not found.' });
  });

  const errorHandler: ErrorRequestHandler = (error: BodyParserError, _request, response, next) => {
    void next;
    if (error.type === 'entity.too.large' || error.status === 413 || error.statusCode === 413) {
      response.status(413).json({ message: 'Request is too large.' });
      return;
    }
    if (error instanceof ZodError || error.type === 'entity.parse.failed') {
      response.status(400).json({ message: 'Please check the submitted details.' });
      return;
    }
    if (error instanceof TrialSlugConflictError || error.code === '23505') {
      response.status(409).json({ message: 'This farm is already awaiting review. Please contact PoultryHisab.' });
      return;
    }
    if (error instanceof Error && error.message === 'Farm name must contain at least one English letter or number.') {
      response.status(400).json({ message: 'Please check the submitted details.' });
      return;
    }
    response.status(500).json({ message: 'We could not submit your request. Please try again.' });
  };
  app.use(errorHandler);

  return app;
}
