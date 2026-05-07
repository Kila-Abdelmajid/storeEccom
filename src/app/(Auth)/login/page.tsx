'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import '../../globals.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Redirect based on role
      if (data.role === 'admin') router.push('/Dashboard');
      else router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceIdLogin = async () => {
    if (!email) {
      setError('Please enter your email first to use Face ID');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Get authentication options
      const optionsRes = await fetch('/api/auth/webauthn/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.error);
      }
      const options = await optionsRes.json();

      // 2. Ask browser for Face ID / biometric
      const assertion = await startAuthentication(options);

      // 3. Verify assertion
      const verifyRes = await fetch('/api/auth/webauthn/login/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertion }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error);
      }
      const data = await verifyRes.json();
      if (data.role === 'admin') router.push('/Dashboard');
      else router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#c9a96e] hover:bg-[#b88a4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c9a96e] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with password'}
            </button>

            <button
              type="button"
              onClick={handleFaceIdLogin}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c9a96e] disabled:opacity-50"
            >
              🔓 Sign in with Face ID / Passkey
            </button>
          </div>
          <div className="text-sm text-center">
            <a href="/signup" className="font-medium text-[#c9a96e] hover:text-[#b88a4a]">
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}