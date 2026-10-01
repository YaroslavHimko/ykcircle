import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Send, Youtube, UserRound, LogOut } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import CookieSettings, { openCookieSettings } from '@/components/CookieSettings';

const baseNav = [
    { to: '/articles', label: 'Articles' },
    { to: '/events', label: 'Events' },
    { to: '/venues', label: 'Venues' },
    { to: '/groups', label: 'Groups' },
];

export function Header() {
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileMenuRef = React.useRef(null);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('authUser') || 'null'));
    const { pathname } = useLocation();
    const overlay = pathname === '/';
    const canManage = Boolean(user && ['admin', 'manager'].includes(user.role));
    const isAdmin = user?.role === 'admin';

    React.useEffect(() => {
        const refreshUser = () => setUser(JSON.parse(localStorage.getItem('authUser') || 'null'));
        window.addEventListener('auth-change', refreshUser);
        return () => window.removeEventListener('auth-change', refreshUser);
    }, []);

    React.useEffect(() => {
        if (!profileOpen) return undefined;

        const closeProfileMenuOnOutsideClick = (event) => {
            if (!profileMenuRef.current?.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeProfileMenuOnOutsideClick);
        return () => document.removeEventListener('pointerdown', closeProfileMenuOnOutsideClick);
    }, [profileOpen]);

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setProfileOpen(false);
        window.dispatchEvent(new Event('auth-change'));
        window.location.assign('/');
    };

    return (
        <header className={`${overlay ? 'absolute' : 'relative'} inset-x-0 top-0 z-50 w-full max-w-full`}>
            <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-2 px-4 py-5 sm:px-8">
                <Link
                    to="/"
                    className={`group mr-auto flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1 shadow-sm md:border-0 md:bg-transparent md:p-0 md:shadow-none ${overlay ? 'border-[hsl(40_30%_88%)]/70 bg-[hsl(25_22%_12%)]' : 'border-primary/30 bg-background'}`}
                >
                    <img src="/logo.png" alt="YKCircle" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    <span className={`font-display text-xl font-black sm:text-2xl tracking-tight ${overlay ? 'text-[hsl(40_30%_94%)]' : 'text-primary'}`}>
                        YKCircle
                    </span>
                    <span className={`hidden text-[0.65rem] uppercase tracking-[0.3em] xl:block ${overlay ? 'text-[hsl(40_30%_94%)]' : 'text-muted-foreground'}`}>
                        real people, real plans
                    </span>
                </Link>

                <nav className="ml-6 hidden items-center gap-6 lg:flex">
                    {baseNav.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            className={({ isActive }) =>
                                `text-sm tracking-wide text-[hsl(25_22%_12%)] transition-opacity hover:opacity-70 ${isActive ? 'underline decoration-primary decoration-2 underline-offset-8' : ''}`
                            }
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>

                <div ref={profileMenuRef} className="relative ml-2 shrink-0">
                    <button type="button" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => { setOpen(false); setProfileOpen((value) => !value); }} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                        <UserRound className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                    {profileOpen && <div className="absolute right-0 top-14 z-50 max-h-[calc(100dvh-7rem)] w-60 overflow-y-auto border border-border bg-background p-2 shadow-xl">
                        {user ? <>
                            <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">{user.name}</p>
                            <p className="px-3 pt-4 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Your account</p>
                            <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">View profile</Link>
                            <Link to="/profile/saved-venues" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Saved venues</Link>
                            <Link to="/account/tickets" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">My tickets</Link>
                            <Link to="/account/billing" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Billing & organizations</Link>
                            <Link to="/profile/subscriptions" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Subscriptions</Link>
                            {canManage && <Link to="/admin/configuration" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Configuration</Link>}
                            <p className="mt-2 border-t border-border px-3 pt-4 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Manage</p>
                            <Link to="/profile/events" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Events</Link>
                            <Link to="/profile/groups" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Groups</Link>
                            <Link to="/profile/venues" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Venues</Link>
                            {canManage && <>
                                <p className="mt-2 border-t border-border px-3 pt-4 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
                                <Link to="/admin/applications" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Applications</Link>
                                <Link to="/admin/users" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">User roles</Link>
                                <Link to="/profile/articles" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Articles</Link>
                                {isAdmin && <Link to="/admin/reports" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Content reports</Link>}
                            </>}
                            <button type="button" onClick={logout} className="mt-2 flex w-full items-center gap-2 border-t border-border px-3 py-3 text-left text-sm text-destructive hover:bg-secondary"><LogOut className="h-4 w-4" /> Log out</button>
                        </> : <Link to="/login" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Log in</Link>}
                    </div>}
                </div>

                <div className="flex shrink-0 items-center lg:hidden">
                    <button
                        type="button"
                        aria-label="Toggle menu"
                        aria-expanded={open}
                        onClick={() => { setProfileOpen(false); setOpen((v) => !v); }}
                        className={`inline-flex h-11 w-11 items-center justify-center ${overlay ? 'text-[hsl(40_30%_94%)]' : 'text-foreground'}`}
                    >
                        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="border-y border-border bg-background lg:hidden">
                    <div className="flex flex-col px-5 py-3">
                        {baseNav.map((n) => (
                            <Link
                                key={n.to}
                                to={n.to}
                                onClick={() => setOpen(false)}
                                className="min-h-[44px] border-b border-border/60 py-3 text-base"
                            >
                                {n.label}
                            </Link>
                        ))}
                        {user ? <>
                            <p className="pt-4 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Your account</p>
                            <Link to="/profile" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">View profile</Link>
                            <Link to="/profile/saved-venues" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Saved venues</Link>
                            <Link to="/account/tickets" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">My tickets</Link>
                            <Link to="/account/billing" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Billing & organizations</Link>
                            <Link to="/profile/subscriptions" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Subscriptions</Link>
                            {canManage && <Link to="/admin/configuration" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Configuration</Link>}
                            <p className="pt-5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Manage</p>
                            <Link to="/profile/events" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Events</Link>
                            <Link to="/profile/groups" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Groups</Link>
                            <Link to="/profile/venues" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Venues</Link>
                            {canManage && <>
                                <p className="pt-5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
                                <Link to="/admin/applications" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Applications</Link>
                                <Link to="/admin/users" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">User roles</Link>
                                <Link to="/profile/articles" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Articles</Link>
                                {isAdmin && <Link to="/admin/reports" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Content reports</Link>}
                            </>}
                            <button type="button" onClick={() => { setOpen(false); logout(); }} className="mt-3 flex min-h-[44px] items-center gap-2 border-b border-border/60 py-3 text-left text-base text-destructive"><LogOut className="h-4 w-4" /> Log out</button>
                        </> : <Link to="/login" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Log in</Link>}
                    </div>
                </div>
            )}
        </header>
    );
}

