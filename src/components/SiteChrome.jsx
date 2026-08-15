import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Send, Youtube, UserRound, LogOut, Users } from 'lucide-react';

const baseNav = [
    { to: '/stockholm/community', label: 'Community' },
    { to: '/articles', label: 'Articles' },
    { to: '/events', label: 'Events' },
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
    // The API verifies the email address and enforces event ownership. Any
    // signed-in member can therefore access their own event workspace.
    const canManageEvents = Boolean(user);
    const nav = [...baseNav, ...(user ? [] : [{ to: '/login', label: 'Log in' }])];

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
    };

    return (
        <header className={`${overlay ? 'absolute' : 'relative'} inset-x-0 top-0 z-50 w-full max-w-full`}>
            <div className="mx-auto flex max-w-[90rem] items-center justify-between px-5 py-5 sm:px-8">
                <Link to="/" className="group flex items-center gap-2">
                    <img src="/logo.png" alt="YKCircle" className="h-11 w-11 rounded-full object-cover" />
                    <span className="font-display text-2xl font-black tracking-tight text-primary">
                        YKCircle
                    </span>
                    <span className={`hidden text-[0.65rem] uppercase tracking-[0.3em] sm:block ${overlay ? 'text-[hsl(40_30%_88%)]/70' : 'text-muted-foreground'}`}>
                        real people, real plans
                    </span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {nav.map((n) => (
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
                    <Link to="/groups" className="inline-flex min-h-[44px] items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]">
                        <Users className="h-4 w-4" strokeWidth={1.75} /> Find your circle
                    </Link>
                </nav>

                <div ref={profileMenuRef} className="relative ml-4 hidden md:block">
                    <button type="button" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)} className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${overlay ? 'border-white/40 text-[hsl(40_30%_94%)]' : 'border-border text-foreground'} transition-colors hover:border-primary hover:text-primary`}>
                        <UserRound className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                    {profileOpen && <div className="absolute right-0 top-14 z-50 w-52 border border-border bg-background p-2 shadow-xl">
                        {user ? <><p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">{user.name}</p><Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">View profile</Link></> : <Link to="/login" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Log in</Link>}
                        {canManage && <>
                            <Link to="/admin/applications" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Manage applications</Link>
                            <Link to="/admin/users" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Manage user roles</Link>
                            <Link to="/profile/articles" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Manage articles</Link>
                            {isAdmin && <Link to="/admin/community/reports" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Community reports</Link>}
                        </>}
                        {canManageEvents && <Link to="/profile/events" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Manage events</Link>}
                        {user && <Link to="/profile/community" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">My community posts</Link>}
                        {user && <Link to="/profile/groups" onClick={() => setProfileOpen(false)} className="block px-3 py-3 text-sm hover:bg-secondary">Manage groups</Link>}
                        {user && <button type="button" onClick={logout} className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm text-destructive hover:bg-secondary"><LogOut className="h-4 w-4" /> Log out</button>}
                    </div>}
                </div>

                <button
                    type="button"
                    aria-label="Toggle menu"
                    onClick={() => setOpen((v) => !v)}
                    className={`inline-flex h-11 w-11 items-center justify-center md:hidden ${overlay ? 'text-[hsl(40_30%_94%)]' : 'text-foreground'}`}
                >
                    {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {open && (
                <div className="border-y border-border bg-background md:hidden">
                    <div className="flex flex-col px-5 py-3">
                        {nav.map((n) => (
                            <Link
                                key={n.to}
                                to={n.to}
                                onClick={() => setOpen(false)}
                                className="min-h-[44px] border-b border-border/60 py-3 text-base"
                            >
                                {n.label}
                            </Link>
                        ))}
                        <Link to="/groups" onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 bg-primary px-5 text-primary-foreground">
                            <Users className="h-4 w-4" /> Find your circle
                        </Link>
                        {user ? <>
                            <Link to="/profile" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">View profile</Link>
                            {canManage && <>
                                <Link to="/admin/applications" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Manage applications</Link>
                                <Link to="/admin/users" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Manage user roles</Link>
                                <Link to="/profile/articles" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Manage articles</Link>
                                {isAdmin && <Link to="/admin/community/reports" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Community reports</Link>}
                            </>}
                            {canManageEvents && <Link to="/profile/events" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Manage events</Link>}
                            <Link to="/profile/community" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">My community posts</Link>
                            <Link to="/profile/groups" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Manage groups</Link>
                            <button type="button" onClick={() => { setOpen(false); logout(); }} className="flex min-h-[44px] items-center gap-2 border-b border-border/60 py-3 text-left text-base text-destructive"><LogOut className="h-4 w-4" /> Log out</button>
                        </> : <Link to="/login" onClick={() => setOpen(false)} className="min-h-[44px] border-b border-border/60 py-3 text-base">Log in</Link>}
                    </div>
                </div>
            )}
        </header>
    );
}

export function Footer() {
    return (
        <footer className="shrink-0 border-t border-border bg-[hsl(var(--ink))] text-[hsl(40_28%_88%)]">
            <div className="mx-auto grid max-w-[72rem] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
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
                        <li><Link className="hover:text-primary" to="/stockholm/community">Communities</Link></li>
                        <li><Link className="hover:text-primary" to="/groups">Groups</Link></li>
                        <li><Link className="hover:text-primary" to="/events">Events</Link></li>
                    </ul>
                </div>

                <div className="text-sm">
                    <p className="mb-4 text-[0.7rem] uppercase tracking-[0.25em] text-[hsl(40_20%_60%)]">More</p>
                    <ul className="space-y-2 text-[hsl(40_20%_78%)]">
                        <li><Link className="hover:text-primary" to="/articles">Articles</Link></li>
                        <li><Link className="hover:text-primary" to="/contact">Contact</Link></li>
                    </ul>
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
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
