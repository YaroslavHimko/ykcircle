export function TicketBrand({ order }) {
  const name = order.seller?.brandName || order.seller?.legalName || order.eventTitle;
  const logo = order.seller?.logoImage;
  return (
    <div className="min-w-0">
      {logo && (
        <img
          src={logo}
          alt={name + ' logo'}
          className="ticket-brand-logo mb-3 max-h-20 max-w-[15rem] object-contain"
        />
      )}
      <p className="ticket-print-brand font-display text-2xl font-semibold">{name}</p>
      <p className="ticket-print-kicker mt-1 text-xs text-muted-foreground">Event admission</p>
    </div>
  );
}
