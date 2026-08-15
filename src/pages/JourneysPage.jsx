import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Clock, MapPin } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';

const items = [
    { city: 'Taipei, Taiwan', title: 'The castle district before the crowds', type: 'City tour', minutes: 18, src: '/images/taipei.png', alt: 'City full of life: Taipei', blurb: 'Life in a city where the energy is palpable and the streets come alive with culture.' },
    { city: 'Minsk, Belarus', title: 'Minsk: A city of contrasts', type: 'City tour', minutes: 22, src: '/images/minsk.png', alt: 'Cityscape of Minsk, Belarus', blurb: 'A journey through the streets of Minsk, exploring its unique blend of Soviet and modern architecture.' },
    { city: 'Stockholm, Sweden', title: 'A rainy night walk through the old town', type: 'History', minutes: 15, src: '/images/stockholm.png', alt: 'Rainy neon-lit cobbled street at night in Stockholm', blurb: 'Exploring the history and charm of Stockholm\'s old town on a rainy evening.' },
];

const filters = ['All', 'City tour', 'History', 'Tips'];

const JourneysPage = () => {
    const [active, setActive] = useState('All');
    const shown = active === 'All' ? items : items.filter((i) => i.type === active);

    return (
        <SiteChrome>
            <Helmet>
                <title>Journeys & Guides — Yaro Himko Travel Channel</title>
                <meta
                    name="description"
                    content="City tours, history deep-dives and practical travel tips from the Yaro Himko channel: Prague, Porto, Kraków, the Amalfi Coast, the High Tatras and Valencia."
                />
            </Helmet>

            <section className="mx-auto max-w-[90rem] px-5 pb-10 pt-32 sm:px-8 sm:pt-40">
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">Journeys</p>
                <h1 className="mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.02em] sm:text-6xl">
                    Routes, stories and the fine print
                </h1>
                <div className="mt-10 flex flex-wrap gap-2">
                    {filters.map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setActive(f)}
                            className={`min-h-[44px] border px-5 text-xs uppercase tracking-[0.2em] transition-colors ${
                                active === f
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-[90rem] px-5 pb-24 sm:px-8">
                {shown.length === 0 ? (
                    <p className="border border-dashed border-border py-20 text-center text-muted-foreground">
                        Nothing filed under this category yet — new episodes land every few weeks.
                    </p>
                ) : (
                    <div className="divide-y divide-border border-t border-border">
                        {shown.map((it) => (
                            <article key={it.title} className="group grid gap-6 py-8 md:grid-cols-[22rem_1fr] md:gap-10">
                                <div className="overflow-hidden bg-secondary">
                                    <img
                                        src={it.src}
                                        alt={it.alt}
                                        className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{it.city}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" strokeWidth={1.75} />{it.minutes} min</span>
                                        <span className="text-primary">{it.type}</span>
                                    </div>
                                    <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
                                        {it.title}
                                    </h2>
                                    <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{it.blurb}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                <p className="mt-8 text-sm text-muted-foreground">
                    Each entry is ready to link to its episode and to hold full cinematic stills once uploaded.
                </p>
            </section>
        </SiteChrome>
    );
};

export default JourneysPage;
