import { Plus, Trash2 } from "lucide-react";
import type {
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { Button } from "../../components/ui/button";
import { Field, SelectInput, TextInput } from "../../components/ui/field";
import { LAYER_PROFILES } from './schema';
import type { TrialFormValues } from "./trial-form";

interface ShedFieldsProps {
  fields: UseFieldArrayReturn<TrialFormValues, "sheds">["fields"];
  register: UseFormRegister<TrialFormValues>;
  errors: FieldErrors<TrialFormValues>;
  append: UseFieldArrayAppend<TrialFormValues, "sheds">;
  remove: UseFieldArrayRemove;
  watch: UseFormWatch<TrialFormValues>;
}

const emptyShed = {
  startDate: "",
  birdCount: 0,
};

function batchNameForDate(value: string) {
  if (!value) return "Select a start date";
  return `${new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`))} Batch`;
}

export function ShedFields({
  fields,
  register,
  errors,
  append,
  remove,
  watch,
}: ShedFieldsProps) {
  const sheds = watch("sheds");
  const productionMode = watch('productionMode');

  return (
    <div className="repeater-stack">
      {fields.map((field, index) => (
        <section className="repeater" key={field.id}>
          <div className="repeater__heading">
            <div className="repeater__labels">
              <span className="pill">Shed {index + 1}</span>
              <span className="pill">{batchNameForDate(sheds[index]?.startDate ?? "")}</span>
            </div>
            {fields.length > 1 ? (
              <Button
                tone="ghost"
                className="icon-button"
                aria-label={`Remove Shed ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={18} />
              </Button>
            ) : null}
          </div>
          <div className="form-grid form-grid--three">
            {productionMode === 'LAYER' ? <Field label="Layer breed (optional)" error={errors.sheds?.[index]?.performanceProfileId?.message}>
              <SelectInput {...register(`sheds.${index}.performanceProfileId`)}>
                <option value="">Not selected</option>
                {LAYER_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
              </SelectInput>
            </Field> : null}
            <Field
              label="Batch start date"
              error={errors.sheds?.[index]?.startDate?.message}
            >
              <TextInput
                type="date"
                {...register(`sheds.${index}.startDate`)}
              />
            </Field>
            <Field
              label="Birds placed"
              error={errors.sheds?.[index]?.birdCount?.message}
            >
              <TextInput
                type="number"
                min="1"
                {...register(`sheds.${index}.birdCount`, {
                  valueAsNumber: true,
                })}
              />
            </Field>
            <Field label="Weekly weight day (optional)" error={errors.sheds?.[index]?.weeklyWeightDay?.message}>
              <SelectInput {...register(`sheds.${index}.weeklyWeightDay`)}>
                <option value="">No weekly reminder</option><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option>
              </SelectInput>
            </Field>
          </div>
        </section>
      ))}
      <Button
        tone="secondary"
        className="add-button"
        disabled={fields.length >= 3}
        onClick={() => append(emptyShed)}
      >
        <Plus size={18} /> Add shed
      </Button>
    </div>
  );
}
