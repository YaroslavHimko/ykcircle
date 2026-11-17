import { useState } from 'react';
import { apiFetch } from '@/shared/api/client.js';
import { auth, errorText } from '../model/venue-management.js';
import { Field, Error } from './VenueManagementShell.jsx';
export function ExternalInvoiceEditor({ booking, onSaved, onError }) {
  const [form, setForm] = useState({
    externalInvoiceNumber: '',
    externalInvoiceDate: '',
    amount: booking.totalAmount || '',
    currency: booking.currency || 'SEK',
    dueDate: '',
    externalInvoiceUrl: '',
  });
  const save = async (event) => {
    event.preventDefault();
    try {
      const response = await apiFetch(`/api/venue-bookings/${booking.id}/external-invoice`, {
        method: 'PUT',
        headers: {
          ...auth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, 'Unable to save external invoice.'));
      onSaved();
    } catch (error) {
      onError(error.message);
    }
  };
  const paid = async () => {
    if (!window.confirm('Confirm that the Venue has actually received this payment.')) return;
    try {
      const response = await apiFetch(
        `/api/venue-bookings/${booking.id}/external-invoice/mark-paid`,
        {
          method: 'POST',
          headers: {
            ...auth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmReceived: true,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(errorText(data, 'Unable to mark payment received.'));
      onSaved();
    } catch (error) {
      onError(error.message);
    }
  };
  return (
    <details className="mt-4 border-t border-border pt-4">
      <summary className="cursor-pointer text-sm font-medium">External invoice details</summary>
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field
          label="Invoice number"
          value={form.externalInvoiceNumber}
          onChange={(value) =>
            setForm({
              ...form,
              externalInvoiceNumber: value,
            })
          }
        />
        <Field
          label="Invoice date"
          value={form.externalInvoiceDate}
          onChange={(value) =>
            setForm({
              ...form,
              externalInvoiceDate: value,
            })
          }
        />
        <Field
          label="Amount"
          value={form.amount}
          onChange={(value) =>
            setForm({
              ...form,
              amount: value,
            })
          }
        />
        <Field
          label="Currency"
          value={form.currency}
          onChange={(value) =>
            setForm({
              ...form,
              currency: value,
            })
          }
        />
        <Field
          label="Due date"
          value={form.dueDate}
          onChange={(value) =>
            setForm({
              ...form,
              dueDate: value,
            })
          }
        />
        <Field
          label="Secure invoice URL"
          value={form.externalInvoiceUrl}
          onChange={(value) =>
            setForm({
              ...form,
              externalInvoiceUrl: value,
            })
          }
        />
        <div className="sm:col-span-2 flex gap-2">
          <button className="ui-action border border-border px-4 py-2 text-sm">
            Save external invoice
          </button>
          {booking.externalInvoiceId && booking.externalInvoiceStatus !== 'paid' && (
            <button
              type="button"
              onClick={paid}
              className="ui-action bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Mark payment received
            </button>
          )}
        </div>
      </form>
    </details>
  );
}
