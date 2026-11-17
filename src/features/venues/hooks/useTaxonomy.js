import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/shared/api/client.js';
import { asList, getError } from '../model/venue-marketplace.js';
export const taxonomyCacheKey = 'ykcircle-venue-taxonomy-v1';
export async function loadTaxonomy() {
  try {
    const cached = sessionStorage.getItem(taxonomyCacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    /* An unavailable storage area should not block venue discovery. */
  }
  const responses = await Promise.all([
    apiFetch('/api/venue-types'),
    apiFetch('/api/venue-event-types'),
    apiFetch('/api/venue-amenities'),
  ]);
  const data = await Promise.all(
    responses.map(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(getError(body, 'Unable to load venue filters.'));
      return body;
    }),
  );
  const taxonomy = {
    venueTypes: asList(data[0], 'venueTypes').length
      ? asList(data[0], 'venueTypes')
      : asList(data[0], 'types'),
    eventTypes: asList(data[1], 'eventTypes').length
      ? asList(data[1], 'eventTypes')
      : asList(data[1], 'venueEventTypes'),
    amenities: asList(data[2], 'amenities'),
  };
  try {
    sessionStorage.setItem(taxonomyCacheKey, JSON.stringify(taxonomy));
  } catch {
    /* ignore */
  }
  return taxonomy;
}
export function useTaxonomy() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    value: {
      venueTypes: [],
      eventTypes: [],
      amenities: [],
    },
  });
  const load = useCallback(() => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));
    loadTaxonomy()
      .then((value) =>
        setState({
          loading: false,
          error: '',
          value,
        }),
      )
      .catch((error) =>
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message,
        })),
      );
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return {
    ...state,
    reload: load,
  };
}
