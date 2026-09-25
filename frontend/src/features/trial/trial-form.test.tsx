import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrialForm, type TrialFormValues } from './trial-form';

const validValues: TrialFormValues = {
  owner: { name: 'Anil Kumar', phone: '9876543210' },
  farm: { name: 'Kumar Poultry Farm', location: 'Prayagraj', openingFeedStockKg: 5000, openingFeedStockRatePerKg: 35 },
  preferences: { feedStockLowThresholdKg: 800, mortalityAlertPercent: 4, paymentReminderDays: 7 },
  sheds: [{ name: 'Shed 1', capacity: 5000, batchName: 'September Batch', startDate: '2026-09-25', birdCount: 4500, maleCount: 4500, femaleCount: 0 }],
  workers: [{ name: 'Ramesh', phone: '9876543211', language: 'hi', sheds: ['Shed 1'], modules: ['FEED'] }],
};

describe('TrialForm', () => {
  async function moveToStep(name: string) {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name });
  }

  async function moveToWorkers() {
    await moveToStep('Farm preferences');
    await moveToStep('Sheds and batches');
    await moveToStep('Workers');
  }

  async function moveToReview() {
    await moveToWorkers();
    await moveToStep('Review');
  }

  it('blocks the first step until owner and farm fields are provided', async () => {
    render(<TrialForm submitApplication={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Owner name is required.')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('shows owner-worker number conflict before sending data', async () => {
    const invalid = structuredClone(validValues);
    invalid.workers[0].phone = '9876543210';
    render(<TrialForm initialValues={invalid} submitApplication={vi.fn()} />);

    await moveToWorkers();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Owner WhatsApp number must be different from worker numbers.')).toBeInTheDocument();
  });

  it('allows no more than four workers', async () => {
    render(<TrialForm initialValues={validValues} submitApplication={vi.fn()} />);

    await moveToWorkers();
    fireEvent.click(screen.getByRole('button', { name: 'Add worker' }));
    await screen.findByText('Worker 2');
    fireEvent.click(screen.getByRole('button', { name: 'Add worker' }));
    await screen.findByText('Worker 3');
    fireEvent.click(screen.getByRole('button', { name: 'Add worker' }));
    await screen.findByText('Worker 4');

    expect(screen.getByRole('button', { name: 'Add worker' })).toBeDisabled();
  });

  it('submits a valid five-step application once and shows manual-review success', async () => {
    const submitApplication = vi.fn().mockResolvedValue({ id: 'trial-uuid', status: 'NEW' });
    render(<TrialForm initialValues={validValues} submitApplication={submitApplication} />);

    await moveToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Submit trial request' }));

    await waitFor(() => expect(submitApplication).toHaveBeenCalledOnce());
    expect(screen.getByText('Your trial request has been received.')).toBeInTheDocument();
    expect(screen.getByText('Our team will review the farm details and contact you on WhatsApp.')).toBeInTheDocument();
  });
});
