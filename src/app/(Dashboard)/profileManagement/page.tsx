'use client';

import { useState, useEffect, useCallback } from 'react';
import { PencilIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import ChangePasswordModal from '@/components/ui/ChangePasswordModal';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AdminSettingsPage() {
  const { session, refreshSession } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();

      // If admin, the API returns an array; we find the current user.
      let userData;
      if (Array.isArray(data)) {
        userData = data.find((u) => u.id === session?.userId);
      } else {
        userData = data;
      }

      if (!userData) throw new Error('User not found in response');
      setUser(userData);
      setFormData({ firstName: userData.firstName, lastName: userData.lastName });
    } catch (error) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, session?.userId]);

  useEffect(() => {
    if (session) fetchUser();
  }, [fetchUser, session]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      // Update local user state
      setUser((prev) => prev ? { ...prev, firstName: data.firstName, lastName: data.lastName } : prev);
      await refreshSession();
      setEditing(false);
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({ firstName: user.firstName, lastName: user.lastName });
    }
    setEditing(false);
  };

  // Redirect if not admin
  if (typeof window !== 'undefined' && !session && !loading) {
    // redirect to login (handled by useAuth redirect)
  }

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (session.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/50">
          <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be logged in as an administrator.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/50">
          <p className="text-gray-600">Unable to load profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-6 md:p-8">
      {/* Animated background accent */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header with glass effect */}
        <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Admin Settings
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Manage your profile and security
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information Card */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 transition-all duration-500 hover:shadow-2xl hover:bg-white/90 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-amber-500" />
                Profile Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 text-amber-600 hover:text-amber-700 transition rounded-full hover:bg-amber-50 group-hover:scale-110"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-500 w-24">Full Name</span>
                  <span className="font-semibold text-slate-800">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-500 w-24">Email</span>
                  <span className="font-semibold text-slate-800">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-500 w-24">Role</span>
                  <span className="font-semibold text-slate-800 capitalize">{user.role}</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 transition-all duration-500 hover:shadow-2xl hover:bg-white/90 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-amber-500" />
                Security
              </h2>
              <p className="text-slate-500 text-sm mb-6">Change your password to keep your account secure.</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-3 rounded-full bg-white border-2 border-amber-500 text-amber-600 font-semibold shadow-sm hover:bg-amber-50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}