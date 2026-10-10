'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';
import { isValidEmail } from '@/lib/validators';
import OTPModal from '@/components/ui/OTPModal';
import Link from 'next/link';
import '../../globals.css';
import * as cartStorage from '@/lib/cartStorage'; // 👈 import


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingAdminToken, setPendingAdminToken] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // Helper to merge guest cart after login
  const mergeGuestCart = async () => {
    const guestCart = cartStorage.getGuestCart();
    if (guestCart.length === 0) return;
    try {
      const items = guestCart.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const res = await fetch('/api/ClientApi/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        cartStorage.clearGuestCart();
        // Optional: trigger cart update to refresh the badge
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err) {
      console.error('Failed to merge guest cart', err);
    }
  };

 

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.requiresOtp && data.pendingToken) {
        setPendingAdminToken(data.pendingToken);
        setShowOTP(true);
        return;
      }

      // Normal user login: merge guest cart and redirect
      await mergeGuestCart();
      showToast(`Welcome back, ${email.split('@')[0]}!`, 'success');
      if (data.role === 'admin') router.push('/Dashboard');
      else router.push('/');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = async () => {
        await mergeGuestCart();

    router.push('/Dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition mb-6 group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
          <div className="w-16 h-1 bg-amber-500 mx-auto mt-3 rounded-full" />
        </div>

        <form className="space-y-5" onSubmit={handlePasswordLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          <button
            onClick={() => router.push('/forgot-password')}
            className="text-amber-600 hover:underline"
          >
            Forgot password?
          </button>
        </p>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="font-medium text-amber-600 hover:underline">
            Create one
          </a>
        </p>
      </div>

      {showOTP && (
        <OTPModal
          email={email}
          type="admin_login"
          pendingToken={pendingAdminToken}
          onSuccess={handleOTPSuccess}
          onCancel={() => setShowOTP(false)}
        />
      )}
    </div>
  );
}