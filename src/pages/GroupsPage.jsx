import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import ForumDiscussion from "@/components/ForumDiscussion";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { asList as communityList, communityPostUrl } from "@/lib/community";

const managementRoles = ["organizer", "manager", "admin"];
const asList = (data, key = "groups") =>
  Array.isArray(data) ? data : data?.[key] || [];
const groupImageValue = (group) =>
  group?.coverImage ||
  group?.coverImageUrl ||
  group?.image ||
  group?.imageUrl ||
  group?.groupImage ||
  group?.groupImageUrl ||
  "";
const eventImageValue = (event) =>
  event?.thumbnailUrl ||
  event?.coverImage ||
  event?.coverImageUrl ||
  event?.image ||
  event?.imageUrl ||
  "";
const ratingStars = (rating) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
};
const imageUrl = (value, folder) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/images/")) return value;
  if (value.startsWith("/uploads/")) return apiAssetUrl(value);
  if (value.startsWith(`${folder}/`)) return apiAssetUrl(`/uploads/${value}`);
  return apiAssetUrl(
    value.startsWith("/") ? value : `/uploads/${folder}/${value}`,
  );
};

function GroupImage({ group, className = "" }) {
  const image = imageUrl(groupImageValue(group), "group-covers");
  return image ? (
    <img src={image} alt="" className={`object-cover ${className}`} />
  ) : (
    <div
      className={`bg-gradient-to-br from-primary/90 via-primary/65 to-slate-900 ${className}`}
    />
  );
}

