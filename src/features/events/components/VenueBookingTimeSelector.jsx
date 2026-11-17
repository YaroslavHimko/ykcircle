import { BusinessIdentitySelector } from '@/features/billing/index.js';
import { SelectedBookingTimeGrid } from './SelectedBookingTimeGrid.jsx';
export function VenueBookingTimeSelector({
  schedule,
  value,
  onChange,
  billingProfiles = [],
  buyerBillingProfileId,
  onBuyerBillingProfileChange,
}) {
  const toMinutes = (time) => {
    const [hours = 0, minutes = 0] = String(time || '00:00')
      .slice(0, 5)
      .split(':')
      .map(Number);
    return hours * 60 + minutes;
  };
  const toTime = (minutes) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const positive = (...values) =>
    values.map(Number).find((number) => Number.isFinite(number) && number > 0);
  const increment = positive(schedule.slotIncrementMinutes, schedule.slotIncrement) || 30;
  const minimum =
    positive(
      schedule.minimumDurationMinutes,
      schedule.minDurationMinutes,
      schedule.minimumDuration,
      schedule.minimumBookingMinutes,
      Number(schedule.minimumBookingHours) * 60,
    ) || increment;
  const maximum =
    positive(
      schedule.maximumDurationMinutes,
      schedule.maxDurationMinutes,
      schedule.maximumDuration,
      schedule.maximumBookingMinutes,
      Number(schedule.maximumBookingHours) * 60,
    ) || Infinity;
  const interval = value?.interval;
  const intervalStart = toMinutes(interval?.startTime || interval?.start);
  const intervalEnd = toMinutes(interval?.endTime || interval?.end);
  const start = value?.start ?? intervalStart;
  const end = value?.end ?? intervalEnd;
  const startOptions = interval
    ? Array.from(
        {
          length: Math.max(0, Math.floor((intervalEnd - intervalStart - minimum) / increment) + 1),
        },
        (_, index) => intervalStart + index * increment,
      )
    : [];
  const endOptions = interval
    ? Array.from(
        {
          length: Math.max(
            0,
            Math.floor((Math.min(intervalEnd, start + maximum) - start - minimum) / increment) + 1,
          ),
        },
        (_, index) => start + minimum + index * increment,
      )
    : [];
  const selectInterval = (nextInterval) => {
    const nextStart = toMinutes(nextInterval.startTime || nextInterval.start);
    onChange({
      interval: nextInterval,
      start: nextStart,
      end: nextStart + minimum,
    });
  };
  const updateStart = (nextStart) => {
    const startValue = Number(nextStart);
    const validEnd =
      end > startValue &&
      end - startValue >= minimum &&
      end - startValue <= maximum &&
      end <= intervalEnd &&
      (end - startValue - minimum) % increment === 0;
    onChange({
      ...value,
      start: startValue,
      end: validEnd ? end : startValue + minimum,
    });
  };
  return (
    <div className="mt-4">
      <p className="text-sm font-medium">Available intervals</p>
      {schedule.loading ? (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          Loading availability…
        </p>
      ) : schedule.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {schedule.error}
        </p>
      ) : schedule.slots?.length ||
        schedule.unavailableSlots?.length ||
        schedule.unavailableIntervals?.length ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {schedule.slots.map((slot, index) => (
              <button
                key={`${slot.startTime || slot.start}-${index}`}
                type="button"
                onClick={() => selectInterval(slot)}
                className={`ui-action border px-3 py-2 text-sm ${interval === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-accent/50 bg-accent/10'}`}
              >
                {String(slot.startTime || slot.start).slice(0, 5)}–
                {String(slot.endTime || slot.end).slice(0, 5)}
              </button>
            ))}
          </div>
          <SelectedBookingTimeGrid
            schedule={schedule}
            value={
              interval
                ? {
                    start,
                    end,
                  }
                : null
            }
          />
          {interval && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Start
                <select
                  value={start}
                  onChange={(event) => updateStart(event.target.value)}
                  className="mt-1 min-h-11 w-full border border-border bg-background px-3"
                >
                  {startOptions.map((option) => (
                    <option key={option} value={option}>
                      {toTime(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                End
                <select
                  value={end}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      end: Number(event.target.value),
                    })
                  }
                  className="mt-1 min-h-11 w-full border border-border bg-background px-3"
                >
                  {endOptions.map((option) => (
                    <option key={option} value={option}>
                      {toTime(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {interval && (
            <div className="mt-4">
              <BusinessIdentitySelector
                context="venue_buyer"
                profiles={billingProfiles}
                value={buyerBillingProfileId}
                onChange={onBuyerBillingProfileChange}
              />
              <p className="text-xs text-muted-foreground">Required only when the Venue charges.</p>
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No bookable time is available on this date.
        </p>
      )}
    </div>
  );
}
