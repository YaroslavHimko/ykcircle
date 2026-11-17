export const inputClass =
  'mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60';
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50';
export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/50 disabled:opacity-50';
export const asList = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);
