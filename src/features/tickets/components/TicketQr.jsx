import { QRCodeSVG } from 'qrcode.react';
import { ticketVerificationUrl } from '../model/ticket-values.js';
export function TicketQr({ ticket, size = 128 }) {
  const value = ticketVerificationUrl(ticket.code, window.location.origin);
  return (
    <div className="shrink-0 bg-white p-2 text-center text-black">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={4}
        title={`Ticket ${ticket.code}`}
        className="mx-auto h-auto max-w-full"
      />
      <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.14em]">Ticket QR</p>
    </div>
  );
}
