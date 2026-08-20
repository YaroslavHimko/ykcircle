import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

const formatWait = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function CheckEmailPage() {
  const { email, verificationRequired, from } = useLocation().state || {};
  const [seconds, setSeconds] = useState(30);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (seconds === 0) return undefined;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const resend = async () => {
    setError('');
    setMessage('');
    const response = await apiFetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 429 && Number(data.retryAfter) > 0) setSeconds(Number(data.retryAfter));
      setError(data.error || 'Unable to resend verification email.');
      return;
    }
    setMessage(data.message);
    setSeconds(30);
  };

  return <SiteChrome><Helmet><title>Verify your email | Yaro Himko</title></Helmet><section className="mx-auto max-w-[38rem] px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Email verification</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">Check your inbox.</h1><p className="mt-6 leading-relaxed text-muted-foreground">{verificationRequired ? 'Your email address still needs to be verified.' : 'We sent you a confirmation link.'}{email ? <> Look for it at <span className="text-foreground">{email}</span>.</> : ' Check your inbox for the link.'}</p><p className="mt-4 text-sm text-muted-foreground">Your verification link is valid for 24 hours.</p>{error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}{message && <p role="status" className="mt-5 text-sm text-primary">{message}</p>}<div className="mt-10 border-t border-border pt-6"><p className="text-sm font-medium">Didn’t receive the email?</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Check your spam or junk folder first. You can request another link if needed.</p>{seconds > 0 ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">Another email can be requested in {formatWait(seconds)}.</p> : <button type="button" disabled={!email} onClick={resend} className="mt-4 min-h-10 text-sm font-medium text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50">Send another confirmation email</button>}</div><Link to={from ? `/login?from=${encodeURIComponent(from)}` : '/login'} className="mt-8 inline-flex min-h-12 items-center text-sm text-primary underline">Return to login</Link></section></SiteChrome>;
}

