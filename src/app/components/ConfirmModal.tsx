/**
 * Custom Confirm Modal Component
 */

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700'
        };
      default: // warning
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmBg: 'bg-amber-600 hover:bg-amber-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-modal-fade-in animate-backdrop-blur"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-modal-zoom-in">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <AlertTriangle className={`w-8 h-8 ${styles.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
            {title}
          </h3>

          {/* Message */}
          <div className="text-gray-600 text-center leading-relaxed mb-8 whitespace-pre-line">
            {message}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-300"
            >
              {cancelText}
            </button>

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 ${styles.confirmBg} text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}