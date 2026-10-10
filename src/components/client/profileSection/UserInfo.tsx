'use client';

import { useState, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';
import ChangePasswordModal from '../../ui/ChangePasswordModal';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/users');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUser(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
        });
      } catch {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [showToast]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setUser((prev) => prev ? { ...prev, firstName: updated.firstName, lastName: updated.lastName } : null);
      setEditing(false);
      showToast('Profile updated', 'success');
    } catch {
      showToast('Update failed', 'error');
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <div className="text-center py-12 text-slate-500">Unable to load profile</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-slate-800">Personal Information</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-amber-600 hover:text-amber-700 transition rounded-full hover:bg-amber-50"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
           
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 text-sm">Full Name</span>
              <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Email</span>
              <p className="font-medium text-slate-800">{user.email}</p>
            </div>
           
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-sm text-amber-600 hover:text-amber-700 transition underline-offset-2 hover:underline mt-2"
          >
            Change Password
          </button>
        </div>
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}