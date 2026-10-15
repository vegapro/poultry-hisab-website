import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrialForm, type TrialFormValues } from './trial-form';

const validValues: TrialFormValues = {
  productionMode: 'LAYER',
  owner: { name: 'Anil Kumar', phone: '9876543210' },
  farm: { name: 'Kumar Poultry Farm', location: 'Prayagraj', openingFeedStockKg: 5000, openingFeedStockRatePerKg: 35 },
  preferences: { feedStockLowThresholdKg: 800, mortalityAlertPercent: 4, paymentReminderDays: 7 },
  sheds: [{ startDate: '2026-09-25', birdCount: 4500 }],
  workers: [{ name: 'Ramesh', phone: '9876543211', language: 'hi', sheds: ['Shed 1'], modules: ['FEED', 'EGG_COLLECTION'] }],
};

describe('TrialForm', () => {
  it('submits a selected supported Layer breed', async () => {
    const submitApplication = vi.fn().mockResolvedValue({ id: 'trial', status: 'NEW' });
    render(<TrialForm initialValues={validValues} submitApplication={submitApplication} />);
    await moveToStep('Farm preferences');
    await moveToStep('Sheds and batches');
    const select = screen.getByLabelText('Layer breed (optional)');
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Lohmann LSL Ultra Lite' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bovans White' })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '21dfea74-429c-4904-bb1f-75e1aeda7932' } });
    await moveToStep('Workers');
    await moveToStep('Review');
    fireEvent.click(screen.getByRole('button', { name: 'Submit trial request' }));
    await waitFor(() => expect(submitApplication).toHaveBeenCalledOnce());
    expect(submitApplication.mock.calls[0][0].sheds[0].performanceProfileId).toBe('21dfea74-429c-4904-bb1f-75e1aeda7932');
  });

  it('clears a Layer breed when changing to Broiler and hides the dropdown', async () => {
    const input = structuredClone(validValues);
    input.sheds[0].performanceProfileId = '21dfea74-429c-4904-bb1f-75e1aeda7932';
    const submitApplication = vi.fn().mockResolvedValue({ id: 'trial', status: 'NEW' });
    render(<TrialForm initialValues={input} submitApplication={submitApplication} />);
    fireEvent.change(screen.getByLabelText('Production type'), { target: { value: 'BROILER' } });
    await moveToStep('Farm preferences');
    await moveToStep('Sheds and batches');
    expect(screen.queryByLabelText('Layer breed (optional)')).not.toBeInTheDocument();
    await moveToStep('Workers');
    await moveToStep('Review');
    fireEvent.click(screen.getByRole('button', { name: 'Submit trial request' }));
    await waitFor(() => expect(submitApplication).toHaveBeenCalledOnce());
    expect(submitApplication.mock.calls[0][0].sheds[0].performanceProfileId).toBeUndefined();
  });
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

  it('blocks the first step until a production mode is selected', async () => {
    const withoutMode = { ...validValues, productionMode: undefined } as unknown as TrialFormValues;
    render(<TrialForm initialValues={withoutMode} submitApplication={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Production type is required.')).toBeInTheDocument();
  });

  it('removes egg collection when a layer trial changes to broiler', async () => {
    const submitApplication = vi.fn().mockResolvedValue({ id: 'trial-uuid', status: 'NEW' });
    render(<TrialForm initialValues={validValues} submitApplication={submitApplication} />);

    fireEvent.change(screen.getByLabelText('Production type'), { target: { value: 'BROILER' } });
    await moveToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Submit trial request' }));

    await waitFor(() => expect(submitApplication).toHaveBeenCalledOnce());
    expect(submitApplication.mock.calls[0][0].workers[0].modules).not.toContain('EGG_COLLECTION');
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

  it('derives non-editable shed and batch labels from position and start date', async () => {
    render(<TrialForm initialValues={validValues} submitApplication={vi.fn()} />);

    await moveToStep('Farm preferences');
    await moveToStep('Sheds and batches');

    expect(screen.getByText('Shed 1')).toBeInTheDocument();
    expect(screen.getByText('September 2026 Batch')).toBeInTheDocument();
    expect(screen.queryByLabelText('Shed name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Batch name')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Batch start date'), { target: { value: '2026-10-15' } });

    expect(await screen.findByText('October 2026 Batch')).toBeInTheDocument();
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
