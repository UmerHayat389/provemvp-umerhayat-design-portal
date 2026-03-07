// src/components/common/ProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const ProfilePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const [form, setForm] = useState({
    phone: '',
    address: '',
    description: '',
    linkedin: '',
    github: '',
    profilePhoto: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      const data = res.data;
      setProfile(data);
      setForm({
        phone: data.phone || '',
        address: data.address || '',
        description: data.description || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        profilePhoto: data.profilePhoto || '',
      });
      if (data.profilePhoto) setPreviewPhoto(data.profilePhoto);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreviewPhoto(base64);
      setForm(f => ({ ...f, profilePhoto: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewPhoto(null);
    setForm(f => ({ ...f, profilePhoto: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/profile/update', form);
      const updatedUser = res.data.user; // full user object from DB

      // Spread user first (keeps _id, name, role, email, token untouched)
      // then overwrite with all fresh fields from DB (including profilePhoto)
      const mergedUser = { ...user, ...updatedUser };

      // setUser (App.jsx) handles BOTH: React state update + localStorage.setItem
      // This causes Navbar to re-render immediately with the new photo
      setUser(mergedUser);

      setProfile(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'Admin') return 'bg-[#0C2B4E] text-white';
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#0C2B4E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#0C2B4E] dark:hover:text-white transition-colors duration-150 group"
        >
          <svg className="w-5 h-5 transition-transform duration-150 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">My Profile</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-xl flex items-center gap-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center gap-3">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Profile saved — navbar photo updated!</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-6">

          {/* Cover Strip */}
          <div className="h-24 bg-gradient-to-r from-[#0C2B4E] to-[#1a4d7a] relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
            />
          </div>

          <div className="px-8 pb-8">

            {/* Avatar row — only avatar pulls up over cover, name stays in card body */}
            <div className="flex justify-between items-start -mt-12 mb-2">
              <div className="relative group w-fit flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-gray-900 shadow-lg bg-[#0C2B4E] flex items-center justify-center">
                  {previewPhoto ? (
                    <img src={previewPhoto} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{getInitials(user?.name)}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>

              {/* Remove photo — top right */}
              {previewPhoto && (
                <button
                  onClick={handleRemovePhoto}
                  className="mt-14 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* Name block — fully below avatar in card body, always visible */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {profile?.name || user?.name}
              </h2>
              <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getRoleBadgeStyle(profile?.role || user?.role)}`}>
                {profile?.role || user?.role}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                {profile?.email || user?.email}
              </p>
            </div>


            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-6 flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#0C2B4E] dark:hover:text-gray-300 transition-colors group"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Click avatar to upload photo · Max 2MB
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-800 mb-6" />

            {/* Read-only Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{profile?.name || user?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{profile?.email || user?.email || '—'}</p>
              </div>
              {profile?.department && (
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{profile.department}</p>
                </div>
              )}
              {profile?.joiningDate && (
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Joined</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {new Date(profile.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editable Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#0C2B4E] rounded-full inline-block" />
            Edit Details
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">About / Bio</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Write a short bio about yourself..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/20 focus:border-[#0C2B4E]/50 dark:focus:border-[#1a4d7a] resize-none transition-all duration-200"
              />
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 text-right">{form.description.length}/500</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone Number</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+92 300 0000000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/20 focus:border-[#0C2B4E]/50 dark:focus:border-[#1a4d7a] transition-all duration-200" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Address</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="City, Country"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/20 focus:border-[#0C2B4E]/50 dark:focus:border-[#1a4d7a] transition-all duration-200" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Social Links</label>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <input type="url" value={form.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/20 focus:border-[#0C2B4E]/50 dark:focus:border-[#1a4d7a] transition-all duration-200" />
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <input type="url" value={form.github} onChange={(e) => handleChange('github', e.target.value)} placeholder="https://github.com/yourusername"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/20 focus:border-[#0C2B4E]/50 dark:focus:border-[#1a4d7a] transition-all duration-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0C2B4E] hover:bg-[#1a4d7a] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
            ) : saved ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved!</>
            ) : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;