import PageHeader from '@/components/PageHeader';
import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import SiteChrome from '@/components/SiteChrome';
import { apiFetch } from '@/lib/api';

const roleLabels = { customer: 'Customer', organizer: 'Event organizer', manager: 'Manager', admin: 'Admin' };

export default function UserRolesPage() {
  const user = JSON.parse(localStorage.getItem('authUser') || 'null');
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const canManage = isAdmin || user?.role === 'manager';
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    const response = await apiFetch(isAdmin ? '/api/admin/users' : '/api/manager/users', { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load users.');
    setUsers([...data].sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)));
  }, [isAdmin, token]);

  useEffect(() => {
    if (!token || !user) return navigate('/login', { replace: true, state: { from: '/admin/users' } });
    if (!canManage) return navigate('/profile', { replace: true });
    load().catch((requestError) => setError(requestError.message));
  }, [canManage, load, navigate, token]);

  const updateRole = async (id, role) => {
    setSaving(id); setError('');
    try {
      const endpoint = isAdmin ? `/api/admin/users/${id}/role` : `/api/manager/users/${id}/role`;
      const response = await apiFetch(endpoint, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update user role.');
      setUsers((current) => current.map((item) => item.id === id ? { ...item, role: data.role || role } : item));
    } catch (requestError) { setError(requestError.message); await load(); } finally { setSaving(null); }
  };

  if (!canManage) return null;
  return <SiteChrome><Helmet><title>Manage user roles | Yaro Himko</title></Helmet><section className="page-container"><PageHeader eyebrow={isAdmin ? 'Administration' : 'Manager area'} title="User roles" description="Assign access to host events and manage the community." /><div className="mt-6 flex flex-wrap gap-3"><Link to="/profile" className="ui-action inline-flex min-h-11 items-center border border-border px-5 py-2 text-sm">View profile</Link></div>{error && <p className="mt-6 text-destructive">{error}</p>}<div className="mt-10 overflow-x-auto border border-border"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="bg-secondary/60 text-xs uppercase tracking-widest"><tr><th className="px-4 py-4">User</th><th className="px-4 py-4">Current role</th><th className="px-4 py-4">Change role</th></tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-4 py-5"><p className="font-medium">{item.name}</p><p className="text-muted-foreground">{item.email}</p></td><td className="px-4 py-5">{roleLabels[item.role] || item.role}</td><td className="px-4 py-5"><select value={item.role} disabled={saving === item.id || (!isAdmin && item.role !== 'customer')} onChange={(event) => updateRole(item.id, event.target.value)} className="min-h-10 border border-border bg-background px-3"><option value="customer">Customer</option>{isAdmin && <><option value="organizer">Event organizer</option><option value="manager">Manager</option><option value="admin">Admin</option></>}</select>{!isAdmin && item.role !== 'customer' && <p className="mt-2 text-xs text-muted-foreground">Only customers can be promoted.</p>}</td></tr>)}</tbody></table></div></section></SiteChrome>;
}
