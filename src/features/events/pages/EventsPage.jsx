import { EventDirectoryPanel } from '../components/EventDirectoryPanel.jsx';
import { EventEditorPanel } from '../components/EventEditorPanel.jsx';
import { useProductConfiguration } from '@/shared/hooks/useProductConfiguration.js';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import DirectoryActions from '@/shared/components/DirectoryActions.jsx';
import DirectoryHeader from '@/shared/components/DirectoryHeader.jsx';
import MyEventsSection, { useAttendingEvents } from '../components/MyEventsSection.jsx';
import { RepresentativeEvents } from '../components/EventRepresentatives.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { localDateTimeToUtc } from '@/shared/utils/time.js';
import {
  isBookableVenue,
  initialForm,
  toInputDate,
  eventDateTimeLabel,
  eventCover,
  eventValue,
} from '../model/event-form.js';
import { EventCoverImage } from '../components/EventCoverImage.jsx';
export function EventsPage({ managementOnly = false, creationPage = false, editPage = false }) {
  const { id: editId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedGroupId = new URLSearchParams(location.search).get('groupId');
  const selectedCategory = searchParams.get('category') || '';
  const draftMessageRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const token = localStorage.getItem('authToken');
  const canManage = Boolean(managementOnly && token);
  const attending = useAttendingEvents(!managementOnly ? token : null);
  const canManageAllEvents = Boolean(user && ['manager', 'admin'].includes(user.role));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [managedGroups, setManagedGroups] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueSchedule, setVenueSchedule] = useState({
    loading: false,
    error: '',
    date: '',
    timezone: '',
    slots: [],
  });
  const [pendingVenueSlot, setPendingVenueSlot] = useState(null);
  const productConfiguration = useProductConfiguration();
  const [organizers, setOrganizers] = useState([]);
  useEffect(() => {
    if (!token || !managementOnly) return;
    let alive = true;
    apiFetch('/api/subscriptions/options')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (alive && data)
          setOrganizers(data.owners.filter((owner) => owner.type === 'organization'));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, managementOnly]);
  const [form, setForm] = useState(initialForm);
  const [draftId, setDraftId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [pendingCover, setPendingCover] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [publishedEvent, setPublishedEvent] = useState(null);
  const [savedEvent, setSavedEvent] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!error && !message) return undefined;
    const timer = window.setTimeout(() => {
      setError('');
      setMessage('');
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, message]);
  useEffect(() => {
    if (draftSaved) window.setTimeout(() => draftMessageRef.current?.focus(), 0);
  }, [draftSaved]);
  useEffect(() => {
    if (!creationPage) return;
    setForm({
      ...initialForm,
      brandName: user?.name || '',
      groupId: requestedGroupId || '',
    });
    setDraftId(null);
    setDraftSaved(false);
    setPendingCover(null);
    setErrors({});
    setError('');
  }, [creationPage, requestedGroupId]);
  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const eventEndpoint = managementOnly ? '/api/my/events' : '/api/events';
      const eventPath = selectedCategory
        ? `${eventEndpoint}?category=${encodeURIComponent(selectedCategory)}`
        : eventEndpoint;
      const response = await apiFetch(
        eventPath,
        managementOnly && token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : {},
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load events.');
      const loadedEvents = Array.isArray(data) ? data : data.events || [];
      if (managementOnly) {
        setMine(loadedEvents);
        setEvents([]);
      } else {
        setEvents(loadedEvents);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [canManage, token, location.pathname, managementOnly, selectedCategory]);
  useEffect(() => {
    Promise.all(['/api/event-categories', '/api/event-types'].map((path) => apiFetch(path)))
      .then(async (responses) => {
        const values = await Promise.all(responses.map((response) => response.json()));
        if (responses[0].ok) setCategories(values[0]);
        if (responses[1].ok) setTypes(values[1]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!canManage || !token) return;
    apiFetch('/api/my/groups/managed', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setManagedGroups(Array.isArray(data) ? data : data.groups || []);
      })
      .catch(() => {});
  }, [canManage, token]);
  useEffect(() => {
    if (!canManage) return;
    apiFetch(
      '/api/venues',
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {},
    )
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data) =>
        setVenues((Array.isArray(data) ? data : data.venues || []).filter(isBookableVenue)),
      )
      .catch(() => setVenues([]));
  }, [canManage, token]);
  const selectedVenueDate = form.startsAt?.slice(0, 10) || '';
  useEffect(() => {
    let cancelled = false;
    setPendingVenueSlot(null);
    if (
      !canManage ||
      !token ||
      form.locationType !== 'venue' ||
      !form.venueId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(selectedVenueDate)
    ) {
      setVenueSchedule({
        loading: false,
        error: '',
        date: '',
        timezone: '',
        slots: [],
        nextAvailable: null,
      });
      return undefined;
    }
    setVenueSchedule({
      loading: true,
      error: '',
      date: selectedVenueDate,
      timezone: '',
      slots: [],
      nextAvailable: null,
    });
    apiFetch(
      `/api/venues/${form.venueId}/availability?date=${encodeURIComponent(selectedVenueDate)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load venue availability.');
        if (!cancelled)
          setVenueSchedule({
            ...data,
            loading: false,
            error: '',
            date: data.date || selectedVenueDate,
            timezone: data.timezone || '',
            slots: data.slots || [],
            nextAvailable: data.nextAvailable || null,
          });
      })
      .catch(
        (requestError) =>
          !cancelled &&
          setVenueSchedule({
            loading: false,
            error: requestError.message,
            date: selectedVenueDate,
            timezone: '',
            slots: [],
            nextAvailable: null,
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [canManage, token, form.locationType, form.venueId, selectedVenueDate]);
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const apply = (event) => {
    setDraftId(event.id);
    setForm((current) => ({
      ...current,
      ...event,
      title: eventValue(event, 'title', 'name'),
      shortDescription: eventValue(event, 'shortDescription', 'short_description'),
      description: eventValue(event, 'description', 'longDescription', 'long_description'),
      foodOptions: Array.isArray(event.foodOptions) ? event.foodOptions : [],
      coverImage: eventCover(event),
      brandName: event.brandName || '',
      logoImage: event.logoImage || '',
      startsAt: toInputDate(
        eventValue(event, 'startsAt', 'startsAtUtc', 'starts_at', 'starts_at_utc'),
        eventValue(event, 'timezone', 'timeZone') || current.timezone,
      ),
      endsAt: toInputDate(
        eventValue(event, 'endsAt', 'endsAtUtc', 'ends_at', 'ends_at_utc'),
        eventValue(event, 'timezone', 'timeZone') || current.timezone,
      ),
      recurrenceFrequency: eventValue(event, 'recurrenceFrequency') || 'none',
      recurrenceInterval: String(eventValue(event, 'recurrenceInterval') || 1),
      recurrenceCount: String(eventValue(event, 'recurrenceCount') || 2),
      categoryId: eventValue(event, 'categoryId', 'category_id') || event.category?.id || '',
      typeId: eventValue(event, 'typeId', 'type_id') || event.type?.id || '',
      country: eventValue(event, 'country') || event.location?.country || current.country,
      city: eventValue(event, 'city') || event.location?.locality || current.city,
      location: typeof event.location === 'string' ? event.location : '',
      venueId: eventValue(event, 'venueId', 'venue_id') || event.venue?.id || '',
      addressLine1:
        event.location?.addressLine1 ||
        event.location?.address_line_1 ||
        eventValue(event, 'address') ||
        '',
      addressLine2: event.location?.addressLine2 || event.location?.address_line_2 || '',
      postalCode: event.location?.postalCode || event.location?.postal_code || '',
      locality: event.location?.locality || event.city || '',
      municipality: event.location?.municipality || '',
      region: event.location?.region || '',
      countryCode: event.location?.countryCode || event.location?.country_code || '',
      latitude: event.location?.latitude ?? event.latitude ?? '',
      longitude: event.location?.longitude ?? event.longitude ?? '',
      googlePlaceId: event.location?.googlePlaceId || event.location?.google_place_id || '',
      formattedAddress: event.location?.formattedAddress || event.location?.formatted_address || '',
      onlineUrl: eventValue(event, 'onlineUrl', 'online_url'),
      onlinePlatform: eventValue(event, 'onlinePlatform', 'online_platform'),
      timezone: eventValue(event, 'timezone', 'timeZone') || current.timezone,
      groupId: eventValue(event, 'groupId', 'group_id'),
      organizerOrganizationId: event.organizerOrganizationId || '',
      locationType:
        eventValue(event, 'locationType', 'location_type') === 'physical'
          ? 'custom'
          : eventValue(event, 'locationType', 'location_type') || current.locationType,
      pricingType: Number(eventValue(event, 'fee')) > 0 ? 'paid' : 'free',
      fee: eventValue(event, 'fee') || 0,
    }));
  };
  const payload = () => {
    const {
      recurrenceFrequency,
      recurrenceInterval,
      recurrenceCount,
      venueId,
      location,
      address,
      addressLine1,
      addressLine2,
      postalCode,
      locality,
      municipality,
      region,
      countryCode,
      latitude,
      longitude,
      googlePlaceId,
      formattedAddress,
      onlineUrl,
      onlinePlatform,
      city,
      country,
      locationVisibility,
      ...eventForm
    } = form;
    const recurrence =
      !draftId && recurrenceFrequency !== 'none'
        ? {
            frequency: recurrenceFrequency,
            interval: Number(recurrenceInterval),
            count: Number(recurrenceCount),
          }
        : undefined;
    return Object.fromEntries(
      Object.entries({
        ...eventForm,
        foodOptions: form.foodOptions.map((option) => option.trim()).filter(Boolean),
        venueId: form.locationType === 'venue' ? Number(venueId) || undefined : undefined,
        customAddressLine1: form.locationType === 'custom' ? addressLine1 : undefined,
        customAddressLine2: form.locationType === 'custom' ? addressLine2 : undefined,
        customPostalCode: form.locationType === 'custom' ? postalCode : undefined,
        customLocality: form.locationType === 'custom' ? locality : undefined,
        customMunicipality: form.locationType === 'custom' ? municipality : undefined,
        customRegion: form.locationType === 'custom' ? region : undefined,
        customCountry: form.locationType === 'custom' ? country : undefined,
        customCountryCode: form.locationType === 'custom' ? countryCode : undefined,
        customLatitude:
          form.locationType === 'custom' && latitude !== '' ? Number(latitude) : undefined,
        customLongitude:
          form.locationType === 'custom' && longitude !== '' ? Number(longitude) : undefined,
        customGooglePlaceId: form.locationType === 'custom' ? googlePlaceId : undefined,
        customFormattedAddress: form.locationType === 'custom' ? formattedAddress : undefined,
        onlineUrl: form.locationType === 'online' ? onlineUrl : undefined,
        onlinePlatform: form.locationType === 'online' ? onlinePlatform : undefined,
        recurrence,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        typeId: form.typeId ? Number(form.typeId) : undefined,
        startsAtUtc: form.startsAt ? localDateTimeToUtc(form.startsAt, form.timezone) : undefined,
        endsAtUtc: form.endsAt ? localDateTimeToUtc(form.endsAt, form.timezone, 'end') : undefined,
        organizerOrganizationId: form.organizerOrganizationId
          ? Number(form.organizerOrganizationId)
          : null,
        fee: form.pricingType === 'paid' ? Number(form.fee) : 0,
      }).filter(
        ([key, value]) =>
          ['logoImage', 'brandName'].includes(key) ||
          (value !== '' && value !== null && value !== undefined),
      ),
    );
  };
  const uploadFile = async (file, eventId = draftId) => {
    if (!file || !eventId) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('coverImage', file);
      const response = await apiFetch(`/api/events/${eventId}/cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to upload cover image.');
      const uploadedCover = eventCover(data.event || data) || data.coverImage;
      setForm((current) => ({
        ...current,
        coverImage: uploadedCover,
      }));
      setPendingCover(null);
      return uploadedCover;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };
  const save = async (event) => {
    event?.preventDefault();
    if (logoBusy) return;
    setErrors({});
    setError('');
    setMessage('');
    try {
      if (!form.endsAt || !localDateTimeToUtc(form.endsAt, form.timezone, 'end')) {
        setErrors({
          endsAt: 'Choose an end date and time.',
        });
        throw new Error('Choose an end date and time before saving the event.');
      }
      if (
        form.startsAt &&
        localDateTimeToUtc(form.endsAt, form.timezone, 'end') <=
          localDateTimeToUtc(form.startsAt, form.timezone)
      ) {
        setErrors({
          endsAt: 'The end must be after the start.',
        });
        throw new Error('The event must end after it starts.');
      }
      if (
        form.locationType === 'custom' &&
        (!form.formattedAddress ||
          !Number.isFinite(Number(form.latitude)) ||
          !Number.isFinite(Number(form.longitude)))
      ) {
        setErrors({
          location: 'Choose an address from the Google suggestions so its location can be saved.',
        });
        throw new Error('Choose an address from the Google suggestions.');
      }
      const selectedGroupId = managedGroups.some(
        (group) => String(group.id) === String(form.groupId),
      )
        ? form.groupId
        : '';
      const draftPath = selectedGroupId
        ? `/api/groups/${selectedGroupId}/events/drafts`
        : '/api/events/drafts';
      const requestPayload = payload();
      delete requestPayload.groupId;
      const response = await apiFetch(draftId ? `/api/events/${draftId}` : draftPath, {
        method: draftId ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields || {});
        const fields = Object.entries(data.fields || {})
          .map(([field, message]) => `${field}: ${message}`)
          .join(' · ');
        throw new Error(fields || data.error || 'Unable to save draft.');
      }
      apply(data);
      setDraftSaved(!editPage);
      if (editPage) setSavedEvent(true);
      setMessage('');
      if (pendingCover) await uploadFile(pendingCover, data.id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const uploadCover = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingCover(file);
      if (draftId) uploadFile(file);
      else setMessage('Cover selected. Save the draft to upload it.');
    }
    event.target.value = '';
  };
  const executePublish = async (id) => {
    const response = await apiFetch(`/api/events/${id}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      setErrors(data.fields || {});
      if (data.code === 'SUBSCRIPTION_REQUIRED' && data.subscribeUrl?.startsWith('/subscribe?')) {
        navigate(data.subscribeUrl);
        return;
      }
      setError(data.error || 'Event cannot be published.');
      return;
    }
    const published = data.event || data;
    setPublishedEvent({
      id,
      title: published.title || form.title || 'Your event',
    });
    await load();
  };
  const publishEvent = (id) =>
    setDialog({
      action: 'publish',
      id,
    });
  const executeDelete = async (id, isDraft = false) => {
    const response = await apiFetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'Unable to delete event.');
      return;
    }
    if (draftId === id) {
      setDraftId(null);
      setForm(initialForm);
    }
    setEvents((current) => current.filter((event) => event.id !== id));
    setMine((current) => current.filter((event) => event.id !== id));
    setArchivedEvents((current) => current.filter((event) => event.id !== id));
    setMessage(isDraft ? 'Draft deleted.' : 'Event deleted.');
    load(false).catch(() => {});
  };
  const deleteEvent = (id, isDraft = false) =>
    setDialog({
      action: 'delete',
      id,
      isDraft,
    });
  const updateStatus = async (id, status) => {
    const response = await apiFetch(`/api/events/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'Unable to update event.');
      return;
    }
    if (status === 'Archived') {
      const archivedEvent = [...mine, ...events].find((event) => String(event.id) === String(id));
      if (archivedEvent) {
        setArchivedEvents((current) => [
          {
            ...archivedEvent,
            status: 'Archived',
          },
          ...current.filter((event) => String(event.id) !== String(id)),
        ]);
      }
      setEvents((current) =>
        current.map((event) =>
          String(event.id) === String(id)
            ? {
                ...event,
                status: 'Archived',
              }
            : event,
        ),
      );
      setMine((current) =>
        current.map((event) =>
          String(event.id) === String(id)
            ? {
                ...event,
                status: 'Archived',
              }
            : event,
        ),
      );
    } else if (status === 'Published') {
      setArchivedEvents((current) => current.filter((event) => String(event.id) !== String(id)));
      setEvents((current) =>
        current.map((event) =>
          String(event.id) === String(id)
            ? {
                ...event,
                status,
              }
            : event,
        ),
      );
      setMine((current) =>
        current.map((event) =>
          String(event.id) === String(id)
            ? {
                ...event,
                status,
              }
            : event,
        ),
      );
    }
    setMessage(
      status === 'Archived'
        ? 'Event archived.'
        : status === 'Published'
          ? 'Event restored.'
          : 'Event updated.',
    );
    load(false).catch((requestError) => setError(requestError.message));
  };
  const archiveEvent = (id) =>
    setDialog({
      action: 'archive',
      id,
    });
  const restoreEvent = (id) =>
    setDialog({
      action: 'restore',
      id,
    });
  const confirmDialog = async () => {
    const current = dialog;
    setDialog(null);
    if (!current) return;
    if (current.action === 'delete') await executeDelete(current.id, current.isDraft);
    else if (current.action === 'archive') await updateStatus(current.id, 'Archived');
    else if (current.action === 'restore') await updateStatus(current.id, 'Published');
    else await executePublish(current.id);
  };
  const input = (name, label, type = 'text', required = false) => (
    <label className="block text-sm">
      {label}
      {required && <span className="text-primary"> *</span>}
      <input
        name={name}
        type={type}
        step={type === 'datetime-local' ? 900 : undefined}
        required={required}
        value={form[name]}
        onChange={update}
        className="mt-2 min-h-11 w-full border border-border bg-background px-3"
      />
      {errors[name] && <span className="mt-1 block text-xs text-destructive">{errors[name]}</span>}
    </label>
  );
  const organizerView = managementOnly && canManage;
  const displayed =
    organizerView && canManageAllEvents
      ? [...mine, ...events.filter((event) => !mine.some((item) => item.id === event.id))]
      : organizerView
        ? mine
        : events;
  const eventStatus = (event) => String(event?.status || 'Published').toLowerCase();
  const active = displayed.filter(
    (event) =>
      !['archived', 'draft'].includes(eventStatus(event)) &&
      (managementOnly || !attending.events.some((item) => String(item.id) === String(event.id))),
  );
  const drafts = displayed.filter((event) => eventStatus(event) === 'draft');
  const archived = [
    ...archivedEvents,
    ...displayed.filter((event) => eventStatus(event) === 'archived'),
  ].filter(
    (event, index, all) => all.findIndex((item) => String(item.id) === String(event.id)) === index,
  );
  useEffect(() => {
    if (!organizerView) return undefined;
    const buttons = [...document.querySelectorAll('article button')].filter(
      (button) => button.textContent === 'Edit',
    );
    buttons.forEach((button) => {
      const article = button.closest('article');
      const event = displayed.find((item) => article?.textContent.includes(item.title));
      if (!event || event.status === 'Draft' || article?.dataset.actionsAdded) return;
      article.dataset.actionsAdded = 'true';
      const actions = button.parentElement;
      const group = document.createElement('div');
      group.className = 'flex flex-wrap gap-2';
      actions?.insertBefore(group, button);
      group.appendChild(button);
      button.textContent = 'Manage';
      button.onclick = () => {
        window.location.assign(`/events/${event.id}?manage=1`);
      };
      const archive = document.createElement('button');
      archive.type = 'button';
      archive.className = 'border border-border px-3 py-2 text-sm';
      archive.textContent = 'Archive';
      archive.onclick = () => archiveEvent(event.id);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'border border-destructive px-3 py-2 text-sm text-destructive';
      remove.textContent = 'Delete';
      remove.onclick = () => deleteEvent(event.id);
      group.append(archive, remove);
    });
    return undefined;
  }, [organizerView, displayed]);
  useEffect(() => {
    if (!organizerView || creationPage || editPage) return undefined;
    const heading = [...document.querySelectorAll('h2')].find((item) =>
      ['Create an experience', 'Edit an event'].includes(item.textContent),
    );
    const section = heading?.closest('section');
    const form = section?.querySelector('form');
    if (form) form.style.display = 'none';
    if (section && !section.querySelector('[data-create-event-link]')) {
      const link = document.createElement('a');
      link.dataset.createEventLink = 'true';
      link.href = '/profile/events/new';
      link.className =
        'inline-flex min-h-10 items-center bg-primary px-4 py-2 text-sm text-primary-foreground';
      link.textContent = 'Create an event';
      heading?.parentElement?.parentElement?.appendChild(link);
    }
    return undefined;
  }, [organizerView, creationPage]);
  useEffect(() => {
    if (!creationPage) return undefined;
    ['Upcoming experiences', 'Your events'].forEach((title) => {
      const heading = [...document.querySelectorAll('h2')].find(
        (item) => item.textContent === title,
      );
      const section = heading?.closest('section');
      if (section) section.style.display = 'none';
    });
    return undefined;
  }, [creationPage]);
  useEffect(() => {
    if (!organizerView || !editPage) return undefined;
    const buttons = [...document.querySelectorAll('article button')].filter(
      (button) => button.textContent === 'Edit',
    );
    buttons.forEach((button) => {
      const article = button.closest('article');
      const event = displayed.find((item) => article?.textContent.includes(item.title));
      if (event) button.onclick = () => window.location.assign(`/profile/events/${event.id}/edit`);
    });
    return undefined;
  }, [organizerView, editPage, displayed]);
  useEffect(() => {
    if (!editPage || !editId) return;
    apiFetch('/api/events/' + editId, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load event.');
        apply(data);
      })
      .catch((requestError) => setError(requestError.message));
  }, [editPage, editId]);
  useEffect(() => {
    if (!editPage) return undefined;
    ['Upcoming experiences', 'Your events'].forEach((title) => {
      const heading = [...document.querySelectorAll('h2')].find(
        (item) => item.textContent === title,
      );
      const section = heading?.closest('section');
      if (section) section.style.display = 'none';
    });
    return undefined;
  }, [editPage]);
  useEffect(() => {
    if (!organizerView || editPage) return undefined;
    const buttons = [...document.querySelectorAll('article button')].filter(
      (button) => button.textContent === 'Edit',
    );
    buttons.forEach((button) => {
      const article = button.closest('article');
      const event = displayed.find((item) => article?.textContent.includes(item.title));
      if (event) button.onclick = () => window.location.assign(`/profile/events/${event.id}/edit`);
    });
    return undefined;
  }, [organizerView, editPage, displayed]);
  return (
    <SiteChrome>
      <Helmet>
        <title>Events | YKCircle</title>
      </Helmet>
      <section className="directory-page">
        <DirectoryHeader
          eyebrow="YKCircle experiences"
          title="Find something worth joining."
          description="Explore activities, gatherings and local experiences."
        />
        {organizerView && !creationPage && !editPage && (
          <Link
            to="/profile/events/new"
            className="ui-action mt-7 inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
          >
            Create an event
          </Link>
        )}
        {organizerView && !creationPage && !editPage && <RepresentativeEvents token={token} />}
        {!managementOnly && token && (
          <DirectoryActions
            manageTo="/profile/events"
            manageLabel="Manage events"
            createTo="/profile/events/new"
            createLabel="Create an event"
          />
        )}
        {!managementOnly && token && <MyEventsSection {...attending} />}
        {!managementOnly && (
          <nav aria-label="Event categories" className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`ui-action directory-filter min-h-10 border px-4 text-sm ${!selectedCategory ? 'border-primary text-primary' : 'border-border'}`}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setSearchParams({
                    category: category.slug,
                  })
                }
                className={`ui-action directory-filter min-h-10 border px-4 text-sm ${selectedCategory === category.slug ? 'border-primary text-primary' : 'border-border'}`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
        {error && (
          <p className="fixed bottom-6 left-5 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6">
            {error}
          </p>
        )}
        {canManage && (creationPage || editPage) && (
          <EventEditorPanel
            editPage={editPage}
            draftSaved={draftSaved}
            save={save}
            input={input}
            creationPage={creationPage}
            managedGroups={managedGroups}
            form={form}
            update={update}
            draftId={draftId}
            setForm={setForm}
            setLogoBusy={setLogoBusy}
            errors={errors}
            pendingCover={pendingCover}
            uploadCover={uploadCover}
            uploading={uploading}
            categories={categories}
            types={types}
            venues={venues}
            setPendingVenueSlot={setPendingVenueSlot}
            selectedVenueDate={selectedVenueDate}
            venueSchedule={venueSchedule}
            pendingVenueSlot={pendingVenueSlot}
            organizers={organizers}
            productConfiguration={productConfiguration}
            logoBusy={logoBusy}
          />
        )}
        {draftSaved && (
          <section className="mt-12 py-10 text-center">
            <p
              ref={draftMessageRef}
              tabIndex="-1"
              className="font-display text-3xl font-semibold text-primary sm:text-4xl"
            >
              {editPage ? 'Draft has been saved' : 'Draft created'}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              You can edit it, publish it, or delete it below.
            </p>
          </section>
        )}
        {canManage && drafts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-3xl font-semibold">Drafts</h2>
            <div className="mt-4 space-y-3">
              {drafts.map((event) => (
                <article key={event.id} className="rounded-2xl border border-border p-5">
                  <EventCoverImage
                    event={event}
                    component="EventsPageDraft"
                    className="mb-4 aspect-[16/7] w-full object-cover"
                  />
                  <span className="text-xs uppercase tracking-[0.2em] text-primary">Draft</span>
                  <h3 className="mt-2 font-display text-2xl">
                    {event.title || 'Untitled experience'}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/profile/events/${event.id}/edit`}
                      className="ui-action inline-flex min-h-10 items-center border border-border px-4 text-sm"
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => publishEvent(event.id)}
                      className="ui-action min-h-10 bg-primary px-4 text-sm text-primary-foreground"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id, true)}
                      className="ui-action min-h-10 border border-destructive px-4 text-sm text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <EventDirectoryPanel
          managementOnly={managementOnly}
          loading={loading}
          attending={attending}
          active={active}
          canManage={canManage}
          archiveEvent={archiveEvent}
          deleteEvent={deleteEvent}
        />
        {canManage && archived.length > 0 && (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-semibold">Archived events</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Archived events are kept here for your records and are not visible to customers.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl relative overflow-hidden border border-border bg-secondary/25 p-4 opacity-75"
                >
                  <div
                    className="pointer-events-none absolute inset-0 z-10 bg-white/35"
                    aria-hidden="true"
                  />
                  <EventCoverImage
                    event={event}
                    component="EventsPageArchived"
                    className="mb-4 aspect-[16/10] w-full object-cover"
                  />
                  <div className="relative z-20">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Archived
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-muted-foreground">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {eventDateTimeLabel(event)}
                    </p>
                  </div>
                  <div className="relative z-20 mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => restoreEvent(event.id)}
                      className="ui-action min-h-10 bg-primary px-3 text-sm text-primary-foreground"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="ui-action min-h-10 border border-destructive px-3 text-sm text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
      {dialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl w-full max-w-md border border-border bg-background p-7 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Please confirm</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              {dialog.action === 'delete'
                ? dialog.isDraft
                  ? 'Delete this draft?'
                  : 'Delete this event?'
                : dialog.action === 'archive'
                  ? 'Archive this event?'
                  : dialog.action === 'restore'
                    ? 'Restore this event?'
                    : 'Publish this event?'}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {dialog.action === 'delete'
                ? dialog.isDraft
                  ? 'This draft and its saved details will be permanently removed.'
                  : 'This event and its saved details will be permanently removed.'
                : dialog.action === 'archive'
                  ? 'Archived events are no longer visible to customers.'
                  : dialog.action === 'restore'
                    ? 'Restoring makes this event visible to customers again.'
                    : 'Publishing makes this event visible to customers and available for registration.'}
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="ui-action min-h-11 border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog}
                className={`min-h-11 px-4 text-sm text-primary-foreground ${dialog.action === 'delete' ? 'bg-destructive' : 'bg-primary'}`}
              >
                {dialog.action === 'delete'
                  ? dialog.isDraft
                    ? 'Delete draft'
                    : 'Delete event'
                  : dialog.action === 'archive'
                    ? 'Archive event'
                    : dialog.action === 'restore'
                      ? 'Restore event'
                      : 'Publish event'}
              </button>
            </div>
          </div>
        </div>
      )}
      {publishedEvent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="published-title"
        >
          <div className="rounded-2xl w-full max-w-md border border-border bg-background p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Now live</p>
            <h2 id="published-title" className="mt-3 font-display text-4xl font-semibold">
              Event published
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{publishedEvent.title}</span> is now
              visible to customers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={`/events/${publishedEvent.id}`}
                className="ui-action inline-flex min-h-11 items-center justify-center bg-primary px-5 text-sm text-primary-foreground"
                onClick={() => setPublishedEvent(null)}
              >
                View event
              </Link>
              <button
                type="button"
                onClick={() => setPublishedEvent(null)}
                className="ui-action min-h-11 border border-border px-5 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {savedEvent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-event-title"
        >
          <div className="rounded-2xl w-full max-w-md border border-border bg-background p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Saved</p>
            <h2 id="saved-event-title" className="mt-3 font-display text-4xl font-semibold">
              Event saved
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Your changes have been saved successfully.
            </p>
            <button
              type="button"
              onClick={() => navigate('/profile/events')}
              className="ui-action mt-8 min-h-11 bg-primary px-5 text-sm text-primary-foreground"
            >
              Manage events
            </button>
          </div>
        </div>
      )}
    </SiteChrome>
  );
}
export default EventsPage;
