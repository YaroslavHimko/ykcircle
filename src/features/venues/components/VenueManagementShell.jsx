import { Helmet } from 'react-helmet';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import { moderationLabels, moderationStyles } from '../model/venue-management.js';
export function Shell({ title, children }) {
  return (
    <SiteChrome>
      <Helmet>
        <title>{title} | YKCircle</title>
      </Helmet>
      <section className="page-container">{children}</section>
    </SiteChrome>
  );
}
export function Loading({ label = 'Loading…' }) {
  return (
    <p role="status" className="mt-8 text-muted-foreground">
      {label}
    </p>
  );
}
export function Field({ label, required, value, onChange }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {required && ' *'}
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 min-h-11 w-full border border-border bg-background px-3"
      />
    </label>
  );
}
export function Error({ text }) {
  return (
    <p
      role="alert"
      className="rounded-2xl mt-5 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {text}
    </p>
  );
}
export function Status({ status }) {
  return (
    <span className="whitespace-nowrap text-sm capitalize text-primary">{status || 'pending'}</span>
  );
}
export function ModerationStatus({ status }) {
  const value = status || 'draft';
  return (
    <span
      className={`whitespace-nowrap border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${moderationStyles[value] || 'border-border text-muted-foreground'}`}
    >
      {moderationLabels[value] || value}
    </span>
  );
}
