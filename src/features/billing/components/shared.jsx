import { inputClass } from '../model/billing-ui.js';
export function Field({ label, value, onChange, ...props }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {props.required && <span className="text-primary"> *</span>}
      <input
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}
export function ErrorNotice({ error }) {
  return error ? (
    <p
      role="alert"
      className="rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {error}
    </p>
  ) : null;
}
