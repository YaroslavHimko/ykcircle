import { Link } from 'react-router-dom';
import LogoUpload from '@/shared/components/LogoUpload.jsx';
import { deviceTimezone } from '@/shared/utils/time.js';
import { VenueBookingPicker } from '@/features/events/components/VenueBookingPicker.jsx';
import GoogleLocationPicker from '@/shared/components/GoogleLocationPicker.jsx';
export function EventEditorPanel({
  editPage,
  draftSaved,
  save,
  input,
  creationPage,
  managedGroups,
  form,
  update,
  draftId,
  setForm,
  setLogoBusy,
  errors,
  pendingCover,
  uploadCover,
  uploading,
  categories,
  types,
  venues,
  setPendingVenueSlot,
  selectedVenueDate,
  venueSchedule,
  pendingVenueSlot,
  organizers,
  productConfiguration,
  logoBusy,
}) {
  return (
    <section className="mt-12 border-y border-border py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Event workspace</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">
            {editPage ? 'Edit an event' : 'Create an experience'}
          </h2>
        </div>
        {editPage && (
          <Link
            to="/profile/events/new"
            className="ui-action inline-flex min-h-11 items-center border border-border px-4 text-sm"
          >
            Create an event
          </Link>
        )}
      </div>
      <form
        style={
          draftSaved
            ? {
                display: 'none',
              }
            : undefined
        }
        onSubmit={save}
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {input('title', 'Title', 'text', true)}
        {creationPage && managedGroups.length > 0 && (
          <label className="block text-sm">
            Post to group
            <select
              name="groupId"
              value={
                managedGroups.some((group) => String(group.id) === String(form.groupId))
                  ? form.groupId
                  : ''
              }
              onChange={update}
              disabled={Boolean(draftId)}
              className="mt-2 min-h-11 w-full border border-border bg-background px-3 disabled:opacity-60"
            >
              <option value="">No group</option>
              {managedGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              Publishing notifies current members of the selected group.
            </span>
          </label>
        )}
        {input('shortDescription', 'Short description')}
        {input('brandName', 'Organizer / brand name')}
        <LogoUpload
          label="Organizer logo"
          value={form.logoImage}
          onChange={(logoImage) =>
            setForm((current) => ({
              ...current,
              logoImage,
            }))
          }
          onBusyChange={setLogoBusy}
          description="Your branding appears on event emails and tickets. Without a logo, we use your brand name."
        />
        {errors.logoImage && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2">
            {errors.logoImage}
          </p>
        )}
        <label className="block text-sm sm:col-span-2">
          Cover image
          {form.coverImage && <span className="ml-2 text-xs text-primary">Uploaded</span>}
          {pendingCover && !form.coverImage && (
            <span className="ml-2 text-xs text-primary">Selected: {pendingCover.name}</span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadCover}
            disabled={uploading}
            className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            JPEG, PNG or WebP, maximum 10 MB.
          </span>
          {errors.coverImage && (
            <span className="mt-1 block text-xs text-destructive">{errors.coverImage}</span>
          )}
        </label>
        <label className="block text-sm">
          Category
          <select
            required
            name="categoryId"
            value={form.categoryId}
            onChange={update}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="">Select category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Event type
          <select
            required
            name="typeId"
            value={form.typeId}
            onChange={update}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="">Select type</option>
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="rounded-2xl grid gap-4 border border-border p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Where is your event?</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="locationType"
              value="venue"
              checked={form.locationType === 'venue'}
              onChange={update}
            />
            At a YKCircle venue
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="locationType"
              value="custom"
              checked={form.locationType === 'custom'}
              onChange={() =>
                setForm((current) => ({
                  ...current,
                  locationType: 'custom',
                  timezone: deviceTimezone(),
                }))
              }
            />
            At another location
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="locationType"
              value="online"
              checked={form.locationType === 'online'}
              onChange={() =>
                setForm((current) => ({
                  ...current,
                  locationType: 'online',
                  timezone: deviceTimezone(),
                }))
              }
            />
            Online
          </label>
          {form.locationType === 'venue' && (
            <VenueBookingPicker
              venues={venues}
              venueId={form.venueId}
              onVenueChange={(venueId) => {
                const venue = venues.find((item) => String(item.id) === String(venueId));
                setForm((current) => ({
                  ...current,
                  venueId,
                  timezone: venue?.timezone || deviceTimezone(),
                }));
                setPendingVenueSlot(null);
              }}
              selectedDate={selectedVenueDate}
              onDateChange={(date) => {
                setForm((current) => ({
                  ...current,
                  startsAt: `${date}T${current.startsAt?.slice(11, 16) || '09:00'}`,
                  endsAt: current.endsAt ? `${date}T${current.endsAt.slice(11, 16)}` : '',
                }));
                setPendingVenueSlot(null);
              }}
              schedule={venueSchedule}
              selectedSlot={pendingVenueSlot}
              onSelectSlot={setPendingVenueSlot}
              onConfirmSlot={() => {
                const clock = (value) =>
                  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
                setForm((current) => ({
                  ...current,
                  startsAt: `${venueSchedule.date}T${clock(pendingVenueSlot.selectedStart)}`,
                  endsAt: `${venueSchedule.date}T${clock(pendingVenueSlot.selectedEnd)}`,
                  timezone: venueSchedule.timezone || deviceTimezone(),
                }));
              }}
              selectedEventTime={
                form.startsAt && form.endsAt
                  ? {
                      date: form.startsAt.slice(0, 10),
                      start: form.startsAt.slice(11, 16),
                      end: form.endsAt.slice(11, 16),
                    }
                  : null
              }
            />
          )}
          {form.locationType === 'custom' && (
            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Search for an address</p>
              <div className="mt-2">
                <GoogleLocationPicker
                  onSelect={(place) =>
                    setForm((current) => ({
                      ...current,
                      ...place,
                      country: place.country || current.country,
                      city: place.locality || current.city,
                    }))
                  }
                />
              </div>
              {form.formattedAddress ? (
                <p className="rounded-2xl mt-3 border border-border bg-secondary/20 p-3 text-sm">
                  <span className="text-muted-foreground">Selected location</span>
                  <br />
                  {form.formattedAddress}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Search and choose an address on the map. Google will save its address details and
                  coordinates automatically.
                </p>
              )}
            </div>
          )}
          {form.locationType === 'online' && (
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                The event is online. Joining links are shown only to the event manager/admin.
              </p>
              {input('onlinePlatform', 'Platform (for example, Zoom)')}
              {input('onlineUrl', 'Joining URL', 'url')}
            </div>
          )}
        </fieldset>
        {form.locationType !== 'venue' && input('startsAt', 'Starts', 'datetime-local', true)}
        {form.locationType !== 'venue' && input('endsAt', 'Ends', 'datetime-local', true)}
        {form.locationType === 'venue' && errors.endsAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.endsAt}
          </p>
        )}
        {creationPage && !draftId && (
          <div className="rounded-2xl grid gap-4 border border-border p-4 sm:col-span-2 sm:grid-cols-3">
            <label className="block text-sm">
              Repeat
              <select
                name="recurrenceFrequency"
                value={form.recurrenceFrequency}
                onChange={update}
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            {form.recurrenceFrequency !== 'none' && (
              <>
                <label className="block text-sm">
                  Every
                  <input
                    required
                    min="1"
                    max="52"
                    name="recurrenceInterval"
                    type="number"
                    value={form.recurrenceInterval}
                    onChange={update}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {form.recurrenceFrequency === 'daily'
                      ? 'day(s)'
                      : form.recurrenceFrequency === 'weekly'
                        ? 'week(s)'
                        : 'month(s)'}
                  </span>
                </label>
                <label className="block text-sm">
                  Occurrences
                  <input
                    required
                    min="2"
                    max="100"
                    name="recurrenceCount"
                    type="number"
                    value={form.recurrenceCount}
                    onChange={update}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Includes the first event.
                  </span>
                </label>
              </>
            )}
            {errors.recurrence && (
              <p className="text-sm text-destructive sm:col-span-3">{errors.recurrence}</p>
            )}
          </div>
        )}
        <label className="block text-sm">
          Organizing account
          <select
            name="organizerOrganizationId"
            value={form.organizerOrganizationId || ''}
            onChange={update}
            disabled={Boolean(draftId)}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="">Personal account</option>
            {organizers.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-muted-foreground">
            Publishing uses this account's subscription. The organizer is fixed when you save the
            draft.
          </span>
        </label>
        {productConfiguration.subscriptionsEnabled && (
          <p className="text-sm text-muted-foreground">
            Drafts are always available. Publishing requires an active subscription or publishing
            access for the organizing account.
          </p>
        )}
        <label className="block text-sm">
          Pricing
          <select
            name="pricingType"
            value={form.pricingType}
            onChange={update}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="free">Free</option>
            <option value="paid" disabled={!productConfiguration.paidEventsEnabled}>
              Paid{!productConfiguration.paidEventsEnabled ? ' (currently unavailable)' : ''}
            </option>
          </select>
        </label>
        {form.pricingType === 'paid' && input('fee', 'Fee', 'number', true)}
        <label className="block text-sm">
          Event visibility
          <select
            name="visibility"
            value={form.visibility}
            onChange={update}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
          {form.visibility === 'Public' && (
            <span className="mt-2 block border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-foreground">
              Public — anyone can view this and it may appear in search engines.
            </span>
          )}
        </label>
        <label className="block text-sm sm:col-span-2">
          Description
          <textarea
            required
            name="description"
            value={form.description}
            onChange={update}
            rows="4"
            className="mt-2 w-full border border-border bg-background px-3 py-3"
          />
          {errors.description && (
            <span className="mt-1 block text-xs text-destructive">{errors.description}</span>
          )}
        </label>
        <label className="block text-sm sm:col-span-2">
          Food options <span className="text-muted-foreground">(optional)</span>
          <textarea
            value={form.foodOptions.join('\n')}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                foodOptions: event.target.value.split('\n'),
              }))
            }
            rows="3"
            placeholder={'Vegetarian\nVegan\nChicken'}
            className="mt-2 w-full border border-border bg-background px-3 py-3"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            One option per line, up to 12. These will be shown before someone registers.
          </span>
          {errors.foodOptions && (
            <span className="mt-1 block text-xs text-destructive">{errors.foodOptions}</span>
          )}
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            disabled={logoBusy}
            className="ui-action min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-60"
          >
            {logoBusy ? 'Preparing logo…' : editPage ? 'Save' : 'Save draft'}
          </button>
        </div>
      </form>
    </section>
  );
}
