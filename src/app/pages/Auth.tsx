/**
 * Authentication Page - Sign In / Sign Up
 */

import { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

interface AuthProps {
  onBack: () => void;
  onSuccess: () => void;
  onNeedProfile: () => void; // When user signs up and needs to complete profile
  showLogoutMessage?: boolean; // Show message when coming back from role selector
}

function Auth({ onBack, onSuccess, onNeedProfile, showLogoutMessage }: AuthProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        // Sign In
        const { user, error } = await signIn(formData.email, formData.password);
        if (error) {
          setErrors({ general: error.message || 'Sign in failed' });
        } else if (user) {
          onSuccess();
        }
      } else {
        // Sign Up - just create auth user, profile will be created in onboarding
        const { user, error } = await signUp(formData.email, formData.password, {});
        if (error) {
          setErrors({ general: error.message || 'Sign up failed' });
        } else if (user) {
          // User created, now need to complete profile
          onNeedProfile();
        }
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-xl hover:bg-white/90 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-[#126DA6]/10 border border-white/60 text-gray-700 hover:text-[#126DA6]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-semibold">Back</span>
      </button>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#73C6D9]/10 rounded-full blur-2xl animate-float" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-[#2A95BF]/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-[#1261A6]/10 rounded-full blur-xl animate-float-slow" />
      </div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#1261A6] to-[#2A95BF] mb-4 shadow-lg shadow-[#1261A6]/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1261A6] to-[#126DA6] bg-clip-text text-transparent mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Join JOFLOW'}
          </h1>
          <p className="text-gray-600">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#126DA6]/10 border border-white/60">
          {/* Logout Message */}
          {showLogoutMessage && (
            <div className="mb-6 p-4 bg-blue-50/60 backdrop-blur-sm rounded-2xl border border-blue-200/40">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-blue-800">Account Options</h4>
              </div>
              <p className="text-sm text-blue-700">
                You can sign out to switch accounts, or continue with your current account to select your role.
              </p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex bg-white/60 backdrop-blur-sm rounded-2xl p-1 mb-6 border border-white/40">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#2A95BF] to-[#126DA6] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#126DA6]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#2A95BF] to-[#126DA6] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#126DA6]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50/60 backdrop-blur-sm border border-red-200/40 rounded-2xl">
              <p className="text-sm text-red-600 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#126DA6] transition-colors" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                placeholder="your@email.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#126DA6] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#126DA6] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#126DA6] transition-colors" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          {/* Info */}
          {mode === 'signup' && (
            <div className="mt-4 p-4 bg-blue-50/60 backdrop-blur-sm rounded-2xl border border-blue-200/40">
              <p className="text-sm text-blue-800">
                After creating your account, you'll complete your profile with name, phone, and location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;