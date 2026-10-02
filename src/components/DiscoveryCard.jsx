import React from 'react';
import { Link } from 'react-router-dom';

export default function DiscoveryCard({ href, image, imageAlt = '', icon: Icon, badge, eyebrow, title, children, footer }) {
  return <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-background transition-shadow hover:shadow-md">
    <Link to={href} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary/60">
        {image ? <img src={image} alt={imageAlt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary text-muted-foreground/40"><Icon aria-hidden="true" className="h-12 w-12" strokeWidth={1} /></div>}
        {badge && <span className="absolute right-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm">{badge}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {eyebrow && <p className="mb-2 text-xs font-medium text-primary">{eyebrow}</p>}
        <h2 className="line-clamp-2 break-words text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">{title}</h2>
        {children}
      </div>
    </Link>
    {footer && <div className="border-t border-border/60 px-5 py-4">{footer}</div>}
  </article>;
}
