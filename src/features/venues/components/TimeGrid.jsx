import {
  HOURS,
  isoDate,
  addDays,
  startOfWeek,
  time,
  dateForEntry,
  readableDate,
  statusLabel,
  entryClass,
  minutesForTime,
  GRID_START_HOUR,
  GRID_HOUR_HEIGHT,
} from '../model/venue-calendar.js';
export function TimeGrid({ days, entries, onDay, onEntry, publicView = false }) {
  const height = HOURS.length * GRID_HOUR_HEIGHT;
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[720px]">
        <div
          className="grid border-l border-t border-border"
          style={{
            gridTemplateColumns: `4.5rem repeat(${days.length}, minmax(9rem, 1fr))`,
          }}
        >
          <div className="border-b border-r border-border bg-secondary/30" />
          {days.map((day) => (
            <button
              key={isoDate(day)}
              type="button"
              onClick={() => onDay(day)}
              className="ui-action border-b border-r border-border bg-secondary/30 px-3 py-3 text-left text-sm hover:bg-secondary/60"
            >
              <span className="block font-medium">
                {new Intl.DateTimeFormat(undefined, {
                  weekday: 'short',
                }).format(day)}
              </span>
              <span className="text-muted-foreground">{day.getDate()}</span>
            </button>
          ))}
        </div>
        <div
          className="grid border-l border-border"
          style={{
            gridTemplateColumns: `4.5rem repeat(${days.length}, minmax(9rem, 1fr))`,
          }}
        >
          <div
            className="relative border-r border-border"
            style={{
              height,
            }}
          >
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-2 text-xs text-muted-foreground"
                style={{
                  top: (hour - GRID_START_HOUR) * GRID_HOUR_HEIGHT,
                }}
              >
                {String(hour).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          {days.map((day) => {
            const date = isoDate(day);
            const dayEntries = entries.filter((entry) => dateForEntry(entry) === date);
            return (
              <div
                key={date}
                className="relative border-r border-border"
                style={{
                  height,
                }}
              >
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    aria-label={`Select ${readableDate(date)} at ${String(hour).padStart(2, '0')}:00`}
                    onClick={() => onDay(day, `${String(hour).padStart(2, '0')}:00`)}
                    className="absolute left-0 right-0 border-b border-border/80 text-left hover:bg-secondary/40"
                    style={{
                      top: (hour - GRID_START_HOUR) * GRID_HOUR_HEIGHT,
                      height: GRID_HOUR_HEIGHT,
                    }}
                  />
                ))}
                {HOURS.slice(0, -1).map((hour) => (
                  <span
                    key={`half-${hour}`}
                    className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50"
                    style={{
                      top: (hour - GRID_START_HOUR + 0.5) * GRID_HOUR_HEIGHT,
                    }}
                  />
                ))}
                {dayEntries.map((entry, index) => {
                  const start = minutesForTime(entry.startTime || entry.start_time || entry.start);
                  const end = minutesForTime(entry.endTime || entry.end_time || entry.end);
                  const top = Math.max(0, (start / 60 - GRID_START_HOUR) * GRID_HOUR_HEIGHT);
                  const bottom = Math.min(height, (end / 60 - GRID_START_HOUR) * GRID_HOUR_HEIGHT);
                  if (bottom <= 0 || top >= height || bottom <= top) return null;
                  return (
                    <button
                      type="button"
                      key={entry.id || `${date}-${index}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEntry(entry);
                      }}
                      className={`ui-action absolute left-1 right-1 z-10 overflow-hidden border p-2 text-left text-xs leading-tight shadow-sm ${entryClass(entry)}`}
                      style={{
                        top: top + 2,
                        height: Math.max(24, bottom - top - 4),
                      }}
                      aria-label={`${statusLabel(entry)} ${time(entry.startTime || entry.start_time || entry.start)}–${time(entry.endTime || entry.end_time || entry.end)}`}
                    >
                      <span className="block font-semibold">{statusLabel(entry)}</span>
                      {!publicView && (
                        <span className="block truncate">
                          {entry.title || entry.eventName || entry.event?.title || ''}
                        </span>
                      )}
                      <span>
                        {time(entry.startTime || entry.start_time || entry.start)}–
                        {time(entry.endTime || entry.end_time || entry.end)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export function WeekGrid({ cursor, entries, onDay, onEntry, publicView = false }) {
  const week = startOfWeek(cursor);
  return (
    <TimeGrid
      days={Array.from(
        {
          length: 5,
        },
        (_, index) => addDays(week, index),
      )}
      entries={entries}
      onDay={onDay}
      onEntry={onEntry}
      publicView={publicView}
    />
  );
}
export function DayGrid({ date, entries, onSelect, onEntry, publicView = false }) {
  return (
    <TimeGrid
      days={[date]}
      entries={entries}
      onDay={onSelect}
      onEntry={onEntry}
      publicView={publicView}
    />
  );
}
