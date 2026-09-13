import assert from "node:assert/strict";
import test from "node:test";
import { ticketVerificationPath, ticketVerificationUrl } from "../src/lib/ticket-values.js";

test("ticket QR values use a stable future verification route", () => {
  assert.equal(ticketVerificationPath("YK-ABC 123"), "/tickets/verify/YK-ABC%20123");
  assert.equal(
    ticketVerificationUrl("YK-ABC 123", "https://ykcircle.com"),
    "https://ykcircle.com/tickets/verify/YK-ABC%20123",
  );
});
