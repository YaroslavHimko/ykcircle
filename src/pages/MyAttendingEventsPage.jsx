import React from 'react';
import { Navigate } from 'react-router-dom';

export default function MyAttendingEventsPage() {
  return <Navigate to="/events" replace />;
}
