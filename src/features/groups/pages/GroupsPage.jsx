import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EventPreviewCard } from '@/features/events/index.js';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import DirectoryActions from '@/shared/components/DirectoryActions.jsx';
import DirectoryHeader from '@/shared/components/DirectoryHeader.jsx';
import ConfirmationDialog from '@/shared/components/ConfirmationDialog.jsx';
import { ForumDiscussion } from '@/features/discussions/index.js';
import { apiFetch } from '@/shared/api/client.js';
import { managementRoles, asList, ratingStars } from '../model/groups.js';
import { EventImage } from '../components/EventImage.jsx';
import { GroupImage } from '../components/GroupImage.jsx';
import { GroupCard } from '../components/GroupCard.jsx';
import { GroupForm } from '../components/GroupForm.jsx';
import { MemberManagement } from '../components/MemberManagement.jsx';
export function GroupsPage({
  detailPage = false,
  managementOnly = false,
  focusedManagement = false,
}) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const managementView = new URLSearchParams(location.search).get('manage') === '1';
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const canManage = Boolean(token && managementRoles.includes(user?.role));
  const canManageOwnGroups = Boolean(token);
  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [managedGroups, setManagedGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberLookup, setMemberLookup] = useState('email');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberNotice, setMemberNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);
  useEffect(() => {
    if (!editing) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('group-editor')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editing]);
  const read = async (response, fallback) => {
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || fallback);
    return data;
  };
  const isGroupOrganizer = (target) =>
    Boolean(
      target?.isOrganizer ||
      (user?.id &&
        [target?.organizerId, target?.organizer_id, target?.ownerId, target?.owner_id].some(
          (ownerId) => String(ownerId) === String(user.id),
        )),
    );
  const loadDirectory = async () => {
    const [publicData, joinedData, managedData] = await Promise.all([
      apiFetch('/api/groups', {
        headers,
      }).then((response) => read(response, 'Unable to load groups.')),
      token
        ? apiFetch('/api/my/groups', {
            headers,
          }).then((response) => read(response, 'Unable to load your groups.'))
        : Promise.resolve([]),
      canManageOwnGroups
        ? apiFetch('/api/my/groups/managed', {
            headers,
          }).then((response) => (response.ok ? response.json() : []))
        : Promise.resolve([]),
    ]);
    setGroups(asList(publicData));
    setMyGroups(asList(joinedData));
    setManagedGroups(asList(managedData));
  };
  const loadDetail = async () => {
    const data = await read(
      await apiFetch(`/api/groups/${id}`, {
        headers,
      }),
      'Unable to load group.',
    );
    setGroup(data.group || data);
  };
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (detailPage) await loadDetail();
      else await loadDirectory();
    } catch (requestError) {
      setError(requestError.message);
      if (detailPage && /not found/i.test(requestError.message))
        navigate('/groups', {
          replace: true,
        });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [id, detailPage, token, canManage, canManageOwnGroups]);
  const refreshGroupViews = async () => {
    if (detailPage) await loadDetail();
    else await loadDirectory();
  };
  const uploadGroupImage = async (groupId, image) => {
    if (!image) return;
    const body = new FormData();
    body.append('coverImage', image);
    await read(
      await apiFetch(`/api/groups/${groupId}/cover`, {
        method: 'POST',
        headers,
        body,
      }),
      'Unable to upload group picture.',
    );
  };
  const toggleMembership = async (confirmedJoin = false) => {
    if (!token) return navigate(`/login?from=${encodeURIComponent(`/groups/${id}`)}`);
    if (!group.isMember && !confirmedJoin) {
      setConfirmation({
        action: 'join-group',
        target: group,
      });
      return;
    }
    setSaving(true);
    setError('');
    try {
      const leaving = group.isMember;
      await read(
        await apiFetch(`/api/groups/${id}${leaving ? '/membership' : '/join'}`, {
          method: leaving ? 'DELETE' : 'POST',
          headers,
        }),
        leaving ? 'Unable to leave group.' : 'Unable to join group.',
      );
      await loadDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const saveGroup = async (form, image, target = editing) => {
    setSaving(true);
    setError('');
    const edited = target;
    try {
      const data = await read(
        await apiFetch(edited ? `/api/groups/${edited.id}` : '/api/groups', {
          method: edited ? 'PATCH' : 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }),
        'Unable to save group.',
      );
      const savedGroup = data.group || data;
      await uploadGroupImage(savedGroup.id, image);
      setEditing(null);
      setCreating(false);
      await loadDirectory();
      if (!edited && savedGroup?.id) navigate(`/groups/${savedGroup.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const deleteGroup = (target) =>
    setConfirmation({
      action: 'delete-group',
      target,
    });
  const executeDeleteGroup = async (target) => {
    setSaving(true);
    setError('');
    try {
      await read(
        await apiFetch(`/api/groups/${target.id}`, {
          method: 'DELETE',
          headers,
        }),
        'Unable to delete group.',
      );
      if (detailPage || focusedManagement) navigate('/profile/groups');
      else await loadDirectory();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const executeDeleteEvent = async (event) => {
    setSaving(true);
    setError('');
    try {
      const response = await apiFetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers,
      });
      await read(response, 'Unable to delete event.');
      await loadDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const restoreEvent = async (event) => {
    setSaving(true);
    setError('');
    try {
      const response = await apiFetch(`/api/events/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Published',
        }),
      });
      await read(response, 'Unable to restore event.');
      await loadDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const loadInvitations = async (target) => {
    setInvitationsLoading(true);
    setInvitationsError('');
    try {
      const data = await read(
        await apiFetch(`/api/groups/${target.id}/invitations`, {
          headers,
        }),
        'Unable to load invitations.',
      );
      setInvitations(asList(data, 'invitations'));
    } catch (requestError) {
      setInvitations([]);
      setInvitationsError(requestError.message);
    } finally {
      setInvitationsLoading(false);
    }
  };
  const openMembers = async (target) => {
    setSelectedGroup(target);
    setMemberError('');
    setMemberNotice('');
    setMemberEmail('');
    setMemberLookup('email');
    setInvitations([]);
    setInvitationsError('');
    if (target.visibility === 'Private' && isGroupOrganizer(target)) {
      void loadInvitations(target);
    } else {
      setInvitationsLoading(false);
    }
    setMemberLoading(true);
    try {
      const data = await read(
        await apiFetch(`/api/groups/${target.id}/members`, {
          headers,
        }),
        'You are not allowed to view members.',
      );
      setMembers(asList(data, 'members'));
    } catch (requestError) {
      setMemberError(requestError.message);
      setMembers([]);
    } finally {
      setMemberLoading(false);
    }
  };
  const addMember = async (event) => {
    event.preventDefault();
    if (!selectedGroup) return;
    setMemberLoading(true);
    setMemberError('');
    setMemberNotice('');
    try {
      const payload =
        memberLookup === 'email'
          ? {
              email: memberEmail.trim(),
            }
          : {
              userId: Number(memberEmail),
            };
      const privateGroup = selectedGroup.visibility === 'Private';
      const response = await apiFetch(
        privateGroup
          ? `/api/groups/${selectedGroup.id}/invitations`
          : `/api/groups/${selectedGroup.id}/members`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'No registered account matches that email address or user ID.'
            : response.status === 409 && data.code === 'EMAIL_NOT_VERIFIED'
              ? 'This person must verify their email address before they can be added.'
              : data.error ||
                (privateGroup ? 'Unable to send invitation.' : 'Unable to add member.'),
        );
      setMemberEmail('');
      if (privateGroup) {
        setMemberNotice(
          'Invitation sent. The recipient can accept or decline it from their email.',
        );
        await loadInvitations(selectedGroup);
      } else {
        await openMembers(selectedGroup);
        await refreshGroupViews();
      }
    } catch (requestError) {
      setMemberError(requestError.message);
    } finally {
      setMemberLoading(false);
    }
  };
  const removeMember = (member) =>
    setConfirmation({
      action: 'remove-member',
      member,
    });
  const executeRemoveMember = async (member) => {
    if (!selectedGroup) return;
    const userId = member.userId ?? member.user_id ?? member.id;
    setMemberLoading(true);
    setMemberError('');
    try {
      await read(
        await apiFetch(`/api/groups/${selectedGroup.id}/members/${userId}`, {
          method: 'DELETE',
          headers,
        }),
        'Unable to remove member.',
      );
      setMembers((current) =>
        current.filter((item) => String(item.userId ?? item.user_id ?? item.id) !== String(userId)),
      );
      await refreshGroupViews();
    } catch (requestError) {
      setMemberError(requestError.message);
    } finally {
      setMemberLoading(false);
    }
  };
  const beginEdit = (target) => {
    setCreating(false);
    setEditing({
      ...target,
    });
  };
  const notification = error && (
    <p
      role="alert"
      className="fixed bottom-6 right-6 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg"
    >
      {error}
    </p>
  );
  const confirmationDialog = confirmation && (
    <ConfirmationDialog
      title={
        confirmation.action === 'join-group'
          ? `Join ${confirmation.target.name}?`
          : confirmation.action === 'remove-member'
            ? `Remove ${confirmation.member.name || confirmation.member.email}?`
            : confirmation.action === 'delete-event'
              ? `Delete ${confirmation.target.title}?`
              : confirmation.action === 'restore-event'
                ? `Restore ${confirmation.target.title}?`
                : `Delete ${confirmation.target.name}?`
      }
      description={
        confirmation.action === 'join-group'
          ? `You will become a member of ${confirmation.target.name}.`
          : confirmation.action === 'remove-member'
            ? `This person will be removed from ${selectedGroup?.name || 'the group'}.`
            : confirmation.action === 'delete-event'
              ? 'This event will be permanently deleted.'
              : confirmation.action === 'restore-event'
                ? 'This event will become visible and clickable again.'
                : 'The group will be permanently deleted. Its events will remain available without a group.'
      }
      confirmLabel={
        confirmation.action === 'join-group'
          ? 'Join group'
          : confirmation.action === 'remove-member'
            ? 'Remove member'
            : confirmation.action === 'delete-event'
              ? 'Delete event'
              : confirmation.action === 'restore-event'
                ? 'Restore event'
                : 'Delete group'
      }
      destructive={confirmation.action !== 'join-group' && confirmation.action !== 'restore-event'}
      busy={confirmation.action === 'remove-member' ? memberLoading : saving}
      onCancel={() => setConfirmation(null)}
      onConfirm={() => {
        const current = confirmation;
        setConfirmation(null);
        if (current.action === 'join-group') toggleMembership(true);
        else if (current.action === 'remove-member') executeRemoveMember(current.member);
        else if (current.action === 'delete-event') executeDeleteEvent(current.target);
        else if (current.action === 'restore-event') restoreEvent(current.target);
        else executeDeleteGroup(current.target);
      }}
    />
  );
  const memberPanel = selectedGroup && (
    <MemberManagement
      group={selectedGroup}
      members={members}
      invitations={invitations}
      invitationsLoading={invitationsLoading}
      invitationsError={invitationsError}
      lookup={memberLookup}
      setLookup={setMemberLookup}
      email={memberEmail}
      setEmail={setMemberEmail}
      loading={memberLoading}
      error={memberError}
      notice={memberNotice}
      canInvite={isGroupOrganizer(selectedGroup)}
      onAdd={addMember}
      onRemove={removeMember}
    />
  );
  const canManageGroup = Boolean(
    group?.isOrganizer ||
    canManage ||
    (user?.id &&
      [group?.organizerId, group?.organizer_id, group?.ownerId, group?.owner_id]
        .filter(Boolean)
        .some((ownerId) => String(ownerId) === String(user.id))),
  );
  const groupEvents = asList(group?.events, 'events');
  const archivedEvents = groupEvents.filter(
    (event) => String(event.status).toLowerCase() === 'archived',
  );
  const upcomingEvents = groupEvents.filter(
    (event) => String(event.status).toLowerCase() !== 'archived',
  );
  if (detailPage)
    return (
      <SiteChrome>
        <Helmet>
          <title>{group ? `${group.name} | YKCircle` : 'Group | YKCircle'}</title>
        </Helmet>
        <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          {loading ? (
            <p className="text-muted-foreground">Loading group…</p>
          ) : (
            group && (
              <>
                <Link
                  to={managementView ? '/profile/groups' : '/groups'}
                  className="text-sm text-primary"
                >
                  ← {managementView ? 'Manage groups' : 'All groups'}
                </Link>
                <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                  <div className="relative">
                    <GroupImage group={group} className="aspect-[16/10] w-full sm:aspect-[16/6]" />
                    <span className="absolute right-4 top-4 rounded-full bg-background/95 px-4 py-2 text-sm font-medium shadow-sm">
                      {group.visibility} group
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-6 p-6 sm:p-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-primary">
                        {group.visibility} group
                      </p>
                      <h1 className="mt-3 break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                        {group.name}
                      </h1>
                      <p className="mt-4 max-w-2xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {group.description || 'No description yet.'}
                      </p>
                      <p className="mt-5 text-sm text-muted-foreground">
                        Organized by {group.organizerName || 'YKCircle'} · {group.memberCount || 0}{' '}
                        members
                      </p>
                      {Number(group.ratedEventCount) > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Group rating:{' '}
                          <span className="text-primary" aria-hidden="true">
                            {ratingStars(group.ratingAverage)}
                          </span>{' '}
                          {Number(group.ratingAverage).toFixed(1)} / 5 from {group.ratedEventCount}{' '}
                          rated {Number(group.ratedEventCount) === 1 ? 'event' : 'events'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {canManageGroup ? (
                        <>
                          <Link
                            to={`/profile/groups/${group.id}`}
                            className="ui-action inline-flex min-h-11 items-center border border-border px-5 text-sm"
                          >
                            Manage group
                          </Link>
                          <Link
                            to={`/profile/events/new?groupId=${group.id}`}
                            className="ui-action inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
                          >
                            Create event
                          </Link>
                        </>
                      ) : (
                        group.visibility === 'Public' && (
                          <button
                            disabled={saving}
                            onClick={toggleMembership}
                            className="ui-action min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                          >
                            {group.isMember ? 'Leave group' : 'Join group'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <section className="mt-12">
                  <h2 className="font-display text-3xl font-semibold">Upcoming events</h2>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {upcomingEvents.length ? (
                      upcomingEvents.map((event) => (
                        <EventPreviewCard key={event.id} event={event}>
                          {Number(event.ratingCount) > 0 && (
                            <p className="text-sm text-muted-foreground">
                              <span className="text-primary" aria-hidden="true">
                                {ratingStars(event.ratingAverage)}
                              </span>{' '}
                              {Number(event.ratingAverage).toFixed(1)} / 5 ({event.ratingCount}{' '}
                              {Number(event.ratingCount) === 1 ? 'rating' : 'ratings'})
                            </p>
                          )}
                        </EventPreviewCard>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No published events yet.</p>
                    )}
                  </div>
                </section>
                {archivedEvents.length > 0 && (
                  <section className="mt-12">
                    <h2 className="font-display text-3xl font-semibold">Archived</h2>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      {archivedEvents.map((event) => (
                        <article
                          key={event.id}
                          className="relative overflow-hidden rounded-xl border border-border bg-secondary/40 opacity-75"
                        >
                          <div
                            className="pointer-events-none absolute inset-0 z-10 bg-white/35"
                            aria-hidden="true"
                          />
                          <EventImage
                            event={event}
                            component="GroupArchivedEventCard"
                            className="aspect-[16/8] w-full object-cover grayscale"
                          />
                          <div className="relative z-20 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              Archived
                            </p>
                            <h3 className="mt-2 font-display text-2xl text-muted-foreground">
                              {event.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {event.shortDescription || event.description}
                            </p>
                            {canManageGroup && (
                              <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    setConfirmation({
                                      action: 'restore-event',
                                      target: event,
                                    })
                                  }
                                  className="ui-action min-h-10 border border-border px-4 text-sm disabled:opacity-50"
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    setConfirmation({
                                      action: 'delete-event',
                                      target: event,
                                    })
                                  }
                                  className="ui-action min-h-10 border border-destructive px-4 text-sm text-destructive disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {(group.isMember || canManageGroup) && (
                  <ForumDiscussion
                    title="Group discussion"
                    basePath={`/api/groups/${group.id}/threads`}
                    token={token}
                    canPost={Boolean(token)}
                    canModerate={canManageGroup}
                    emptyText="No group discussions yet."
                  />
                )}
                {canManageGroup && (
                  <section className="mt-12 border-t border-border pt-8">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openMembers(group)}
                        className="ui-action min-h-11 border border-border px-5 text-sm"
                      >
                        Manage members
                      </button>
                      <button
                        onClick={() => deleteGroup(group)}
                        className="ui-action min-h-11 border border-destructive px-5 text-sm text-destructive"
                      >
                        Delete group
                      </button>
                    </div>
                    {selectedGroup?.id === group.id && memberPanel}
                  </section>
                )}
              </>
            )
          )}
        </section>
        {notification}
        {confirmationDialog}
      </SiteChrome>
    );
  if (managementOnly && !canManageOwnGroups)
    return (
      <SiteChrome>
        <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          <h1 className="font-display text-4xl font-semibold">Sign in to manage groups</h1>
          <p className="mt-4 text-muted-foreground">
            Verified members can create and manage the groups they own.
          </p>
          <Link
            to="/login?from=%2Fprofile%2Fgroups"
            className="ui-action mt-6 inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
          >
            Log in
          </Link>
        </section>
      </SiteChrome>
    );
  const focusedGroup = focusedManagement
    ? managedGroups.find((item) => String(item.id) === String(id))
    : null;
  if (managementOnly && focusedManagement)
    return (
      <SiteChrome>
        <Helmet>
          <title>
            {focusedGroup ? `Manage ${focusedGroup.name} | YKCircle` : 'Manage group | YKCircle'}
          </title>
        </Helmet>
        <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          {loading ? (
            <p className="text-muted-foreground">Loading group…</p>
          ) : !focusedGroup ? (
            <>
              <h1 className="font-display text-4xl font-semibold">Group unavailable</h1>
              <p className="mt-4 text-muted-foreground">
                You do not have permission to manage this group.
              </p>
              <Link to="/profile/groups" className="mt-6 inline-flex text-primary">
                Back to your groups
              </Link>
            </>
          ) : (
            <>
              <Link to={`/groups/${focusedGroup.id}?manage=1`} className="text-sm text-primary">
                ← Back to group
              </Link>
              <p className="mt-8 text-xs uppercase tracking-[0.25em] text-primary">
                Group management
              </p>
              <h1 className="mt-3 font-display text-5xl font-black">Manage {focusedGroup.name}</h1>
              <GroupForm
                initial={focusedGroup}
                onSave={(form, image) => saveGroup(form, image, focusedGroup)}
                onCancel={() => navigate(`/groups/${focusedGroup.id}?manage=1`)}
                saving={saving}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openMembers(focusedGroup)}
                  className="ui-action min-h-11 border border-border px-5 text-sm"
                >
                  Manage members
                </button>
                <Link
                  to={`/profile/events/new?groupId=${focusedGroup.id}`}
                  className="ui-action inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
                >
                  Create event
                </Link>
                <button
                  type="button"
                  onClick={() => deleteGroup(focusedGroup)}
                  className="ui-action min-h-11 border border-destructive px-5 text-sm text-destructive"
                >
                  Delete group
                </button>
              </div>
              {selectedGroup?.id === focusedGroup.id && <div className="mt-8">{memberPanel}</div>}
            </>
          )}
        </section>
        {notification}
        {confirmationDialog}
      </SiteChrome>
    );
  const displayGroups = managementOnly
    ? managedGroups
    : groups.filter((item) => !myGroups.some((joined) => String(joined.id) === String(item.id)));
  return (
    <SiteChrome>
      <Helmet>
        <title>{managementOnly ? 'Manage groups | YKCircle' : 'Groups | YKCircle'}</title>
      </Helmet>
      <section className="directory-page">
        <DirectoryHeader
          eyebrow="Groups"
          title={managementOnly ? 'Your groups' : 'Find your people.'}
          description={
            managementOnly
              ? 'Create a following and share events with your members.'
              : 'Join groups to hear when their organizers publish a new event.'
          }
        />
        {canManageOwnGroups && (
          <DirectoryActions
            manageTo={!managementOnly ? '/profile/groups' : null}
            manageLabel="Manage groups"
            createLabel={creating ? 'Close' : 'Create group'}
            onCreate={() => {
              setCreating((value) => !value);
              setEditing(null);
            }}
          />
        )}
        {creating && (
          <GroupForm onSave={saveGroup} onCancel={() => setCreating(false)} saving={saving} />
        )}
        {editing && (
          <GroupForm
            initial={editing}
            onSave={saveGroup}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        )}
        {!managementOnly && token && (
          <section className="mt-10">
            <h2 className="font-display text-3xl font-semibold">My Groups</h2>
            {loading && (
              <p role="status" className="mt-5 text-muted-foreground">
                Loading your groups…
              </p>
            )}
            {!loading && !myGroups.length && (
              <p className="mt-5 text-muted-foreground">
                Groups you join will appear here. Explore groups below to find your people.
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {myGroups.map((item) => (
                <GroupCard key={item.id} group={item} />
              ))}
            </div>
          </section>
        )}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-semibold">
            {managementOnly ? 'Managed groups' : 'Discover groups'}
          </h2>
          {loading ? (
            <p className="mt-5 text-muted-foreground">Loading groups…</p>
          ) : displayGroups.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {displayGroups.map((item) => (
                <GroupCard
                  key={item.id}
                  group={item}
                  managementView={managementOnly}
                  action={
                    managementOnly ? (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/groups/${item.id}?manage=1`}
                          className="ui-action inline-flex min-h-10 items-center border border-border px-4 text-sm"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => beginEdit(item)}
                          className="ui-action min-h-10 border border-border px-4 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openMembers(item)}
                          className="ui-action min-h-10 border border-border px-4 text-sm"
                        >
                          Members
                        </button>
                        <Link
                          to={`/profile/events/new?groupId=${item.id}`}
                          className="ui-action inline-flex min-h-10 items-center bg-primary px-4 text-sm text-primary-foreground"
                        >
                          Create event
                        </Link>
                      </div>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-muted-foreground">
              {managementOnly
                ? 'You have not created any groups yet.'
                : myGroups.length
                  ? 'Your groups are listed above. No other groups are available yet.'
                  : 'No groups are available yet.'}
            </p>
          )}
        </section>
        {managementOnly && memberPanel}
      </section>
      {notification}
      {confirmationDialog}
    </SiteChrome>
  );
}
export default GroupsPage;
