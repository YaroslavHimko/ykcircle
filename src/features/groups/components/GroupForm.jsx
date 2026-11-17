import { useEffect, useState } from 'react';
export function GroupForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    visibility: initial?.visibility || 'Public',
  });
  const [image, setImage] = useState(null);
  useEffect(() => {
    setForm({
      name: initial?.name || '',
      description: initial?.description || '',
      visibility: initial?.visibility || 'Public',
    });
    setImage(null);
  }, [initial]);
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  return (
    <form
      id="group-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form, image);
      }}
      className="mt-6 grid gap-4 border-y border-border py-6"
    >
      <label className="text-sm">
        Group name
        <input
          required
          minLength="3"
          maxLength="120"
          name="name"
          value={form.name}
          onChange={update}
          className="mt-2 min-h-11 w-full border border-border bg-background px-3"
        />
      </label>
      <label className="text-sm">
        Description
        <textarea
          name="description"
          maxLength="10000"
          value={form.description}
          onChange={update}
          rows="4"
          className="mt-2 w-full border border-border bg-background px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Group picture
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] || null)}
          className="mt-2 block w-full border border-border bg-background px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          JPEG, PNG or WebP, maximum 10 MB.
        </span>
      </label>
      <label className="text-sm">
        Visibility
        <select
          name="visibility"
          value={form.visibility}
          onChange={update}
          className="mt-2 min-h-11 w-full border border-border bg-background px-3"
        >
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>
        {form.visibility === 'Public' && (
          <span className="mt-2 block border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-foreground">
            Public — anyone can view this and it may appear in search engines.
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={saving}
          className="ui-action min-h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial ? 'Save group' : 'Create group'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="ui-action min-h-11 border border-border px-5 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