export function Footer() {
    const [legalDocuments, setLegalDocuments] = useState([]);
    const defaultLegalDocuments = [
        { slug: 'terms', title: 'Terms' },
        { slug: 'privacy', title: 'Privacy' },
        { slug: 'cookies', title: 'Cookies' },
        { slug: 'paid-services', title: 'Paid Services' },
    ];
    const additionalLegalDocuments = legalDocuments.filter((document) =>
        document?.slug &&
        !defaultLegalDocuments.some((defaultDocument) => defaultDocument.slug === document.slug),
    );

    useEffect(() => {
        apiFetch('/api/legal-documents')
            .then(async (response) => response.ok ? response.json() : [])
            .then((data) => setLegalDocuments(Array.isArray(data) ? data : data.documents || []))
            .catch(() => setLegalDocuments([]));
    }, []);

    return (
        <footer className="shrink-0 border-t border-border bg-[hsl(var(--ink))] text-[hsl(40_28%_88%)]">
            <div className="mx-auto grid max-w-[72rem] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_0.8fr_1.2fr]">
                <div>
                    <div className="flex items-center gap-3"><img src="/logo.png" alt="" className="h-10 w-10 rounded-full object-cover" /><p className="font-display text-2xl font-semibold">YKCircle</p></div>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-[hsl(40_20%_78%)]">
                        Find people for the things you want to do, make a plan together, and discover the places that make it happen.
                    </p>
                    <div className="mt-5 flex gap-3">
                        {[
                            { href: 'https://www.instagram.com/yaroHimko', Icon: Instagram, label: 'Instagram' },
                            { href: 'https://t.me/yaroslavHimko', Icon: Send, label: 'Telegram' },
                            { href: 'https://www.youtube.com/@yaroHimko', Icon: Youtube, label: 'YouTube' },
                        ].map(({ href, Icon, label }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={label}
                                className="inline-flex h-11 w-11 items-center justify-center border border-white/15 transition-colors hover:border-primary hover:text-primary"
                            >
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="text-sm">
                    <p className="mb-4 text-[0.7rem] uppercase tracking-[0.25em] text-[hsl(40_20%_60%)]">Explore</p>
                    <ul className="space-y-2">
                        <li><Link className="hover:text-primary" to="/groups">Groups</Link></li>
                        <li><Link className="hover:text-primary" to="/events">Events</Link></li>
                        <li><Link className="hover:text-primary" to="/venues">Venues</Link></li>
                        <li><Link className="hover:text-primary" to="/articles">Articles</Link></li>
                    </ul>
                </div>

                <div className="text-sm">
                    <p className="mb-4 text-[0.7rem] uppercase tracking-[0.25em] text-[hsl(40_20%_60%)]">Help</p>
                    <ul className="space-y-2 text-[hsl(40_20%_78%)]">
                        <li><Link className="hover:text-primary" to="/contact">Contact</Link></li>
                        <li><Link className="hover:text-primary" to="/report">Report content</Link></li>
                        <li><Link className="hover:text-primary" to="/appeal">Appeal a decision</Link></li>
                    </ul>
                    <div className="mt-7 border-t border-white/10 pt-5">
                        <p className="mb-3 text-[0.7rem] uppercase tracking-[0.25em] text-[hsl(40_20%_60%)]">Legal</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[hsl(40_20%_78%)]">
                            {defaultLegalDocuments.map((document) => <Link key={document.slug} className="hover:text-primary" to={`/${document.slug}`}>{document.title}</Link>)}
                            {additionalLegalDocuments.map((document) => <Link key={document.slug} className="hover:text-primary" to={`/${document.slug}`}>{document.title}</Link>)}
                            <Link className="hover:text-primary" to="/legal">All documents</Link>
                            <Link className="hover:text-primary" to="/company">Company information</Link>
                            <Link className="hover:text-primary" to="/subprocessors">Subprocessors</Link>
                            <button type="button" onClick={openCookieSettings} className="hover:text-primary">Cookie settings</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-[hsl(40_15%_62%)] sm:px-8">
                &copy; {new Date().getFullYear()} YKCircle. All rights reserved.
            </div>
        </footer>
    );
}

export default function SiteChrome({ children }) {
    return (
        <div className="grain flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
            <Header />
            <main className="min-w-0 flex-1">{children}</main>
            <Footer />
            <CookieSettings />
        </div>
    );
}
