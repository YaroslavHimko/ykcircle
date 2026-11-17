import { BookingDayTimeline } from './BookingDayTimeline.jsx';
export function VenueBookingPicker({
  venues,
  venueId,
  onVenueChange,
  selectedDate,
  onDateChange,
  schedule,
  selectedSlot,
  onSelectSlot,
  onConfirmSlot,
  selectedEventTime,
}) {
  const asMinutes = (value) => {
    if (typeof value === 'number') return value;
    const [hours = 0, minutes = 0] = String(value || '00:00')
      .slice(0, 5)
      .split(':')
      .map(Number);
    return hours * 60 + minutes;
  };
  const asTime = (value) =>
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const positive = (...values) =>
    values.map(Number).find((value) => Number.isFinite(value) && value > 0);
  const increment = positive(schedule.slotIncrementMinutes, schedule.slotIncrement) || 30;
  const minimumDuration =
    positive(
      schedule.minimumDurationMinutes,
      schedule.minDurationMinutes,
      schedule.minimumDuration,
      schedule.minimumBookingMinutes,
      Number(schedule.minimumBookingHours) * 60,
    ) || increment;
  const maximumDuration =
    positive(
      schedule.maximumDurationMinutes,
      schedule.maxDurationMinutes,
      schedule.maximumDuration,
      schedule.maximumBookingMinutes,
      Number(schedule.maximumBookingHours) * 60,
    ) || Infinity;
  const eventTimeOnSelectedDate =
    selectedEventTime?.date === selectedDate ? selectedEventTime : null;
  // While editing, the event's persisted range is not an available interval:
  // it is correctly returned as occupied by the API. Use it as the initial
  // visual selection so the manager can still see the event on the grid.
  const persistedInterval = eventTimeOnSelectedDate
    ? {
        startTime: eventTimeOnSelectedDate.start,
        endTime: eventTimeOnSelectedDate.end,
      }
    : null;
  const selectedInterval =
    selectedSlot?.interval ||
    (selectedSlot && persistedInterval ? persistedInterval : selectedSlot) ||
    persistedInterval;
  const intervalStart = asMinutes(selectedInterval?.startTime || selectedInterval?.start);
  const intervalEnd = asMinutes(selectedInterval?.endTime || selectedInterval?.end);
  const selectedStart = asMinutes(
    selectedSlot?.selectedStart ?? selectedInterval?.startTime ?? selectedInterval?.start,
  );
  const selectedEnd = asMinutes(
    selectedSlot?.selectedEnd ?? selectedInterval?.endTime ?? selectedInterval?.end,
  );
  const timeApplied = Boolean(
    eventTimeOnSelectedDate &&
    eventTimeOnSelectedDate.start === asTime(selectedStart) &&
    eventTimeOnSelectedDate.end === asTime(selectedEnd),
  );
  const startOptions = selectedInterval
    ? Array.from(
        {
          length: Math.max(
            0,
            Math.floor((intervalEnd - intervalStart - minimumDuration) / increment) + 1,
          ),
        },
        (_, index) => intervalStart + index * increment,
      )
    : [];
  const endOptions = selectedInterval
    ? Array.from(
        {
          length: Math.max(
            0,
            Math.floor(
              (Math.min(intervalEnd, selectedStart + maximumDuration) -
                selectedStart -
                minimumDuration) /
                increment,
            ) + 1,
          ),
        },
        (_, index) => selectedStart + minimumDuration + index * increment,
      )
    : [];
  const selectInterval = (interval, requestedStart) => {
    if (schedule.bookingMode === 'daily') {
      onSelectSlot({
        interval,
        selectedStart: 0,
        selectedEnd: 1439,
      });
      return;
    }
    const intervalStart = asMinutes(interval.startTime || interval.start);
    const end = asMinutes(interval.endTime || interval.end);
    const start = Math.max(
      intervalStart,
      Math.min(Number(requestedStart) || intervalStart, end - minimumDuration),
    );
    onSelectSlot({
      interval,
      selectedStart: start,
      selectedEnd: start + minimumDuration,
    });
  };
  const updateStart = (value) => {
    const nextStart = Number(value);
    const validEnd =
      selectedEnd > nextStart &&
      selectedEnd - nextStart >= minimumDuration &&
      selectedEnd - nextStart <= maximumDuration &&
      selectedEnd <= intervalEnd &&
      (selectedEnd - nextStart - minimumDuration) % increment === 0;
    onSelectSlot({
      ...(selectedSlot || {
        interval: selectedInterval,
      }),
      selectedStart: nextStart,
      selectedEnd: validEnd ? selectedEnd : nextStart + minimumDuration,
    });
  };
  const available = schedule.slots || [];
  if (schedule.bookingMode === 'daily')
    return (
      <div className="rounded-2xl sm:col-span-2 border border-border bg-secondary/10 p-4 sm:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Venue scheduling</p>
          <h3 className="mt-1 font-display text-2xl font-semibold">Book a full day</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This venue is charged per day / evening. Selecting an available date reserves the entire
            local day.
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Venue
            <select
              required
              value={venueId}
              onChange={(event) => onVenueChange(event.target.value)}
              className="mt-2 min-h-11 w-full border border-border bg-background px-3"
            >
              <option value="">Choose a venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                  {venue.location?.locality || venue.city
                    ? ` — ${venue.location?.locality || venue.city}`
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Date
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="mt-2 min-h-11 w-full border border-border bg-background px-3"
            />
          </label>
        </div>
        {!venueId ? (
          <p className="mt-5 text-sm text-muted-foreground">
            Choose a venue to see available dates.
          </p>
        ) : !selectedDate ? (
          <p className="mt-5 text-sm text-muted-foreground">Choose a date to check availability.</p>
        ) : schedule.loading ? (
          <p role="status" className="mt-5 text-sm text-muted-foreground">
            Loading availability…
          </p>
        ) : schedule.error ? (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {schedule.error}
          </p>
        ) : available.length ? (
          <div className="rounded-2xl mt-5 border border-primary/40 bg-background p-4">
            <p className="text-sm font-medium">
              {selectedSlot?.daily ? 'Full day selected' : 'This date is available'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onSelectSlot({
                    daily: true,
                    selectedStart: 0,
                    selectedEnd: 1439,
                  })
                }
                className="ui-action border border-border px-4 py-2 text-sm"
              >
                Select full day
              </button>
              <button
                type="button"
                disabled={!selectedSlot?.daily}
                onClick={onConfirmSlot}
                className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                Apply this day
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            This venue is not available on this date.
          </p>
        )}
      </div>
    );
  return (
    <div className="rounded-2xl sm:col-span-2 border border-border bg-secondary/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Venue scheduling</p>
          <h3 className="mt-1 font-display text-2xl font-semibold">Choose a booking time</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The venue’s current availability and duration rules determine which times can be
            selected.
          </p>
        </div>
        {schedule.timezone && (
          <p className="text-sm text-muted-foreground">Venue time: {schedule.timezone}</p>
        )}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Venue
          <select
            required
            value={venueId}
            onChange={(event) => onVenueChange(event.target.value)}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="">Choose a venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
                {venue.location?.locality || venue.city
                  ? ` — ${venue.location?.locality || venue.city}`
                  : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Date
          <input
            type="date"
            required
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          />
        </label>
      </div>
      {eventTimeOnSelectedDate?.start && eventTimeOnSelectedDate?.end && (
        <p className="rounded-2xl mt-4 border border-primary/40 bg-primary/5 p-3 text-sm">
          Event time:{' '}
          <strong>
            {eventTimeOnSelectedDate.start}–{eventTimeOnSelectedDate.end}
          </strong>
          <span className="ml-2 text-primary">Current booking</span>
        </p>
      )}
      {schedule.nextAvailable?.date && (
        <button
          type="button"
          onClick={() => onDateChange(schedule.nextAvailable.date)}
          className="ui-action mt-4 border border-accent/50 bg-accent/10 px-4 py-3 text-left text-sm hover:bg-accent/20"
        >
          <strong>Next available: {schedule.nextAvailable.date}</strong>
          <span className="ml-2">
            {schedule.nextAvailable.startTime}–{schedule.nextAvailable.endTime}
          </span>
          <span className="mt-1 block text-xs">Choose this date</span>
        </button>
      )}
      {!venueId ? (
        <p className="mt-5 text-sm text-muted-foreground">Choose a venue to see its free times.</p>
      ) : !selectedDate ? (
        <p className="mt-5 text-sm text-muted-foreground">Choose a date to see available times.</p>
      ) : schedule.loading ? (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          Loading availability…
        </p>
      ) : schedule.error ? (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {schedule.error}
        </p>
      ) : (
        <>
          {available.length ||
          schedule.unavailableSlots?.length ||
          schedule.unavailableIntervals?.length ? (
            <BookingDayTimeline
              available={available}
              unavailable={schedule.unavailableSlots || schedule.unavailableIntervals || []}
              selectedInterval={selectedInterval}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              onSelect={selectInterval}
              asMinutes={asMinutes}
              asTime={asTime}
            />
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No scheduled hours are available on this date.
            </p>
          )}
          {selectedInterval && (
            <div className="rounded-2xl mt-5 border border-primary/40 bg-background p-4">
              <p className="text-sm font-medium">Choose the booking time</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start and end are limited to the selected free interval and this venue’s booking
                rules.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Start
                  <select
                    value={selectedStart}
                    onChange={(event) => updateStart(event.target.value)}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  >
                    {startOptions.map((value) => (
                      <option key={value} value={value}>
                        {asTime(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  End
                  <select
                    value={selectedEnd}
                    onChange={(event) =>
                      onSelectSlot({
                        ...selectedSlot,
                        selectedEnd: Number(event.target.value),
                      })
                    }
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  >
                    {endOptions.map((value) => (
                      <option key={value} value={value}>
                        {asTime(value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm">
                  Selected:{' '}
                  <strong>
                    {asTime(selectedStart)}–{asTime(selectedEnd)}
                  </strong>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onConfirmSlot}
                    className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    {timeApplied ? 'Time applied' : 'Apply this time'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectSlot(null)}
                    className="ui-action border border-border px-4 py-2 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {timeApplied && (
                <p role="status" className="mt-3 text-sm text-primary">
                  Time applied to the event. Save the event to keep this selection.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
