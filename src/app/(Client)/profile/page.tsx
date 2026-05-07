'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        throw new Error();
      }
      const data = await res.json();
      setUser(data);
      // Check if user has passkey
      const passkeyRes = await fetch('/api/auth/webauthn/has-passkey');
      if (passkeyRes.ok) {
        const { hasPasskey } = await passkeyRes.json();
        setHasPasskey(hasPasskey);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFaceId = async () => {
    setError('');
    try {
      const optsRes = await fetch('/api/auth/webauthn/register/begin', { method: 'POST' });
      if (!optsRes.ok) {
        const err = await optsRes.json();
        throw new Error(err.error);
      }
      const options = await optsRes.json();
      const attestation = await startRegistration(options);
      const verifyRes = await fetch('/api/auth/webauthn/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attestation }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error);
      }
      alert('Face ID added successfully');
      setHasPasskey(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeFaceId = async () => {
    if (!confirm('Remove Face ID from your account? You can add it again later.')) return;
    try {
      const res = await fetch('/api/auth/webauthn/remove-passkey', { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      alert('Face ID removed');
      setHasPasskey(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and security settings.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.firstName} {user.lastName}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.phone || 'Not provided'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Face ID / Passkey</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                {hasPasskey ? (
                  <button
                    onClick={removeFaceId}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Remove Face ID
                  </button>
                ) : (
                  <button
                    onClick={addFaceId}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-[#c9a96e] hover:bg-[#b88a4a]"
                  >
                    Add Face ID
                  </button>
                )}
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}