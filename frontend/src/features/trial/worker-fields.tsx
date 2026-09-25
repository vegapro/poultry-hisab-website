import { Plus, Trash2 } from 'lucide-react';
import type { FieldErrors, UseFieldArrayAppend, UseFieldArrayRemove, UseFieldArrayReturn, UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Field, SelectInput, TextInput } from '../../components/ui/field';
import { MODULE_OPTIONS } from './schema';
import type { TrialFormValues } from './trial-form';

interface WorkerFieldsProps {
  fields: UseFieldArrayReturn<TrialFormValues, 'workers'>['fields'];
  register: UseFormRegister<TrialFormValues>;
  errors: FieldErrors<TrialFormValues>;
  append: UseFieldArrayAppend<TrialFormValues, 'workers'>;
  remove: UseFieldArrayRemove;
  watch: UseFormWatch<TrialFormValues>;
  getValues: UseFormGetValues<TrialFormValues>;
  setValue: UseFormSetValue<TrialFormValues>;
}

const emptyWorker = { name: '', phone: '', language: 'hinglish' as const, sheds: [] as string[], modules: [] as TrialFormValues['workers'][number]['modules'] };

export function WorkerFields({ fields, register, errors, append, remove, watch, getValues, setValue }: WorkerFieldsProps) {
  const sheds = watch('sheds');
  const shedNames = sheds.map((shed) => shed.name).filter(Boolean);
  const toggle = (index: number, key: 'sheds' | 'modules', value: string) => {
    const current = getValues(`workers.${index}.${key}`) as string[];
    setValue(`workers.${index}.${key}`, current.includes(value) ? current.filter((item) => item !== value) : [...current, value], { shouldValidate: true });
  };

  return <div className="repeater-stack">
    {fields.map((field, index) => {
      const selectedSheds = watch(`workers.${index}.sheds`);
      const selectedModules = watch(`workers.${index}.modules`);
      return <section className="repeater" key={field.id}>
        <div className="repeater__heading"><h3>Worker {index + 1}</h3>{fields.length > 1 ? <Button tone="ghost" className="icon-button" aria-label={`Remove worker ${index + 1}`} onClick={() => remove(index)}><Trash2 size={18} /></Button> : null}</div>
        <div className="form-grid form-grid--three">
          <Field label="Worker name" error={errors.workers?.[index]?.name?.message}><TextInput {...register(`workers.${index}.name`)} /></Field>
          <Field label="Worker WhatsApp number" error={errors.workers?.[index]?.phone?.message}><TextInput inputMode="numeric" {...register(`workers.${index}.phone`)} /></Field>
          <Field label="Preferred language"><SelectInput {...register(`workers.${index}.language`)}><option value="hinglish">Hinglish</option><option value="hi">Hindi</option></SelectInput></Field>
        </div>
        <fieldset className="choice-group"><legend>Assigned sheds</legend><div className="choice-list">{shedNames.map((shed) => <label key={shed}><input type="checkbox" checked={selectedSheds?.includes(shed) || false} onChange={() => toggle(index, 'sheds', shed)} /> {shed}</label>)}</div>{errors.workers?.[index]?.sheds?.message ? <small className="field__error">{errors.workers[index]?.sheds?.message}</small> : null}</fieldset>
        <fieldset className="choice-group"><legend>Daily entries</legend><div className="choice-list">{MODULE_OPTIONS.map((module) => <label key={module.value}><input type="checkbox" checked={selectedModules?.includes(module.value) || false} onChange={() => toggle(index, 'modules', module.value)} /> {module.label}</label>)}</div>{errors.workers?.[index]?.modules?.message ? <small className="field__error">{errors.workers[index]?.modules?.message}</small> : null}</fieldset>
      </section>;
    })}
    <Button tone="secondary" className="add-button" disabled={fields.length >= 4} onClick={() => append(emptyWorker)}><Plus size={18} /> Add worker</Button>
  </div>;
}
