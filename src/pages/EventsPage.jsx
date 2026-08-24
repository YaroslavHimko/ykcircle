import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  recurrenceFrequency: "none",
  recurrenceInterval: "1",
  recurrenceCount: "2",
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
const testEventPresets = [
  ["Sunrise walk at Djurgården", "Start the day with a relaxed waterside walk and coffee.", "Join a friendly sunrise walk through Djurgården. We will keep an easy pace, stop for photos and finish with coffee together.", "Rosendal Garden", "Rosendalsvägen 38, 115 21 Stockholm", "2030-06-08T08:00", "2030-06-08T10:00", "2030-06-07T18:00", "Bring comfortable shoes and a reusable cup.", "Meet by the Rosendal Garden entrance, ten minutes before we start.", "free", "0", "physical", "public", "20", "4", "16", "en", "none"],
  ["Beginner bouldering social", "Learn the basics and meet other climbers.", "A welcoming indoor bouldering session for complete beginners. An instructor will cover safety and basic techniques before open social climbing.", "Klättercentret Telefonplan", "Tellusgången 22, 126 26 Hägersten", "2030-06-12T18:30", "2030-06-12T21:00", "2030-06-11T20:00", "Wear comfortable sports clothes; climbing shoes can be rented.", "Ask for the YKCircle host at reception.", "paid", "180", "physical", "public", "16", "3", "18", "en", "none"],
  ["Midsummer picnic planning", "Make new plans over snacks in the park.", "Bring a small picnic item to share and help build a friendly Midsummer plan with new people in Stockholm.", "Tantolunden", "Tantolunden, 118 42 Stockholm", "2030-06-15T14:00", "2030-06-15T17:00", "2030-06-14T18:00", "A picnic blanket and something small to share.", "Meet at the main lawn near the beach volleyball court.", "free", "0", "physical", "public", "30", "6", "16", "en", "weekly"],
  ["Stockholm street-photo walk", "Find better frames with a small creative group.", "Explore Södermalm with a camera or phone, swap composition tips and select a few favourite photos together afterwards.", "Mariatorget", "Mariatorget, 118 48 Stockholm", "2030-06-18T17:30", "2030-06-18T20:00", "2030-06-17T19:00", "Any camera or phone with space for photos.", "Gather beside the statue in the centre of Mariatorget.", "free", "0", "physical", "public", "12", "3", "14", "en", "none"],
  ["Sunday board-game brunch", "Easy games, pastries and new people.", "A low-pressure Sunday brunch with modern board games. New players are especially welcome and rules will be explained.", "Alphaspel", "Östgötagatan 33, 116 25 Stockholm", "2030-06-23T11:00", "2030-06-23T14:00", "2030-06-22T17:00", "Optional: bring a favourite game to teach.", "Look for the YKCircle table near the café.", "paid", "90", "physical", "public", "18", "4", "16", "en", "none"],
  ["Swedish fika conversation club", "Practice Swedish in a relaxed small group.", "Build confidence speaking Swedish through guided conversation prompts, café chat and a little help from fellow learners.", "Kulturhuset Stadsteatern", "Sergels torg, 111 57 Stockholm", "2030-06-25T18:00", "2030-06-25T19:30", "2030-06-24T18:00", "A notebook if you like taking notes.", "Meet inside the main entrance by the information desk.", "free", "0", "physical", "public", "14", "4", "18", "sv", "weekly"],
  ["Kayak taster on Lake Mälaren", "Try kayaking with a supportive crew.", "A beginner-friendly kayak taster with equipment, safety briefing and a calm route close to shore.", "Långholmens Kajak", "Långholmsmuren 21, 117 33 Stockholm", "2030-06-29T10:00", "2030-06-29T12:30", "2030-06-27T18:00", "Swimwear, a towel and water; equipment is included.", "Arrive 15 minutes early for the safety briefing.", "paid", "350", "physical", "public", "10", "4", "18", "en", "none"],
  ["Remote co-working sprint", "Focus together from wherever you are.", "Join a structured online co-working session with short introductions, two focus blocks and a friendly check-out.", "Online via video call", "A joining link will be sent after registration.", "2030-07-02T09:00", "2030-07-02T11:30", "2030-07-01T18:00", "Headphones and one task you want to finish.", "The video-call link is shared with registered attendees.", "free", "0", "online", "private", "25", "3", "16", "en", "weekly"],
  ["Evening run by the water", "A social 5 km at a conversational pace.", "Run a relaxed route around Kungsholmen, with a no-drop pace and an optional cool-down drink afterwards.", "Rålambshovsparken", "Smedsuddsvägen, 112 35 Stockholm", "2030-07-05T18:30", "2030-07-05T19:45", "2030-07-04T16:00", "Running shoes and a light layer for after the run.", "Meet at the park entrance closest to Rålambshovsled.", "free", "0", "physical", "public", "24", "4", "16", "en", "none"],
  ["Ceramics introduction workshop", "Make a small piece from clay and unwind.", "Learn simple hand-building techniques in a calm studio session. Your finished piece will be glazed and fired by the studio.", "Stockholm Ceramic Studio", "Sankt Eriksgatan 39, 112 34 Stockholm", "2030-07-09T18:00", "2030-07-09T20:30", "2030-07-07T18:00", "Wear clothes that can get a little clay on them.", "Meet the host inside the studio courtyard entrance.", "paid", "420", "physical", "public", "12", "4", "18", "en", "none"],
];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedGroupId = new URLSearchParams(location.search).get("groupId");
  const selectedCategory = searchParams.get("category") || "";
  const draftMessageRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const token = localStorage.getItem("authToken");
  const canManage = Boolean(managementOnly && token);
  const canManageAllEvents = Boolean(
    user && ["manager", "admin"].includes(user.role),
  );
  const isAdministrator = user?.role === "admin";
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
      const eventPath = !managementOnly && selectedCategory
        ? `/api/events?category=${encodeURIComponent(selectedCategory)}`
        : "/api/events";
      const response = await apiFetch(
        eventPath,
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
          const ownEvents = Array.isArray(ownData) ? ownData : ownData.events || [];
          const hydratedEvents = await Promise.all(ownEvents.map(async (event) => {
            if (eventCover(event) || !event.id) return event;
            try {
              const detail = await apiFetch(`/api/events/${event.id}`, { headers: { Authorization: `Bearer ${token}` } });
              if (!detail.ok) return event;
              const detailData = await detail.json();
              return { ...event, ...(detailData.event || detailData) };
            } catch {
              return event;
            }
          }));
          setMine(hydratedEvents);
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
  }, [canManage, token, location.pathname, managementOnly, selectedCategory]);
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
  const applyTestPreset = (event) => {
    const presetIndex = Number(event.target.value);
    if (!Number.isInteger(presetIndex) || !testEventPresets[presetIndex]) return;
    const [
      title, shortDescription, description, location, address, startsAt, endsAt,
      registrationDeadline, whatToBring, meetingInstructions, pricingType, fee,
      locationType, locationVisibility, capacity, minimumAttendees, minimumAge,
      languageCode, recurrenceFrequency,
    ] = testEventPresets[presetIndex];
    setForm((current) => ({
      ...current,
      title, shortDescription, description, location, address, startsAt, endsAt,
      registrationDeadline, whatToBring, meetingInstructions, pricingType, fee,
      locationType, locationVisibility, capacity, minimumAttendees, minimumAge,
      languageCode, recurrenceFrequency,
      recurrenceInterval: "1",
      recurrenceCount: recurrenceFrequency === "none" ? "2" : "4",
      country: "Sweden",
      city: "Stockholm",
      timezone: timezones.includes("Europe/Stockholm") ? "Europe/Stockholm" : current.timezone,
      currency: "SEK",
      registrationType: "yaroko",
      visibility: "Public",
      categoryId: categories.length ? String(categories[presetIndex % categories.length].id) : "",
      typeId: types.length ? String(types[presetIndex % types.length].id) : "",
    }));
    setErrors({});
    setMessage("Test event details loaded. Add a cover image if needed, then save the draft.");
  };
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
      recurrenceFrequency: eventValue(event, "recurrenceFrequency") || "none",
      recurrenceInterval: String(eventValue(event, "recurrenceInterval") || 1),
      recurrenceCount: String(eventValue(event, "recurrenceCount") || 2),
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
  const payload = () => {
    const {
      recurrenceFrequency,
      recurrenceInterval,
      recurrenceCount,
      ...eventForm
    } = form;
    const recurrence = !draftId && recurrenceFrequency !== "none"
      ? {
          frequency: recurrenceFrequency,
          interval: Number(recurrenceInterval),
          count: Number(recurrenceCount),
        }
      : undefined;
    return Object.fromEntries(
      Object.entries({
        ...eventForm,
        recurrence,
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
  };
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
  const eventStatus = (event) => String(event?.status || "Published").toLowerCase();
  const active = displayed.filter(
    (event) => !["archived", "draft"].includes(eventStatus(event)),
  );
  const drafts = displayed.filter((event) => eventStatus(event) === "draft");
  const archived = [...archivedEvents, ...displayed.filter((event) => eventStatus(event) === "archived")]
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
        <title>Events | YKCircle</title>
      </Helmet>
      <section className="mx-auto max-w-[72rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          YKCircle experiences
        </p>
        <h1 className="mt-3 font-display text-5xl font-black">
          Find something worth joining.
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Explore activities, gatherings and local experiences.
        </p>
        {!managementOnly && (
          <nav aria-label="Event categories" className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`min-h-10 border px-4 text-sm ${!selectedCategory ? "border-primary text-primary" : "border-border"}`}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSearchParams({ category: category.slug })}
                className={`min-h-10 border px-4 text-sm ${selectedCategory === category.slug ? "border-primary text-primary" : "border-border"}`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
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
              {creationPage && isAdministrator && (
                <label className="border border-primary/30 bg-primary/5 p-4 text-sm sm:col-span-2">
                  Testing preset
                  <select
                    defaultValue=""
                    onChange={applyTestPreset}
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  >
                    <option value="" disabled>Choose one of 10 sample events</option>
                    {testEventPresets.map(([title], index) => (
                      <option key={title} value={index}>{index + 1}. {title}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Populates all event details. Cover images must still be selected from your device.
                  </span>
                </label>
              )}
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
              {creationPage && !draftId && (
                <div className="grid gap-4 border border-border p-4 sm:col-span-2 sm:grid-cols-3">
                  <label className="block text-sm">
                    Repeat
                    <select
                      name="recurrenceFrequency"
                      value={form.recurrenceFrequency}
                      onChange={update}
                      className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                  {form.recurrenceFrequency !== "none" && <>
                    <label className="block text-sm">
                      Every
                      <input required min="1" max="52" name="recurrenceInterval" type="number" value={form.recurrenceInterval} onChange={update} className="mt-2 min-h-11 w-full border border-border bg-background px-3" />
                      <span className="mt-1 block text-xs text-muted-foreground">{form.recurrenceFrequency === "daily" ? "day(s)" : form.recurrenceFrequency === "weekly" ? "week(s)" : "month(s)"}</span>
                    </label>
                    <label className="block text-sm">
                      Occurrences
                      <input required min="2" max="100" name="recurrenceCount" type="number" value={form.recurrenceCount} onChange={update} className="mt-2 min-h-11 w-full border border-border bg-background px-3" />
                      <span className="mt-1 block text-xs text-muted-foreground">Includes the first event.</span>
                    </label>
                  </>}
                  {errors.recurrence && <p className="text-sm text-destructive sm:col-span-3">{errors.recurrence}</p>}
                </div>
              )}
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
                    {event.seriesId && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Recurring series · occurrence {event.occurrenceNumber || 1} of {event.recurrenceCount || "?"}
                      </p>
                    )}
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
                    {(event.venueBooking?.status === "confirmed" || event.venue_booking?.status === "confirmed") && (
                      <p className="mt-2 text-sm text-primary">Confirmed venue: {event.venueBooking?.venue?.name || event.venueBooking?.venueName || event.venue_booking?.venue?.name || event.venue_booking?.venueName}</p>
                    )}
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
                <article key={event.id} className="relative overflow-hidden border border-border bg-secondary/25 p-4 opacity-75">
                  <div className="pointer-events-none absolute inset-0 z-10 bg-white/35" aria-hidden="true" />
                  {eventCover(event) && <img src={coverImageUrl(eventCover(event))} alt="" className="mb-4 aspect-[16/10] w-full object-cover" />}
                  <div className="relative z-20">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Archived</p>
                    <h3 className="mt-2 font-display text-2xl text-muted-foreground">{event.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{event.startsAt ? new Date(event.startsAt).toLocaleString() : "Date to be announced"}</p>
                  </div>
                  <div className="relative z-20 mt-5 grid grid-cols-2 gap-2">
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
