import PageHeader from '@/shared/components/PageHeader.jsx';
import { useProductConfiguration } from '@/shared/hooks/useProductConfiguration.js';
import LogoUpload from '@/shared/components/LogoUpload.jsx';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '@/shared/components/ui/skeleton.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { appendGalleryFiles } from '@/shared/media/gallery-files.js';
import { Link } from '../components/VenueLink.jsx';
import {
  authHeaders,
  inputClass,
  textareaClass,
  getError,
  toNumber,
  emptyVenue,
  toForm,
} from '../model/venue-marketplace.js';
import { useTaxonomy } from '../hooks/useTaxonomy.js';
import { Shell } from '../components/VenueShell.jsx';
import { FilterSelect } from '../components/FilterSelect.jsx';
import { EditorSection, Input, CheckOption } from '../components/VenueEditorFields.jsx';
import { VenueScheduleEditor } from '../components/VenueScheduleEditor.jsx';
export function VenueEditorPage() {
  const productConfiguration = useProductConfiguration();
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const taxonomy = useTaxonomy();
  const [form, setForm] = useState(emptyVenue);
  const [logoBusy, setLogoBusy] = useState(false);
  const [pendingCover, setPendingCover] = useState(null);
  const [pendingGallery, setPendingGallery] = useState([]);
  const [state, setState] = useState({
    loading: editing,
    saving: false,
    error: '',
  });
  const [organization, setOrganization] = useState({
    name: '',
    websiteUrl: '',
    contactEmail: '',
  });
  const [organizations, setOrganizations] = useState([]);
  useEffect(() => {
    if (editing) return;
    apiFetch('/api/my/organizations', {
      headers: authHeaders(),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(getError(data, 'Unable to load organizations.'));
        setOrganizations(Array.isArray(data) ? data : data.organizations || []);
      })
      .catch((error) =>
        setState((current) => ({
          ...current,
          error: error.message,
        })),
      );
  }, [editing]);
  useEffect(() => {
    if (!editing) return;
    apiFetch(`/api/venues/${id}`, {
      headers: authHeaders(),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(getError(data, 'Unable to load venue.'));
        setForm(toForm(data.venue || data));
      })
      .catch((error) =>
        setState((current) => ({
          ...current,
          error: error.message,
        })),
      )
      .finally(() =>
        setState((current) => ({
          ...current,
          loading: false,
        })),
      );
  }, [editing, id]);
  const updatePricingType = (event) => {
    const pricingType = event.target.value;
    if (pricingType === 'paid' && !productConfiguration.paidVenuesEnabled) return;
    setForm((current) => ({
      ...current,
      pricingType,
      priceFrom: pricingType === 'free' ? '0' : '',
    }));
  };
  const update = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  const toggle = (key, value) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  const applyPlace = (place) =>
    setForm((current) => ({
      ...current,
      ...place,
      city: place.locality || current.city,
    }));
  useEffect(() => {
    const receivePlace = (event) => applyPlace(event.detail);
    const receiveCover = (event) => setPendingCover(event.detail);
    const receiveGallery = (event) =>
      setPendingGallery((current) => appendGalleryFiles(current, event.detail));
    window.addEventListener('ykcircle:venue-place-selected', receivePlace);
    window.addEventListener('ykcircle:venue-cover-selected', receiveCover);
    window.addEventListener('ykcircle:venue-gallery-selected', receiveGallery);
    return () => {
      window.removeEventListener('ykcircle:venue-place-selected', receivePlace);
      window.removeEventListener('ykcircle:venue-cover-selected', receiveCover);
      window.removeEventListener('ykcircle:venue-gallery-selected', receiveGallery);
    };
  }, []);
  const save = async (event) => {
    event.preventDefault();
    if (logoBusy) return;
    setState((current) => ({
      ...current,
      saving: true,
      error: '',
    }));
    try {
      if (form.pricingType === 'paid') {
        if (!productConfiguration.paidVenuesEnabled)
          throw new Error(
            'Paid venues are currently unavailable. Choose a free venue to continue.',
          );
        if (!Number.isFinite(Number(form.priceFrom)) || Number(form.priceFrom) <= 0)
          throw new Error('Enter a booking rate greater than zero for a paid venue.');
      }
      if (!form.availability.length)
        throw new Error('Add at least one weekly availability period.');
      if (!editing && !pendingCover) throw new Error('Choose a cover image for the venue.');
      let organizationId = Number(form.organizationId) || null;
      if (!editing && !organizationId) {
        const organizationResponse = await apiFetch('/api/organizations', {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...organization,
            slug: organization.name,
          }),
        });
        const organizationData = await organizationResponse.json();
        if (!organizationResponse.ok)
          throw new Error(getError(organizationData, 'Unable to create Venue organization.'));
        organizationId = organizationData.id;
        setOrganizations((current) => [...current, organizationData]);
        setForm((current) => ({
          ...current,
          organizationId,
        }));
      }
      const payload = {
        logoImage: form.logoImage || '',
        businessName: form.businessName || '',
        organizationId,
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        venueType: form.venueType,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        postalCode: form.postalCode,
        city: form.city,
        municipality: form.municipality,
        region: form.region,
        country: form.country,
        countryCode: form.countryCode,
        googlePlaceId: form.googlePlaceId,
        formattedAddress: form.formattedAddress,
        latitude: toNumber(form.latitude),
        longitude: toNumber(form.longitude),
        locationVisibility: form.locationVisibility,
        capacityMin: toNumber(form.capacityMin),
        capacityMax: toNumber(form.capacityMax),
        standingCapacity: toNumber(form.standingCapacity),
        seatedCapacity: toNumber(form.seatedCapacity),
        diningCapacity: toNumber(form.diningCapacity),
        classroomCapacity: toNumber(form.classroomCapacity),
        sizeSqm: toNumber(form.sizeSqm),
        priceFrom: form.pricingType === 'free' ? 0 : toNumber(form.priceFrom),
        priceUnit: ['day', 'evening'].includes(form.priceUnit) ? 'day' : 'hour',
        currency: form.currency,
        pricingDescription: form.pricingDescription,
        minimumBookingHours: ['day', 'evening'].includes(form.priceUnit) ? 24 : 1,
        availabilityType: form.availabilityType,
        availability: form.availability,
        houseRulesText: form.houseRulesText,
        amenities: form.amenities,
        suitableEventTypes: form.suitableEventTypes,
      };
      const response = await apiFetch(editing ? `/api/venues/${id}` : '/api/venues', {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getError(data, 'Unable to save venue.'));
      const savedVenue = data.venue || data;
      const daily = ['day', 'evening'].includes(form.priceUnit);
      const settingsResponse = await apiFetch(`/api/venues/${savedVenue.id}/booking-settings`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingMode: daily ? 'daily' : 'hourly',
          slotIncrementMinutes: daily ? 1440 : 60,
          minimumBookingMinutes: daily ? 1440 : 60,
          maximumBookingMinutes: daily ? 1440 : null,
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: 0,
          minimumNoticeHours: 0,
          maximumAdvanceDays: 365,
          currency: form.currency || 'SEK',
          hourlyRate: daily ? null : toNumber(form.priceFrom),
          dailyRate: daily ? toNumber(form.priceFrom) : null,
          invoiceDueDays: 30,
        }),
      });
      const settingsData = await settingsResponse.json();
      if (!settingsResponse.ok)
        throw new Error(getError(settingsData, 'Unable to save venue booking settings.'));
      const upload = async (file, kind) => {
        const body = new FormData();
        body.append('image', file);
        body.append('kind', kind);
        body.append(
          'altText',
          `${form.name || 'Venue'} ${kind === 'cover' ? 'cover' : 'gallery image'}`,
        );
        const imageResponse = await apiFetch(`/api/venues/${savedVenue.id}/media`, {
          method: 'POST',
          headers: authHeaders(),
          body,
        });
        const imageData = await imageResponse.json();
        if (!imageResponse.ok)
          throw new Error(getError(imageData, 'Unable to upload venue image.'));
      };
      if (pendingCover) await upload(pendingCover, 'cover');
      for (const image of pendingGallery) await upload(image, 'gallery');
      navigate('/profile/venues');
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
      }));
    } finally {
      setState((current) => ({
        ...current,
        saving: false,
      }));
    }
  };
  if (state.loading)
    return (
      <Shell title="Venue editor" noindex>
        <div className="max-w-3xl">
          <Skeleton className="h-11 w-2/5" />
          <Skeleton className="mt-8 h-96 w-full" />
        </div>
      </Shell>
    );
  return (
    <Shell title={editing ? 'Edit venue' : 'List a venue'} noindex>
      <PageHeader
        eyebrow="Venue workspace"
        title={editing ? 'Edit venue' : 'List a venue'}
        description={
          editing
            ? 'Changes to public listings are reviewed by YKCircle.'
            : 'Your organization owns this venue. New listings start as drafts until they are approved.'
        }
      />
      <div className="mt-6">
        <Link to="/profile/venues" className="text-sm text-primary underline">
          Back to my venues
        </Link>
      </div>
      <form onSubmit={save} className="mt-8 max-w-4xl space-y-9">
        <EditorSection title="Organization">
          {!editing && (
            <label className="text-sm font-medium sm:col-span-2">
              Owning organization
              <select
                value={form.organizationId || ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organizationId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Add a new organization</option>
                {organizations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-muted-foreground">
                Use an organization you already manage, or create one below.
              </span>
            </label>
          )}
          {form.organizationId ? (
            <p className="text-sm text-muted-foreground">
              This listing belongs to{' '}
              {organizations.find((item) => Number(item.id) === Number(form.organizationId))
                ?.name ||
                organization.name ||
                'your organization'}
              .{' '}
              <Link to="/account/organizations" className="text-primary underline">
                Manage organization
              </Link>
            </p>
          ) : (
            <>
              <Input
                label="Organization name"
                required
                value={organization.name}
                onChange={(event) =>
                  setOrganization((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <Input
                label="Organization website"
                type="url"
                value={organization.websiteUrl}
                onChange={(event) =>
                  setOrganization((current) => ({
                    ...current,
                    websiteUrl: event.target.value,
                  }))
                }
              />
              <Input
                label="Organization contact email"
                type="email"
                value={organization.contactEmail}
                onChange={(event) =>
                  setOrganization((current) => ({
                    ...current,
                    contactEmail: event.target.value,
                  }))
                }
              />
            </>
          )}
        </EditorSection>
        <EditorSection title="Your brand">
          <Input
            label="Business / brand name"
            value={form.businessName || ''}
            onChange={update('businessName')}
          />
          <LogoUpload
            label="Venue logo"
            value={form.logoImage}
            onChange={(logoImage) =>
              setForm((current) => ({
                ...current,
                logoImage,
              }))
            }
            onBusyChange={setLogoBusy}
            description="Your logo appears on invoices issued for this venue. Without one, we use your business or venue name."
          />
        </EditorSection>
        <EditorSection title="Venue details">
          <Input label="Venue name" required value={form.name} onChange={update('name')} />
          <FilterSelect
            label="Venue type"
            value={form.venueType}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                venueType: value,
              }))
            }
            options={taxonomy.value.venueTypes}
            placeholder="Choose a venue type"
          />
          <label className="sm:col-span-2 text-sm font-medium">
            Short description
            <textarea
              value={form.shortDescription}
              onChange={update('shortDescription')}
              className={textareaClass}
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">
            About this venue
            <textarea
              value={form.description}
              onChange={update('description')}
              className={textareaClass}
            />
          </label>
        </EditorSection>
        <EditorSection title="Location">
          <Input label="Address" value={form.addressLine1} onChange={update('addressLine1')} />
          <Input
            label="Address line 2"
            value={form.addressLine2}
            onChange={update('addressLine2')}
          />
          <Input label="Postal code" value={form.postalCode} onChange={update('postalCode')} />
          <Input label="City / locality" required value={form.city} onChange={update('city')} />
          <Input label="Municipality" value={form.municipality} onChange={update('municipality')} />
          <Input label="Region" value={form.region} onChange={update('region')} />
          <Input label="Country" required value={form.country} onChange={update('country')} />
          <FilterSelect
            label="Location privacy"
            value={form.locationVisibility}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                locationVisibility: value,
              }))
            }
            options={['exact', 'approximate', 'private_until_booking']}
            placeholder="Choose visibility"
          />
          <Input
            label="Latitude"
            type="number"
            value={form.latitude}
            onChange={update('latitude')}
          />
          <Input
            label="Longitude"
            type="number"
            value={form.longitude}
            onChange={update('longitude')}
          />
        </EditorSection>
        <EditorSection title="Capacity">
          <Input
            label="Minimum guests"
            type="number"
            value={form.capacityMin}
            onChange={update('capacityMin')}
          />
          <Input
            label="Maximum guests"
            type="number"
            value={form.capacityMax}
            onChange={update('capacityMax')}
          />
          <Input
            label="Standing capacity"
            type="number"
            value={form.standingCapacity}
            onChange={update('standingCapacity')}
          />
          <Input
            label="Seated capacity"
            type="number"
            value={form.seatedCapacity}
            onChange={update('seatedCapacity')}
          />
          <Input
            label="Dinner capacity"
            type="number"
            value={form.diningCapacity}
            onChange={update('diningCapacity')}
          />
          <Input
            label="Classroom capacity"
            type="number"
            value={form.classroomCapacity}
            onChange={update('classroomCapacity')}
          />
          <Input
            label="Size (m²)"
            type="number"
            value={form.sizeSqm}
            onChange={update('sizeSqm')}
          />
        </EditorSection>
        <EditorSection title="Pricing and availability">
          <label className="text-sm font-medium">
            Venue pricing
            <select
              value={form.pricingType}
              onChange={updatePricingType}
              className={inputClass}
              aria-describedby={
                !productConfiguration.paidVenuesEnabled ? 'venue-pricing-help' : undefined
              }
            >
              <option value="free">Free venue</option>
              <option value="paid" disabled={!productConfiguration.paidVenuesEnabled}>
                Paid venue
                {!productConfiguration.paidVenuesEnabled ? ' (currently unavailable)' : ''}
              </option>
            </select>
            {!productConfiguration.paidVenuesEnabled && (
              <span id="venue-pricing-help" className="mt-2 block text-xs text-muted-foreground">
                Paid venues are currently unavailable. Free venues have no booking charge.
              </span>
            )}
          </label>
          {form.pricingType === 'free' && (
            <p className="self-center text-sm text-muted-foreground">Free booking · no charge</p>
          )}
          {productConfiguration.paidVenuesEnabled &&
            editing &&
            form.pricingType === 'paid' &&
            Number(form.priceFrom) > 0 && (
              <div className="sm:col-span-2 rounded-lg border border-border p-4">
                <h2 className="font-medium">Get paid for bookings</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose your seller business details and how customers pay for this Venue.
                </p>
                <Link
                  to={`/account/payments/venues?venueId=${id}&edit=1&returnTo=${encodeURIComponent(window.location.pathname)}`}
                  className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline"
                >
                  Set up Venue payments
                </Link>
              </div>
            )}
          {form.pricingType === 'paid' && (
            <Input
              label="Starting price"
              required
              type="number"
              min="0.01"
              step="any"
              value={form.priceFrom}
              onChange={update('priceFrom')}
            />
          )}
          <FilterSelect
            label="Price unit"
            value={form.priceUnit}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                priceUnit: value,
              }))
            }
            options={['hour', 'half_day', 'day', 'evening', 'person', 'event', 'contact']}
            placeholder="Choose price unit"
          />
          <Input label="Currency" value={form.currency} onChange={update('currency')} />
          <FilterSelect
            label="Availability"
            value={form.availabilityType}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                availabilityType: value,
              }))
            }
            options={['contact', 'calendar', 'always_open']}
            placeholder="Choose availability"
          />
          <label className="sm:col-span-2 text-sm font-medium">
            Pricing description
            <textarea
              value={form.pricingDescription}
              onChange={update('pricingDescription')}
              className={textareaClass}
            />
          </label>
          <Input
            label="Minimum booking hours"
            type="number"
            value={form.minimumBookingHours}
            onChange={update('minimumBookingHours')}
          />
        </EditorSection>
        <EditorSection title="Weekly availability">
          <VenueScheduleEditor
            slots={form.availability}
            onChange={(availability) =>
              setForm((current) => ({
                ...current,
                availability,
              }))
            }
            galleryCount={pendingGallery.length}
          />
        </EditorSection>
        <EditorSection title="Suitable for">
          {taxonomy.value.eventTypes.map((item) => (
            <CheckOption
              key={item.slug}
              item={item}
              checked={form.suitableEventTypes.includes(item.slug)}
              onChange={() => toggle('suitableEventTypes', item.slug)}
            />
          ))}
        </EditorSection>
        <EditorSection title="Amenities">
          {taxonomy.value.amenities.map((item) => (
            <CheckOption
              key={item.slug}
              item={item}
              checked={form.amenities.includes(item.slug)}
              onChange={() => toggle('amenities', item.slug)}
            />
          ))}
        </EditorSection>
        <EditorSection title="Venue rules">
          <label className="sm:col-span-2 text-sm font-medium">
            House rules
            <textarea
              value={form.houseRulesText}
              onChange={update('houseRulesText')}
              placeholder="For example: external catering allowed; music until 22:30; no smoking."
              className={textareaClass}
            />
          </label>
        </EditorSection>
        <button
          disabled={state.saving || logoBusy}
          className="ui-action bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {state.saving ? 'Saving…' : editing ? 'Save changes' : 'Create venue draft'}
        </button>
      </form>
      {state.error && (
        <p
          role="alert"
          className="fixed bottom-6 left-5 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6"
        >
          {state.error}
        </p>
      )}
    </Shell>
  );
}
