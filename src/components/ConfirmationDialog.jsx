import React from "react";

export default function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
  busy = false,
  children,
}) {
  return (
    <div
      className="fixed inset-0 z-[72] flex items-center justify-center bg-black/45 px-5 py-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <div className="rounded-2xl max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto border border-border bg-background p-7 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">Please confirm</p>
        <h2 id="confirmation-dialog-title" className="mt-3 font-display text-3xl font-semibold">
          {title}
        </h2>
        <p id="confirmation-dialog-description" className="mt-4 leading-relaxed text-muted-foreground">
          {description}
        </p>
        {children && <div className="mt-5">{React.isValidElement(children) && children.type === "textarea" ? React.cloneElement(children, { id: "confirmation-message", rows: 4, placeholder: "Optional message", "aria-label": "Optional message", className: "w-full border border-border bg-background p-3" }) : children}</div>}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="ui-action min-h-11 border border-border px-4 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-11 px-4 text-sm text-primary-foreground disabled:opacity-50 ${destructive ? "bg-destructive" : "bg-primary"}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
