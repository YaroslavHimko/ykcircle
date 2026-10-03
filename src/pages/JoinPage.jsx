import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Compass, Languages, Trophy, Code2 } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';

const TENNIS = '/images/tennis-game.png';
const LANGUAGE = '/images/english.png';
const TAIPEI = '/images/taipei.png';
const WEB = '/images/web.png';
const tracks = [
    {
        Icon: Compass,
        eyebrow: 'Relocation',
        title: 'One-to-one relocation advice',
        img: TAIPEI,
        alt: 'City full of life: Taipei',
        body: 'A structured session for people choosing a country: shortlisting cities against your budget and work, paperwork and residency basics, neighbourhoods, schools, healthcare, and the real monthly cost once the holiday feeling wears off.',
        points: ['City shortlist built around your situation', 'Paperwork and timeline checklist', 'Neighbourhood and cost-of-living breakdown', 'Follow-up session once you land'],
    },
    {
        Icon: Languages,
        eyebrow: 'Language',
        title: 'Travel-first language courses',
        img: LANGUAGE,
        alt: 'Small international group practising a language in a Valencia cafe',
        body: 'Small-group and self-paced courses built for movement, not exams. You learn the sentences that get you a flat, a doctor, a haircut and a conversation with your neighbour — in that order.',
        points: ['Small live groups, weekly rhythm', 'Situation-based lessons, not grammar drills', 'Recordings and practice packs', 'Speaking partners from the community'],
    },
    {
        Icon: Trophy,
        eyebrow: 'Community',
        title: 'Activities & city memberships',
        img: TENNIS,
        alt: 'Two travellers playing tennis on a clay court at sunset',
        body: 'The part that makes a new city feel like home: tennis matches, hikes, weekend trips and dinners with other travellers and newcomers. Organised per city, with membership tiers planned once the first groups are running.',
        points: ['Tennis and racket meetups', 'Hikes and weekend micro-trips', 'Newcomer dinners and city walks', 'Per-city membership planned'],
    },
    {
        Icon: Code2,
        eyebrow: 'Web development',
        title: 'Custom website development',
        img: WEB,
        alt: 'City view placeholder for custom website development',
        body: 'Thoughtful, fast websites for people and small businesses who need a clear online home. From structure and visual direction to a polished responsive build, each site is shaped around your work and audience.',
        points: ['Custom design and responsive build', 'Clear pages, copy and calls to action', 'Contact forms and deployment support', 'Performance-minded, mobile-first finish'],
    },
];

const JoinPage = () => (
    <SiteChrome>
        <Helmet>
            <title>Relocation Advice, Language Courses & Traveller Community — Yaro Himko</title>
            <meta
                name="description"
                content="Coming soon from Yaro Himko: one-to-one relocation advice, travel-first language courses, and city communities with tennis, hikes and meetups for travellers and newcomers."
            />
        </Helmet>

        <section className="mx-auto max-w-[72rem] px-5 pb-14 pt-32 sm:px-8 sm:pt-40">
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">In preparation</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.02em] sm:text-6xl">
                Move, speak, belong
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Three services are being built on top of the channel. None of them are on sale yet — no payments,
                no sign-up pressure. When they open, they open on this page first.
            </p>
        </section>

        <section className="mx-auto max-w-[72rem] px-5 pb-24 sm:px-8">
            <div className="space-y-20">
                {tracks.map(({ Icon, eyebrow, title, img, alt, body, points }, i) => (
                    <article
                        key={title}
                        className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${i % 2 ? 'md:[&>figure]:order-2' : ''}`}
                    >
                        <figure className="overflow-hidden bg-secondary">
                            <img src={img} alt={alt} className="aspect-[4/3] w-full object-cover" />
                        </figure>
                        <div>
                            <div className="flex items-center gap-3">
                                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                <span className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</span>
                            </div>
                            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                                {title}
                            </h2>
                            <p className="mt-4 leading-relaxed text-muted-foreground">{body}</p>
                            <ul className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                                {points.map((p) => (
                                    <li key={p} className="flex gap-3">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary" />
                                        <span className="text-muted-foreground">{p}</span>
                                    </li>
                                ))}
                            </ul>
                            <span className="mt-6 inline-block border border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                                {title === 'Activities & city memberships' ? 'Available now' : 'Opening soon'}
                            </span>
                            {title === 'Activities & city memberships' && (
                                <Link to="/events" className="mt-6 ml-3 inline-flex min-h-10 items-center bg-primary px-5 text-sm font-medium uppercase tracking-widest text-primary-foreground">
                                    View events
                                </Link>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>

        <section className="mx-auto max-w-[72rem] px-5 pb-24 sm:px-8"><div className="border border-primary/30 bg-secondary/40 px-8 py-12 text-center sm:px-12"><p className="text-[0.7rem] uppercase tracking-[0.3em] text-primary">Stay in the loop</p><h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Join the community before it opens</h2><p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">Create your account to follow new services, share what you are looking for, and be among the first to hear when bookings begin.</p><Link to="/register" className="mt-8 inline-flex min-h-[48px] items-center bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-transform active:scale-[0.98]">Register now</Link></div></section>

        {/* Channel promotion is hidden until dedicated YKCircle channels are ready. */}
    </SiteChrome>
);

export default JoinPage;
