/**
 * Role Selector Component - Modern Design with Animated Waves
 * User selects if they are a Giver or Receiver before entering dashboard
 */

import { useState } from 'react';
import { UserRole } from '../types';
import { Heart, HandHelping, Sparkles, ArrowLeft } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
  onBack?: () => void; // Optional back handler
}

export default function RoleSelector({ onSelectRole, onBack }: RoleSelectorProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    setShowConfirmModal(true);
  };

  const handleConfirmRole = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
    setShowConfirmModal(false);
    setSelectedRole(null);
  };

  const handleCancelRole = () => {
    setShowConfirmModal(false);
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Back Button - Top Left */}
      <button
        onClick={() => {
          console.log('Back button clicked, onBack:', onBack);
          if (onBack) {
            onBack();
          }
        }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-xl hover:bg-white/90 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-[#126DA6]/10 border border-white/60 text-gray-700 hover:text-[#126DA6]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-semibold">Back</span>
      </button>

      {/* Animated Wave Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
        {/* Wave 1 - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 opacity-30">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path 
              fill="#1261A6" 
              fillOpacity="0.15"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            >
              <animate
                attributeName="d"
                dur="10s"
                repeatCount="indefinite"
                values="
                  M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                  M0,128L48,144C96,160,192,192,288,176C384,160,480,96,576,80C672,64,768,96,864,128C960,160,1056,192,1152,176C1248,160,1344,96,1392,64L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                  M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </path>
          </svg>
        </div>

        {/* Wave 2 - Middle */}
        <div className="absolute bottom-0 left-0 right-0 opacity-20">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path 
              fill="#2A95BF" 
              fillOpacity="0.2"
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            >
              <animate
                attributeName="d"
                dur="15s"
                repeatCount="indefinite"
                values="
                  M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                  M0,192L48,197.3C96,203,192,213,288,213.3C384,213,480,203,576,192C672,181,768,171,864,181.3C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                  M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </path>
          </svg>
        </div>

        {/* Top Wave */}
        <div className="absolute top-0 left-0 right-0 opacity-10 rotate-180">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path 
              fill="#73C6D9" 
              fillOpacity="0.3"
              d="M0,96L48,106.7C96,117,192,139,288,144C384,149,480,139,576,122.7C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            >
              <animate
                attributeName="d"
                dur="12s"
                repeatCount="indefinite"
                values="
                  M0,96L48,106.7C96,117,192,139,288,144C384,149,480,139,576,122.7C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z;
                  M0,128L48,122.7C96,117,192,107,288,112C384,117,480,139,576,133.3C672,128,768,96,864,80C960,64,1056,64,1152,80C1248,96,1344,128,1392,144L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z;
                  M0,96L48,106.7C96,117,192,139,288,144C384,149,480,139,576,122.7C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
              />
            </path>
          </svg>
        </div>

        {/* Floating Circles */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#73C6D9]/10 rounded-full blur-2xl animate-float" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-[#2A95BF]/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-[#1261A6]/10 rounded-full blur-xl animate-float-slow" />
        <div className="absolute top-1/3 right-1/3 w-36 h-36 bg-[#73C6D9]/5 rounded-full blur-2xl animate-float" />
      </div>

      {/* Content */}
      <div className="max-w-3xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#1261A6] to-[#2A95BF] mb-3 shadow-lg shadow-[#1261A6]/30">
            <Heart className="w-6 h-6 text-white fill-white animate-pulse-subtle" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            JOFLOW
          </h1>
          <p className="text-base text-gray-600 max-w-md mx-auto flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#2A95BF]" />
            Choose how you'd like to join the flow
            <Sparkles className="w-3.5 h-3.5 text-[#2A95BF]" />
          </p>
          
          {/* Important Warning */}
          <div className="max-w-lg mx-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-amber-800">Important Notice</h3>
            </div>
            <p className="text-amber-700 text-xs leading-relaxed">
              <strong>Your role choice is permanent and cannot be changed.</strong> Once you select Giver or Receiver, 
              this will be your fixed role for this account. Choose carefully based on your primary need.
            </p>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          {/* Giver Card */}
          <button
            onClick={() => handleRoleSelection('giver')}
            className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-[#1261A6] transition-all duration-300 overflow-hidden"
          >
            {/* Hover Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D5E7F2] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-4">
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 group-hover:bg-[#1261A6] transition-colors duration-300 flex items-center justify-center">
                  <HandHelping className="w-6 h-6 text-[#1261A6] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              
              {/* Content */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                I'm a Giver
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                Share resources with those who need them most
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#73C6D9] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">Post items you can give</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#73C6D9] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">See people who need help</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#73C6D9] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">AI matches you with receivers</span>
                </div>
              </div>
              
              {/* CTA */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <span className="text-[#1261A6] font-semibold group-hover:underline text-sm">
                  Continue as Giver →
                </span>
              </div>
            </div>
          </button>

          {/* Receiver Card */}
          <button
            onClick={() => handleRoleSelection('receiver')}
            className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-red-500 transition-all duration-300 overflow-hidden"
          >
            {/* Hover Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-4">
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-red-50 group-hover:bg-red-500 transition-colors duration-300 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-500 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              
              {/* Content */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                I'm a Receiver
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                Request assistance from generous donors nearby
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">Post items you need urgently</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">See available donors nearby</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">AI finds the best matches</span>
                </div>
              </div>
              
              {/* CTA */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <span className="text-red-500 font-semibold group-hover:underline text-sm">
                  Continue as Receiver →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Info Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Powered by AI Symmetry Matching Engine
          </p>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={`Confirm Role Selection`}
        message={`Are you sure you want to be a ${selectedRole?.toUpperCase()}?

This choice is PERMANENT and cannot be changed later. You will need to create a new account to change your role.`}
        confirmText="Yes, Continue"
        cancelText="Cancel"
        onConfirm={handleConfirmRole}
        onCancel={handleCancelRole}
        type="warning"
      />
    </div>
  );
}