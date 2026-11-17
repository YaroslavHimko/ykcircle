import { Helmet } from 'react-helmet';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import {
  isoDate,
  atMidnight,
  addDays,
  startOfWeek,
  readableDate,
} from '../model/venue-calendar.js';
export function Shell({ title, children }) {
  return (
    <SiteChrome>
      <Helmet>
        <title>{title} | YKCircle</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="mx-auto max-w-[92rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        {children}
      </section>
    </SiteChrome>
  );
}
export function Toolbar({ view, setView, cursor, setCursor, timezone, owner = false }) {
  const move = (amount) =>
    setCursor((current) =>
      view === 'month'
        ? new Date(current.getFullYear(), current.getMonth() + amount, 1)
        : addDays(current, amount * (view === 'week' ? 7 : 1)),
    );
  const heading =
    view === 'month'
      ? new Intl.DateTimeFormat(undefined, {
          month: 'long',
          year: 'numeric',
        }).format(cursor)
      : view === 'week'
        ? `${readableDate(isoDate(startOfWeek(cursor)), {
            month: 'short',
            day: 'numeric',
          })} – ${readableDate(isoDate(addDays(startOfWeek(cursor), 6)), {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`
        : readableDate(isoDate(cursor), {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="ui-action min-h-10 border border-border px-3 text-sm"
          onClick={() => setCursor(atMidnight(new Date()))}
        >
          Today
        </button>
        <button
          type="button"
          aria-label="Previous period"
          className="ui-action min-h-10 border border-border px-3"
          onClick={() => move(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next period"
          className="ui-action min-h-10 border border-border px-3"
          onClick={() => move(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <h2 className="ml-2 font-display text-2xl font-semibold">{heading}</h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Venue time: {timezone || 'Venue local time'}
        </span>
        <div className="flex border border-border" role="group" aria-label="Calendar view">
          {['month', 'week', 'day'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`min-h-10 px-3 text-sm capitalize ${view === item ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {item}
            </button>
          ))}
        </div>
        {owner && <span className="sr-only">Owner calendar</span>}
      </div>
    </div>
  );
}
