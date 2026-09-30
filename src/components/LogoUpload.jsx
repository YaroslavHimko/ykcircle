import React, { useId, useRef, useState } from 'react';
import { prepareLogo } from '@/lib/branding';

export default function LogoUpload({ value, onChange, label = 'Brand logo', description, onBusyChange }) {
  const id = useId();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choose = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); onBusyChange?.(true); setError('');
    try { onChange(await prepareLogo(file)); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); onBusyChange?.(false); if (input.current) input.current.value = ''; }
  };
  return <div className="min-w-0 sm:col-span-2">
    <label htmlFor={id} className="block text-sm font-medium">{label} <span className="font-normal text-muted-foreground">(optional)</span></label>
    <p id={`${id}-help`} className="mt-1 text-sm text-muted-foreground">{description}</p>
    {value && <div className="mt-3 flex flex-wrap items-center gap-4"><img src={value} alt={`${label} preview`} className="h-24 max-w-full border border-border bg-white p-3 object-contain" /><button type="button" disabled={busy} onClick={() => { onChange(''); setError(''); }} className="text-sm text-destructive underline">Remove logo</button></div>}
    <input ref={input} id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={choose} aria-describedby={`${id}-help`} aria-invalid={Boolean(error)} className="mt-3 block w-full min-w-0 border border-border bg-background p-3 text-sm" />
    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WebP, up to 5 MB. Your logo is fitted without cropping onto a white background.</p>
    {busy && <p role="status" className="mt-2 text-sm">Preparing logo…</p>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </div>;
}
