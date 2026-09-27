import React from 'react';
import { apiFetch } from '@/lib/api';

export const inputClass = 'mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60';
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50';
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/50 disabled:opacity-50';
export const asList = (data, key) => Array.isArray(data) ? data : data?.[key] || [];

export async function billingRequest(path, options = {}) {
  const response = await apiFetch(path, { ...options, headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error([data?.error || data?.message || 'Unable to complete this request.', ...Object.values(data?.fields || {})].join(' '));
  return data;
}

export function Field({ label, value, onChange, ...props }) {
  return <label className="block text-sm font-medium">{label}{props.required && <span className="text-primary"> *</span>}<input {...props} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

export function ErrorNotice({ error }) {
  return error ? <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null;
}
