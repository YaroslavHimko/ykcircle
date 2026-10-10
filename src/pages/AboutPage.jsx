import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';

const PORTRAIT = '/images/portrait.png';
const HERO = `/images/hero.png?v=${import.meta.env.VITE_HERO_IMAGE_VERSION}`;

const AboutPage = () => (
    <SiteChrome>
        <Helmet>
            <title>About Yaro Himko — Travel Filmmaker & Relocation</title>
            <meta
                name="description"
                content="Who is Yaro Himko? A travel filmmaker documenting European city tours, history and practical travel advice on YouTube, now building relocation consulting, language courses and traveller communities."
            />
        </Helmet>

        <section className="mx-auto max-w-[56rem] px-5 pb-16 pt-32 sm:px-8 sm:pt-40">
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-primary">About</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-[-0.02em] sm:text-6xl">
                Yaro Himko
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                Travel filmmaker, slow walker, compulsive researcher. I document European cities and the history
                underneath them, and I tell travellers the truth about what is worth their time.
            </p>
        </section>

        <section className="mx-auto max-w-[72rem] px-5 sm:px-8">
            <img
                src={PORTRAIT}
                alt="Yaro Himko filming on a narrow cobbled street in Lisbon"
                className="aspect-[16/9] w-full object-cover object-top"
            />
        </section>

        <section className="mx-auto max-w-[56rem] space-y-6 px-5 py-16 text-[1.05rem] leading-relaxed text-muted-foreground sm:px-8 sm:py-24">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                How the channel works
            </h2>
            <p>
                Every video starts on foot. Before I film a city I read its history — the sieges, the trade routes,
                the fires, the architects, the neighbourhoods that changed hands three times in a century. Then I
                walk the route myself, usually twice: once early in the morning when the streets belong to the
                people who live there, and once in the late golden hour when the stone turns warm.
            </p>
            <p>
                What you get in an episode: the places that genuinely matter, in a sensible order; the story behind
                each of them; and the practical layer most travel content skips — opening hours that actually hold,
                how long the walk really takes, what the entry costs, where to eat without paying a tourist markup,
                and which famous stop is better traded for something two streets away.
            </p>
            <h2 className="pt-6 font-display text-3xl font-semibold tracking-tight text-foreground">
                Why history, and why tips
            </h2>
            <p>
                A viewpoint is just a view until you know what happened below it. History is what turns a
                sightseeing list into a place you remember years later. And advice is what makes the trip possible:
                budgets, seasons, transport, safety, etiquette, the small habits that separate a guest from a
                tourist.
            </p>
            <h2 className="pt-6 font-display text-3xl font-semibold tracking-tight text-foreground">
                Where this is going
            </h2>
            <p>
                Viewers keep asking the same questions: could I live here, how do I learn the language, who would I
                meet if I moved? So the next stage of the project is relocation advice, travel-first language
                courses, and small city communities built around real activities — tennis, hiking, dinners, weekend
                trips. Those will arrive as proper services on this site, step by step.
            </p>
            <div className="pt-4">
                <Link
                    to="/join"
                    className="ui-action inline-flex min-h-[48px] items-center gap-3 bg-primary px-7 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-transform active:scale-[0.98]"
                >
                    What is coming next <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>

        <section className="border-t border-border">
            <img src={HERO} alt="Yaro Himko filming" className="aspect-[21/9] w-full object-cover" />
        </section>
    </SiteChrome>
);

export default AboutPage;
