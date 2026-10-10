import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DirectoryActions({ manageTo, manageLabel, createTo, createLabel, onCreate }) {
  const buttonClass = 'min-h-11 h-auto rounded-lg px-5 py-2 shadow-none';
  return <div className="mt-6 flex flex-wrap items-center gap-3">
    {manageTo && <Button asChild variant="outline" className={`${buttonClass} border-border hover:bg-primary/5 hover:text-inherit`}><Link to={manageTo}>{manageLabel}</Link></Button>}
    {createTo ? <Button asChild className={buttonClass}><Link to={createTo}>{createLabel}</Link></Button> : <Button type="button" onClick={onCreate} className={buttonClass}>{createLabel}</Button>}
  </div>;
}
