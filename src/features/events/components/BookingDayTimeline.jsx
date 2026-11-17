export function BookingDayTimeline({
  available,
  unavailable = [],
  selectedInterval,
  selectedStart,
  selectedEnd,
  onSelect,
  asMinutes,
  asTime,
}) {
  const hours = Array.from(
    {
      length: 15,
    },
    (_, index) => index + 7,
  );
  const hourHeight = 64;
  const height = hours.length * hourHeight;
  const range = (start, end) => ({
    top: Math.max(0, (start / 60 - 7) * hourHeight),
    bottom: Math.min(height, (end / 60 - 7) * hourHeight),
  });
  const selected = range(selectedStart, selectedEnd);
  const selectedHeight = Math.max(0, selected.bottom - selected.top - 6);
  return (
    <div
      className="mt-5 overflow-auto border border-border bg-background"
      style={{
        maxHeight: '34rem',
      }}
    >
      <div className="min-w-[20rem]">
        <div className="grid grid-cols-[4.5rem_1fr] border-b border-border bg-secondary/30">
          <div className="border-r border-border" />
          <div className="px-3 py-3 text-sm font-medium">
            Bookable venue time{' '}
            <span className="ml-2 text-xs font-normal text-muted-foreground">30-minute slots</span>
          </div>
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
                {asTime(hour * 60)}
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
                className="pointer-events-none absolute left-0 right-0 border-b border-border/80"
                style={{
                  top: (hour - 7) * hourHeight,
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
            {unavailable.map((slot, index) => {
              const start = asMinutes(slot.startTime || slot.start);
              const end = asMinutes(slot.endTime || slot.end);
              const position = range(start, end);
              const blockHeight = Math.max(0, position.bottom - position.top - 6);
              if (!blockHeight) return null;
              const compact = blockHeight < 50;
              return (
                <div
                  key={`unavailable-${slot.startTime || slot.start}-${index}`}
                  title={`Unavailable: ${asTime(start)}-${asTime(end)}`}
                  className={`pointer-events-none absolute left-2 right-2 z-20 overflow-hidden border border-slate-500 bg-slate-500 text-left text-white ${compact ? 'flex items-center px-2 text-xs' : 'p-3 text-sm'}`}
                  style={{
                    top: position.top + 3,
                    height: blockHeight,
                  }}
                >
                  {compact ? (
                    <span className="truncate">Unavailable</span>
                  ) : (
                    <>
                      <strong className="block">Unavailable</strong>
                      <span className="mt-1 block text-xs">
                        {asTime(start)}-{asTime(end)}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
            {available.map((slot, index) => {
              const start = asMinutes(slot.startTime || slot.start);
              const end = asMinutes(slot.endTime || slot.end);
              const position = range(start, end);
              const blockHeight = Math.max(0, position.bottom - position.top - 6);
              if (!blockHeight) return null;
              const compact = blockHeight < 50;
              return (
                <button
                  key={`${slot.startTime || slot.start}-${index}`}
                  type="button"
                  aria-pressed={selectedInterval === slot}
                  onClick={(event) => {
                    const minutesFromTop =
                      ((event.clientY - event.currentTarget.getBoundingClientRect().top) /
                        event.currentTarget.getBoundingClientRect().height) *
                      (end - start);
                    const clickedStart =
                      start +
                      Math.max(0, Math.min(end - start - 30, Math.floor(minutesFromTop / 30) * 30));
                    onSelect(slot, clickedStart);
                  }}
                  className={`absolute left-2 right-2 z-10 overflow-hidden border border-accent/50 bg-accent/10 text-left shadow-sm hover:bg-accent/20 ${compact ? 'px-2 text-xs' : 'p-3 text-sm'}`}
                  style={{
                    top: position.top + 3,
                    height: blockHeight,
                  }}
                >
                  {compact ? (
                    <span className="block truncate">
                      {asTime(start)}-{asTime(end)}
                    </span>
                  ) : (
                    <>
                      <strong className="block">
                        {asTime(start)}-{asTime(end)}
                      </strong>
                      <span className="mt-1 block text-xs opacity-80">
                        Click a 30-minute position to start there
                      </span>
                    </>
                  )}
                </button>
              );
            })}
            {selectedInterval &&
              selectedEnd > selectedStart &&
              selected.top >= 0 &&
              selected.top < height &&
              selectedHeight > 0 && (
                <div
                  className={`pointer-events-none absolute left-3 right-3 z-30 overflow-hidden border-2 border-primary bg-primary font-semibold text-primary-foreground shadow-sm ${selectedHeight < 50 ? 'flex items-center px-2 text-xs' : 'p-2 text-xs'}`}
                  style={{
                    top: selected.top + 3,
                    height: selectedHeight,
                  }}
                >
                  {selectedHeight < 50 ? (
                    <span className="truncate">
                      Selected: {asTime(selectedStart)}-{asTime(selectedEnd)}
                    </span>
                  ) : (
                    <>
                      Selected: {asTime(selectedStart)}-{asTime(selectedEnd)}
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
