import { Router, type RequestHandler } from 'express';
import { buildOnboardingPayload } from './payload.js';
import { trialApplicationSchema } from './schema.js';
import type { TrialApplicationRepository } from './types.js';

export class TrialSlugConflictError extends Error {}

export function createTrialApplicationRouter(repository: TrialApplicationRepository): Router {
  const router = Router();

  const createTrialApplication: RequestHandler = async (request, response, next) => {
    try {
      const input = trialApplicationSchema.parse(request.body);
      const onboardingPayload = buildOnboardingPayload(input);
      const { slug } = onboardingPayload.tenant;

      if ((await repository.tenantSlugExists(slug)) || (await repository.activeTrialSlugExists(slug))) {
        throw new TrialSlugConflictError();
      }

      const created = await repository.create({
        ownerName: input.owner.name,
        ownerPhone: input.owner.phone,
        farmName: input.farm.name,
        tenantSlug: slug,
        onboardingPayload,
      });

      response.status(201).json({
        id: created.id,
        status: created.status,
        message: 'Your trial request has been received.',
      });
    } catch (error) {
      next(error);
    }
  };

  router.post('/', createTrialApplication);
  return router;
}
