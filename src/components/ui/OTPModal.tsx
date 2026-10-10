'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';

interface OTPModalProps {
  email: string;
  type: 'signup' | 'forgot' | 'admin_login';
  pendingToken?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OTPModal({ email, type, pendingToken, onSuccess, onCancel }: OTPModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      showToast('Please enter the 6‑digit code', 'error');
      return;
    }
    setLoading(true);
    try {
      let url = '/api/auth/verify-otp';
      let body: any = { email, code, type };
      if (type === 'admin_login' && pendingToken) {
        url = '/api/auth/verify-admin-otp';
        body = { pendingToken, code };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Verification successful', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full border border-white/50 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-800">Verification code</h3>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-slate-100">
            <XMarkIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        <p className="text-slate-600 text-sm mb-4">
          We sent a 6‑digit code to <strong>{email}</strong>. Please enter it below.
        </p>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 mb-5"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading}
            className="flex-1 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium shadow-md hover:shadow-lg transition"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}