import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { apiAssetUrl, apiFetch } from "@/lib/api";

const initialForm = {
  title: "",
  shortDescription: "",
  description: "",
  coverImage: "",
  categoryId: "",
  typeId: "",
  country: "",
  city: "Stockholm",
  locationType: "physical",
  locationVisibility: "public",
  location: "",
  address: "",
  startsAt: "",
  endsAt: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  capacity: "",
  minimumAttendees: "",
  registrationDeadline: "",
  minimumAge: "",
  languageCode: "en",
  whatToBring: "",
  meetingInstructions: "",
  pricingType: "free",
  fee: "0",
  currency: "SEK",
  registrationType: "yaroko",
  visibility: "Public",
};
const toInputDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";
const eventCover = (event) =>
  event?.thumbnailUrl ||
  event?.thumbnail_url ||
  event?.thumbnail ||
  event?.coverImage ||
  event?.coverImageUrl ||
  event?.cover_image_url ||
  event?.cover_image ||
  event?.coverUrl ||
  event?.cover_url ||
  event?.cover ||
  event?.image ||
  event?.image_url ||
  event?.imageUrl ||
  "";
const coverImageUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("/images/")) return value;
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.pathname.startsWith("/uploads/event-covers/"))
      return apiAssetUrl(parsed.pathname);
    if (/^https?:\/\//i.test(value)) return parsed.toString();
  } catch {
    // A bare filename is handled below.
  }
  return apiAssetUrl(
    value.startsWith("/") ? value : "/uploads/event-covers/" + value,
  );
};
const eventValue = (event, ...keys) =>
  keys.map((key) => event?.[key]).find((value) => value !== undefined && value !== null) ?? "";
const timezoneLabel = (zone) => {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "longOffset",
    }).formatToParts(new Date());
    const offset = parts
      .find((part) => part.type === "timeZoneName")
      ?.value?.replace("GMT", "UTC");
    return offset && offset !== "UTC" ? `${zone} (${offset})` : `${zone} (UTC)`;
  } catch {
    return zone;
  }
};

