import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{error ? <small className="field__error">{error}</small> : null}</label>;
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(props, ref) {
  return <input ref={ref} className="input" {...props} />;
});

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function SelectInput(props, ref) {
  return <select ref={ref} className="input" {...props} />;
});
