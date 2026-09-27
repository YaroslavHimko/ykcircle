export const ticketVerificationPath = (ticketCode) =>
  `/tickets/verify/${encodeURIComponent(String(ticketCode || ""))}`;

export const ticketVerificationUrl = (ticketCode, origin) =>
  new URL(ticketVerificationPath(ticketCode), origin).toString();

// Read the payload only. Scanned links are never navigated to or fetched.
export function parseTicketCode(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  let code = value.trim();
  if (!/^YK-[a-f0-9]{32}$/i.test(code)) {
    try {
      const url = new URL(code, 'https://ticket.invalid');
      if (!['https:', 'http:'].includes(url.protocol)) return null;
      const match = /^\/tickets\/verify\/([^/]+)\/?$/.exec(url.pathname);
      if (!match) return null;
      code = decodeURIComponent(match[1]);
    } catch { return null; }
  }
  return /^YK-[a-f0-9]{32}$/i.test(code) ? code.toUpperCase() : null;
}
