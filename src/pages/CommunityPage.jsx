import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  MapPin,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import {
  asList,
  communityHeaders,
  communityPostUrl,
  communityRequest,
  formatCommunityDate,
  parseAttributes,
  slugify,
} from "@/lib/community";

const attributeFields = {
  sports: ["Skill level", "Frequency", "Availability"],
  music: ["Instrument / role", "Genre", "Experience level"],
  outdoors: ["Difficulty", "Preferred distance", "Availability"],
};
const attributeLabels = {
  skilllevel: "Skill Level",
  skillLevel: "Skill Level",
  frequency: "Frequency",
  availability: "Availability",
};
const labelForAttribute = (key) =>
  attributeLabels[key] ??
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const emptyForm = {
  postTypeId: "",
  categoryId: "",
  subcategoryId: "",
  city: "Stockholm",
  title: "",
  shortDescription: "",
  body: "",
  locationName: "",
  locationRadiusKm: "",
  attributes: {},
  visibility: "public",
  expiresAt: "",
};

const postImage = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return apiAssetUrl(
    value.startsWith("/") ? value : `/uploads/profile-pictures/${value}`,
  );
};

function FieldError({ errors, name }) {
  return errors[name] ? (
    <span className="mt-1 block text-xs text-destructive">{errors[name]}</span>
  ) : null;
}

function LinkedEventSelector({ events, value, onChange, loading }) {
  return (
    <div className="mx-auto mt-5 block max-w-3xl text-sm">
      Linked events <span className="text-muted-foreground">(select one or more)</span>
      <select
        multiple
        value={value}
        onChange={(event) =>
          onChange(
            [...event.target.selectedOptions].map((option) => option.value),
          )
        }
        disabled={loading}
        className="sr-only"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
            {event.startsAt
              ? ` · ${new Date(event.startsAt).toLocaleDateString()}`
              : ""}
            {event.status ? ` (${event.status})` : ""}
          </option>
        ))}
      </select>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {events.map((event) => {
          const id = String(event.id);
          const selected = value.includes(id);
          return <label key={event.id} className={`flex cursor-pointer items-start gap-3 border p-4 text-sm transition-colors ${selected ? "border-primary bg-primary/5" : "border-border"}`}>
            <input type="checkbox" checked={selected} disabled={loading} onChange={() => onChange(selected ? value.filter((item) => item !== id) : [...value, id])} className="mt-1 h-4 w-4 shrink-0" />
            <span><span className="block font-medium">{event.title}</span><span className="text-muted-foreground">{event.startsAt ? new Date(event.startsAt).toLocaleDateString() : "Date to be announced"}{event.status ? ` · ${event.status}` : ""}</span></span>
          </label>;
        })}
        {!loading && events.length === 0 && <p className="text-sm text-muted-foreground">You do not have any events available to link.</p>}
      </div>
    </div>
  );
}

const linkedEventIds = (post) =>
  Array.isArray(post.eventIds)
    ? post.eventIds
    : post.eventId != null
      ? [post.eventId]
      : [];

function LinkedEventCta({ post, inActionBar = false }) {
  const eventIds = linkedEventIds(post);
  const [hasAvailableEvents, setHasAvailableEvents] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all(eventIds.map((eventId) => apiFetch(`/api/events/${eventId}`)))
      .then((responses) => {
        if (active)
          setHasAvailableEvents(responses.some((response) => response.ok));
      })
      .catch(() => {
        if (active) setHasAvailableEvents(false);
      });
    return () => {
      active = false;
    };
  }, [eventIds.join(",")]);
  return eventIds.length > 0 && hasAvailableEvents ? (
    <Link
      to={`${communityPostUrl(post)}/events`}
      className={`${inActionBar ? "" : "mt-5 "}inline-flex min-h-12 items-center border border-primary px-5 text-sm text-primary`}
    >
      View linked events
    </Link>
  ) : null;
}

