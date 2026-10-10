'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import OTPModal from '@/components/ui/OTPModal';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'forgot' }),
      });
      if (!res.ok) throw new Error();
      setShowOTP(true);
      showToast('Verification code sent to your email', 'success');
    } catch {
      showToast('Failed to send code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#c9a96e] transition mb-6 group"
        >
          {/* S-ghir SVG Icon d l-Back/Home */}
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
           Back to login
        </Link>

          <h2 className="text-2xl font-light text-slate-800 mb-6">Reset password</h2>
          <form onSubmit={handleSendOTP} className="space-y-5">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg transition"
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        </div>
      </div>
      {showOTP && (
        <OTPModal
          email={email}
          type="forgot"
          onSuccess={handleOTPSuccess}
          onCancel={() => setShowOTP(false)}
        />
      )}
    </>
  );
}