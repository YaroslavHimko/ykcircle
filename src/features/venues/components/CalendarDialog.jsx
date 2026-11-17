import { input } from '../model/venue-calendar.js';
export function Dialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rounded-2xl mx-auto mt-16 w-full max-w-lg border border-border bg-background p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-3xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-action min-h-10 border border-border px-3 text-sm"
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function TimeField({ label, value, onChange, disabled }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type="time"
        required
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={input}
      />
    </label>
  );
}
