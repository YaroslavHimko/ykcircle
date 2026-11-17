import { humanize } from '../model/venue-marketplace.js';
export function TagList({ items = [], empty }) {
  return items.length ? (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={item.slug || item.id || index}
          className="rounded-full border border-border/70 bg-secondary/20 px-3 py-1.5 text-sm"
        >
          {item.name || humanize(item.slug || item)}
        </span>
      ))}
    </div>
  ) : (
    <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
  );
}
export function Capacity({ venue }) {
  const c = venue.capacity || {};
  const fields = [
    ['Maximum', c.max ?? venue.capacityMax],
    ['Standing', c.standing ?? venue.standingCapacity],
    ['Seated', c.seated ?? venue.seatedCapacity],
    ['Dinner', c.dining ?? venue.diningCapacity],
    ['Classroom', c.classroom ?? venue.classroomCapacity],
    ['Size', (c.sizeSqm ?? venue.sizeSqm) && `${c.sizeSqm ?? venue.sizeSqm} m²`],
  ].filter(([, value]) => value);
  return fields.length ? (
    <dl className="mt-4 grid grid-cols-2 gap-3">
      {fields.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="mt-1 font-semibold">
            {value}
            {label !== 'Size' ? ' guests' : ''}
          </dd>
        </div>
      ))}
    </dl>
  ) : (
    <p className="mt-4 text-muted-foreground">Capacity is available on request.</p>
  );
}
