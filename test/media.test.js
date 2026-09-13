import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { eventMediaValue, hasMediaToken, isExplicitMediaUrl, venueMediaValue } from "../src/lib/media-values.js";

const signedEvent = "/api/media/event/private-event.png?token=event-signature";
const signedVenue = "/api/media/venue/private-venue.png?token=venue-signature";
const pathSignedEvent = "/api/media/event/path-token-signature/private-event.png";
const pathSignedVenue = "/api/media/venue/path-token-signature/private-venue.png";

test("private event image renders the complete signed URL, not its filename", () => {
  const src = eventMediaValue({
    coverImage: "private-event.png",
    coverImageUrl: signedEvent,
  });

  assert.equal(src, signedEvent);
  assert.equal(hasMediaToken(src), true);
});

test("event images preserve a signed path-token URL returned by the API", () => {
  const src = eventMediaValue({
    coverImage: "private-event.png",
    coverImageUrl: pathSignedEvent,
  });

  assert.equal(src, pathSignedEvent);
  assert.equal(hasMediaToken(src), true);
});

test("draft event image renders the complete signed URL even when legacy fields arrive first", () => {
  const src = eventMediaValue({
    thumbnail: "draft-event.png",
    coverImage: "draft-event.png",
    coverImageUrl: signedEvent,
  });

  assert.equal(src, signedEvent);
  assert.equal(hasMediaToken(src), true);
});

test("a draft event keeps its exact path-token URL when every legacy cover field is also present", () => {
  const productionStylePathToken = "/api/media/event/eyJmaWxlbmFtZSI6ImV2ZW50LTIucG5nIn0.signature/event-2.png";
  const src = eventMediaValue({
    status: "Draft",
    visibility: "Private",
    coverImage: "event-2.png",
    coverImagePath: "/uploads/event-covers/event-2.png",
    coverImageUrl: "/uploads/event-covers/event-2.png",
    cover_image_url: productionStylePathToken,
  });

  assert.equal(src, productionStylePathToken);
  assert.equal(hasMediaToken(src), true);
  assert.equal(src.includes("/uploads/event-covers/"), false);
});

test("a signed event URL is never truncated or replaced when it has query parameters", () => {
  const signedWithQuery = "/api/media/event/private-event.png?token=event-signature&variant=cover";
  const src = eventMediaValue({
    status: "Draft",
    coverImage: "private-event.png",
    coverImageUrl: signedWithQuery,
  });

  assert.equal(src, signedWithQuery);
});

test("private venue image renders the complete signed URL, not its filename", () => {
  const src = venueMediaValue({
    coverImage: "private-venue.png",
    coverImageUrl: signedVenue,
  });

  assert.equal(src, signedVenue);
  assert.equal(hasMediaToken(src), true);
});

test("venue images preserve a signed path-token URL returned by the API", () => {
  const src = venueMediaValue({ coverImageUrl: pathSignedVenue });

  assert.equal(src, pathSignedVenue);
  assert.equal(hasMediaToken(src), true);
});

test("private venue gallery cover also preserves its signed URL", () => {
  const src = venueMediaValue({
    images: [{ isCover: true, filename: "private-venue.png", url: signedVenue }],
  });

  assert.equal(src, signedVenue);
  assert.equal(hasMediaToken(src), true);
});

test("a public venue cover uses the API-provided public venue upload URL", () => {
  const publicCoverUrl = "/uploads/venue-images/public-venue.png";

  assert.equal(venueMediaValue({
    coverImage: "public-venue.png",
    coverImageUrl: publicCoverUrl,
  }), publicCoverUrl);
});

test("a venue filename alone never becomes a public image URL", () => {
  assert.equal(venueMediaValue({ coverImage: "private-venue.png" }), "");
});

test("a protected-media fallback cannot generate an unsigned request from a filename", () => {
  assert.equal(isExplicitMediaUrl("private-event.png"), false);
  assert.equal(eventMediaValue({ coverImage: "private-event.png" }), "");
  assert.equal(venueMediaValue({ coverImage: "private-venue.png" }), "");
});

test("no protected event image URL can use the legacy public upload path", () => {
  assert.equal(eventMediaValue({ coverImageUrl: "/uploads/event-covers/private-event.png" }), "");
  assert.equal(eventMediaValue({ coverImageUrl: "https://api.example.test/uploads/event-covers/private-event.png" }), "");
  assert.equal(eventMediaValue({ coverImage: "/uploads/event-covers/private-event.png" }), "");
  assert.equal(eventMediaValue({ coverImagePath: "/uploads/event-covers/private-event.png" }), "");
  assert.equal(isExplicitMediaUrl("/uploads/venue-images/private-venue.png"), false);
});

test("a published public event can use the API-supplied public upload URL", () => {
  const publicCoverUrl = "/uploads/event-covers/public-event.png";
  assert.equal(eventMediaValue({
    status: "Published",
    visibility: "Public",
    coverImageUrl: publicCoverUrl,
  }), publicCoverUrl);
});

test("a draft/private event never uses a legacy public upload URL", () => {
  const publicCoverUrl = "/uploads/event-covers/private-event.png";
  assert.equal(eventMediaValue({ status: "Draft", visibility: "Private", coverImageUrl: publicCoverUrl }), "");
  assert.equal(eventMediaValue({ status: "draft", visibility: "Public", coverImageUrl: publicCoverUrl }), "");
  assert.equal(eventMediaValue({ status: "Published", visibility: "Private", coverImageUrl: publicCoverUrl }), "");
});

test("an error retry keeps the refreshed signed URL intact", () => {
  const refreshed = "/api/media/venue/private-venue.png?token=fresh-signature";
  const src = venueMediaValue({ coverImage: "private-venue.png", coverImageUrl: refreshed });

  assert.equal(src, refreshed);
  assert.equal(hasMediaToken(src), true);
});

test("event rendering surfaces cannot reintroduce the legacy event-covers URL", async () => {
  const surfaces = [
    "src/pages/EventsPage.jsx",
    "src/pages/EventDetailPage.jsx",
    "src/pages/HomePage.jsx",
    "src/pages/GroupsPage.jsx",
  ];

  await Promise.all(surfaces.map(async (file) => {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /uploads\/event-covers/i, file);
    assert.match(source, /eventMediaUrl/, file);
  }));
});
