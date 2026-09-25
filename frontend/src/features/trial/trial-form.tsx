import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Field, TextInput } from '../../components/ui/field';
import type { TrialApplicationResponse } from '../../lib/api';
import { submitTrialApplication } from '../../lib/api';
import { trialFormSchema } from './schema';
import { ShedFields } from './shed-fields';
import { WorkerFields } from './worker-fields';

export type TrialFormValues = {
  owner: { name: string; phone: string };
  farm: { name: string; location: string; openingFeedStockKg: number; openingFeedStockRatePerKg: number };
  preferences: { feedStockLowThresholdKg: number; mortalityAlertPercent: number; paymentReminderDays: number };
  sheds: Array<{ name: string; capacity: number; batchName: string; startDate: string; birdCount: number; maleCount: number; femaleCount: number }>;
  workers: Array<{ name: string; phone: string; language: 'hinglish' | 'hi'; sheds: string[]; modules: Array<'FEED' | 'MORTALITY' | 'EGG_COLLECTION' | 'WEIGHT_ENTRY'> }>;
};

const DEFAULT_VALUES: TrialFormValues = {
  owner: { name: '', phone: '' },
  farm: { name: '', location: '', openingFeedStockKg: 0, openingFeedStockRatePerKg: 0 },
  preferences: { feedStockLowThresholdKg: 1000, mortalityAlertPercent: 5, paymentReminderDays: 10 },
  sheds: [{ name: '', capacity: 0, batchName: '', startDate: '', birdCount: 0, maleCount: 0, femaleCount: 0 }],
  workers: [{ name: '', phone: '', language: 'hinglish', sheds: [], modules: [] }],
};

const STEP_TITLES = ['Owner and farm', 'Farm preferences', 'Sheds and batches', 'Workers', 'Review'];

interface TrialFormProps {
  initialValues?: TrialFormValues;
  submitApplication?: (input: TrialFormValues) => Promise<TrialApplicationResponse>;
}

export function TrialForm({ initialValues, submitApplication = submitTrialApplication }: TrialFormProps) {
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, control, trigger, getValues, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<TrialFormValues>({
    defaultValues: initialValues ?? DEFAULT_VALUES,
    resolver: zodResolver(trialFormSchema),
    mode: 'onBlur',
  });
  const shedFields = useFieldArray({ control, name: 'sheds' });
  const workerFields = useFieldArray({ control, name: 'workers' });
  const values = watch();
  const reviewShedCount = useMemo(() => values.sheds.length, [values.sheds.length]);

  const validateFullForm = () => {
    const result = trialFormSchema.safeParse(getValues());
    if (result.success) return true;
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.') as keyof TrialFormValues;
      setError(path as never, { message: issue.message });
    });
    return false;
  };

  const goNext = async () => {
    setSubmitError(null);
    const fieldsByStep = [
      ['owner.name', 'owner.phone', 'farm.name', 'farm.location'],
      ['farm.openingFeedStockKg', 'farm.openingFeedStockRatePerKg', 'preferences.feedStockLowThresholdKg', 'preferences.mortalityAlertPercent', 'preferences.paymentReminderDays'],
      ['sheds'],
      ['workers'],
    ] as const;
    const valid = step === 3 ? validateFullForm() : await trigger(fieldsByStep[step] as never);
    if (valid) setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
  };

  const submit = async () => {
    setSubmitError(null);
    if (!validateFullForm()) return;
    try {
      await submitApplication(getValues());
      setSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not submit your request. Please try again.');
    }
  };

  if (success) return <section className="trial-success" aria-live="polite"><CheckCircle2 size={42} /><h2>Your trial request has been received.</h2><p>Our team will review the farm details and contact you on WhatsApp.</p></section>;

  return <section className="trial-form" aria-label="Start free trial">
    <header className="trial-form__header"><div><p className="eyebrow">Start free trial</p><h1>{STEP_TITLES[step]}</h1></div><p>Step {step + 1} of {STEP_TITLES.length}</p></header>
    <div className="step-meter" aria-hidden="true">{STEP_TITLES.map((title, index) => <span className={index <= step ? 'step-meter__active' : ''} key={title} />)}</div>

    {step === 0 ? <div className="form-grid form-grid--two">
      <Field label="Owner name" error={errors.owner?.name?.message}><TextInput autoComplete="name" {...register('owner.name')} /></Field>
      <Field label="Owner WhatsApp number" error={errors.owner?.phone?.message}><TextInput inputMode="numeric" autoComplete="tel" {...register('owner.phone')} /></Field>
      <Field label="Farm name" error={errors.farm?.name?.message}><TextInput {...register('farm.name')} /></Field>
      <Field label="Farm location" error={errors.farm?.location?.message}><TextInput {...register('farm.location')} /></Field>
    </div> : null}

    {step === 1 ? <div className="form-grid form-grid--two">
      <Field label="Opening feed stock (kg)" error={errors.farm?.openingFeedStockKg?.message}><TextInput type="number" min="0" {...register('farm.openingFeedStockKg', { valueAsNumber: true })} /></Field>
      <Field label="Opening feed rate (Rs/kg)" error={errors.farm?.openingFeedStockRatePerKg?.message}><TextInput type="number" min="0" {...register('farm.openingFeedStockRatePerKg', { valueAsNumber: true })} /></Field>
      <Field label="Low-feed alert level (kg)" error={errors.preferences?.feedStockLowThresholdKg?.message}><TextInput type="number" min="0" {...register('preferences.feedStockLowThresholdKg', { valueAsNumber: true })} /></Field>
      <Field label="Mortality alert level (%)" error={errors.preferences?.mortalityAlertPercent?.message}><TextInput type="number" min="0" max="100" {...register('preferences.mortalityAlertPercent', { valueAsNumber: true })} /></Field>
      <Field label="Payment reminder after (days)" error={errors.preferences?.paymentReminderDays?.message}><TextInput type="number" min="0" {...register('preferences.paymentReminderDays', { valueAsNumber: true })} /></Field>
    </div> : null}

    {step === 2 ? <ShedFields fields={shedFields.fields} register={register} errors={errors} append={shedFields.append} remove={shedFields.remove} /> : null}
    {step === 3 ? <WorkerFields fields={workerFields.fields} register={register} errors={errors} append={workerFields.append} remove={workerFields.remove} watch={watch} getValues={getValues} setValue={setValue} /> : null}
    {step === 4 ? <div className="review-grid"><div><span>Farm</span><strong>{values.farm.name}</strong></div><div><span>Owner</span><strong>{values.owner.name}</strong></div><div><span>Sheds</span><strong>{reviewShedCount}</strong></div><div><span>Workers</span><strong>{values.workers.length}</strong></div><p>We will review these details before setting up your farm. No trial account is created until our team contacts you.</p></div> : null}

    {submitError ? <p className="form-error" role="alert">{submitError}</p> : null}
    <footer className="trial-form__footer">
      {step > 0 ? <Button tone="secondary" onClick={() => setStep((current) => current - 1)}><ChevronLeft size={18} /> Back</Button> : <span />}
      {step < STEP_TITLES.length - 1 ? <Button onClick={() => void goNext()}>Next <ChevronRight size={18} /></Button> : <Button onClick={() => void submit()} disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />} Submit trial request</Button>}
    </footer>
  </section>;
}
