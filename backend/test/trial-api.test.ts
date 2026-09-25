import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { TrialApplicationRepository } from '../src/trial/types.js';

const validApplication = {
  owner: { name: 'Anil Kumar', phone: '9876543210' },
  farm: {
    name: 'Kumar Poultry Farm',
    location: 'Prayagraj',
    openingFeedStockKg: 5000,
    openingFeedStockRatePerKg: 35,
  },
  preferences: { feedStockLowThresholdKg: 800, mortalityAlertPercent: 4, paymentReminderDays: 7 },
  sheds: [
    {
      name: 'Shed 1',
      capacity: 5000,
      batchName: 'September Batch',
      startDate: '2026-09-25',
      birdCount: 4500,
      maleCount: 4500,
      femaleCount: 0,
    },
  ],
  workers: [
    { name: 'Ramesh', phone: '9876543211', language: 'hi', sheds: ['Shed 1'], modules: ['FEED'] },
  ],
};

function fakeRepository(): TrialApplicationRepository & {
  tenantSlugExists: ReturnType<typeof vi.fn>;
  activeTrialSlugExists: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
} {
  return {
    tenantSlugExists: vi.fn().mockResolvedValue(false),
    activeTrialSlugExists: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue({ id: 'trial-uuid', status: 'NEW' }),
  };
}

describe('POST /api/trial-applications', () => {
  let repository: ReturnType<typeof fakeRepository>;
  let app: express.Express;

  beforeEach(() => {
    repository = fakeRepository();
    app = createApp({ repository, config: { corsOrigin: 'https://website.example.com' } });
  });

  it('creates one manual-review application with a canonical payload', async () => {
    const response = await request(app)
      .post('/api/trial-applications')
      .set('Origin', 'https://website.example.com')
      .send(validApplication);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 'trial-uuid',
      status: 'NEW',
      message: 'Your trial request has been received.',
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create.mock.calls[0][0]).toMatchObject({
      ownerPhone: '+919876543210',
      tenantSlug: 'kumar-poultry-farm',
    });
  });

  it('rejects a live tenant slug without inserting a trial', async () => {
    repository.tenantSlugExists.mockResolvedValue(true);

    const response = await request(app).post('/api/trial-applications').send(validApplication);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'This farm is already awaiting review. Please contact PoultryHisab.' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects an active trial slug without inserting another trial', async () => {
    repository.activeTrialSlugExists.mockResolvedValue(true);

    const response = await request(app).post('/api/trial-applications').send(validApplication);

    expect(response.status).toBe(409);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps an active-slug index race to the same generic conflict response', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    const response = await request(app).post('/api/trial-applications').send(validApplication);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'This farm is already awaiting review. Please contact PoultryHisab.' });
  });

  it('rejects worker assignments not present in the submitted shed list', async () => {
    const invalid = structuredClone(validApplication);
    invalid.workers[0].sheds = ['Unknown Shed'];

    const response = await request(app).post('/api/trial-applications').send(invalid);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Please check the submitted details.' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects oversized bodies before a repository call', async () => {
    const response = await request(app)
      .post('/api/trial-applications')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ padding: 'x'.repeat(65 * 1024) }));

    expect(response.status).toBe(413);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON without leaking parser details', async () => {
    const response = await request(app)
      .post('/api/trial-applications')
      .set('Content-Type', 'application/json')
      .send('{not-json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Please check the submitted details.' });
  });

  it('rejects requests from an unapproved browser origin', async () => {
    const response = await request(app)
      .post('/api/trial-applications')
      .set('Origin', 'https://attacker.example.com')
      .send(validApplication);

    expect(response.status).toBe(403);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('does not expose any public listing route', async () => {
    const response = await request(app).get('/api/trial-applications');

    expect(response.status).toBe(404);
  });
});
