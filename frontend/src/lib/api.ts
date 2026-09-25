import type { TrialFormValues } from '../features/trial/trial-form';

export interface TrialApplicationResponse {
  id: string;
  status: 'NEW';
  message: string;
}

export async function submitTrialApplication(input: TrialFormValues): Promise<TrialApplicationResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('Trial service is not configured.');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/trial-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as TrialApplicationResponse | { message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'We could not submit your request. Please try again.');
  }
  return body as TrialApplicationResponse;
}