function CommunityLinkedEventsPage({ post }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const eventIds = linkedEventIds(post);
  useEffect(() => {
    let active = true;
    Promise.all(
      eventIds.map(async (eventId) => {
        const response = await apiFetch(`/api/events/${eventId}`);
        return response.ok ? response.json() : null;
      }),
    )
      .then((data) => {
        if (active)
          setEvents(data.filter(Boolean).map((event) => event.event || event));
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventIds.join(",")]);
  return (
    <SiteChrome>
      <Helmet>
        <title>Linked events | YKCircle</title>
      </Helmet>
      <section className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <Link to={communityPostUrl(post)} className="text-sm text-primary">
          ← Back to post
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-primary">
          Community post
        </p>
        <h1 className="mt-3 font-display text-4xl font-black">Linked events</h1>
        <p className="mt-4 text-muted-foreground">
          Events connected to “{post.title}”.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {loading ? (
            <p className="text-muted-foreground">Loading linked events…</p>
          ) : (
            events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="border border-border p-5 hover:border-primary"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-primary">
                  {event.startsAt
                    ? new Date(event.startsAt).toLocaleString()
                    : "Date to be announced"}
                </p>
                <h2 className="mt-2 font-display text-2xl">{event.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {event.shortDescription ||
                    event.description ||
                    "View event details."}
                </p>
              </Link>
            ))
          )}
          {!loading && events.length === 0 && (
            <p className="text-muted-foreground">
              No linked events are currently available.
            </p>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}

function CommunityEventLinkPage({ post, token }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [eventIds, setEventIds] = useState(() =>
    linkedEventIds(post).map(String),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/api/my/events", { headers: communityHeaders(token) })
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (active) setEvents(asList(data, "events"));
      })
      .catch(() => {
        if (active) setError("Unable to load your events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await communityRequest(`/api/community/posts/${post.id}/event`, {
        method: "PUT",
        headers: communityHeaders(token, true),
        body: JSON.stringify({ eventIds: eventIds.map(Number) }),
      });
      navigate(communityPostUrl(post));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SiteChrome>
      <Helmet>
        <title>Link events | YKCircle</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <Link to={communityPostUrl(post)} className="text-sm text-primary">
          ← Back to post
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-primary">
          Post management
        </p>
        <h1 className="mt-3 font-display text-4xl font-black">Link events</h1>
        <p className="mt-4 text-muted-foreground">
          Choose one of your events to show alongside “{post.title}”.
        </p>
        <LinkedEventSelector
          events={events}
          value={eventIds}
          onChange={setEventIds}
          loading={loading || saving}
        />
        {error && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to={communityPostUrl(post)}
            className="inline-flex min-h-12 items-center border border-border px-5 text-sm"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="min-h-12 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save linked event"}
          </button>
        </div>
      </section>
    </SiteChrome>
  );
}

function PostCard({ post }) {
  return (
    <article className="border border-border bg-background p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">
            {post.postTypeName || post.postTypeKey?.replaceAll("_", " ")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            <Link to={communityPostUrl(post)} className="hover:text-primary">
              {post.title}
            </Link>
          </h2>
        </div>
        <span
          className={`text-xs font-medium ${post.status === "fulfilled" ? "text-primary" : "text-muted-foreground"}`}
        >
          {post.status === "fulfilled" ? "Completed" : "Active"}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {post.shortDescription}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span>
          {post.categoryName}
          {post.subcategoryName ? ` · ${post.subcategoryName}` : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {post.city}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.responseCount || 0} interested
        </span>
      </div>
      {linkedEventIds(post).length > 0 && <LinkedEventCta post={post} />}
    </article>
  );
}

function CommunityForm({
  initial,
  postTypes,
  categories,
  onSave,
  saving,
  serverErrors,
}) {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const topCategories = categories.filter((item) => !item.parentId);
  const selectedCategory = categories.find(
    (item) => String(item.id) === String(form.categoryId),
  );
  const subcategories = categories.filter(
    (item) => String(item.parentId) === String(form.categoryId),
  );
  const fields = attributeFields[selectedCategory?.slug] || [
    "Details",
    "Availability",
    "Preferences",
  ];
  const displayedErrors = { ...serverErrors, ...errors };

  useEffect(() => {
    const attributes = parseAttributes(initial?.attributes);
    setForm(
      initial
        ? {
            postTypeId: initial.postTypeId || "",
            categoryId: initial.categoryId || "",
            subcategoryId: initial.subcategoryId || "",
            city: initial.city || "Stockholm",
            title: initial.title || "",
            shortDescription: initial.shortDescription || "",
            body: initial.body || "",
            locationName: initial.locationName || "",
            locationRadiusKm: initial.locationRadiusKm || "",
            attributes,
            visibility: initial.visibility || "public",
            expiresAt: initial.expiresAt
              ? String(initial.expiresAt).slice(0, 10)
              : "",
          }
        : emptyForm,
    );
    setErrors({});
    setStep(1);
  }, [initial]);

  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  const updateAttribute = (name, value) =>
    setForm((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [slugify(name).replaceAll("-", "")]: value,
      },
    }));
  const canMoveForward = () => {
    if (step === 1) return Boolean(form.postTypeId);
    if (step === 2) return Boolean(form.categoryId);
    if (step === 3)
      return (
        form.title.trim().length >= 5 &&
        form.shortDescription.trim().length >= 20
      );
    return true;
  };
  const save = (status) => {
    const nextErrors = {};
    if (!form.postTypeId)
      nextErrors.postTypeId = "Choose what you are looking for.";
    if (!form.categoryId) nextErrors.categoryId = "Choose a category.";
    if (form.title.trim().length < 5)
      nextErrors.title = "Use at least 5 characters.";
    if (form.shortDescription.trim().length < 20)
      nextErrors.shortDescription = "Use at least 20 characters.";
    if (!form.city.trim()) nextErrors.city = "Choose a city.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStep(3);
      return;
    }
    onSave({ ...form, status });
  };

  const type = postTypes.find(
    (item) => String(item.id) === String(form.postTypeId),
  );
  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Community post
          </p>
          <h1 className="mt-2 font-display text-4xl font-black">
            {initial ? "Edit your post" : "Post what you’re looking for"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">Step {step} of 6</p>
      </div>
      <div className="mt-8 border-y border-border py-7">
        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl">What are you looking for?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {postTypes.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => update("postTypeId", item.id)}
                  className={`min-h-20 border p-4 text-left ${String(form.postTypeId) === String(item.id) ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
            <FieldError errors={displayedErrors} name="postTypeId" />
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl">What is it about?</h2>
            <label className="mt-5 block text-sm">
              Category
              <select
                value={form.categoryId}
                onChange={(event) => {
                  update("categoryId", event.target.value);
                  update("subcategoryId", "");
                }}
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              >
                <option value="">Choose a category</option>
                {topCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <FieldError errors={displayedErrors} name="categoryId" />
            </label>
            {subcategories.length > 0 && (
              <label className="mt-5 block text-sm">
                Subcategory{" "}
                <span className="text-muted-foreground">(optional)</span>
                <select
                  value={form.subcategoryId}
                  onChange={(event) =>
                    update("subcategoryId", event.target.value)
                  }
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                >
                  <option value="">Any subcategory</option>
                  {subcategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <FieldError errors={displayedErrors} name="subcategoryId" />
              </label>
            )}
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl">Describe it</h2>
            <label className="mt-5 block text-sm">
              Title
              <input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                maxLength="180"
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                placeholder="Looking for a tennis partner in Stockholm"
              />
            </label>
            <FieldError errors={displayedErrors} name="title" />
            <label className="mt-5 block text-sm">
              Short description
              <textarea
                value={form.shortDescription}
                onChange={(event) =>
                  update("shortDescription", event.target.value)
                }
                maxLength="500"
                rows="3"
                className="mt-2 w-full border border-border bg-background px-3 py-2"
                placeholder="A quick summary that helps the right people find you."
              />
            </label>
            <FieldError errors={displayedErrors} name="shortDescription" />
            <label className="mt-5 block text-sm">
              Full description{" "}
              <span className="text-muted-foreground">(optional)</span>
              <textarea
                value={form.body}
                onChange={(event) => update("body", event.target.value)}
                maxLength="10000"
                rows="6"
                className="mt-2 w-full border border-border bg-background px-3 py-2"
              />
            </label>
            <FieldError errors={displayedErrors} name="body" />
          </div>
        )}
        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl">Where?</h2>
            <label className="mt-5 block text-sm">
              City
              <input
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              />
            </label>
            <FieldError errors={errors} name="city" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Area or location{" "}
                <span className="text-muted-foreground">(optional)</span>
                <input
                  value={form.locationName}
                  onChange={(event) =>
                    update("locationName", event.target.value)
                  }
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                />
              </label>
              <label className="block text-sm">
                Radius in km{" "}
                <span className="text-muted-foreground">(optional)</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.locationRadiusKm}
                  onChange={(event) =>
                    update("locationRadiusKm", event.target.value)
                  }
                  className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                />
              </label>
            </div>
          </div>
        )}
        {step === 5 && (
          <div>
            <h2 className="font-display text-2xl">A few useful details</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Optional details help the right people respond.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {fields.map((label) => {
                const key = slugify(label).replaceAll("-", "");
                return (
                  <label key={label} className="block text-sm">
                    {label}
                    <input
                      value={form.attributes[key] || ""}
                      onChange={(event) =>
                        updateAttribute(label, event.target.value)
                      }
                      className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                    />
                  </label>
                );
              })}
            </div>
            <label className="mt-5 block text-sm">
              Expires on{" "}
              <span className="text-muted-foreground">(optional)</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) => update("expiresAt", event.target.value)}
                className="mt-2 min-h-11 border border-border bg-background px-3"
              />
            </label>
          </div>
        )}
        {step === 6 && (
          <div>
            <h2 className="font-display text-2xl">Review your post</h2>
            <div className="mt-5 border border-border bg-secondary/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">
                {type?.name || "Community post"}
              </p>
              <h3 className="mt-2 font-display text-3xl">
                {form.title || "Your post title"}
              </h3>
              <p className="mt-3 text-muted-foreground">
                {form.shortDescription ||
                  "Your short description will appear here."}
              </p>
              <p className="mt-4 text-sm">
                {form.city}
                {form.locationName ? ` · ${form.locationName}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={step === 1 || saving}
          onClick={() => setStep((current) => current - 1)}
          className="min-h-11 border border-border px-5 text-sm disabled:opacity-50"
        >
          Back
        </button>
        {step < 6 ? (
          <button
            type="button"
            disabled={!canMoveForward() || saving}
            onClick={() => setStep((current) => current + 1)}
            className="min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50"
          >
            Continue <ArrowRight className="ml-2 inline h-4 w-4" />
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => save("draft")}
              className="min-h-11 border border-border px-5 text-sm disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("active")}
              className="min-h-11 bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Publish post"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CommunityDetail({ post, token, user, onReload }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ reason: "", details: "" });
  const [responses, setResponses] = useState([]);
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [group, setGroup] = useState({
    name: "",
    slug: "",
    description: "",
    visibility: "Public",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isOwner = user && String(user.id) === String(post.authorUserId);
  const isActive = post.status === "active";
  const attributes = Object.fromEntries(
    Object.entries(parseAttributes(post.attributes)).map(([key, value]) => [
      labelForAttribute(key),
      value,
    ]),
  );
  const detailUrl = `${window.location.origin}${communityPostUrl(post)}`;

  useEffect(() => {
    if (
      token &&
      new URLSearchParams(location.search).get("interest") === "1" &&
      isActive &&
      !isOwner
    )
      setInterestOpen(true);
  }, [token, location.search, isActive, isOwner]);
  const showError = (error) => setMessage(error.message);
  const submitInterest = async () => {
    const messageText =
      document.getElementById("confirmation-message")?.value ?? interestMessage;
    setBusy(true);
    setMessage("");
    try {
      await communityRequest(`/api/community/posts/${post.id}/responses`, {
        method: "POST",
        headers: communityHeaders(token, true),
        body: JSON.stringify({ message: messageText }),
      });
      setInterestOpen(false);
      setInterestMessage("");
      setMessage("Your interest has been sent.");
      onReload();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };
  const submitReport = async () => {
    setBusy(true);
    setMessage("");
    try {
      await communityRequest(`/api/community/posts/${post.id}/report`, {
        method: "POST",
        headers: communityHeaders(token, true),
        body: JSON.stringify(report),
      });
      setReportOpen(false);
      setMessage("Report submitted. Thank you for helping keep YKCircle safe.");
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };
  const loadResponses = async () => {
    setBusy(true);
    setMessage("");
    try {
      setResponses(
        asList(
          await communityRequest(`/api/community/posts/${post.id}/responses`, {
            headers: communityHeaders(token),
          }),
        ),
      );
      setResponsesOpen(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };
  const updateResponse = async (responseId, status) => {
    try {
      await communityRequest(
        `/api/community/posts/${post.id}/responses/${responseId}`,
        {
          method: "PATCH",
          headers: communityHeaders(token, true),
          body: JSON.stringify({ status }),
        },
      );
      setResponses((current) =>
        current.map((item) =>
          item.id === responseId ? { ...item, status } : item,
        ),
      );
    } catch (error) {
      showError(error);
    }
  };
  const updateStatus = async (status) => {
    setBusy(true);
    try {
      await communityRequest(`/api/community/posts/${post.id}/status`, {
        method: "PATCH",
        headers: communityHeaders(token, true),
        body: JSON.stringify({ status }),
      });
      onReload();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };
  const createGroup = async () => {
    setBusy(true);
    try {
      const created = await communityRequest(
        `/api/community/posts/${post.id}/group`,
        {
          method: "POST",
          headers: communityHeaders(token, true),
          body: JSON.stringify({
            ...group,
            slug: group.slug || slugify(group.name),
          }),
        },
      );
      navigate(`/stockholm/groups/${created.slug || created.id}`);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };
  const beginInterest = () => {
    if (!token)
      return navigate(
        `/login?from=${encodeURIComponent(`${location.pathname}?interest=1`)}`,
      );
    setInterestOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | YKCircle</title>
        <meta name="description" content={post.shortDescription} />
        <link rel="canonical" href={detailUrl} />
        <meta property="og:title" content={`${post.title} | YKCircle`} />
        <meta property="og:description" content={post.shortDescription} />
        {post.status !== "active" && post.status !== "fulfilled" ? (
          <meta name="robots" content="noindex" />
        ) : null}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: post.city,
                item: `${window.location.origin}/${post.citySlug}/community`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: post.categoryName,
                item: `${window.location.origin}/${post.citySlug}/community/${post.categorySlug}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: detailUrl,
              },
            ],
          })}
        </script>
      </Helmet>
      <section className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <Link
          to={`/${post.citySlug}/community/${post.categorySlug}`}
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {post.categoryName} in {post.city}
        </Link>
        <div className="mt-7 border-y border-border py-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            {post.postTypeName}
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.95]">
                {post.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {post.shortDescription}
              </p>
            </div>
            <span
              className={`border px-3 py-2 text-sm ${post.status === "fulfilled" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              {post.status === "fulfilled" ? "Completed" : post.status}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>
              {post.authorName} · {formatCommunityDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {post.locationName || post.city}
              {post.locationRadiusKm
                ? ` · within ${post.locationRadiusKm} km`
                : ""}
            </span>
            <span>
              {post.categoryName}
              {post.subcategoryName ? ` · ${post.subcategoryName}` : ""}
            </span>
          </div>
          {post.body && (
            <p className="mt-8 whitespace-pre-wrap leading-relaxed">
              {post.body}
            </p>
          )}
          {Object.values(attributes).filter(Boolean).length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {Object.entries(attributes)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="border border-border bg-secondary/40 px-3 py-2 text-sm"
                  >
                    {key.replace(/([A-Z])/g, " $1")}: {value}
                  </span>
                ))}
            </div>
          )}
        </div>
        {message && (
          <p
            role="alert"
            className="mt-5 border border-primary/30 bg-secondary/30 p-4 text-sm"
          >
            {message}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {linkedEventIds(post).length > 0 && (
            <LinkedEventCta post={post} inActionBar />
          )}
          {isActive && !isOwner && (
            <button
              type="button"
              onClick={beginInterest}
              className="min-h-12 bg-primary px-6 text-sm text-primary-foreground"
            >
              I’m interested
            </button>
          )}
          {post.groupSlug && (
            <Link
              to={`/stockholm/groups/${post.groupSlug}`}
              className="inline-flex min-h-12 items-center border border-border px-6 text-sm"
            >
              View {post.groupName || "group"}
            </Link>
          )}
          {isOwner && (
            <>
              <Link
                to={`/profile/community/${post.id}/edit`}
                className="inline-flex min-h-12 items-center border border-border px-5 text-sm"
              >
                Edit post
              </Link>
              <Link
                to={`/profile/community/${post.id}/event`}
                className="inline-flex min-h-12 items-center border border-border px-5 text-sm"
              >
                Link event
              </Link>
              <button
                type="button"
                onClick={loadResponses}
                disabled={busy}
                className="min-h-12 border border-border px-5 text-sm"
              >
                Manage interested people ({post.responseCount || 0})
              </button>
              {isActive && !post.groupId && (
                <button
                  type="button"
                  onClick={() => {
                    setGroup({
                      name: post.title,
                      slug: slugify(post.title),
                      description: post.shortDescription,
                      visibility: "Public",
                    });
                    setGroupOpen(true);
                  }}
                  className="min-h-12 bg-primary px-5 text-sm text-primary-foreground"
                >
                  Create group
                </button>
              )}
              {isActive && (
                <button
                  type="button"
                  onClick={() => updateStatus("fulfilled")}
                  disabled={busy}
                  className="min-h-12 border border-border px-5 text-sm"
                >
                  Mark fulfilled
                </button>
              )}
              {["active", "fulfilled", "draft"].includes(post.status) && (
                <button
                  type="button"
                  onClick={() => updateStatus("archived")}
                  disabled={busy}
                  className="min-h-12 border border-destructive px-5 text-sm text-destructive"
                >
                  Archive
                </button>
              )}
            </>
          )}
          {token && !isOwner && isActive && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex min-h-12 items-center gap-2 px-4 text-sm text-muted-foreground"
            >
              <Flag className="h-4 w-4" />
              Report
            </button>
          )}
        </div>
        {post.status === "fulfilled" && !post.groupSlug && (
          <div className="mt-8 border border-primary/30 bg-secondary/30 p-5">
            <p className="font-medium">This request has been completed.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore other active community posts or upcoming events in{" "}
              {post.city}.
            </p>
            <Link
              to={`/${post.citySlug}/community/${post.categorySlug}`}
              className="mt-4 inline-block text-sm text-primary"
            >
              Find similar posts
            </Link>
          </div>
        )}
        {responsesOpen && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="font-display text-3xl font-semibold">
              Interested people
            </h2>
            <div className="mt-5 space-y-3">
              {responses.map((response) => (
                <article key={response.id} className="border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {response.profilePicture ? (
                        <img
                          src={postImage(response.profilePicture)}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                          {response.name?.charAt(0)}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{response.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCommunityDate(response.createdAt)} ·{" "}
                          {response.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateResponse(response.id, "accepted")}
                        className="border border-primary px-3 py-2 text-xs text-primary"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateResponse(response.id, "declined")}
                        className="border border-border px-3 py-2 text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                  {response.message && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {response.message}
                    </p>
                  )}
                </article>
              ))}
              {responses.length === 0 && (
                <p className="text-muted-foreground">
                  No one has responded yet.
                </p>
              )}
            </div>
          </section>
        )}
      </section>
      {interestOpen && (
        <ConfirmationDialog
          title="Tell the author you’re interested"
          description="You can include a short message. The author will see your name and response, never your contact details."
          confirmLabel={busy ? "Sending…" : "Send interest"}
          busy={busy}
          onCancel={() => setInterestOpen(false)}
          onConfirm={submitInterest}
        >
          <textarea />
        </ConfirmationDialog>
      )}
      {interestOpen && (
        <div className="fixed inset-0 z-[71] flex items-center justify-center px-5 pointer-events-none">
          <textarea
            value={interestMessage}
            onChange={(event) => setInterestMessage(event.target.value)}
            maxLength="2000"
            placeholder="Optional message"
            className="pointer-events-auto mt-36 h-28 w-full max-w-md border border-border bg-background p-3 shadow-xl"
          />
        </div>
      )}
      {reportOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitReport();
            }}
            className="w-full max-w-md border border-border bg-background p-7 shadow-2xl"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Report post
            </p>
            <h2 className="mt-3 font-display text-3xl">
              Help keep YKCircle safe
            </h2>
            <label className="mt-5 block text-sm">
              Reason
              <input
                required
                value={report.reason}
                onChange={(event) =>
                  setReport((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                className="mt-2 min-h-11 w-full border border-border px-3"
              />
            </label>
            <label className="mt-4 block text-sm">
              Details <span className="text-muted-foreground">(optional)</span>
              <textarea
                value={report.details}
                onChange={(event) =>
                  setReport((current) => ({
                    ...current,
                    details: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-border px-3 py-2"
                rows="4"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="min-h-11 border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="min-h-11 bg-destructive px-4 text-sm text-primary-foreground"
              >
                Submit report
              </button>
            </div>
          </form>
        </div>
      )}
      {groupOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createGroup();
            }}
            className="w-full max-w-md border border-border bg-background p-7 shadow-2xl"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Create a group
            </p>
            <h2 className="mt-3 font-display text-3xl">
              Turn this plan into a circle
            </h2>
            <label className="mt-5 block text-sm">
              Group name
              <input
                required
                minLength="3"
                value={group.name}
                onChange={(event) =>
                  setGroup((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: slugify(event.target.value),
                  }))
                }
                className="mt-2 min-h-11 w-full border border-border px-3"
              />
            </label>
            <label className="mt-4 block text-sm">
              Description
              <textarea
                value={group.description}
                onChange={(event) =>
                  setGroup((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows="4"
                className="mt-2 w-full border border-border px-3 py-2"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setGroupOpen(false)}
                className="min-h-11 border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="min-h-11 bg-primary px-4 text-sm text-primary-foreground"
              >
                Create group
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default function CommunityPage({ mode = "discover" }) {
  const { city = "stockholm", category, subcategory, slug, id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("authUser") || "null");
  const [postTypes, setPostTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [typeFilter, setTypeFilter] = useState("");

  const taxonomy = async () => {
    const [types, categoryData] = await Promise.all([
      communityRequest("/api/community/post-types"),
      communityRequest("/api/community/categories"),
    ]);
    setPostTypes(asList(types, "postTypes"));
    setCategories(asList(categoryData, "categories"));
  };
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      await taxonomy();
      if (mode === "detail" || mode === "linked-events")
        setPost(
          await communityRequest(
            `/api/community/posts/${slug}`,
            token ? { headers: communityHeaders(token) } : {},
          ),
        );
      else if (["mine", "edit", "event-link"].includes(mode)) {
        if (!token)
          return navigate(
            `/login?from=${encodeURIComponent("/profile/community")}`,
          );
        const mine = asList(
          await communityRequest("/api/my/community/posts", {
            headers: communityHeaders(token),
          }),
          "posts",
        );
        if (mode === "mine") setPosts(mine);
        else {
          const found = mine.find((item) => String(item.id) === String(id));
          if (!found) throw new Error("Community post not found.");
          setPost(found);
        }
      } else if (mode !== "create") {
        const query = new URLSearchParams({ city, page: "1", limit: "20" });
        if (category) query.set("category", category);
        if (subcategory) query.set("subcategory", subcategory);
        if (typeFilter) query.set("type", typeFilter);
        setPosts(
          asList(
            await communityRequest(`/api/community/posts?${query}`),
            "posts",
          ),
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [mode, city, category, subcategory, slug, id, typeFilter, token]);
  const savePost = async (form) => {
    if (!token)
      return navigate(
        `/login?from=${encodeURIComponent(`/stockholm/community/${post ? `post/${post.slug}` : "new"}`)}`,
      );
    setSaving(true);
    setError("");
    setFormErrors({});
    try {
      const payload = {
        ...form,
        postTypeId: Number(form.postTypeId),
        categoryId: Number(form.categoryId),
        subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : null,
        locationRadiusKm: form.locationRadiusKm
          ? Number(form.locationRadiusKm)
          : null,
        expiresAt: form.expiresAt ? `${form.expiresAt} 23:59:59` : null,
      };
      const saved = await communityRequest(
        post ? `/api/community/posts/${post.id}` : "/api/community/posts",
        {
          method: post ? "PATCH" : "POST",
          headers: communityHeaders(token, true),
          body: JSON.stringify(payload),
        },
      );
      navigate(communityPostUrl(saved));
    } catch (requestError) {
      setError(requestError.message);
      setFormErrors(requestError.fields || {});
    } finally {
      setSaving(false);
    }
  };
  const selectedCategory = categories.find((item) => item.slug === category);
  const title =
    mode === "mine"
      ? "My community posts"
      : selectedCategory
        ? `${selectedCategory.name} in ${city.charAt(0).toUpperCase() + city.slice(1)}`
        : `Community in ${city.charAt(0).toUpperCase() + city.slice(1)}`;
  if (mode === "detail" && post)
    return (
      <SiteChrome>
        <CommunityDetail
          post={post}
          token={token}
          user={user}
          onReload={load}
        />
      </SiteChrome>
    );
  if (mode === "linked-events" && post)
    return <CommunityLinkedEventsPage post={post} />;
  if (mode === "event-link" && post)
    return <CommunityEventLinkPage post={post} token={token} />;
  if (mode === "create" || mode === "edit")
    return (
      <SiteChrome>
        <Helmet>
          <title>
            {mode === "edit"
              ? "Edit community post"
              : "Post what you’re looking for"}{" "}
            | YKCircle
          </title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
          <CommunityForm
            initial={post}
            postTypes={postTypes}
            categories={categories}
            onSave={savePost}
            saving={saving}
            serverErrors={formErrors}
          />
          {error && (
            <p
              role="alert"
              className="mx-auto mt-5 max-w-3xl text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </section>
      </SiteChrome>
    );
  return (
    <SiteChrome>
      <Helmet>
        <title>{title} | YKCircle</title>
        <meta
          name="description"
          content={`Find people, groups, and local plans in ${city}.`}
        />
        <link
          rel="canonical"
          href={`${window.location.origin}/${city}/community${category ? `/${category}${subcategory ? `/${subcategory}` : ""}` : ""}`}
        />
      </Helmet>
      <section className="mx-auto max-w-[76rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              YKCircle community
            </p>
            <h1 className="mt-3 font-display text-5xl font-black leading-[0.95]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Start with a real-world intention: find people, make a plan, or
              discover what your circle is already doing.
            </p>
          </div>
          <Link
            to="/stockholm/community/new"
            className="inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-sm text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Post what you’re looking for
          </Link>
        </div>
        {mode === "mine" ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
            {!loading && posts.length === 0 && (
              <p className="text-muted-foreground">
                You have not posted anything yet.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-10 flex flex-wrap gap-2">
              <Link
                to={`/${city}/community`}
                className={`border px-4 py-2 text-sm ${!category ? "border-primary text-primary" : "border-border"}`}
              >
                All topics
              </Link>
              {categories
                .filter((item) => !item.parentId)
                .map((item) => (
                  <Link
                    key={item.id}
                    to={`/${city}/community/${item.slug}`}
                    className={`border px-4 py-2 text-sm ${category === item.slug ? "border-primary text-primary" : "border-border"}`}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
            <label className="mt-6 block max-w-xs text-sm">
              Intent
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              >
                <option value="">All intentions</option>
                {postTypes.map((item) => (
                  <option key={item.id} value={item.typeKey}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <p className="text-muted-foreground">
                  Loading community posts…
                </p>
              ) : (
                posts.map((item) => <PostCard key={item.id} post={item} />)
              )}
              {!loading && posts.length === 0 && (
                <div className="border border-border p-6 text-muted-foreground">
                  <p>No public posts match this view yet.</p>
                  <Link
                    to="/stockholm/community/new"
                    className="mt-4 inline-block text-primary"
                  >
                    Be the first to post what you’re looking for.
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </section>
      {error && (
        <p
          role="alert"
          className="fixed bottom-6 right-6 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg"
        >
          {error}
        </p>
      )}
    </SiteChrome>
  );
}
