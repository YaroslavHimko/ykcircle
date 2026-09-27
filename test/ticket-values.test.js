import assert from "node:assert/strict";
import test from "node:test";
import { parseTicketCode, ticketVerificationPath, ticketVerificationUrl } from "../src/lib/ticket-values.js";

test("ticket QR values use a stable verification route", () => {
  assert.equal(ticketVerificationPath("YK-ABC 123"), "/tickets/verify/YK-ABC%20123");
  assert.equal(
    ticketVerificationUrl("YK-ABC 123", "https://ykcircle.com"),
    "https://ykcircle.com/tickets/verify/YK-ABC%20123",
  );
});

test('scanner reads raw ticket codes and existing QR links without navigating', () => {
  const code = 'YK-' + 'A1'.repeat(16);
  assert.equal(parseTicketCode(code.toLowerCase()), code);
  assert.equal(parseTicketCode(` https://ykcircle.com/tickets/verify/${code} `), code);
  assert.equal(parseTicketCode(`/tickets/verify/${code}`), code);
  for (const value of ['', 'https://example.com', `javascript:/tickets/verify/${code}`, 'YK-short', {}, '/tickets/verify/%', 'x'.repeat(2049)]) assert.equal(parseTicketCode(value), null);
});
