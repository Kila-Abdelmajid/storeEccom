'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subtotal: number;
  itemsCount: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export default function CheckoutModal({ isOpen, onClose, onSuccess, subtotal, itemsCount }: CheckoutModalProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  // Fetch user profile when modal opens and user is logged in
  useEffect(() => {
    if (!isOpen || !session) return;

    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/auth/users');
        if (!res.ok) throw new Error();
        const data: UserProfile = await res.json();
        setFormData(prev => ({
          ...prev,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          phone: data.phone || '',
        }));
      } catch (err) {
        console.error('Failed to load user profile', err);
      }
    };

    fetchUserProfile();
  }, [isOpen, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim() || !formData.city.trim()) {
      showToast('Please fill in your shipping address', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ClientApi/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: `${formData.address}, ${formData.city}`,
          shippingPhone: formData.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Order placed successfully!', 'success');
      onSuccess(); // refresh cart / close drawer
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/50">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Checkout
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              disabled
              className="w-full mt-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full mt-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
              placeholder="Street, building, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
              placeholder="City"
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({itemsCount} items)</span>
              <span className="font-semibold">{subtotal.toFixed(2)} MAD</span>
            </div>
           
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Place order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}