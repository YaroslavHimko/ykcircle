import assert from "node:assert/strict";
import test from "node:test";
import { eventMediaValue, hasMediaToken, isExplicitMediaUrl, venueMediaValue } from "../src/lib/media-values.js";

const signedEvent = "/api/media/event/private-event.png?token=event-signature";
const signedVenue = "/api/media/venue/private-venue.png?token=venue-signature";

test("private event image renders the complete signed URL, not its filename", () => {
  const src = eventMediaValue({
    coverImage: "private-event.png",
    coverImageUrl: signedEvent,
  });

  assert.equal(src, signedEvent);
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

test("private venue image renders the complete signed URL, not its filename", () => {
  const src = venueMediaValue({
    coverImage: "private-venue.png",
    coverImageUrl: signedVenue,
  });

  assert.equal(src, signedVenue);
  assert.equal(hasMediaToken(src), true);
});

test("private venue gallery cover also preserves its signed URL", () => {
  const src = venueMediaValue({
    images: [{ isCover: true, filename: "private-venue.png", url: signedVenue }],
  });

  assert.equal(src, signedVenue);
  assert.equal(hasMediaToken(src), true);
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

test("an error retry keeps the refreshed signed URL intact", () => {
  const refreshed = "/api/media/venue/private-venue.png?token=fresh-signature";
  const src = venueMediaValue({ coverImage: "private-venue.png", coverImageUrl: refreshed });

  assert.equal(src, refreshed);
  assert.equal(hasMediaToken(src), true);
});
