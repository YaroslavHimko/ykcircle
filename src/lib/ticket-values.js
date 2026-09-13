export const ticketVerificationPath = (ticketCode) =>
  `/tickets/verify/${encodeURIComponent(String(ticketCode || ""))}`;

export const ticketVerificationUrl = (ticketCode, origin) =>
  new URL(ticketVerificationPath(ticketCode), origin).toString();
