'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import '../../globals.css';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFaceIdPrompt, setShowFaceIdPrompt] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // After successful signup, show Face ID prompt
      setShowFaceIdPrompt(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

 const registerFaceId = async () => {
  setFaceIdLoading(true);
  setError('');
  try {
    const optsRes = await fetch('/api/auth/webauthn/register/begin', { method: 'POST' });
    if (!optsRes.ok) {
      const err = await optsRes.json();
      throw new Error(err.error);
    }
    const options = await optsRes.json();

    // ✅ Correct v11+ call format
    const attestation = await startRegistration({ optionsJSON: options });

    const verifyRes = await fetch('/api/auth/webauthn/register/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attestation }),
    });
    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error);
    }
    alert('Face ID registered successfully!');
    router.push('/');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setFaceIdLoading(false);
  }
};

  const skipAndGoHome = () => {
    router.push('/');
  };

  // Show Face ID registration prompt after account creation
  if (showFaceIdPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Account created successfully!</h2>
          <p className="text-gray-600 mb-6">
            Do you want to add Face ID / Passkey for faster login?
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={registerFaceId}
              disabled={faceIdLoading}
              className="w-full py-2 px-4 bg-[#c9a96e] text-white rounded-md hover:bg-[#b88a4a] disabled:opacity-50 transition-colors"
            >
              {faceIdLoading ? 'Registering...' : 'Yes, register Face ID'}
            </button>
            <button
              onClick={skipAndGoHome}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip & go to homepage
            </button>
          </div>
          {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Create new account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] sm:text-sm"
                placeholder="First Name"
              />
            </div>
            <div>
              <input
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] sm:text-sm"
                placeholder="Last Name"
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#c9a96e] focus:border-[#c9a96e] sm:text-sm"
                placeholder="Phone (optional)"
              />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#c9a96e] hover:bg-[#b88a4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c9a96e] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          <div className="text-sm text-center">
            <a href="/login" className="font-medium text-[#c9a96e] hover:text-[#b88a4a]">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}