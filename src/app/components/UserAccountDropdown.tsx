/**
 * Premium User Account Dropdown
 * Shows user info, settings, and logout
 */

import { useState, useRef, useEffect } from 'react';
import { User, Phone, Mail, MapPin, LogOut, Settings, Edit2, X } from 'lucide-react';
import { UserProfile } from './OnboardingFlow';
import Button from './Button';

interface UserAccountDropdownProps {
  userProfile: Omit<UserProfile, 'password'>;
  onEditProfile: (profile: Omit<UserProfile, 'password'>) => void;
  onLogout: () => void;
}

export default function UserAccountDropdown({ 
  userProfile, 
  onEditProfile,
  onLogout 
}: UserAccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(userProfile);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSaveEdit = () => {
    onEditProfile(editData);
    setIsEditing(false);
    setIsOpen(false);
  };

  const handleCancelEdit = () => {
    setEditData(userProfile);
    setIsEditing(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 hover:bg-white/70 transition-all duration-300 hover:scale-105"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1261A6] to-[#2A95BF] flex items-center justify-center shadow-md">
          <User className="w-5 h-5 text-white" />
        </div>
        <span className="hidden sm:inline text-sm font-semibold text-gray-700">{userProfile.name}</span>
      </button>

      {/* Dropdown Panel - Use fixed positioning to escape parent z-index */}
      {isOpen && (
        <div 
          className="fixed w-80 bg-white backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#126DA6]/10 border border-white/60 overflow-hidden z-[99999]"
          style={{
            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 0,
            right: window.innerWidth - (dropdownRef.current ? dropdownRef.current.getBoundingClientRect().right : 0)
          }}
        >
          {!isEditing ? (
            <>
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-[#1261A6] to-[#2A95BF] text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                    <User className="w-8 h-8" />
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-bold mb-1">{userProfile.name}</h3>
                <p className="text-white/80 text-sm">JOFLOW Member</p>
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#126DA6]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold">Phone</p>
                    <p className="text-gray-900 font-medium">{userProfile.phone}</p>
                  </div>
                </div>

                {userProfile.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-semibold">Email</p>
                      <p className="text-gray-900 font-medium">{userProfile.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold">Location</p>
                    <p className="text-gray-900 font-medium">{userProfile.locationName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {userProfile.location.lat.toFixed(4)}, {userProfile.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Open settings modal here if needed
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-2xl transition-all duration-300 group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-semibold">Settings</span>
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </>
          ) : (
            /* Edit Mode */
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={handleCancelEdit} className="flex-1" size="sm">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1" size="sm">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
