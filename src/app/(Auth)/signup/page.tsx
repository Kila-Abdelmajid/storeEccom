'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';
import { isValidEmail, getPasswordStrength } from '@/lib/validators';
import OTPModal from '@/components/ui/OTPModal';
import'../../globals.css';
import Link from 'next/link';



export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  // Update password strength when password changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, password: val }));
    setPasswordStrength(getPasswordStrength(val));
    if (touched.password) {
      const err = validateField('password', val);
      setErrors(prev => ({ ...prev, password: err }));
    }
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!isValidEmail(value)) return 'Invalid email format';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      if (key === 'confirmPassword') {
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        return;
      }
      const err = validateField(key, formData[key as keyof typeof formData]);
      if (err) newErrors[key] = err;
    });
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true, confirmPassword: true, firstName: true, lastName: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Send OTP
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, type: 'signup' }),
      });
      if (!otpRes.ok) throw new Error('Failed to send verification code');
      setPendingEmail(formData.email);
      setShowOTP(true);
      showToast('Verification code sent to your email', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    showToast('Email verified! You can now log in.', 'success');
    router.push('/login');
  };

  return (
    <>
    
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#c9a96e] transition mb-6 group"
        >
          {/* S-ghir SVG Icon d l-Back/Home */}
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
          <div className="text-center mb-8">
                    
            <h2 className="text-3xl font-extrabold text-gray-900">Create account</h2>
            <p className="text-gray-500 mt-2">Join us and start shopping</p>
            <div className="w-16 h-1 bg-amber-500 mx-auto mt-3 rounded-full" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 bg-white/50 border rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.firstName && touched.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 bg-white/50 border rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.lastName && touched.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-white/50 border rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition ${errors.email && touched.email ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.email && touched.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 bg-white/50 border rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition pr-10 ${errors.password && touched.password ? 'border-red-500' : 'border-slate-200'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                    <div className={`flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-gray-200'}`} />
                  </div>
                  <p className={`text-xs mt-1 ${passwordStrength.label === 'Strong' ? 'text-green-600' : passwordStrength.label === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
              {errors.password && touched.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 bg-white/50 border rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-amber-600 hover:underline">Sign in</a>
          </p>
        </div>
      </div>

      {showOTP && (
        <OTPModal
          email={pendingEmail}
          type="signup"
          onSuccess={handleOTPSuccess}
          onCancel={() => setShowOTP(false)}
        />
      )}
    </>
  );
}