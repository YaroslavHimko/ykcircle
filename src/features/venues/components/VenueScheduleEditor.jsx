import { useEffect, useState } from 'react';
import { inputClass } from '../model/venue-marketplace.js';
export function VenueScheduleEditor({ slots = [], onChange, galleryCount = 0 }) {
  const weekdays = [
    [1, 'Mon'],
    [2, 'Tue'],
    [3, 'Wed'],
    [4, 'Thu'],
    [5, 'Fri'],
    [6, 'Sat'],
    [0, 'Sun'],
  ];
  const hours = Array.from(
    {
      length: 14,
    },
    (_, index) => index + 7,
  );
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selected, setSelected] = useState(null);
  const formatTime = (hour) => `${String(hour).padStart(2, '0')}:00`;
  const timeToMinutes = (value) => {
    const [hoursValue, minutes = 0] = String(value || '00:00')
      .split(':')
      .map(Number);
    return hoursValue * 60 + minutes;
  };
  const [compactSchedule, setCompactSchedule] = useState(
    () => window.matchMedia('(max-width: 1023px)').matches,
  );
  const [selectedWeekday, setSelectedWeekday] = useState(1);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setCompactSchedule(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const displayedWeekdays = compactSchedule
    ? weekdays.filter(([weekday]) => weekday === selectedWeekday)
    : weekdays.slice(0, 5);
  const hourHeight = 72;
  const gridHeight = hours.length * hourHeight;
  const removeInterval = (index) => onChange(slots.filter((_, slotIndex) => slotIndex !== index));
  const selectCell = (weekday, hour) => {
    const matchingIndex = slots.findIndex(
      (slot) =>
        Number(slot.weekday) === weekday &&
        timeToMinutes(slot.startTime) < (hour + 1) * 60 &&
        timeToMinutes(slot.endTime) > hour * 60,
    );
    if (matchingIndex >= 0) {
      setSelected({
        index: matchingIndex,
        ...slots[matchingIndex],
      });
      return;
    }
    const interval = {
      weekday,
      startTime: formatTime(hour),
      endTime: formatTime(hour + 1),
    };
    onChange([...slots, interval]);
    setSelected({
      index: slots.length,
      ...interval,
    });
  };
  const updateSelected = (key, value) => {
    if (!selected) return;
    const next = {
      ...selected,
      [key]: key === 'weekday' ? Number(value) : value,
    };
    setSelected(next);
    onChange(
      slots.map((slot, index) =>
        index === selected.index
          ? {
              weekday: next.weekday,
              startTime: next.startTime,
              endTime: next.endTime,
            }
          : slot,
      ),
    );
  };
  const today = new Date();
  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Set regular hours on a work-week timeline. Click an empty hour to add availability, or
            select a block to edit its start and end time.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your browser timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}.
            These hours repeat weekly.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setWeekStart(
              new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - ((today.getDay() + 6) % 7),
              ),
            )
          }
          className="ui-action border border-border px-3 py-2 text-sm"
        >
          Today
        </button>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() =>
            setWeekStart(
              (current) =>
                new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7),
            )
          }
          className="ui-action min-h-10 border border-border px-3"
        >
          ‹
        </button>
        <p className="min-w-0 flex-1 text-sm font-medium">
          Work week of{' '}
          {weekStart.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <button
          type="button"
          aria-label="Next week"
          onClick={() =>
            setWeekStart(
              (current) =>
                new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7),
            )
          }
          className="ui-action min-h-10 border border-border px-3"
        >
          ›
        </button>
      </div>
      <label className="mt-4 block text-sm font-medium lg:hidden">
        Day
        <select
          value={selectedWeekday}
          onChange={(event) => setSelectedWeekday(Number(event.target.value))}
          className={inputClass}
        >
          {weekdays.map(([weekday, label]) => (
            <option key={weekday} value={weekday}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3">
        <div className="min-w-0">
          <div
            className="grid border-l border-t border-border"
            style={{
              gridTemplateColumns: `4rem repeat(${displayedWeekdays.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="border-b border-r border-border bg-secondary/30" />
            {displayedWeekdays.map(([weekday, label]) => {
              const calendarDate = new Date(weekStart);
              calendarDate.setDate(weekStart.getDate() + ((weekday + 6) % 7));
              return (
                <div
                  key={weekday}
                  className="border-b border-r border-border bg-secondary/30 px-3 py-3 text-left text-sm"
                >
                  <strong className="block">{label}</strong>
                  <span className="text-muted-foreground">{calendarDate.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div
            className="grid border-l border-border"
            style={{
              gridTemplateColumns: `4rem repeat(${displayedWeekdays.length}, minmax(0, 1fr))`,
            }}
          >
            <div
              className="relative border-r border-border"
              style={{
                height: gridHeight,
              }}
            >
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-2 text-xs text-muted-foreground"
                  style={{
                    top: (hour - 7) * hourHeight,
                  }}
                >
                  {formatTime(hour)}
                </span>
              ))}
            </div>
            {displayedWeekdays.map(([weekday]) => (
              <div
                key={weekday}
                className="relative border-r border-border"
                style={{
                  height: gridHeight,
                }}
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => selectCell(weekday, hour)}
                    aria-label={`Add availability on ${weekdays.find(([day]) => day === weekday)?.[1]} at ${formatTime(hour)}`}
                    className="absolute left-0 right-0 border-b border-border/80 hover:bg-secondary/40"
                    style={{
                      top: (hour - 7) * hourHeight,
                      height: hourHeight,
                    }}
                  />
                ))}
                {hours.slice(0, -1).map((hour) => (
                  <span
                    key={`half-${hour}`}
                    className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50"
                    style={{
                      top: (hour - 6.5) * hourHeight,
                    }}
                  />
                ))}
                {slots.map((slot, index) => {
                  if (Number(slot.weekday) !== weekday) return null;
                  const top = Math.max(0, (timeToMinutes(slot.startTime) / 60 - 7) * hourHeight);
                  const bottom = Math.min(
                    gridHeight,
                    (timeToMinutes(slot.endTime) / 60 - 7) * hourHeight,
                  );
                  if (bottom <= top) return null;
                  return (
                    <button
                      type="button"
                      key={`${weekday}-${index}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected({
                          index,
                          ...slot,
                        });
                      }}
                      className="ui-action absolute left-1 right-1 z-10 border border-accent/50 bg-accent/10 p-2 text-left text-xs shadow-sm hover:bg-accent/20"
                      style={{
                        top: top + 2,
                        height: Math.max(24, bottom - top - 4),
                      }}
                    >
                      <strong className="block">Available</strong>
                      {slot.startTime}–{slot.endTime}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="border border-accent/50 bg-accent/10 px-2 py-1">Available every week</span>
        <span className="px-2 py-1 text-muted-foreground">
          Click an empty time to add availability
        </span>
      </div>
      {selected && (
        <div className="rounded-2xl mt-5 border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold">Edit availability</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This applies every{' '}
                {weekdays.find(([weekday]) => weekday === Number(selected.weekday))?.[1] || 'week'}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                removeInterval(selected.index);
                setSelected(null);
              }}
              className="text-sm text-destructive"
            >
              Remove block
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Day
              <select
                value={selected.weekday}
                onChange={(event) => updateSelected('weekday', event.target.value)}
                className={inputClass}
              >
                {weekdays.map(([weekday, label]) => (
                  <option key={weekday} value={weekday}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Start
              <input
                type="time"
                value={selected.startTime}
                onChange={(event) => updateSelected('startTime', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium">
              End
              <input
                type="time"
                value={selected.endTime}
                onChange={(event) => updateSelected('endTime', event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      )}
      <div className="mt-5">
        <h3 className="font-display text-xl font-semibold">Regular availability</h3>
        {slots.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {slots.map((slot, index) => (
              <button
                key={`${slot.weekday}-${slot.startTime}-${index}`}
                type="button"
                onClick={() =>
                  setSelected({
                    index,
                    ...slot,
                  })
                }
                className="ui-action border border-border bg-background px-3 py-2 text-sm hover:border-primary"
              >
                {weekdays.find(([weekday]) => weekday === Number(slot.weekday))?.[1]} ·{' '}
                {slot.startTime}–{slot.endTime}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No regular availability selected yet.
          </p>
        )}
      </div>
      <div className="mt-7 border-t border-border pt-5">
        <h3 className="font-display text-xl font-semibold">Venue photos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A cover photo is required. Add optional gallery photos for the venue details page.
        </p>
        <label className="mt-4 block text-sm font-medium">
          Cover image
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) =>
              window.dispatchEvent(
                new CustomEvent('ykcircle:venue-cover-selected', {
                  detail: event.target.files?.[0] || null,
                }),
              )
            }
            className={inputClass}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Gallery images
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              window.dispatchEvent(
                new CustomEvent('ykcircle:venue-gallery-selected', {
                  detail: Array.from(event.target.files || []),
                }),
              );
              event.target.value = '';
            }}
            className={inputClass}
          />
        </label>
        {galleryCount > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {galleryCount} gallery {galleryCount === 1 ? 'image' : 'images'} ready to upload. Choose
            more to add them.
          </p>
        )}
      </div>
    </div>
  );
}
