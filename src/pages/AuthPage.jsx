import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Eye, EyeOff } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import { apiUrl } from '@/lib/api';

const initialForm = { name: '', email: '', password: '', phone: '' };

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const registrationRedirect = !isRegister && (location.state?.from?.startsWith('/events/') || new URLSearchParams(location.search).get('from')?.startsWith('/events/'));
  const hostIntent = isRegister && new URLSearchParams(location.search).get('intent') === 'host';
  const [form, setForm] = useState(initialForm);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '' });
  const returnTo = location.state?.from || new URLSearchParams(location.search).get('from') || '/';

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });
    try {
      const response = await fetch(apiUrl(`/api/auth/${isRegister ? 'register' : 'login'}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? form : { email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          navigate('/check-email', { state: { email: form.email, verificationRequired: true } });
          return;
        }
        throw new Error(data.error || 'Authentication failed.');
      }
      if (isRegister) {
        navigate('/check-email', { state: { email: form.email, from: returnTo } });
      } else {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        navigate(location.state?.from || new URLSearchParams(location.search).get('from') || '/');
      }
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  return <SiteChrome>
    <Helmet><title>{hostIntent ? 'Register to host an experience' : isRegister ? 'Create an account' : 'Log in'} | YKCircle</title></Helmet>
    <section className="mx-auto max-w-[34rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Member access</p>
      <h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">{hostIntent ? 'Become part of the people who make YKCircle happen.' : isRegister ? 'Join the community.' : registrationRedirect ? 'Log in to register for an event.' : 'Log in to your account.'}</h1>
      <p className="mt-6 text-muted-foreground">{hostIntent ? 'Create and verify your YKCircle member account first. Verified members can create and manage their own events.' : isRegister ? 'Create an account to keep track of your applications and plans.' : registrationRedirect ? 'Log in to register for this event. New here? You can create an account below.' : 'Log in to view your applications and member details.'}</p>
      {hostIntent && <div className="mt-6 border-l-2 border-primary bg-secondary/50 px-5 py-4 text-sm leading-relaxed"><p className="font-medium">How hosting works</p><p className="mt-2 text-muted-foreground">After registration, verify your email, then use the event workspace to create and manage your own experiences.</p></div>}
      <form onSubmit={submit} className="mt-10 space-y-5">
        {isRegister && <>
          <label className="block text-sm">Name<input required name="name" value={form.name} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>
          <label className="block text-sm">Phone number <span className="text-muted-foreground">(optional)</span><input name="phone" value={form.phone} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>
        </>}
        <label className="block text-sm">Email<input required type="email" name="email" value={form.email} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label>
        <label className="block text-sm">Password
          <span className="relative mt-2 block">
            <input required minLength={8} type={passwordVisible ? 'text' : 'password'} name="password" value={form.password} onChange={update} className="min-h-12 w-full border border-border bg-background px-4 pr-12" />
            <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible}>
              {passwordVisible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </span>
        </label>
        {status.error && <p role="alert" className="text-sm text-destructive">{status.error}</p>}
        <button disabled={status.loading} className="min-h-12 w-full bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-60">{status.loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
      </form>
      {!isRegister && <p className="mt-5 text-sm"><Link className="text-primary underline underline-offset-4" to="/forgot-password">Forgot your password?</Link></p>}
      <p className="mt-8 text-sm text-muted-foreground">{isRegister ? 'Already have an account? ' : 'Need an account? '}<Link className="text-primary underline underline-offset-4" to={isRegister ? `/login?from=${encodeURIComponent(returnTo)}` : `/register?from=${encodeURIComponent(returnTo)}`}>{isRegister ? 'Log in' : 'Register'}</Link></p>
    </section>
  </SiteChrome>;
}
