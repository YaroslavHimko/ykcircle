export function StatusBadge({ status }) {
  return (
    <span
      className={`border px-2 py-1 text-xs uppercase tracking-wider ${status === 'published' ? 'border-primary text-primary' : status === 'removed' ? 'border-destructive text-destructive' : 'border-border text-muted-foreground'}`}
    >
      {status}
    </span>
  );
}
