import React from 'react';

// All primary pages share the same title anchor and responsive wrapping space.
export default function PageHeader({ eyebrow = 'Your account', title, description }) {
  return (
    <header className="page-header">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h1 className="page-heading">{title}</h1>
      {description ? <p className="page-description">{description}</p> : <div className="page-description" aria-hidden="true" />}
    </header>
  );
}
