import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'ykcircle-cookie-consent';
const defaultConsent = { necessary: true, analytics: false, marketing: false };

const readConsent = () => {
  try { return { ...defaultConsent, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return defaultConsent; }
};

export function openCookieSettings() {
  window.dispatchEvent(new Event('ykcircle:open-cookie-settings'));
}

export default function CookieSettings() {
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [consent, setConsent] = useState(readConsent);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('ykcircle:open-cookie-settings', show);
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    return () => window.removeEventListener('ykcircle:open-cookie-settings', show);
  }, []);

  const save = (next) => {
    const value = { ...defaultConsent, ...next, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setConsent(value);
    setOpen(false);
    setCustomizing(false);
    window.dispatchEvent(new CustomEvent('ykcircle:cookie-consent', { detail: value }));
  };

  if (!open) return null;
  return <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
    <div className="mx-auto max-w-4xl">
      <h2 id="cookie-settings-title" className="font-display text-2xl font-semibold">Your cookie choices</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Necessary storage keeps the site working. Analytics and marketing technologies remain off unless you choose to enable them. Read our <a className="text-primary underline" href="/cookies">Cookie Policy</a>.</p>
      {customizing && <div className="mt-5 grid gap-3 border-y border-border py-5 text-sm">
        <label className="flex items-start gap-3"><input checked disabled type="checkbox" className="mt-1" /><span><strong>Necessary</strong><br /><span className="text-muted-foreground">Required for core site functions and security.</span></span></label>
        <label className="flex items-start gap-3"><input checked={consent.analytics} onChange={(event) => setConsent((current) => ({ ...current, analytics: event.target.checked }))} type="checkbox" className="mt-1" /><span><strong>Analytics</strong><br /><span className="text-muted-foreground">Optional measurement to improve the service.</span></span></label>
        <label className="flex items-start gap-3"><input checked={consent.marketing} onChange={(event) => setConsent((current) => ({ ...current, marketing: event.target.checked }))} type="checkbox" className="mt-1" /><span><strong>Marketing</strong><br /><span className="text-muted-foreground">Optional marketing and retargeting technologies.</span></span></label>
      </div>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="min-h-11 bg-primary px-5 text-sm text-primary-foreground">Accept all</button>
        <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="min-h-11 border border-border px-5 text-sm">Reject non-essential</button>
        {customizing ? <button type="button" onClick={() => save(consent)} className="min-h-11 border border-border px-5 text-sm">Save choices</button> : <button type="button" onClick={() => setCustomizing(true)} className="min-h-11 border border-border px-5 text-sm">Customize</button>}
      </div>
    </div>
  </div>;
}
