import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { UserRound, LogOut } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useProductConfiguration } from '@/lib/product-configuration';
import CookieSettings, { openCookieSettings } from '@/components/CookieSettings';

const baseNav = [
    { to: '/articles', label: 'Articles' },
    { to: '/events', label: 'Events' },
    { to: '/venues', label: 'Venues' },
    { to: '/groups', label: 'Groups' },
];
const menuLinkClass = 'flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function Header() {
    const product = useProductConfiguration();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const profileButtonRef = useRef(null);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('authUser') || 'null'));
    const location = useLocation();
    const canManage = Boolean(user && ['admin', 'manager'].includes(user.role));
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const refreshUser = () => setUser(JSON.parse(localStorage.getItem('authUser') || 'null'));
        window.addEventListener('auth-change', refreshUser);
        return () => window.removeEventListener('auth-change', refreshUser);
    }, []);

    useEffect(() => { setProfileOpen(false); }, [location.key]);

    useEffect(() => {
        if (!profileOpen) return undefined;
        const closeOutside = (event) => {
            if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key !== 'Escape') return;
            setProfileOpen(false);
            profileButtonRef.current?.focus();
        };
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('focusin', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('focusin', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [profileOpen]);

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setProfileOpen(false);
        window.dispatchEvent(new Event('auth-change'));
        window.location.assign('/');
    };
    const accountLink = (to, label) => <Link to={to} onClick={() => setProfileOpen(false)} className={menuLinkClass}>{label}</Link>;

    return (
        <header className="relative z-50 w-full border-b border-border/60 bg-background/90">
            <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-5 py-4 sm:px-8 lg:gap-10">
                <Link to="/" aria-label="YKCircle home" className="flex shrink-0 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
                    <img src="/logo.png" alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className="font-display text-lg font-semibold tracking-tight text-foreground">YKCircle</span>
                </Link>
                <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
                    {baseNav.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `inline-flex min-h-11 items-center text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? 'text-primary underline decoration-2 underline-offset-8' : 'text-foreground/80'}`}>{item.label}</NavLink>)}
                </nav>
                <div ref={profileMenuRef} className="relative ml-auto shrink-0">
                    <button ref={profileButtonRef} type="button" aria-label={profileOpen ? 'Close navigation and profile menu' : 'Open navigation and profile menu'} aria-expanded={profileOpen} aria-controls="profile-navigation" onClick={() => setProfileOpen(value => !value)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/60 bg-background/70 text-primary backdrop-blur-md transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
                        <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                    {profileOpen && <div id="profile-navigation" className="absolute right-0 top-[calc(100%+0.75rem)] z-50 max-h-[calc(100dvh-7rem)] w-72 max-w-[calc(100vw-2.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background p-2 shadow-xl">
                        {user ? <>
                            <p className="break-words px-3 py-2 text-sm font-medium">{user.name}</p>
                            <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Your account</p>
                            {accountLink('/profile', 'View profile')}
                            {product.paidEventsEnabled && accountLink('/account/tickets', 'My tickets')}
                        </> : <>
                            <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Your account</p>
                            {accountLink('/login', 'Log in')}
                            {accountLink('/register', 'Create account')}
                        </>}
                        <nav aria-label="Explore" className="mt-2 border-t border-border pt-3">
                            <p className="px-3 pb-1 text-xs text-muted-foreground">Explore</p>
                            {baseNav.map(item => <NavLink key={item.to} to={item.to} onClick={() => setProfileOpen(false)} className={({ isActive }) => `${menuLinkClass} ${isActive ? 'bg-primary/5 font-medium text-primary' : ''}`}>{item.label}</NavLink>)}
                        </nav>
                        {canManage && <>
                            <p className="mt-2 border-t border-border px-3 pb-1 pt-3 text-xs text-muted-foreground">Administration</p>
                            {accountLink('/admin/configuration', 'Configuration')}
                            {accountLink('/admin/contact-messages', 'Contact messages')}
                            {accountLink('/admin/users', 'User roles')}
                            {isAdmin && accountLink('/admin/reports', 'Content reports')}
                        </>}
                        {user && <button type="button" onClick={logout} className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg border-t border-border px-3 py-3 text-left text-sm text-destructive hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LogOut aria-hidden="true" className="h-4 w-4" /> Log out</button>}
                    </div>}
                </div>
            </div>
        </header>
    );
}

export function Footer() {
    const [legalDocuments, setLegalDocuments] = useState([]);
    const defaultLegalDocuments = [
        { slug: 'terms', title: 'Terms' },
        { slug: 'privacy', title: 'Privacy' },
        { slug: 'cookies', title: 'Cookies' },
        { slug: 'community-guidelines', title: 'Community Guidelines' },
    ];
    const additionalLegalDocuments = legalDocuments.filter((document) =>
        ["terms","privacy","community-guidelines","cookies"].includes(document?.slug) &&
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
                    {/* Social links are hidden until dedicated YKCircle channels are ready. */}
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
                            <Link className="hover:text-primary" to="/operator">Operator information</Link>
                            <Link className="hover:text-primary" to="/subprocessors">Service providers</Link>
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
