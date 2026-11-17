export function SelectedBookingTimeGrid({ schedule, value }) {
  const slots = schedule.slots || [];
  const unavailable = schedule.unavailableSlots || schedule.unavailableIntervals || [];
  const toMinutes = (time) => {
    const [hours = 0, minutes = 0] = String(time || '00:00')
      .slice(0, 5)
      .split(':')
      .map(Number);
    return hours * 60 + minutes;
  };
  const toTime = (minutes) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const hours = Array.from(
    {
      length: 15,
    },
    (_, index) => index + 7,
  );
  const hourHeight = 52;
  const height = hours.length * hourHeight;
  const position = (start, end) => ({
    top: Math.max(0, (start / 60 - 7) * hourHeight),
    bottom: Math.min(height, (end / 60 - 7) * hourHeight),
  });
  const selected = position(value?.start, value?.end);
  const selectedHeight = Math.max(0, selected.bottom - selected.top - 4);
  const block = (slot, index, isUnavailable) => {
    const start = toMinutes(slot.startTime || slot.start);
    const end = toMinutes(slot.endTime || slot.end);
    const range = position(start, end);
    const blockHeight = Math.max(0, range.bottom - range.top - 4);
    if (!blockHeight) return null;
    const label = `${isUnavailable ? 'Unavailable' : 'Available'} ${toTime(start)}-${toTime(end)}`;
    return (
      <div
        key={`${isUnavailable ? 'unavailable' : 'available'}-${start}-${index}`}
        title={label}
        className={`rounded-2xl absolute left-2 right-2 overflow-hidden border p-2 text-xs ${isUnavailable ? 'z-20 border-slate-500 bg-slate-500 text-white' : 'z-10 border-accent/50 bg-accent/10 text-muted-foreground'}`}
        style={{
          top: range.top + 2,
          height: blockHeight,
        }}
      >
        <span className="block truncate">{label}</span>
      </div>
    );
  };
  return (
    <div
      className="mt-5 overflow-auto border border-border bg-background"
      style={{
        maxHeight: '30rem',
      }}
    >
      <div className="min-w-[19rem]">
        <div className="grid grid-cols-[4.5rem_1fr] border-b border-border bg-secondary/30">
          <div className="border-r border-border" />
          <div className="px-3 py-2 text-sm font-medium">Selected venue time</div>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr]">
          <div
            className="relative border-r border-border"
            style={{
              height,
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
                {toTime(hour * 60)}
              </span>
            ))}
          </div>
          <div
            className="relative"
            style={{
              height,
            }}
          >
            {hours.map((hour) => (
              <span
                key={hour}
                className="absolute left-0 right-0 border-b border-border/80"
                style={{
                  top: (hour - 7) * hourHeight,
                }}
              />
            ))}
            {hours.slice(0, -1).map((hour) => (
              <span
                key={`half-${hour}`}
                className="absolute left-0 right-0 border-b border-dashed border-border/50"
                style={{
                  top: (hour - 6.5) * hourHeight,
                }}
              />
            ))}
            {unavailable.map((slot, index) => block(slot, index, true))}
            {slots.map((slot, index) => block(slot, index, false))}
            {Number.isFinite(value?.start) &&
              Number.isFinite(value?.end) &&
              value.end > value.start &&
              selectedHeight > 0 && (
                <div
                  className={`pointer-events-none absolute left-3 right-3 z-30 overflow-hidden border-2 border-primary bg-primary font-semibold text-primary-foreground shadow-sm ${selectedHeight < 42 ? 'flex items-center px-2 text-xs' : 'p-2 text-xs'}`}
                  style={{
                    top: selected.top + 2,
                    height: selectedHeight,
                  }}
                >
                  <span className="truncate">
                    Selected: {toTime(value.start)}-{toTime(value.end)}
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
