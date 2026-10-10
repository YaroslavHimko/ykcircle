import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';

export default function AccountDeletedPage() {
  return <SiteChrome><Helmet><title>Account deleted | Yaro Himko</title></Helmet><section className="mx-auto max-w-[38rem] px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Account closed</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95]">Your account was deleted.</h1><p className="mt-6 leading-relaxed text-muted-foreground">Your profile and account access have been permanently removed.</p><Link to="/" className="ui-action mt-8 inline-flex min-h-12 items-center bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground">Back to homepage</Link></section></SiteChrome>;
}
