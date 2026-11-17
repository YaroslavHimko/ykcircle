import { TicketScanner } from '@/features/tickets/index.js';
import { ParticipantAvatar } from '@/features/events/components/ParticipantAvatar.jsx';
import { FoodChoices } from '@/features/events/components/FoodChoices.jsx';
import { Check, X } from 'lucide-react';
export function EventParticipantsPanel({
  canManageEvents,
  event,
  token,
  setAttendance,
  setEvent,
  setRegistrations,
  isCurrentParticipant,
  participantPaymentStatus,
  markParticipantPaid,
  attendance,
  updateParticipantStatus,
}) {
  return (
    <section className="mt-10 rounded-2xl border border-border/70 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold">Participants</h2>
        {canManageEvents && (
          <TicketScanner
            eventId={event.id}
            eventTitle={event.title}
            token={token}
            onCheckIn={({ participant }) => {
              if (!participant) return;
              setAttendance((current) => ({
                ...current,
                [participant.id]: participant.status,
              }));
              setEvent((current) => ({
                ...current,
                participants: [
                  ...(current.participants || []).filter(
                    (item) => String(item.id) !== String(participant.id),
                  ),
                  participant,
                ],
              }));
              setRegistrations((current) =>
                current.filter(
                  (item) => String(item.userId ?? item.user_id) !== String(participant.userId),
                ),
              );
            }}
          />
        )}
      </div>
      {event.participants?.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {event.participants.map((participant) => {
            const isYou = isCurrentParticipant(participant);
            const paymentStatus = participantPaymentStatus(participant);
            return (
              <div
                key={participant.id}
                className={`rounded-2xl border p-4 ${isYou ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
              >
                <div className="flex items-center gap-3">
                  <ParticipantAvatar person={participant} />
                  <p className="font-medium">{participant.name}</p>
                </div>
                {canManageEvents && <FoodChoices choices={participant.selectedFoodOptions} />}
                {canManageEvents && participant.email && (
                  <p className="mt-2 text-sm text-muted-foreground">{participant.email}</p>
                )}
                {canManageEvents && participant.phone && (
                  <p className="mt-1 text-sm text-muted-foreground">{participant.phone}</p>
                )}
                {participant.joinedAt && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Joined {new Date(participant.joinedAt).toLocaleDateString()}
                  </p>
                )}
                {canManageEvents && event.fee > 0 && paymentStatus !== 'Not Required' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`participant-payment text-xs font-medium ${paymentStatus === 'Paid' ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {paymentStatus === 'Paid' ? 'Paid' : 'Payment required'}
                    </span>
                    {paymentStatus !== 'Paid' && (
                      <button
                        type="button"
                        onClick={() => markParticipantPaid(participant.id)}
                        className="ui-action inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                )}
                {canManageEvents &&
                  (attendance[participant.id] === 'Attended' ? (
                    <span
                      className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white"
                      aria-label="Attended"
                    >
                      <Check className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : attendance[participant.id] === 'No Show' ? (
                    <span
                      className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white"
                      aria-label="No show"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => updateParticipantStatus(participant.id, 'Attended')}
                        className="ui-action min-h-9 border border-green-600 px-3 text-xs uppercase tracking-widest text-green-700"
                      >
                        Attended
                      </button>
                      <button
                        onClick={() => updateParticipantStatus(participant.id, 'No Show')}
                        className="ui-action min-h-9 border border-red-600 px-3 text-xs uppercase tracking-widest text-red-700"
                      >
                        No Show
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">No participants yet.</p>
      )}
    </section>
  );
}
