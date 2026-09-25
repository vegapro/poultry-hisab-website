import { Plus, Trash2 } from 'lucide-react';
import type { FieldErrors, UseFieldArrayAppend, UseFieldArrayRemove, UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Field, TextInput } from '../../components/ui/field';
import type { TrialFormValues } from './trial-form';

interface ShedFieldsProps {
  fields: UseFieldArrayReturn<TrialFormValues, 'sheds'>['fields'];
  register: UseFormRegister<TrialFormValues>;
  errors: FieldErrors<TrialFormValues>;
  append: UseFieldArrayAppend<TrialFormValues, 'sheds'>;
  remove: UseFieldArrayRemove;
}

const emptyShed = {
  name: '', capacity: 0, batchName: '', startDate: '', birdCount: 0, maleCount: 0, femaleCount: 0,
};

export function ShedFields({ fields, register, errors, append, remove }: ShedFieldsProps) {
  return <div className="repeater-stack">
    {fields.map((field, index) => <section className="repeater" key={field.id}>
      <div className="repeater__heading"><h3>Shed {index + 1}</h3>{fields.length > 1 ? <Button tone="ghost" className="icon-button" aria-label={`Remove Shed ${index + 1}`} onClick={() => remove(index)}><Trash2 size={18} /></Button> : null}</div>
      <div className="form-grid form-grid--three">
        <Field label="Shed name" error={errors.sheds?.[index]?.name?.message}><TextInput {...register(`sheds.${index}.name`)} /></Field>
        <Field label="Capacity" error={errors.sheds?.[index]?.capacity?.message}><TextInput type="number" min="0" {...register(`sheds.${index}.capacity`, { valueAsNumber: true })} /></Field>
        <Field label="Batch name" error={errors.sheds?.[index]?.batchName?.message}><TextInput {...register(`sheds.${index}.batchName`)} /></Field>
        <Field label="Batch start date" error={errors.sheds?.[index]?.startDate?.message}><TextInput type="date" {...register(`sheds.${index}.startDate`)} /></Field>
        <Field label="Birds placed" error={errors.sheds?.[index]?.birdCount?.message}><TextInput type="number" min="1" {...register(`sheds.${index}.birdCount`, { valueAsNumber: true })} /></Field>
        <Field label="Male birds" error={errors.sheds?.[index]?.maleCount?.message}><TextInput type="number" min="0" {...register(`sheds.${index}.maleCount`, { valueAsNumber: true })} /></Field>
        <Field label="Female birds" error={errors.sheds?.[index]?.femaleCount?.message}><TextInput type="number" min="0" {...register(`sheds.${index}.femaleCount`, { valueAsNumber: true })} /></Field>
      </div>
    </section>)}
    <Button tone="secondary" className="add-button" disabled={fields.length >= 3} onClick={() => append(emptyShed)}><Plus size={18} /> Add shed</Button>
  </div>;
}
