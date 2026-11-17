import {
  DAYS,
  isoDate,
  addDays,
  startOfMonth,
  dateForEntry,
  statusLabel,
} from '../model/venue-calendar.js';
export function MonthGrid({ cursor, entries, onDay, publicView = false }) {
  const first = startOfMonth(cursor);
  const start = addDays(first, -first.getDay() + 1);
  const cells = Array.from(
    {
      length: 42,
    },
    (_, index) => addDays(start, index),
  );
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[680px] border-l border-t border-border">
        <div className="grid grid-cols-7">
          {DAYS.slice(1)
            .concat(DAYS[0])
            .map((day) => (
              <div
                key={day}
                className="border-b border-r border-border bg-secondary/30 p-2 text-sm font-medium"
              >
                {day.slice(0, 3)}
              </div>
            ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day) => {
            const date = isoDate(day);
            const dayEntries = entries.filter((entry) => dateForEntry(entry) === date);
            const available = dayEntries.filter((entry) =>
              ['Available', 'Date-specific availability'].includes(statusLabel(entry)),
            ).length;
            const requests = dayEntries.filter(
              (entry) => statusLabel(entry) === 'Booking request',
            ).length;
            const occupied = dayEntries.filter(
              (entry) =>
                !['Available', 'Date-specific availability', 'Booking request'].includes(
                  statusLabel(entry),
                ),
            ).length;
            return (
              <button
                type="button"
                key={date}
                onClick={() => onDay(day)}
                className={`min-h-28 border-b border-r border-border p-2 text-left hover:bg-secondary/30 ${day.getMonth() !== cursor.getMonth() ? 'text-muted-foreground' : ''}`}
              >
                <span className="font-medium">{day.getDate()}</span>
                {publicView ? (
                  <p className="mt-3 text-xs font-medium">
                    {available ? 'Available' : 'Unavailable'}
                  </p>
                ) : (
                  <div className="mt-3 space-y-1 text-xs">
                    <p>
                      {occupied ? `${occupied} booking${occupied === 1 ? '' : 's'}` : 'No bookings'}
                    </p>
                    {requests > 0 && (
                      <p className="text-amber-700">
                        {requests} request{requests === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
