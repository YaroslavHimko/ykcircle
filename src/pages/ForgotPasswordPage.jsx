import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', sent: false });

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', sent: false });
    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to request a password reset.');
      setStatus({ loading: false, error: '', sent: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message, sent: false });
    }
  };

  return <SiteChrome><Helmet><title>Reset password | YKCircle</title></Helmet><section className="mx-auto max-w-[34rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Password reset</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">Reset your password.</h1>{status.sent ? <><p role="status" className="mt-6 leading-relaxed text-muted-foreground">If an account exists for <span className="text-foreground">{email}</span>, we’ve sent a password-reset link. Check your inbox and spam folder.</p><Link to="/login" className="mt-8 inline-flex min-h-12 items-center bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground">Return to login</Link></> : <><p className="mt-6 text-muted-foreground">Enter the email address connected to your account and we’ll send you a reset link.</p><form onSubmit={submit} className="mt-10 space-y-5"><label className="block text-sm">Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>{status.error && <p role="alert" className="text-sm text-destructive">{status.error}</p>}<button disabled={status.loading} className="min-h-12 w-full bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-60">{status.loading ? 'Sending…' : 'Send reset link'}</button></form><p className="mt-8 text-sm text-muted-foreground">Remembered your password? <Link to="/login" className="text-primary underline underline-offset-4">Log in</Link></p></>}</section></SiteChrome>;
}
