import { inputClass, humanize } from '../model/venue-marketplace.js';
export function FilterSelect({ label, value, onChange, options, placeholder, className = '' }) {
  if (label === 'Price unit') {
    const chargeType = ['day', 'evening'].includes(value) ? 'daily' : 'hourly';
    return (
      <label className="block text-sm font-medium">
        Charge for bookings
        <select
          value={chargeType}
          onChange={(event) => onChange(event.target.value === 'daily' ? 'day' : 'hour')}
          className={`${inputClass} ${className}`}
        >
          <option value="hourly">Per hour</option>
          <option value="daily">Per day / evening</option>
        </select>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {chargeType === 'daily'
            ? 'Guests reserve the whole day; the invoice has one day charge.'
            : 'Guests select full one-hour slots; invoices are calculated from booked hours.'}
        </span>
      </label>
    );
  }
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.slug || item.id || item} value={item.slug || item}>
            {item.name || humanize(item.slug || item)}
          </option>
        ))}
      </select>
    </label>
  );
}
