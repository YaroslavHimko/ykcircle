import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '', complete: false });

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmation) return setStatus({ loading: false, error: 'The passwords do not match.', complete: false });
    setStatus({ loading: true, error: '', complete: false });
    try {
      const response = await apiFetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reset your password.');
      setStatus({ loading: false, error: '', complete: true });
    } catch (error) { setStatus({ loading: false, error: error.message, complete: false }); }
  };

  const passwordField = (label, value, setValue, autocomplete) => <label className="block text-sm">{label}<span className="relative mt-2 block"><input required minLength={8} autoComplete={autocomplete} type={visible ? 'text' : 'password'} value={value} onChange={(event) => setValue(event.target.value)} className="min-h-12 w-full border border-border bg-background px-4 pr-12" /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>;
  return <SiteChrome><Helmet><title>Choose a new password | YKCircle</title></Helmet><section className="mx-auto max-w-[34rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Password reset</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">Choose a new password.</h1>{!token ? <><p role="alert" className="mt-6 text-destructive">This password-reset link is missing its token.</p><Link to="/forgot-password" className="mt-8 inline-flex text-primary underline">Request a new link</Link></> : status.complete ? <><p role="status" className="mt-6 text-muted-foreground">Your password has been updated. You can now log in with your new password.</p><Link to="/login" className="mt-8 inline-flex min-h-12 items-center bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground">Log in</Link></> : <form onSubmit={submit} className="mt-10 space-y-5">{passwordField('New password', password, setPassword, 'new-password')}{passwordField('Confirm new password', confirmation, setConfirmation, 'new-password')}{status.error && <p role="alert" className="text-sm text-destructive">{status.error}</p>}<button disabled={status.loading} className="min-h-12 w-full bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-60">{status.loading ? 'Updating…' : 'Set new password'}</button></form>}</section></SiteChrome>;
}
