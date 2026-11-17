import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import DirectoryActions from '@/shared/components/DirectoryActions.jsx';
import DirectoryHeader from '@/shared/components/DirectoryHeader.jsx';
import { apiFetch } from '@/shared/api/client.js';
import {
  asList,
  normalizeVenue,
  inputClass,
  getError,
  humanize,
} from '../model/venue-marketplace.js';
import { useTaxonomy } from '../hooks/useTaxonomy.js';
import { Shell, ErrorState } from '../components/VenueShell.jsx';
import { VenueCard, VenueCardSkeleton } from '../components/VenueCard.jsx';
import { FilterSelect } from '../components/FilterSelect.jsx';
export function VenuesDiscoveryPage({ city: routeCity = '', venueType: routeVenueType = '' }) {
  const taxonomy = useTaxonomy();
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [saved, setSaved] = useState({
    loading: Boolean(token),
    error: '',
    venues: [],
  });
  const [savedRevision, setSavedRevision] = useState(0);
  const [owned, setOwned] = useState({
    loading: Boolean(token),
    error: '',
    venues: [],
  });
  const [ownedRevision, setOwnedRevision] = useState(0);
  const [filters, setFilters] = useState({
    city: routeCity.replace(/-/g, ' '),
    venueType: routeVenueType,
    eventType: '',
    amenity: '',
    minCapacity: '',
    maxCapacity: '',
    maxPrice: '',
    verified: false,
  });
  const [state, setState] = useState({
    loading: true,
    error: '',
    venues: [],
  });
  useEffect(() => {
    const refreshAuth = () => setToken(localStorage.getItem('authToken'));
    window.addEventListener('auth-change', refreshAuth);
    return () => window.removeEventListener('auth-change', refreshAuth);
  }, []);
  useEffect(() => {
    if (!token) {
      setSaved({
        loading: false,
        error: '',
        venues: [],
      });
      return;
    }
    let active = true;
    setSaved({
      loading: true,
      error: '',
      venues: [],
    });
    apiFetch('/api/my/saved-venues', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(getError(data, 'Unable to load saved venues.'));
        const venues = asList(data, 'venues')
          .map((item) => normalizeVenue(item.venue || item))
          .filter((venue) => venue.id != null);
        if (active)
          setSaved({
            loading: false,
            error: '',
            venues,
          });
      })
      .catch((error) => {
        if (active)
          setSaved({
            loading: false,
            error: error.message,
            venues: [],
          });
      });
    return () => {
      active = false;
    };
  }, [token, savedRevision]);
  useEffect(() => {
    if (!token) {
      setOwned({
        loading: false,
        error: '',
        venues: [],
      });
      return;
    }
    let active = true;
    setOwned({
      loading: true,
      error: '',
      venues: [],
    });
    apiFetch('/api/my/venues', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(getError(data, 'Unable to load your venues.'));
        const venues = asList(data, 'venues')
          .map(normalizeVenue)
          .filter((venue) => venue.id != null);
        if (active)
          setOwned({
            loading: false,
            error: '',
            venues,
          });
      })
      .catch((error) => {
        if (active)
          setOwned({
            loading: false,
            error: error.message,
            venues: [],
          });
      });
    return () => {
      active = false;
    };
  }, [token, ownedRevision]);
  useEffect(
    () =>
      setFilters((current) => ({
        ...current,
        city: routeCity.replace(/-/g, ' '),
        venueType: routeVenueType,
      })),
    [routeCity, routeVenueType],
  );
  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) params.set(key, value === true ? 'true' : value);
    });
    try {
      const response = await apiFetch(`/api/venues${params.size ? `?${params}` : ''}`);
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, "We couldn't load venues. Try again."));
      setState({
        loading: false,
        error: '',
        venues: asList(data, 'venues')
          .map(normalizeVenue)
          .filter((venue) => venue.id != null),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, [filters]);
  useEffect(() => {
    load();
  }, [load]);
  const setFilter = (key) => (value) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  const title = routeCity ? `Venues in ${humanize(routeCity)}` : 'Find a venue for your next event';
  const savedIds = new Set(saved.venues.map((venue) => String(venue.id)));
  const ownedIds = new Set(owned.venues.map((venue) => String(venue.id)));
  const savedVenues = saved.venues.filter((venue) => !ownedIds.has(String(venue.id)));
  const otherVenues = state.venues.filter(
    (venue) => !ownedIds.has(String(venue.id)) && !savedIds.has(String(venue.id)),
  );
  return (
    <Shell
      directory
      title={title}
      description="Discover spaces for meetups, workshops, celebrations and community events."
    >
      <DirectoryHeader
        eyebrow="Venue marketplace"
        title={title}
        description="Find spaces that fit your people, plan and budget. Send a request. No payment or booking is completed here."
      />
      {token && (
        <DirectoryActions
          manageTo="/profile/venues"
          manageLabel="Manage venues"
          createTo="/profile/venues/new"
          createLabel="Add venue"
        />
      )}
      {token && (
        <section id="my-venues" aria-labelledby="my-venues-title" className="mt-10 scroll-mt-8">
          <h2 id="my-venues-title" className="font-display text-3xl font-semibold">
            My Venues
          </h2>
          {owned.error ? (
            <ErrorState error={owned.error} retry={() => setOwnedRevision((value) => value + 1)} />
          ) : owned.loading ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <VenueCardSkeleton key={item} />
              ))}
            </div>
          ) : owned.venues.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {owned.venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} owned />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Venues you own will appear here.{' '}
              <RouterLink to="/profile/venues/new" className="text-primary underline">
                Add a venue
              </RouterLink>{' '}
              to get started.
            </p>
          )}
        </section>
      )}
      {token && (
        <section
          id="saved-venues"
          aria-labelledby="saved-venues-title"
          className="mt-10 scroll-mt-8"
        >
          <h2 id="saved-venues-title" className="font-display text-3xl font-semibold">
            Saved Venues
          </h2>
          {saved.error ? (
            <ErrorState error={saved.error} retry={() => setSavedRevision((value) => value + 1)} />
          ) : saved.loading || owned.loading ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <VenueCardSkeleton key={item} />
              ))}
            </div>
          ) : savedVenues.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {savedVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {saved.venues.length
                ? 'Venues you own are shown in My Venues above.'
                : 'Save a venue using the heart on its page. Your saved venues will appear here.'}
            </p>
          )}
        </section>
      )}
      {token && <h2 className="mt-12 font-display text-3xl font-semibold">Browse venues</h2>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
        className="rounded-2xl mt-9 grid gap-3 border border-border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block text-sm font-medium">
          Location
          <input
            value={filters.city}
            onChange={(event) => setFilter('city')(event.target.value)}
            placeholder="City or area"
            className={`${inputClass} directory-filter`}
          />
        </label>
        <FilterSelect
          className="directory-filter"
          label="Venue type"
          value={filters.venueType}
          onChange={setFilter('venueType')}
          options={taxonomy.value.venueTypes}
          placeholder="Any type"
        />
        <FilterSelect
          className="directory-filter"
          label="Suitable for"
          value={filters.eventType}
          onChange={setFilter('eventType')}
          options={taxonomy.value.eventTypes}
          placeholder="Any event"
        />
        <FilterSelect
          className="directory-filter"
          label="Amenity"
          value={filters.amenity}
          onChange={setFilter('amenity')}
          options={taxonomy.value.amenities}
          placeholder="Any amenity"
        />
        <label className="block text-sm font-medium">
          Minimum guests
          <input
            type="number"
            min="1"
            value={filters.minCapacity}
            onChange={(event) => setFilter('minCapacity')(event.target.value)}
            className={`${inputClass} directory-filter`}
          />
        </label>
        <label className="block text-sm font-medium">
          Maximum guests
          <input
            type="number"
            min="1"
            value={filters.maxCapacity}
            onChange={(event) => setFilter('maxCapacity')(event.target.value)}
            className={`${inputClass} directory-filter`}
          />
        </label>
        <label className="block text-sm font-medium">
          Maximum price (SEK)
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => setFilter('maxPrice')(event.target.value)}
            className={`${inputClass} directory-filter`}
          />
        </label>
        <label className="directory-filter flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm font-medium focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <input
            type="checkbox"
            className="accent-primary"
            checked={filters.verified}
            onChange={(event) => setFilter('verified')(event.target.checked)}
          />{' '}
          Verified venues only
        </label>
        <div className="flex items-end">
          <button className="ui-action min-h-11 w-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Search venues
          </button>
        </div>
        {taxonomy.error && (
          <p className="sm:col-span-2 lg:col-span-4 text-sm text-muted-foreground">
            Filters are unavailable right now; you can still search by location.
          </p>
        )}
      </form>
      {state.error ? (
        <ErrorState error={state.error} retry={load} />
      ) : state.loading || (token && (saved.loading || owned.loading)) ? (
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <VenueCardSkeleton key={item} />
          ))}
        </div>
      ) : otherVenues.length ? (
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {otherVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl mt-9 border border-border p-6 text-muted-foreground">
          {state.venues.length
            ? 'All matching venues are shown in My Venues or Saved Venues above.'
            : 'No venues found for these filters.'}
        </p>
      )}
    </Shell>
  );
}
