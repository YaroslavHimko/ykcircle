import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SiteChrome from '@/components/SiteChrome';
import { apiUrl } from '@/lib/api';

const initialForm = { name: '', email: '', contact: '', activity: '', additionalInformation: '' };

const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: false });
  const navigate = useNavigate();

  useEffect(() => {
    fetch(apiUrl('/api/application-activities')).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load activities.');
      setActivities(Array.isArray(data) ? data : []);
    }).catch((error) => setActivitiesError(error.message || 'Unable to load activities.')).finally(() => setActivitiesLoading(false));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setStatus({ loading: true, message: '', error: false });
    try {
      const response = await fetch(apiUrl('/api/contact'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      navigate('/application-sent');
    } catch (error) { setStatus({ loading: false, message: error.message || 'Something went wrong.', error: true }); }
  };

  return <SiteChrome><Helmet><title>Contact Yaro Himko</title></Helmet><section className="mx-auto max-w-[56rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Get in touch</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95] sm:text-6xl">Tell me what you are planning.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Leave your details and the activity you are interested in. I will get back to you soon.</p><form onSubmit={submit} className="mt-12 space-y-6"><label className="block text-sm">Name<input required name="name" value={form.name} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><label className="block text-sm">Email<input required type="email" name="email" value={form.email} onChange={update} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><label className="block text-sm">WhatsApp / LINE / Telegram number <span className="text-muted-foreground">(optional)</span><input name="contact" value={form.contact} onChange={update} placeholder="Include country code" className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><label className="block text-sm">Additional information <span className="text-muted-foreground">(optional)</span><textarea name="additionalInformation" value={form.additionalInformation} onChange={update} rows="5" className="mt-2 w-full border border-border bg-background px-4 py-3" /></label><label className="block text-sm">Desired activity<select required name="activity" value={form.activity} onChange={update} disabled={activitiesLoading || Boolean(activitiesError)} className="mt-2 min-h-12 w-full border border-border bg-background px-4"><option value="">{activitiesLoading ? 'Loading activities…' : 'Select an activity'}</option>{activities.map((activity) => <option key={activity.id} value={activity.name}>{activity.name}</option>)}</select></label>{activitiesError && <p className="text-sm text-destructive">{activitiesError}</p>}<button disabled={status.loading || activitiesLoading || Boolean(activitiesError) || activities.length === 0} className="min-h-12 bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-60">{status.loading ? 'Sending…' : 'Send enquiry'}</button>{status.message && <p className={status.error ? 'text-destructive' : 'text-primary'}>{status.message}</p>}</form></section></SiteChrome>;
};
export default ContactPage;
