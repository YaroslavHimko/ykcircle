import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiUrl } from '@/lib/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState({ loading: false, error: 'This verification link is missing its token.' }); return; }
    fetch(`${apiUrl('/api/auth/verify-email')}?token=${encodeURIComponent(token)}`)
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to verify your email.'); setState({ loading: false, error: '' }); })
      .catch((error) => setState({ loading: false, error: error.message }));
  }, [params]);
  return <SiteChrome><Helmet><title>Email confirmation | Yaro Himko</title></Helmet><section className="mx-auto max-w-[38rem] px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Account confirmed</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">{state.loading ? 'Confirming your email…' : state.error ? 'Confirmation failed.' : 'Email confirmed.'}</h1><p className="mt-6 leading-relaxed text-muted-foreground">{state.loading ? 'Please wait while we confirm your email address.' : state.error || 'Your email address has been confirmed successfully. You can now log in to your account.'}</p>{!state.loading && <Link to={state.error ? '/register' : '/login'} className="mt-8 inline-flex min-h-12 items-center bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground">{state.error ? 'Try again' : 'Log in'}</Link>}</section></SiteChrome>;
}
