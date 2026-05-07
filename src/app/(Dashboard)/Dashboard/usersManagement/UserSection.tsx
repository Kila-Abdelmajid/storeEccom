// app/dashboard/UsersSection.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'user';
  createdAt: string;
};

const ITEMS_PER_PAGE = 8;

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      // Ensure data is array; if not, wrap
      const usersArray = Array.isArray(data) ? data : [data];
      // Map to ensure consistent property names (in case API returns snake_case)
      const normalized = usersArray.map((u: any) => ({
        id: u.id || u.userId,
        firstName: u.firstName || u.firstname || 'Unknown',
        lastName: u.lastName || u.lastname || 'User',
        email: u.email || '',
        phone: u.phone || null,
        role: (u.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
        createdAt: u.createdAt || u.createdat || new Date().toISOString(),
      }));
      setUsers(normalized);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId: number, newRole: 'admin' | 'user') => {
    const user = users.find(u => u.id === userId);
    if (!confirm(`Change ${user?.firstName} ${user?.lastName} to ${newRole}?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/auth/users?userId=${userId}&role=${newRole}`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!confirm(`Delete ${user?.firstName} ${user?.lastName}?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/auth/users?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtering & sorting
  const filtered = useMemo(() => {
    let result = users.filter(user => {
      if (search) {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        if (!fullName.includes(search.toLowerCase()) && !user.email.toLowerCase().includes(search.toLowerCase()))
          return false;
      }
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return result;
  }, [users, search, roleFilter, sortBy]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const regular = total - admins;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;
    return { total, admins, regular, newUsers };
  }, [users]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setSortBy('date');
    setCurrentPage(1);
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Users</h1>
          <p className="text-slate-500 mt-1">Manage registered customers and administrators</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Total Users</p><p className="text-2xl font-bold text-slate-800">{stats.total}</p></div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
          </div>
          {/* Admins */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Administrators</p><p className="text-2xl font-bold text-amber-600">{stats.admins}</p></div>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></div>
          </div>
          {/* Regular Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">Regular Users</p><p className="text-2xl font-bold text-emerald-600">{stats.regular}</p></div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
          </div>
          {/* New Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div><p className="text-slate-500 text-sm">New (30 days)</p><p className="text-2xl font-bold text-blue-600">{stats.newUsers}</p></div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-45">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input type="text" placeholder="Name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
              <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-slate-500 mb-1">Sort by</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="date">Newest first</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            <div>
              <button onClick={resetFilters} className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition">Reset Filters</button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="w-[25%] px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="w-[25%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Contact</th>
                  <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Role</th>
                  <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Joined</th>
                  <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((user, idx) => {
                  const firstName = user.firstName || '?';
                  const lastName = user.lastName || '?';
                  const initial1 = firstName.charAt(0).toUpperCase();
                  const initial2 = lastName.charAt(0).toUpperCase();
                  return (
                    <tr key={user.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-4 py-3 text-sm text-slate-500">{(currentPage-1)*ITEMS_PER_PAGE + idx+1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                            {initial1}{initial2}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{firstName} {lastName}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {user.role === 'admin' ? (
                            <button onClick={() => updateRole(user.id, 'user')} disabled={actionLoading === user.id} className="p-1 text-amber-500 hover:text-amber-700 disabled:opacity-50" title="Demote to user">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          ) : (
                            <button onClick={() => updateRole(user.id, 'admin')} disabled={actionLoading === user.id} className="p-1 text-indigo-500 hover:text-indigo-700 disabled:opacity-50" title="Make admin">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </button>
                          )}
                          <button onClick={() => deleteUser(user.id)} disabled={actionLoading === user.id} className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-50" title="Delete user">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                       </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex justify-between items-center bg-slate-50 text-sm">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}