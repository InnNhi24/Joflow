/**
 * Account Page - For logged in users who want to sign out or continue
 */

import { ArrowLeft, User, LogOut, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

interface AccountProps {
  onBack: () => void;
  onSignOut: () => void;
  onContinue: () => void;
  userEmail?: string;
  userName?: string;
}

function Account({ onBack, onSignOut, onContinue, userEmail, userName }: AccountProps) {
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
            Account Options
          </h1>
          <p className="text-gray-600">
            Choose what you'd like to do
          </p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#126DA6]/10 border border-white/60 mb-6">
          {/* Current Account Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1261A6] to-[#2A95BF] flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {userName || 'Current User'}
            </h3>
            {userEmail && (
              <p className="text-sm text-gray-600">{userEmail}</p>
            )}
          </div>

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50/60 backdrop-blur-sm rounded-2xl border border-blue-200/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-blue-800">Account Status</h4>
            </div>
            <p className="text-sm text-blue-700">
              You are currently signed in. You can continue with role selection or sign out to switch accounts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Continue Button */}
            <Button
              onClick={onContinue}
              className="w-full flex items-center justify-center gap-2"
            >
              <span>Continue with this account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50/60 backdrop-blur-sm border-2 border-red-200/40 rounded-2xl text-red-600 hover:bg-red-100/60 hover:border-red-300/60 transition-all duration-300 font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out and switch account</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            JOFLOW - Join the Flow of Giving
          </p>
        </div>
      </div>
    </div>
  );
}

export default Account;