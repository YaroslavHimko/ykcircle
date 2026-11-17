import GoogleLocationPicker from '@/shared/components/GoogleLocationPicker.jsx';
import { inputClass, humanize } from '../model/venue-marketplace.js';
export function EditorSection({ title, children }) {
  return (
    <section className="border-t border-border pt-7">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {title === 'Location' && (
        <div className="mt-5">
          <GoogleLocationPicker
            onSelect={(place) =>
              window.dispatchEvent(
                new CustomEvent('ykcircle:venue-place-selected', {
                  detail: place,
                }),
              )
            }
          />
        </div>
      )}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
export function Input({ label, required, type = 'text', value, onChange, min, max, step }) {
  if (['Latitude', 'Longitude', 'Minimum booking hours'].includes(label)) return null;
  return (
    <label className="text-sm font-medium">
      {label === 'Starting price' ? 'Booking rate' : label}
      {required && ' *'}
      <input
        required={required}
        type={type}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={onChange}
        className={inputClass}
      />
    </label>
  );
}
export function CheckOption({ item, checked, onChange }) {
  return (
    <label className="ui-action flex min-h-11 items-center gap-2 border border-border px-3 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {item.name || humanize(item.slug || item)}
    </label>
  );
}
