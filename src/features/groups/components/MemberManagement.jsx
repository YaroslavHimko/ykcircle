export function MemberManagement({
  group,
  members,
  invitations,
  invitationsLoading,
  invitationsError,
  lookup,
  setLookup,
  email,
  setEmail,
  loading,
  error,
  notice,
  canInvite,
  onAdd,
  onRemove,
}) {
  return (
    <section className="mt-8 border-y border-border py-8">
      <p className="text-xs uppercase tracking-[0.25em] text-primary">Member management</p>
      <h2 className="mt-2 font-display text-3xl font-semibold">{group.name} members</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {group.visibility === 'Private'
          ? 'Invite a registered user by email or user ID. They will receive an email to accept or decline the invitation.'
          : 'Add a verified registered user by email or user ID.'}
      </p>
      {group.visibility !== 'Private' || canInvite ? (
        <form onSubmit={onAdd} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
          <select
            value={lookup}
            onChange={(event) => {
              setLookup(event.target.value);
              setEmail('');
            }}
            className="min-h-11 border border-border bg-background px-3 text-sm"
          >
            <option value="email">Email</option>
            <option value="userId">User ID</option>
          </select>
          <label className="sr-only" htmlFor="member-identifier">
            {lookup === 'email' ? 'Member email' : 'Member user ID'}
          </label>
          <input
            id="member-identifier"
            required
            type={lookup === 'email' ? 'email' : 'number'}
            min={lookup === 'userId' ? '1' : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={lookup === 'email' ? 'member@example.com' : 'Account ID'}
            className="min-h-11 flex-1 border border-border bg-background px-3"
          />
          <button
            disabled={loading}
            className="ui-action min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading
              ? 'Sending…'
              : group.visibility === 'Private'
                ? 'Send invitation'
                : 'Add member'}
          </button>
        </form>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Only this group’s organizer can send private invitations.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-primary">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 divide-y divide-border border-y border-border">
        {loading && members.length === 0 ? (
          <p className="py-5 text-muted-foreground">Loading members…</p>
        ) : (
          members.map((member) => {
            const role = member.role || member.membershipRole || 'member';
            const userId = member.userId ?? member.user_id ?? member.id;
            return (
              <div key={userId} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{member.name || member.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined{' '}
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'recently'}
                  </p>
                </div>
                {role === 'owner' ? (
                  <span className="text-sm font-medium text-primary">Owner</span>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onRemove(member)}
                    className="ui-action min-h-10 border border-destructive px-4 text-sm text-destructive disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      {group.visibility === 'Private' && canInvite && (
        <div className="mt-10">
          <h3 className="font-display text-2xl font-semibold">Invitations</h3>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {invitationsLoading ? (
              <p className="py-5 text-muted-foreground">Loading invitations...</p>
            ) : invitationsError ? (
              <p role="alert" className="py-5 text-sm text-destructive">
                {invitationsError}
              </p>
            ) : invitations.length === 0 ? (
              <p className="py-5 text-muted-foreground">No invitations yet.</p>
            ) : (
              invitations.map((invitation) => {
                const recipient =
                  invitation.recipientName ||
                  invitation.recipientEmail ||
                  `User #${invitation.invitedUserId}`;
                const status =
                  invitation.isExpired && String(invitation.status).toLowerCase() === 'pending'
                    ? 'Expired'
                    : invitation.status;
                return (
                  <div
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="font-medium">{recipient}</p>
                      {invitation.recipientEmail && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {invitation.recipientEmail}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sent{' '}
                        {invitation.createdAt
                          ? new Date(invitation.createdAt).toLocaleDateString()
                          : 'recently'}
                        {invitation.expiresAt &&
                          ` · Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">{status || 'Pending'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