function GroupCard({ group, action }) {
  return (
    <article className="overflow-hidden border border-border bg-background shadow-sm">
      <GroupImage group={group} className="aspect-[16/7] w-full" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              {group.visibility} group
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              <Link className="hover:text-primary" to={`/groups/${group.id}`}>
                {group.name}
              </Link>
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {group.memberCount || 0}
          </span>
        </div>
        {group.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {group.description}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          Organized by {group.organizerName || "YKCircle"}
        </p>
        {Number(group.ratedEventCount) > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="text-primary" aria-hidden="true">{ratingStars(group.ratingAverage)}</span>{" "}{Number(group.ratingAverage).toFixed(1)} / 5 from {group.ratedEventCount} rated {Number(group.ratedEventCount) === 1 ? "event" : "events"}
          </p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </article>
  );
}

function GroupForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    visibility: initial?.visibility || "Public",
  });
  const [image, setImage] = useState(null);
  useEffect(() => {
    setForm({
      name: initial?.name || "",
      description: initial?.description || "",
      visibility: initial?.visibility || "Public",
    });
    setImage(null);
  }, [initial]);
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  return (
    <form
      id="group-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form, image);
      }}
      className="mt-6 grid gap-4 border-y border-border py-6"
    >
      <label className="text-sm">
        Group name
        <input
          required
          minLength="3"
          maxLength="120"
          name="name"
          value={form.name}
          onChange={update}
          className="mt-2 min-h-11 w-full border border-border bg-background px-3"
        />
      </label>
      <label className="text-sm">
        Description
        <textarea
          name="description"
          maxLength="10000"
          value={form.description}
          onChange={update}
          rows="4"
          className="mt-2 w-full border border-border bg-background px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Group picture
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] || null)}
          className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          JPEG, PNG or WebP, maximum 10 MB.
        </span>
      </label>
      <label className="text-sm">
        Visibility
        <select
          name="visibility"
          value={form.visibility}
          onChange={update}
          className="mt-2 min-h-11 w-full border border-border bg-background px-3"
        >
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={saving}
          className="min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save group" : "Create group"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 border border-border px-5 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function MemberManagement({
  group,
  members,
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
      <p className="text-xs uppercase tracking-[0.25em] text-primary">
        Member management
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold">
        {group.name} members
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {group.visibility === "Private"
          ? "Invite a registered user by email or user ID. They will receive an email to accept or decline the invitation."
          : "Add a verified registered user by email or user ID."}
      </p>
      {(group.visibility !== "Private" || canInvite) ? <form
        onSubmit={onAdd}
        className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row"
      >
        <select
          value={lookup}
          onChange={(event) => {
            setLookup(event.target.value);
            setEmail("");
          }}
          className="min-h-11 border border-border bg-background px-3 text-sm"
        >
          <option value="email">Email</option>
          <option value="userId">User ID</option>
        </select>
        <label className="sr-only" htmlFor="member-identifier">
          {lookup === "email" ? "Member email" : "Member user ID"}
        </label>
        <input
          id="member-identifier"
          required
          type={lookup === "email" ? "email" : "number"}
          min={lookup === "userId" ? "1" : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={lookup === "email" ? "member@example.com" : "Account ID"}
          className="min-h-11 flex-1 border border-border bg-background px-3"
        />
        <button
          disabled={loading}
          className="min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Sending…" : group.visibility === "Private" ? "Send invitation" : "Add member"}
        </button>
      </form> : <p className="mt-5 text-sm text-muted-foreground">Only this group’s organizer can send private invitations.</p>}
      {notice && <p role="status" className="mt-3 text-sm text-primary">{notice}</p>}
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
            const role = member.role || member.membershipRole || "member";
            const userId = member.userId ?? member.user_id ?? member.id;
            return (
              <div
                key={userId}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium">{member.name || member.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined{" "}
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString()
                      : "recently"}
                  </p>
                </div>
                {role === "owner" ? (
                  <span className="text-sm font-medium text-primary">
                    Owner
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onRemove(member)}
                    className="min-h-10 border border-destructive px-4 text-sm text-destructive disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function GroupsPage({
  detailPage = false,
  managementOnly = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const canManage = Boolean(token && managementRoles.includes(user?.role));
  const canManageOwnGroups = Boolean(token);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [managedGroups, setManagedGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [sourceCommunityPost, setSourceCommunityPost] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberLookup, setMemberLookup] = useState("email");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [memberNotice, setMemberNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);
  useEffect(() => {
    if (!editing) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("group-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editing]);
  const read = async (response, fallback) => {
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || fallback);
    return data;
  };
  const loadDirectory = async () => {
    const [publicData, joinedData, managedData] = await Promise.all([
      apiFetch("/api/groups", { headers }).then((response) =>
        read(response, "Unable to load groups."),
      ),
      token
        ? apiFetch("/api/my/groups", { headers }).then((response) =>
            response.ok ? response.json() : [],
          )
        : Promise.resolve([]),
      canManageOwnGroups
        ? apiFetch("/api/my/groups/managed", { headers }).then((response) =>
            response.ok ? response.json() : [],
          )
        : Promise.resolve([]),
    ]);
    setGroups(asList(publicData));
    setMyGroups(asList(joinedData));
    setManagedGroups(asList(managedData));
  };
  const loadDetail = async () => {
    const data = await read(
      await apiFetch(`/api/groups/${id}`, { headers }),
      "Unable to load group.",
    );
    setGroup(data.group || data);
  };
  useEffect(() => {
    setSourceCommunityPost(null);
    if (!detailPage || !group?.sourcePostId) return undefined;
    let active = true;
    apiFetch("/api/community/posts?limit=50")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const post = communityList(data, "posts").find(
          (item) => String(item.id) === String(group.sourcePostId),
        );
        if (active) setSourceCommunityPost(post || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [detailPage, group?.sourcePostId]);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (detailPage) await loadDetail();
      else await loadDirectory();
    } catch (requestError) {
      setError(requestError.message);
      if (detailPage && /not found/i.test(requestError.message))
        navigate("/groups", { replace: true });
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
    body.append("coverImage", image);
    await read(
      await apiFetch(`/api/groups/${groupId}/cover`, {
        method: "POST",
        headers,
        body,
      }),
      "Unable to upload group picture.",
    );
  };
  const toggleMembership = async (confirmedJoin = false) => {
    if (!token)
      return navigate(`/login?from=${encodeURIComponent(`/groups/${id}`)}`);
    if (!group.isMember && !confirmedJoin) {
      setConfirmation({ action: "join-group", target: group });
      return;
    }
    setSaving(true);
    setError("");
    try {
      const leaving = group.isMember;
      await read(
        await apiFetch(
          `/api/groups/${id}${leaving ? "/membership" : "/join"}`,
          { method: leaving ? "DELETE" : "POST", headers },
        ),
        leaving ? "Unable to leave group." : "Unable to join group.",
      );
      await loadDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const saveGroup = async (form, image) => {
    setSaving(true);
    setError("");
    const edited = editing;
    try {
      const data = await read(
        await apiFetch(edited ? `/api/groups/${edited.id}` : "/api/groups", {
          method: edited ? "PATCH" : "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }),
        "Unable to save group.",
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
    setConfirmation({ action: "delete-group", target });
  const executeDeleteGroup = async (target) => {
    setSaving(true);
    setError("");
    try {
      await read(
        await apiFetch(`/api/groups/${target.id}`, {
          method: "DELETE",
          headers,
        }),
        "Unable to delete group.",
      );
      if (detailPage) navigate("/profile/groups");
      else await loadDirectory();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const executeDeleteEvent = async (event) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiFetch(`/api/events/${event.id}`, {
        method: "DELETE",
        headers,
      });
      await read(response, "Unable to delete event.");
      await loadDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const restoreEvent = async (event) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiFetch(`/api/events/${event.id}/status`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Published" }),
      });
      await read(response, "Unable to restore event.");
      await loadDetail();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const openMembers = async (target) => {
    setSelectedGroup(target);
    setMemberError("");
    setMemberNotice("");
    setMemberEmail("");
    setMemberLookup("email");
    setMemberLoading(true);
    try {
      const data = await read(
        await apiFetch(`/api/groups/${target.id}/members`, { headers }),
        "You are not allowed to view members.",
      );
      setMembers(asList(data, "members"));
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
    setMemberError("");
    setMemberNotice("");
    try {
      const payload =
        memberLookup === "email"
          ? { email: memberEmail.trim() }
          : { userId: Number(memberEmail) };
      const privateGroup = selectedGroup.visibility === "Private";
      const response = await apiFetch(
        privateGroup
          ? `/api/groups/${selectedGroup.id}/invitations`
          : `/api/groups/${selectedGroup.id}/members`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? "No registered account matches that email address or user ID."
            : response.status === 409 && data.code === "EMAIL_NOT_VERIFIED"
              ? "This person must verify their email address before they can be added."
              : data.error || (privateGroup ? "Unable to send invitation." : "Unable to add member."),
        );
      setMemberEmail("");
      if (privateGroup) {
        setMemberNotice("Invitation sent. The recipient can accept or decline it from their email.");
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
    setConfirmation({ action: "remove-member", member });
  const executeRemoveMember = async (member) => {
    if (!selectedGroup) return;
    const userId = member.userId ?? member.user_id ?? member.id;
    setMemberLoading(true);
    setMemberError("");
    try {
      await read(
        await apiFetch(`/api/groups/${selectedGroup.id}/members/${userId}`, {
          method: "DELETE",
          headers,
        }),
        "Unable to remove member.",
      );
      setMembers((current) =>
        current.filter(
          (item) =>
            String(item.userId ?? item.user_id ?? item.id) !== String(userId),
        ),
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
    setEditing({ ...target });
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
        confirmation.action === "join-group"
          ? `Join ${confirmation.target.name}?`
          : confirmation.action === "remove-member"
            ? `Remove ${confirmation.member.name || confirmation.member.email}?`
            : confirmation.action === "delete-event"
              ? `Delete ${confirmation.target.title}?`
              : confirmation.action === "restore-event"
                ? `Restore ${confirmation.target.title}?`
                : `Delete ${confirmation.target.name}?`
      }
      description={
        confirmation.action === "join-group"
          ? `You will become a member of ${confirmation.target.name}.`
          : confirmation.action === "remove-member"
            ? `This person will be removed from ${selectedGroup?.name || "the group"}.`
            : confirmation.action === "delete-event"
              ? "This event will be permanently deleted."
              : confirmation.action === "restore-event"
                ? "This event will become visible and clickable again."
                : "The group will be permanently deleted. Its events will remain available without a group."
      }
      confirmLabel={
        confirmation.action === "join-group"
          ? "Join group"
          : confirmation.action === "remove-member"
            ? "Remove member"
            : confirmation.action === "delete-event"
              ? "Delete event"
              : confirmation.action === "restore-event"
                ? "Restore event"
                : "Delete group"
      }
      destructive={confirmation.action !== "join-group" && confirmation.action !== "restore-event"}
      busy={confirmation.action === "remove-member" ? memberLoading : saving}
      onCancel={() => setConfirmation(null)}
      onConfirm={() => {
        const current = confirmation;
        setConfirmation(null);
        if (current.action === "join-group") toggleMembership(true);
        else if (current.action === "remove-member")
          executeRemoveMember(current.member);
        else if (current.action === "delete-event") executeDeleteEvent(current.target);
        else if (current.action === "restore-event") restoreEvent(current.target);
        else executeDeleteGroup(current.target);
      }}
    />
  );
  const memberPanel = selectedGroup && (
    <MemberManagement
      group={selectedGroup}
      members={members}
      lookup={memberLookup}
      setLookup={setMemberLookup}
      email={memberEmail}
      setEmail={setMemberEmail}
      loading={memberLoading}
      error={memberError}
      notice={memberNotice}
      canInvite={Boolean(selectedGroup?.isOrganizer || (user?.id && [selectedGroup?.organizerId, selectedGroup?.organizer_id, selectedGroup?.ownerId, selectedGroup?.owner_id].some((ownerId) => String(ownerId) === String(user.id))))}
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
  const groupEvents = asList(group?.events, "events");
  const archivedEvents = groupEvents.filter((event) => String(event.status).toLowerCase() === "archived");
  const upcomingEvents = groupEvents.filter((event) => String(event.status).toLowerCase() !== "archived");
  if (detailPage)
    return (
      <SiteChrome>
        <Helmet>
          <title>{group ? `${group.name} | YKCircle` : "Group | YKCircle"}</title>
        </Helmet>
        <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
          {loading ? (
            <p className="text-muted-foreground">Loading group…</p>
          ) : (
            group && (
              <>
                <Link to="/groups" className="text-sm text-primary">
                  ← All groups
                </Link>
                <div className="mt-6 overflow-hidden border-y border-border">
                  <GroupImage group={group} className="aspect-[16/6] w-full" />
                  <div className="flex flex-wrap items-start justify-between gap-6 py-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-primary">
                        {group.visibility} group
                      </p>
                      <h1 className="mt-3 font-display text-5xl font-black">
                        {group.name}
                      </h1>
                      <p className="mt-4 max-w-2xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {group.description || "No description yet."}
                      </p>
                      <p className="mt-5 text-sm text-muted-foreground">
                        Organized by {group.organizerName || "YKCircle"} ·{" "}
                        {group.memberCount || 0} members
                      </p>
                      {Number(group.ratedEventCount) > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Group rating: <span className="text-primary" aria-hidden="true">{ratingStars(group.ratingAverage)}</span>{" "}{Number(group.ratingAverage).toFixed(1)} / 5 from {group.ratedEventCount} rated {Number(group.ratedEventCount) === 1 ? "event" : "events"}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {sourceCommunityPost && (
                        <Link
                          to={communityPostUrl(sourceCommunityPost)}
                          className="inline-flex min-h-11 items-center border border-border px-5 text-sm"
                        >
                          View community post
                        </Link>
                      )}
                      {canManageGroup ? (
                        <>
                          <Link
                            to="/profile/groups"
                            className="inline-flex min-h-11 items-center border border-border px-5 text-sm"
                          >
                            Manage group
                          </Link>
                          <Link
                            to={`/profile/events/new?groupId=${group.id}`}
                            className="inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
                          >
                            Create event
                          </Link>
                        </>
                      ) : (
                        group.visibility === "Public" && (
                          <button
                            disabled={saving}
                            onClick={toggleMembership}
                            className="min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50"
                          >
                            {group.isMember ? "Leave group" : "Join group"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <section className="mt-12">
                  <h2 className="font-display text-3xl font-semibold">
                    Upcoming events
                  </h2>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {upcomingEvents.length ? (
                      upcomingEvents.map((event) => (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="overflow-hidden border border-border bg-background hover:border-primary"
                        >
                          {eventImageValue(event) && (
                            <img
                              src={imageUrl(
                                eventImageValue(event),
                                "event-covers",
                              )}
                              alt=""
                              className="aspect-[16/8] w-full object-cover"
                            />
                          )}
                          <div className="relative z-20 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-primary">
                              {event.startsAt
                                ? new Date(event.startsAt).toLocaleString()
                                : "Date to be announced"}
                            </p>
                            <h3 className="mt-2 font-display text-2xl">
                              {event.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {event.shortDescription || event.description}
                            </p>
                            {Number(event.ratingCount) > 0 && (
                              <p className="mt-3 text-sm text-muted-foreground">
                                <span className="text-primary" aria-hidden="true">{ratingStars(event.ratingAverage)}</span>{" "}{Number(event.ratingAverage).toFixed(1)} / 5 ({event.ratingCount} {Number(event.ratingCount) === 1 ? "rating" : "ratings"})
                              </p>
                            )}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No published events yet.
                      </p>
                    )}
                  </div>
                </section>
                {archivedEvents.length > 0 && (
                  <section className="mt-12">
                    <h2 className="font-display text-3xl font-semibold">Archived</h2>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      {archivedEvents.map((event) => (
                        <article key={event.id} className="relative overflow-hidden border border-border bg-secondary/40 opacity-75">
                          <div className="pointer-events-none absolute inset-0 z-10 bg-white/35" aria-hidden="true" />
                          {eventImageValue(event) && <img src={imageUrl(eventImageValue(event), "event-covers")} alt="" className="aspect-[16/8] w-full object-cover grayscale" />}
                          <div className="relative z-20 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Archived</p>
                            <h3 className="mt-2 font-display text-2xl text-muted-foreground">{event.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{event.shortDescription || event.description}</p>
                            {canManageGroup && (
                              <div className="mt-5 flex flex-wrap gap-3">
                                <button type="button" disabled={saving} onClick={() => setConfirmation({ action: "restore-event", target: event })} className="min-h-10 border border-border px-4 text-sm disabled:opacity-50">Restore</button>
                                <button type="button" disabled={saving} onClick={() => setConfirmation({ action: "delete-event", target: event })} className="min-h-10 border border-destructive px-4 text-sm text-destructive disabled:opacity-50">Delete</button>
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {(group.isMember || canManageGroup) && <ForumDiscussion title="Group discussion" basePath={`/api/groups/${group.id}/threads`} token={token} canPost={Boolean(token)} canModerate={canManageGroup} emptyText="No group discussions yet." />}
                {canManageGroup && (
                  <section className="mt-12 border-t border-border pt-8">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openMembers(group)}
                        className="min-h-11 border border-border px-5 text-sm"
                      >
                        Manage members
                      </button>
                      <button
                        onClick={() => deleteGroup(group)}
                        className="min-h-11 border border-destructive px-5 text-sm text-destructive"
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
        <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
          <h1 className="font-display text-4xl font-semibold">
            Sign in to manage groups
          </h1>
          <p className="mt-4 text-muted-foreground">
            Verified members can create and manage the groups they own.
          </p>
          <Link
            to="/login?from=%2Fprofile%2Fgroups"
            className="mt-6 inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
          >
            Log in
          </Link>
        </section>
      </SiteChrome>
    );
  const displayGroups = managementOnly ? managedGroups : groups;
  return (
    <SiteChrome>
      <Helmet>
        <title>
          {managementOnly ? "Manage groups | YKCircle" : "Groups | YKCircle"}
        </title>
      </Helmet>
      <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Community groups
            </p>
            <h1 className="mt-3 font-display text-5xl font-black">
              {managementOnly ? "Your groups" : "Find your people."}
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              {managementOnly
                ? "Create a following and share events with your members."
                : "Join groups to hear when their organizers publish a new event."}
            </p>
          </div>
          {canManageOwnGroups && (
            <button
              type="button"
              onClick={() => {
                setCreating((value) => !value);
                setEditing(null);
              }}
              className="min-h-11 bg-primary px-5 text-sm text-primary-foreground"
            >
              {creating ? "Close" : "Create group"}
            </button>
          )}
        </div>
        {creating && (
          <GroupForm
            onSave={saveGroup}
            onCancel={() => setCreating(false)}
            saving={saving}
          />
        )}
        {editing && (
          <GroupForm
            initial={editing}
            onSave={saveGroup}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        )}
        {managementOnly && myGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-3xl font-semibold">
              Groups you joined
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {myGroups
                .filter(
                  (item) =>
                    !managedGroups.some((managed) => managed.id === item.id),
                )
                .map((item) => (
                  <GroupCard key={item.id} group={item} />
                ))}
            </div>
          </section>
        )}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-semibold">
            {managementOnly ? "Managed groups" : "Discover groups"}
          </h2>
          {loading ? (
            <p className="mt-5 text-muted-foreground">Loading groups…</p>
          ) : displayGroups.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {displayGroups.map((item) => (
                <GroupCard
                  key={item.id}
                  group={item}
                  action={
                    managementOnly ? (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/groups/${item.id}`}
                          className="inline-flex min-h-10 items-center border border-border px-4 text-sm"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => beginEdit(item)}
                          className="min-h-10 border border-border px-4 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openMembers(item)}
                          className="min-h-10 border border-border px-4 text-sm"
                        >
                          Members
                        </button>
                        <Link
                          to={`/profile/events/new?groupId=${item.id}`}
                          className="inline-flex min-h-10 items-center bg-primary px-4 text-sm text-primary-foreground"
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
                ? "You have not created any groups yet."
                : "No groups are available yet."}
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
