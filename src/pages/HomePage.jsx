import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";
import { eventMediaUrl, mediaRenderDebug } from "@/lib/media";

const images = {
  hero: `/images/hero.png?v=${import.meta.env.VITE_HERO_IMAGE_VERSION}`,
  stockholm: "/images/stockholm.png",
  taipei: "/images/taipei.png",
  minsk: "/images/minsk.png",
  tennis: "/images/tennis-game.png",
  band: "/images/band.png",
  art: "/images/art.png",
};
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-SE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Date to be announced";

function EventCard({ event }) {
  const image = eventMediaUrl(event);
  if (image) mediaRenderDebug({ component: "HomeEventCard", eventId: event.id, rawUrl: image });
  return (
    <Link
      to={`/events/${event.id}`}
      className="group grid overflow-hidden border border-border bg-background sm:grid-cols-[10rem_1fr] md:grid-cols-[14rem_1fr_15rem]"
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="aspect-[16/9] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-[16/9] items-end bg-gradient-to-br from-primary/90 via-primary/65 to-slate-900 p-4 text-xl font-display text-white">
          {event.title}
        </div>
      )}
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">
          {event.status || "Published"} ·{" "}
          {event.fee > 0 ? `${event.fee} SEK` : "Free"}
        </p>
        {event.groupName && (
          <p className="mt-2 text-xs font-medium text-primary">
            From {event.groupName}
          </p>
        )}
        <h3 className="mt-2 font-display text-2xl font-semibold group-hover:text-primary">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {event.shortDescription || event.description}
          </p>
        )}
      </div>
      <div className="space-y-2 border-t border-border p-5 text-sm text-muted-foreground sm:border-l sm:border-t-0">
        <p className="flex gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {formatDate(event.startsAt)}
        </p>
        <p className="flex gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {event.location || event.city || "Location to be announced"}
        </p>
        <p className="flex gap-2">
          <Users className="h-4 w-4 text-primary" />
          {event.managerName || "YKCircle"}
        </p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    apiFetch("/api/events")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const published = data
          .filter(
            (event) =>
              !["Archived", "Draft", "Cancelled"].includes(event.status),
          )
          .slice(0, 4);
        setEvents(published);
      })
      .catch(() => {});
  }, []);
  return (
    <SiteChrome>
      <Helmet>
        <title>YKCircle | Real people, real plans, real places</title>
        <meta
          name="description"
          content="Find people for the things you want to do, make a plan together, and discover local places through YKCircle."
        />
      </Helmet>
      <section className="relative overflow-hidden">
        <img
          src={images.hero}
          alt="A person discovering a city"
          className="h-[36rem] w-full object-cover sm:h-[38rem]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[90rem] px-5 pb-10 sm:px-8 sm:pb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-white/80">
            YKCircle · Stockholm community
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[0.95] text-white sm:text-7xl">
            Find people for the things you want to do.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Turn an idea into a real plan: find people, form a group, join an event, or discover the right local place.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-5 text-sm text-primary-foreground"
            >
              Join YKCircle <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/events?category=music"
              className="inline-flex min-h-12 items-center justify-center border border-white/70 px-5 text-sm text-white"
            >
              Explore events
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              This week in the city
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              Upcoming experiences
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Activity first, people second. Find a reason to step outside.
          </p>
        </div>
        <div className="mt-8">
          {events.length ? (
            events.map((event) => <EventCard event={event} key={event.id} />)
          ) : (
            <p className="border-t border-border py-5 text-muted-foreground">
              New experiences are being prepared.
            </p>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary">
                Find your kind of day
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold">
                Start with an interest
              </h2>
            </div>
            <Link
              to="/events"
              className="hidden items-center gap-2 text-sm text-primary sm:inline-flex"
            >
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/events?category=music"
              className="group relative aspect-[4/3] overflow-hidden"
            >
              <img
                src={images.band}
                alt="Friends playing music together"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35" />
              <span className="absolute bottom-4 left-4 text-xl font-medium text-white">
                Music
              </span>
            </Link>
            <Link
              to="/events?category=sports"
              className="group relative aspect-[4/3] overflow-hidden"
            >
              <img
                src={images.tennis}
                alt="Playing sport"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35" />
              <span className="absolute bottom-4 left-4 text-xl font-medium text-white">
                Sport
              </span>
            </Link>
            <Link
              to="/events?category=art"
              className="group relative aspect-[4/3] overflow-hidden"
            >
              <img
                src={images.art}
                alt="Friends painting together at an art workshop"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35" />
              <span className="absolute bottom-4 left-4 text-xl font-medium text-white">
                Art & creativity
              </span>
            </Link>
            <Link
              to="/events?category=culture"
              className="group relative aspect-[4/3] overflow-hidden"
            >
              <img
                src={images.minsk}
                alt="Culture and places"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35" />
              <span className="absolute bottom-4 left-4 text-xl font-medium text-white">
                Culture
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[90rem] gap-10 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Promote your idea
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold">
            Give your event or business a place in the conversation.
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Planning something worth sharing? Request an article space to introduce your event, venue, service, or business to the YKCircle community.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary"
          >
            Request article space <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <img
            src={images.stockholm}
            alt="Stockholm"
            className="aspect-[3/4] w-full object-cover"
          />
          <img
            src={images.minsk}
            alt="Minsk"
            className="mt-8 aspect-[3/4] w-full object-cover"
          />
        </div>
      </section>
    </SiteChrome>
  );
}
