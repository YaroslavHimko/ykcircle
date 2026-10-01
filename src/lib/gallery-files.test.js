import assert from "node:assert/strict";
import test from "node:test";
import { appendGalleryFiles } from "./gallery-files.js";

const file = (name, size, lastModified) => ({ name, size, lastModified, type: "image/jpeg" });

test("gallery selections accumulate without duplicating a file already selected", () => {
  const first = file("front.jpg", 100, 1);
  const second = file("hall.jpg", 200, 2);
  const third = file("garden.jpg", 300, 3);

  const pending = appendGalleryFiles([first, second], [second, third]);

  assert.deepEqual(pending, [first, second, third]);
});
