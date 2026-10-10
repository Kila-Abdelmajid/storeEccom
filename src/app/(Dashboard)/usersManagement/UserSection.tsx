'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
};

const ITEMS_PER_PAGE = 8;

export default function UsersSection() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    action: 'role' | 'delete';
    newRole?: 'admin' | 'user';
  }>({ isOpen: false, userId: null, action: 'delete' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      const usersArray = Array.isArray(data) ? data : [data];
      const normalized = usersArray.map((u: any) => ({
        id: u.id || u.userId,
        firstName: u.firstName || u.firstname || 'Unknown',
        lastName: u.lastName || u.lastname || 'User',
        email: u.email || '',
        role: (u.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
        createdAt: u.createdAt || u.createdat || new Date().toISOString(),
      }));
      setUsers(normalized);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: number, newRole: 'admin' | 'user') => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/auth/users?userId=${userId}&role=${newRole}`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ isOpen: false, userId: null, action: 'delete' });
    }
  };

  const deleteUser = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/auth/users?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('User deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ isOpen: false, userId: null, action: 'delete' });
    }
  };

  const openRoleConfirm = (userId: number, newRole: 'admin' | 'user') => {
    setConfirmDialog({
      isOpen: true,
      userId,
      action: 'role',
      newRole,
    });
  };

  const openDeleteConfirm = (userId: number) => {
    setConfirmDialog({ isOpen: true, userId, action: 'delete' });
  };

  const handleConfirm = () => {
    if (confirmDialog.userId) {
      if (confirmDialog.action === 'role' && confirmDialog.newRole) {
        updateRole(confirmDialog.userId, confirmDialog.newRole);
      } else if (confirmDialog.action === 'delete') {
        deleteUser(confirmDialog.userId);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchUsers} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-6 md:p-8">
      {/* Custom Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${confirmDialog.action === 'delete' ? 'bg-rose-100' : 'bg-amber-100'} flex items-center justify-center`}>
                {confirmDialog.action === 'delete' ? (
                  <TrashIcon className="w-5 h-5 text-rose-600" />
                ) : (
                  <ShieldCheckIcon className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {confirmDialog.action === 'delete' ? 'Delete User' : 'Change Role'}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {confirmDialog.action === 'delete'
                ? 'Are you sure you want to delete this user? This action cannot be undone.'
                : `Are you sure you want to change this user's role to ${confirmDialog.newRole}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, userId: null, action: 'delete' })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition ${
                  confirmDialog.action === 'delete'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
            Users
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Manage registered customers and administrators
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Users" value={stats.total} icon={UserGroupIcon} color="indigo" />
          <StatCard title="Administrators" value={stats.admins} icon={ShieldCheckIcon} color="amber" />
          <StatCard title="Regular Users" value={stats.regular} icon={UserCircleIcon} color="emerald" />
          <StatCard title="New (30 days)" value={stats.newUsers} icon={CalendarIcon} color="blue" />
        </div>

        {/* Filters Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-5 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition bg-white/50"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Role</label>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm bg-white/50 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 appearance-none"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50 focus:ring-2 focus:ring-amber-300"
              >
                <option value="date">Newest first</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            <div>
              <button
                onClick={resetFilters}
                className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition font-medium shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((user, idx) => {
                  const firstName = user.firstName || '?';
                  const lastName = user.lastName || '?';
                  const initial1 = firstName.charAt(0).toUpperCase();
                  const initial2 = lastName.charAt(0).toUpperCase();
                  return (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-500">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 font-semibold text-sm shadow-sm">
                            {initial1}{initial2}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {firstName} {lastName}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <button
                              onClick={() => openRoleConfirm(user.id, 'user')}
                              disabled={actionLoading === user.id}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                              title="Demote to user"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => openRoleConfirm(user.id, 'admin')}
                              disabled={actionLoading === user.id}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                              title="Make admin"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteConfirm(user.id)}
                            disabled={actionLoading === user.id}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                            title="Delete user"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  <ChevronLeftIcon className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  Next <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable StatCard component
function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
  };
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-white/50 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}