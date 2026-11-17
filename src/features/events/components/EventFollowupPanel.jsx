export function EventFollowupPanel({
  event,
  finishEvent,
  finishingEvent,
  followups,
  followupDrafts,
  followupBusy,
  setFollowupDrafts,
  saveFollowup,
  sendFollowup,
  followupMessage,
  followupError,
}) {
  return (
    <section className="rounded-2xl mt-8 max-w-2xl border border-border p-5">
      <h2 className="font-display text-2xl font-semibold">Finish event and follow up</h2>
      {event.status === 'Published' ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            After the scheduled end, mark the event finished to prepare attendance-based emails. For
            events without an end time, this is available after the start.
          </p>
          <button
            type="button"
            onClick={finishEvent}
            disabled={
              finishingEvent ||
              !event.startsAt ||
              new Date(event.endsAt || event.startsAt).getTime() > Date.now()
            }
            className="ui-action mt-4 min-h-10 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
          >
            {finishingEvent ? 'Finishing…' : 'Mark as finished'}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Only people marked Attended or No Show receive a follow-up. Check attendance before
            sending; each message is locked once sending starts.
          </p>
          {followups?.attendance?.unmarked > 0 && (
            <p className="mt-3 text-sm text-amber-700">
              {followups.attendance.unmarked} participant
              {followups.attendance.unmarked === 1 ? ' is' : 's are'} still unmarked and will
              receive no email.
            </p>
          )}
          {event.logoImage && (
            <div className="mt-4 flex items-center gap-3">
              <img
                src={event.logoImage}
                alt="Organizer logo used in follow-up emails"
                className="h-14 max-w-32 object-contain"
              />
              <span className="text-sm text-muted-foreground">Organizer logo in each email</span>
            </div>
          )}
          {followups &&
            [
              {
                audience: 'attended',
                title: 'Attended',
                count: followups.attendance.attendedWithEmail,
              },
              {
                audience: 'no_show',
                title: 'No Show',
                count: followups.attendance.noShowWithEmail,
              },
            ].map(({ audience, title, count }) => {
              const delivery = followups.deliveries[audience] || {};
              const locked = Object.values(delivery).some((total) => total > 0);
              const draft = followupDrafts[audience];
              const saved = followups.templates[audience];
              const dirty =
                !saved ||
                draft.subject.trim() !== saved.subject ||
                draft.body.trim() !== saved.body;
              const remaining = Math.max(0, count - (delivery.sent || 0) - (delivery.sending || 0));
              return (
                <div key={audience} className="mt-6 border-t border-border pt-5">
                  <h3 className="font-display text-xl font-semibold">
                    {title} · {count} email recipient{count === 1 ? '' : 's'}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {delivery.sent || 0} sent
                    {delivery.failed ? ` · ${delivery.failed} failed` : ''}
                    {delivery.sending ? ` · ${delivery.sending} sending` : ''}
                  </p>
                  <label className="mt-4 block text-sm">
                    Subject
                    <input
                      value={draft.subject}
                      disabled={locked || Boolean(followupBusy)}
                      maxLength={180}
                      onChange={(e) =>
                        setFollowupDrafts((current) => ({
                          ...current,
                          [audience]: {
                            ...current[audience],
                            subject: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 min-h-10 w-full border border-border bg-background px-3 disabled:opacity-60"
                    />
                  </label>
                  <label className="mt-3 block text-sm">
                    Your message
                    <textarea
                      value={draft.body}
                      disabled={locked || Boolean(followupBusy)}
                      maxLength={5000}
                      rows={5}
                      onChange={(e) =>
                        setFollowupDrafts((current) => ({
                          ...current,
                          [audience]: {
                            ...current[audience],
                            body: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 w-full border border-border bg-background px-3 py-2 disabled:opacity-60"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveFollowup(audience)}
                      disabled={
                        locked ||
                        Boolean(followupBusy) ||
                        !draft.subject.trim() ||
                        !draft.body.trim() ||
                        !dirty
                      }
                      className="ui-action min-h-10 border border-border px-4 text-sm disabled:opacity-50"
                    >
                      Save message
                    </button>
                    <button
                      type="button"
                      onClick={() => sendFollowup(audience)}
                      disabled={Boolean(followupBusy) || dirty || remaining === 0}
                      className="ui-action min-h-10 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
                    >
                      {followupBusy === audience ? 'Working…' : `Send to ${title.toLowerCase()}`}
                    </button>
                  </div>
                  {remaining > 25 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Up to 25 emails are sent per click. Use this button again for the remaining
                      recipients.
                    </p>
                  )}
                </div>
              );
            })}
        </>
      )}
      {followupMessage && (
        <p role="status" className="mt-4 text-sm text-primary">
          {followupMessage}
        </p>
      )}
      {followupError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {followupError}
        </p>
      )}
    </section>
  );
}
