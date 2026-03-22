/**
 * Auth Callback Page - Handle email confirmation
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function AuthCallback({ onSuccess, onError }: AuthCallbackProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken) {
          // Email confirmation successful
          setStatus('success');
          setMessage('Email confirmed successfully! Welcome to JOFLOW.');
          
          // Wait a moment for auth context to update
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else if (type === 'recovery') {
          // Password recovery
          setStatus('success');
          setMessage('Password reset link confirmed. You can now set a new password.');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          throw new Error('Invalid confirmation link');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Invalid or expired confirmation link.');
        setTimeout(() => {
          onError('Invalid confirmation link');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [onSuccess, onError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20 p-6">
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#126DA6]/10 border border-white/60 text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-[#126DA6] to-[#2A95BF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirming your account...</h2>
            <p className="text-gray-600">Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}