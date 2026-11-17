import { FoodChoices } from '@/features/events/components/FoodChoices.jsx';
export function EventInvitationsPanel({
  sendInvitation,
  invitation,
  setInvitation,
  invitationMessage,
  invitations,
  updateInvitationStatus,
  invitationStatuses,
  resendInvitation,
  resendingInvitationId,
  registrations,
  event,
  markRegistrationPaid,
  updateStatus,
}) {
  return (
    <>
      <h2 className="mt-14 font-display text-3xl font-semibold">Invite a participant</h2>
      <form onSubmit={sendInvitation} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          required
          placeholder="Name"
          value={invitation.name}
          onChange={(e) =>
            setInvitation((current) => ({
              ...current,
              name: e.target.value,
            }))
          }
          className="min-h-12 border border-border bg-background px-4"
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={invitation.email}
          onChange={(e) =>
            setInvitation((current) => ({
              ...current,
              email: e.target.value,
            }))
          }
          className="min-h-12 border border-border bg-background px-4"
        />
        <button className="ui-action min-h-12 bg-primary px-5 text-sm uppercase tracking-widest text-primary-foreground">
          Send invitation
        </button>
      </form>
      {invitationMessage && (
        <p className="mt-3 text-sm text-muted-foreground">{invitationMessage}</p>
      )}
      <h2 className="mt-14 font-display text-3xl font-semibold">Invitations</h2>
      <div className="mt-5 divide-y divide-border border-y border-border">
        {invitations.length === 0 ? (
          <p className="py-5 text-muted-foreground">No invitations yet.</p>
        ) : (
          invitations.map((invitationRecord) => (
            <div
              key={invitationRecord.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <p className="font-medium">{invitationRecord.name}</p>
                <p className="text-sm text-muted-foreground">{invitationRecord.email}</p>
              </div>
              <select
                value={invitationRecord.status}
                onChange={(e) => updateInvitationStatus(invitationRecord.id, e.target.value)}
                className="h-10 border border-border bg-background px-3"
              >
                {invitationStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              {String(invitationRecord.status).toLowerCase() === 'pending' && (
                <button
                  type="button"
                  onClick={() => resendInvitation(invitationRecord.id)}
                  disabled={resendingInvitationId === invitationRecord.id}
                  className="ui-action inline-flex min-h-10 items-center justify-center border border-primary px-3 text-xs uppercase tracking-widest text-primary disabled:opacity-50"
                >
                  {resendingInvitationId === invitationRecord.id ? 'Resending…' : 'Resend email'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <h2 className="mt-14 font-display text-3xl font-semibold">Registrations</h2>
      <div className="mt-5 divide-y divide-border border-y border-border">
        {registrations.length === 0 ? (
          <p className="py-5 text-muted-foreground">No registrations yet.</p>
        ) : (
          registrations.map((registration) => (
            <div
              key={registration.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <p className="font-medium">{registration.name}</p>
                <FoodChoices choices={registration.selectedFoodOptions} />
                <p className="text-sm text-muted-foreground">{registration.email}</p>
                {event.fee > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-medium ${(registration.paymentStatus || registration.registrationPaymentStatus) === 'Paid' ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {(registration.paymentStatus || registration.registrationPaymentStatus) ===
                      'Paid'
                        ? 'Paid'
                        : 'Payment required'}
                    </span>
                    {(registration.paymentStatus || registration.registrationPaymentStatus) !==
                      'Paid' && (
                      <button
                        type="button"
                        onClick={() => markRegistrationPaid(registration.id)}
                        className="ui-action inline-flex min-h-9 items-center justify-center border border-primary px-3 text-xs text-primary"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(registration.id, 'Confirmed')}
                  disabled={registration.status === 'Confirmed'}
                  className="ui-action min-h-10 bg-primary px-3 text-xs uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateStatus(registration.id, 'Declined')}
                  disabled={registration.status === 'Declined'}
                  className="ui-action min-h-10 border border-destructive px-3 text-xs uppercase tracking-widest text-destructive disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