export default function EventsPage({
  managementOnly = false,
  creationPage = false,
  editPage = false,
}) {
  const { id: editId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedGroupId = new URLSearchParams(location.search).get("groupId");
  const draftMessageRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const token = localStorage.getItem("authToken");
  const canManage = Boolean(managementOnly && token);
  const canManageAllEvents = Boolean(
    user && ["manager", "admin"].includes(user.role),
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [timezones, setTimezones] = useState([]);
  const [managedGroups, setManagedGroups] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [draftId, setDraftId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [pendingCover, setPendingCover] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [publishedEvent, setPublishedEvent] = useState(null);
  const [savedEvent, setSavedEvent] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!error && !message) return undefined;
    const timer = window.setTimeout(() => {
      setError("");
      setMessage("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, message]);
  useEffect(() => {
    if (draftSaved)
      window.setTimeout(() => draftMessageRef.current?.focus(), 0);
  }, [draftSaved]);
  useEffect(() => {
    if (!creationPage) return;
    setForm({ ...initialForm, groupId: requestedGroupId || "" });
    setDraftId(null);
    setDraftSaved(false);
    setPendingCover(null);
    setErrors({});
    setError("");
  }, [creationPage, requestedGroupId]);
  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await apiFetch(
        "/api/events",
        canManage && token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {},
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load events.");
      setEvents(Array.isArray(data) ? data : data.events || []);
      if (canManage && token) {
        const own = await apiFetch("/api/my/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (own.ok) {
          const ownData = await own.json();
          setMine(Array.isArray(ownData) ? ownData : ownData.events || []);
        }
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [canManage, token, location.pathname]);
  useEffect(() => {
    Promise.all(
      ["/api/event-categories", "/api/event-types", "/api/timezones"].map(
        (path) => apiFetch(path),
      ),
    )
      .then(async (responses) => {
        const values = await Promise.all(
          responses.map((response) => response.json()),
        );
        if (responses[0].ok) setCategories(values[0]);
        if (responses[1].ok) setTypes(values[1]);
        if (responses[2].ok) setTimezones(values[2]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!canManage || !token) return;
    apiFetch("/api/my/groups/managed", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setManagedGroups(Array.isArray(data) ? data : data.groups || []);
      })
      .catch(() => {});
  }, [canManage, token]);
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const apply = (event) => {
    setDraftId(event.id);
    setForm((current) => ({
      ...current,
      ...event,
      title: eventValue(event, "title", "name"),
      shortDescription: eventValue(event, "shortDescription", "short_description"),
      description: eventValue(event, "description", "longDescription", "long_description"),
      coverImage: eventCover(event),
      startsAt: toInputDate(eventValue(event, "startsAt", "startsAtUtc", "starts_at", "starts_at_utc")),
      endsAt: toInputDate(eventValue(event, "endsAt", "endsAtUtc", "ends_at", "ends_at_utc")),
      registrationDeadline: toInputDate(eventValue(event, "registrationDeadline", "registration_deadline")),
      categoryId: eventValue(event, "categoryId", "category_id") || event.category?.id || "",
      typeId: eventValue(event, "typeId", "type_id") || event.type?.id || "",
      country: eventValue(event, "country"),
      city: eventValue(event, "city"),
      location: eventValue(event, "location", "venue"),
      address: eventValue(event, "address"),
      timezone: eventValue(event, "timezone", "timeZone") || current.timezone,
      capacity: eventValue(event, "capacity"),
      minimumAttendees: eventValue(event, "minimumAttendees", "minimum_attendees"),
      minimumAge: eventValue(event, "minimumAge", "minimum_age"),
      languageCode: eventValue(event, "languageCode", "language_code") || current.languageCode,
      whatToBring: eventValue(event, "whatToBring", "what_to_bring"),
      meetingInstructions: eventValue(event, "meetingInstructions", "meeting_instructions"),
      groupId: eventValue(event, "groupId", "group_id"),
      locationType: eventValue(event, "locationType", "location_type") || current.locationType,
      locationVisibility: eventValue(event, "locationVisibility", "location_visibility") || current.locationVisibility,
      pricingType: Number(eventValue(event, "fee")) > 0 ? "paid" : "free",
      fee: eventValue(event, "fee") || 0,
    }));
  };
  const payload = () =>
    Object.fromEntries(
      Object.entries({
        ...form,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        typeId: form.typeId ? Number(form.typeId) : undefined,
        startsAtUtc: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : undefined,
        endsAtUtc: form.endsAt
          ? new Date(form.endsAt).toISOString()
          : undefined,
        registrationDeadline: form.registrationDeadline
          ? new Date(form.registrationDeadline).toISOString()
          : undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        minimumAttendees: form.minimumAttendees
          ? Number(form.minimumAttendees)
          : undefined,
        minimumAge: form.minimumAge ? Number(form.minimumAge) : undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        fee: form.pricingType === "paid" ? Number(form.fee) : 0,
      }).filter(
        ([, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );
  const uploadFile = async (file, eventId = draftId) => {
    if (!file || !eventId) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("coverImage", file);
      const response = await apiFetch(`/api/events/${eventId}/cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to upload cover image.");
      const uploadedCover = eventCover(data.event || data) || data.coverImage;
      setForm((current) => ({ ...current, coverImage: uploadedCover }));
      setPendingCover(null);
      return uploadedCover;
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  };
  const save = async (event) => {
    event?.preventDefault();
    setErrors({});
    setError("");
    setMessage("");
    try {
      const selectedGroupId = managedGroups.some(
        (group) => String(group.id) === String(form.groupId),
      )
        ? form.groupId
        : "";
      const draftPath = selectedGroupId
        ? `/api/groups/${selectedGroupId}/events/drafts`
        : "/api/events/drafts";
      const requestPayload = payload();
      delete requestPayload.groupId;
      const response = await apiFetch(
        draftId ? `/api/events/${draftId}` : draftPath,
        {
          method: draftId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields || {});
        const fields = Object.entries(data.fields || {})
          .map(([field, message]) => `${field}: ${message}`)
          .join(" · ");
        throw new Error(fields || data.error || "Unable to save draft.");
      }
      apply(data);
      setDraftSaved(!editPage);
      if (editPage) setSavedEvent(true);
      setMessage("");
      if (pendingCover) await uploadFile(pendingCover, data.id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const uploadCover = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingCover(file);
      if (draftId) uploadFile(file);
      else setMessage("Cover selected. Save the draft to upload it.");
    }
    event.target.value = "";
  };
  const executePublish = async (id) => {
    const response = await apiFetch(`/api/events/${id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setErrors(data.fields || {});
      setError(data.error || "Event cannot be published.");
      return;
    }
    const published = data.event || data;
    setPublishedEvent({
      id,
      title: published.title || form.title || "Your event",
    });
    await load();
  };
  const publishEvent = (id) => setDialog({ action: "publish", id });
  const executeDelete = async (id, isDraft = false) => {
    const response = await apiFetch(`/api/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to delete event.");
      return;
    }
    if (draftId === id) {
      setDraftId(null);
      setForm(initialForm);
    }
    setEvents((current) => current.filter((event) => event.id !== id));
    setMine((current) => current.filter((event) => event.id !== id));
    setArchivedEvents((current) => current.filter((event) => event.id !== id));
    setMessage(isDraft ? "Draft deleted." : "Event deleted.");
    load(false).catch(() => {});
  };
  const deleteEvent = (id, isDraft = false) =>
    setDialog({ action: "delete", id, isDraft });
  const updateStatus = async (id, status) => {
    const response = await apiFetch(`/api/events/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to update event.");
      return;
    }
    if (status === "Archived") {
      const archivedEvent = [...mine, ...events].find(
        (event) => String(event.id) === String(id),
      );
      if (archivedEvent) {
        setArchivedEvents((current) => [
          { ...archivedEvent, status: "Archived" },
          ...current.filter((event) => String(event.id) !== String(id)),
        ]);
      }
      setEvents((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status: "Archived" } : event,
      ));
      setMine((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status: "Archived" } : event,
      ));
    } else if (status === "Published") {
      setArchivedEvents((current) =>
        current.filter((event) => String(event.id) !== String(id)),
      );
      setEvents((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status } : event,
      ));
      setMine((current) => current.map((event) =>
        String(event.id) === String(id) ? { ...event, status } : event,
      ));
    }
    setMessage(
      status === "Archived"
        ? "Event archived."
        : status === "Published"
          ? "Event restored."
          : "Event updated.",
    );
    load(false).catch((requestError) => setError(requestError.message));
  };
  const archiveEvent = (id) => setDialog({ action: "archive", id });
  const restoreEvent = (id) => setDialog({ action: "restore", id });
  const confirmDialog = async () => {
    const current = dialog;
    setDialog(null);
    if (!current) return;
    if (current.action === "delete")
      await executeDelete(current.id, current.isDraft);
    else if (current.action === "archive") await updateStatus(current.id, "Archived");
    else if (current.action === "restore") await updateStatus(current.id, "Published");
    else await executePublish(current.id);
  };
  const input = (name, label, type = "text", required = false) => (
    <label className="block text-sm">
      {label}
      {required && <span className="text-primary"> *</span>}
      <input
        name={name}
        type={type}
        step={type === "datetime-local" ? 900 : undefined}
        required={required}
        value={form[name]}
        onChange={update}
        className="mt-2 min-h-11 w-full border border-border bg-background px-3"
      />
      {errors[name] && (
        <span className="mt-1 block text-xs text-destructive">
          {errors[name]}
        </span>
      )}
    </label>
  );
  const organizerView = managementOnly && canManage;
  const displayed = organizerView && canManageAllEvents
    ? [
        ...mine,
        ...events.filter((event) => !mine.some((item) => item.id === event.id)),
      ]
    : organizerView
      ? mine
      : events;
  const active = displayed.filter(
    (event) => !["Archived", "Draft"].includes(event.status),
  );
  const drafts = displayed.filter((event) => event.status === "Draft");
  const archived = [...archivedEvents, ...displayed.filter((event) => event.status === "Archived")]
    .filter((event, index, all) => all.findIndex((item) => String(item.id) === String(event.id)) === index);
  useEffect(() => {
    if (!organizerView) return undefined;
    const buttons = [...document.querySelectorAll("article button")].filter(
      (button) => button.textContent === "Edit",
    );
    buttons.forEach((button) => {
      const article = button.closest("article");
      const event = displayed.find((item) =>
        article?.textContent.includes(item.title),
      );
      if (!event || event.status === "Draft" || article?.dataset.actionsAdded)
        return;
      article.dataset.actionsAdded = "true";
      const actions = button.parentElement;
      const group = document.createElement("div");
      group.className = "flex flex-wrap gap-2";
      actions?.insertBefore(group, button);
      group.appendChild(button);
      button.textContent = "Manage";
      button.onclick = () => {
        window.location.assign(`/events/${event.id}?manage=1`);
      };
      const archive = document.createElement("button");
      archive.type = "button";
      archive.className = "border border-border px-3 py-2 text-sm";
      archive.textContent = "Archive";
      archive.onclick = () => archiveEvent(event.id);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className =
        "border border-destructive px-3 py-2 text-sm text-destructive";
      remove.textContent = "Delete";
      remove.onclick = () => deleteEvent(event.id);
      group.append(archive, remove);
    });
    return undefined;
  }, [organizerView, displayed]);
  useEffect(() => {
    if (!organizerView || creationPage || editPage) return undefined;
    const heading = [...document.querySelectorAll("h2")].find((item) =>
      ["Create an experience", "Edit an event"].includes(item.textContent),
    );
    const section = heading?.closest("section");
    const form = section?.querySelector("form");
    if (form) form.style.display = "none";
    if (section && !section.querySelector("[data-create-event-link]")) {
      const link = document.createElement("a");
      link.dataset.createEventLink = "true";
      link.href = "/profile/events/new";
      link.className =
        "inline-flex min-h-10 items-center bg-primary px-4 py-2 text-sm text-primary-foreground";
      link.textContent = "Create an event";
      heading?.parentElement?.parentElement?.appendChild(link);
    }
    return undefined;
  }, [organizerView, creationPage]);
  useEffect(() => {
    if (!creationPage) return undefined;
    ["Upcoming experiences", "Your events"].forEach((title) => {
      const heading = [...document.querySelectorAll("h2")].find(
        (item) => item.textContent === title,
      );
      const section = heading?.closest("section");
      if (section) section.style.display = "none";
    });
    return undefined;
  }, [creationPage]);
  useEffect(() => {
    if (!organizerView || !editPage) return undefined;
    const buttons = [...document.querySelectorAll("article button")].filter(
      (button) => button.textContent === "Edit",
    );
    buttons.forEach((button) => {
      const article = button.closest("article");
      const event = displayed.find((item) =>
        article?.textContent.includes(item.title),
      );
      if (event)
        button.onclick = () =>
          window.location.assign(`/profile/events/${event.id}/edit`);
    });
    return undefined;
  }, [organizerView, editPage, displayed]);
  useEffect(() => {
    if (!editPage || !editId) return;
    apiFetch("/api/events/" + editId, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to load event.");
        apply(data);
      })
      .catch((requestError) => setError(requestError.message));
  }, [editPage, editId]);
  useEffect(() => {
    if (!editPage) return undefined;
    ["Upcoming experiences", "Your events"].forEach((title) => {
      const heading = [...document.querySelectorAll("h2")].find(
        (item) => item.textContent === title,
      );
      const section = heading?.closest("section");
      if (section) section.style.display = "none";
    });
    return undefined;
  }, [editPage]);
  useEffect(() => {
    if (!organizerView || editPage) return undefined;
    const buttons = [...document.querySelectorAll("article button")].filter(
      (button) => button.textContent === "Edit",
    );
    buttons.forEach((button) => {
      const article = button.closest("article");
      const event = displayed.find((item) =>
        article?.textContent.includes(item.title),
      );
      if (event)
        button.onclick = () =>
          window.location.assign(`/profile/events/${event.id}/edit`);
    });
    return undefined;
  }, [organizerView, editPage, displayed]);
  return (
    <SiteChrome>
      <Helmet>
        <title>Events | YARO</title>
      </Helmet>
      <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          YARO experiences
        </p>
        <h1 className="mt-3 font-display text-5xl font-black">
          Find something worth joining.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Explore activities, gatherings and local experiences.
        </p>
        {error && (
          <p className="fixed bottom-6 left-5 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg sm:left-auto sm:right-6">
            {error}
          </p>
        )}
        {canManage && (
          <section className="mt-12 border-y border-border py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  Event workspace
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {editPage ? "Edit an event" : "Create an experience"}
                </h2>
              </div>
              {editPage && (
                <Link
                  to="/profile/events/new"
                  className="inline-flex min-h-11 items-center border border-border px-4 text-sm"
                >
                  Create an event
                </Link>
              )}
            </div>
            <form
              style={draftSaved ? { display: "none" } : undefined}
              onSubmit={save}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {input("title", "Title", "text", true)}
              {creationPage && managedGroups.length > 0 && (
                <label className="block text-sm">
                  Post to group
                  <select
                    name="groupId"
                    value={managedGroups.some((group) => String(group.id) === String(form.groupId)) ? form.groupId : ""}
                    onChange={update}
                    disabled={Boolean(draftId)}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3 disabled:opacity-60"
                  >
                    <option value="">No group</option>
                    {managedGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Publishing notifies current members of the selected group.
                  </span>
                </label>
              )}
              {input("shortDescription", "Short description")}
              <label className="block text-sm sm:col-span-2">
                Cover image
                {form.coverImage && (
                  <span className="ml-2 text-xs text-primary">Uploaded</span>
                )}
                {pendingCover && !form.coverImage && (
                  <span className="ml-2 text-xs text-primary">
                    Selected: {pendingCover.name}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadCover}
                  disabled={uploading}
                  className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  JPEG, PNG or WebP, maximum 10 MB.
                </span>
                {errors.coverImage && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.coverImage}
                  </span>
                )}
              </label>
              <label className="block text-sm">
                Category
                <select
                  required
                  name="categoryId"
                  value={form.categoryId}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Event type
                <select
                  required
                  name="typeId"
                  value={form.typeId}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="">Select type</option>
                  {types.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              {input("country", "Country", "text", true)}
              {input("city", "City", "text", true)}
              {input("location", "Location")}
              {input("address", "Address")}
              {input("startsAt", "Starts", "datetime-local", true)}
              {input("endsAt", "Ends", "datetime-local")}
              {
                <label className="block text-sm">
                  Timezone
                  <select
                    required
                    name="timezone"
                    value={form.timezone}
                    onChange={update}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  >
                    <option value="">Select timezone</option>
                    {timezones.map((zone) => (
                      <option key={zone} value={zone}>
                        {timezoneLabel(zone)}
                      </option>
                    ))}
                  </select>
                  {errors.timezone && (
                    <span className="mt-1 block text-xs text-destructive">
                      {errors.timezone}
                    </span>
                  )}
                </label>
              }
              {input("capacity", "Capacity", "number")}
              {input("minimumAttendees", "Minimum attendees", "number")}
              {input("languageCode", "Language")}
              <label className="block text-sm">
                Pricing
                <select
                  name="pricingType"
                  value={form.pricingType}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              {form.pricingType === "paid" &&
                input("fee", "Fee", "number", true)}
              <label className="block text-sm">
                Location type
                <select
                  name="locationType"
                  value={form.locationType}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="physical">Physical</option>
                  <option value="online">Online</option>
                </select>
              </label>
              <label className="block text-sm">
                Location visibility
                <select
                  name="locationVisibility"
                  value={form.locationVisibility}
                  onChange={update}
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              {input(
                "registrationDeadline",
                "Registration deadline",
                "datetime-local",
              )}
              {input("minimumAge", "Minimum age", "number")}
              {input("whatToBring", "What to bring")}
              {input("meetingInstructions", "Meeting instructions")}
              <label className="block text-sm sm:col-span-2">
                Description
                <textarea
                  required
                  name="description"
                  value={form.description}
                  onChange={update}
                  rows="4"
                  className="mt-2 w-full border border-border bg-background px-3 py-3"
                />
                {errors.description && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.description}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button className="min-h-11 bg-primary px-5 text-sm text-primary-foreground">
                  {editPage ? "Save" : "Save draft"}
                </button>
              </div>
            </form>
          </section>
        )}
        {draftSaved && (
          <section className="mt-12 py-10 text-center">
            <p
              ref={draftMessageRef}
              tabIndex="-1"
              className="font-display text-3xl font-semibold text-primary sm:text-4xl"
            >
              {editPage ? "Draft has been saved" : "Draft created"}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              You can edit it, publish it, or delete it below.
            </p>
          </section>
        )}
        {canManage && drafts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-3xl font-semibold">Drafts</h2>
            <div className="mt-4 space-y-3">
              {drafts.map((event) => (
                <article key={event.id} className="border border-border p-5">
                  {eventCover(event) && (
                    <img
                      src={coverImageUrl(eventCover(event))}
                      alt=""
                      className="mb-4 aspect-[16/7] w-full object-cover"
                    />
                  )}
                  <span className="text-xs uppercase tracking-[0.2em] text-primary">
                    Draft
                  </span>
                  <h3 className="mt-2 font-display text-2xl">
                    {event.title || "Untitled experience"}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/profile/events/${event.id}/edit`}
                      className="inline-flex min-h-10 items-center border border-border px-4 text-sm"
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => publishEvent(event.id)}
                      className="min-h-10 bg-primary px-4 text-sm text-primary-foreground"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id, true)}
                      className="min-h-10 border border-destructive px-4 text-sm text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-semibold">
            {managementOnly ? "Your events" : "Upcoming experiences"}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="flex items-center gap-3 py-8 text-muted-foreground">
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  aria-hidden="true"
                />
                Loading events…
              </div>
            ) : active.length === 0 ? (
              <p className="py-6 text-muted-foreground">
                No published events are available yet.
              </p>
            ) : (
              active.map((event) => (
                <article
                  key={event.id}
                  className="group overflow-hidden border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="min-w-0 flex-1">
                    {eventCover(event) ? (
                      <img
                        src={coverImageUrl(eventCover(event))}
                        alt={`${event.title} cover`}
                        className="mb-4 aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="mb-4 flex aspect-[16/10] w-full items-end bg-gradient-to-br from-primary/90 via-primary/65 to-slate-900 p-5 text-white">
                        <span className="font-display text-2xl leading-none">
                          {event.title}
                        </span>
                      </div>
                    )}
                    <p className="text-xs uppercase tracking-[0.2em] text-primary">
                      {event.status}
                    </p>
                    {event.groupName && (
                      <Link to={`/groups/${event.groupId}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                        From {event.groupName}
                      </Link>
                    )}
                    <h3 className="mt-2 font-display text-2xl">
                      {event.title}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {event.shortDescription ||
                        event.description ||
                        "Details coming soon."}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.startsAt
                        ? new Date(event.startsAt).toLocaleString()
                        : "Date to be announced"}{" "}
                      ·{" "}
                      {event.city ||
                        event.location ||
                        "Location to be announced"}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <a
                        href={`/profile/events/${event.id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center border border-border px-3 text-sm"
                      >
                        Edit
                      </a>
                      <a
                        href={`/events/${event.id}?manage=1`}
                        className="inline-flex min-h-10 items-center justify-center bg-primary px-3 text-sm text-primary-foreground"
                      >
                        Manage
                      </a>
                      <button
                        type="button"
                        onClick={() => archiveEvent(event.id)}
                        className="min-h-10 border border-border px-3 text-sm"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="min-h-10 border border-destructive px-3 text-sm text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={`/events/${event.id}`}
                      className="mt-5 inline-flex min-h-10 items-center bg-primary px-4 text-sm text-primary-foreground"
                    >
                      View
                    </Link>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
        {canManage && archived.length > 0 && (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-semibold">Archived events</h2>
            <p className="mt-2 text-sm text-muted-foreground">Archived events are kept here for your records and are not visible to customers.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((event) => (
                <article key={event.id} className="overflow-hidden border border-border bg-secondary/25 p-4">
                  {eventCover(event) && <img src={coverImageUrl(eventCover(event))} alt="" className="mb-4 aspect-[16/10] w-full object-cover" />}
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Archived</p>
                  <h3 className="mt-2 font-display text-2xl">{event.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{event.startsAt ? new Date(event.startsAt).toLocaleString() : "Date to be announced"}</p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => restoreEvent(event.id)}
                      className="min-h-10 bg-primary px-3 text-sm text-primary-foreground"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="min-h-10 border border-destructive px-3 text-sm text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
      {dialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md border border-border bg-background p-7 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Please confirm
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              {dialog.action === "delete"
                ? dialog.isDraft ? "Delete this draft?" : "Delete this event?"
                : dialog.action === "archive"
                  ? "Archive this event?"
                  : dialog.action === "restore"
                    ? "Restore this event?"
                  : "Publish this event?"}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {dialog.action === "delete"
                ? dialog.isDraft ? "This draft and its saved details will be permanently removed." : "This event and its saved details will be permanently removed."
                : dialog.action === "archive"
                  ? "Archived events are no longer visible to customers."
                  : dialog.action === "restore"
                    ? "Restoring makes this event visible to customers again."
                  : "Publishing makes this event visible to customers and available for registration."}
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="min-h-11 border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog}
                className={`min-h-11 px-4 text-sm text-primary-foreground ${dialog.action === "delete" ? "bg-destructive" : "bg-primary"}`}
              >
                {dialog.action === "delete" ? dialog.isDraft ? "Delete draft" : "Delete event" : dialog.action === "archive" ? "Archive event" : dialog.action === "restore" ? "Restore event" : "Publish event"}
              </button>
            </div>
          </div>
        </div>
      )}
      {publishedEvent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="published-title"
        >
          <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Now live
            </p>
            <h2
              id="published-title"
              className="mt-3 font-display text-4xl font-semibold"
            >
              Event published
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                {publishedEvent.title}
              </span>{" "}
              is now visible to customers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={`/events/${publishedEvent.id}`}
                className="inline-flex min-h-11 items-center justify-center bg-primary px-5 text-sm text-primary-foreground"
                onClick={() => setPublishedEvent(null)}
              >
                View event
              </Link>
              <button
                type="button"
                onClick={() => setPublishedEvent(null)}
                className="min-h-11 border border-border px-5 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {savedEvent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-event-title"
        >
          <div className="w-full max-w-md border border-border bg-background p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Saved
            </p>
            <h2 id="saved-event-title" className="mt-3 font-display text-4xl font-semibold">
              Event saved
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Your changes have been saved successfully.
            </p>
            <button
              type="button"
              onClick={() => navigate("/profile/events")}
              className="mt-8 min-h-11 bg-primary px-5 text-sm text-primary-foreground"
            >
              Manage events
            </button>
          </div>
        </div>
      )}
    </SiteChrome>
  );
}
