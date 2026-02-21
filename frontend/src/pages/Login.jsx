// src/pages/Login.jsx
import React, { useState } from 'react';
import { IoPersonCircle, IoArrowBack, IoCheckmarkCircle, IoLockClosedOutline, IoMailOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { authAPI } from '../services/api';

// ─── Reusable Error Box ───────────────────────────────────────────────────────
const ErrorBox = ({ message }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
    <p className="text-red-600 dark:text-red-400 text-sm text-center">{message}</p>
  </div>
);

// ─── Password Input with show/hide toggle ─────────────────────────────────────
const PasswordInput = ({ placeholder, value, onChange, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="flex h-11 w-full rounded-md border border-gray-300 dark:border-[#4a6080] bg-white dark:bg-[#2a3a4f] px-3 py-2 pr-10 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0C2B4E] dark:focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 text-gray-900 dark:text-gray-100"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {show ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ─── Forgot Password View ─────────────────────────────────────────────────────
const ForgotPasswordView = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (oldPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);
    try {
      // POST /auth/change-password → { email, oldPassword, newPassword }
      await authAPI.changePassword({ email, oldPassword, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Password reset failed. Please check your email and current password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-4 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <IoCheckmarkCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#0C2B4E] dark:text-gray-100">
          Password Updated!
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
          Your password has been changed successfully. You can now log in with your new password.
        </p>
        <button
          onClick={onBack}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-[#0C2B4E] px-8 py-2.5 font-semibold text-white hover:bg-[#0a243d] dark:hover:bg-[#1a4d7a] transition-colors duration-200 shadow-lg"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#0C2B4E] dark:text-blue-400 hover:underline mb-6 font-medium"
      >
        <IoArrowBack className="w-4 h-4" />
        Back to Login
      </button>

      {/* Icon + Title */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-14 h-14 rounded-full bg-[#0C2B4E]/10 dark:bg-blue-900/30 flex items-center justify-center mb-3">
          <IoLockClosedOutline className="w-7 h-7 text-[#0C2B4E] dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-[#0C2B4E] dark:text-gray-100">
          Reset Password
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300 text-center">
          Verify your identity and set a new password
        </p>
      </div>

      <div className="h-px bg-gray-200 dark:bg-[#3a4a5f] mb-5" />

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
            <IoMailOutline className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            disabled={loading}
            className="flex h-11 w-full rounded-md border border-gray-300 dark:border-[#4a6080] bg-white dark:bg-[#2a3a4f] px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0C2B4E] dark:focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="h-px bg-gray-200 dark:bg-[#3a4a5f]" />

        {/* Current Password */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">
            Current Password
          </label>
          <PasswordInput
            placeholder="Enter your current password"
            value={oldPassword}
            onChange={(e) => { setOldPassword(e.target.value); setError(''); }}
            disabled={loading}
          />
        </div>

        {/* New Password */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">
            New Password
          </label>
          <PasswordInput
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            disabled={loading}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">
            Confirm New Password
          </label>
          <PasswordInput
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            disabled={loading}
          />
          {confirmPassword && (
            <p className={`mt-1 text-xs ${newPassword === confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
              {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {error && <ErrorBox message={error} />}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-md bg-[#0C2B4E] px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-[#0a243d] dark:hover:bg-[#1a4d7a] transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Updating...
            </span>
          ) : 'Update Password'}
        </button>

      </form>
    </div>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen bg-[#0C2B4E] dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
      <section className="w-full max-w-sm mx-4">
        <div className="bg-[#F5F2F2] dark:bg-gray-750 px-6 py-8 rounded-lg shadow-xl transition-colors duration-200" style={{backgroundColor: 'var(--card-bg)'}}>
          <style>{`
            :root { --card-bg: #F5F2F2; }
            .dark { --card-bg: #1e2a3a; }
          `}</style>

          {showForgotPassword ? (
            <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />
          ) : (
            <div className="animate-fadeIn">
              <IoPersonCircle className='mx-auto w-14 h-14 mb-4 text-[#0C2B4E] dark:text-blue-400 block' />

              <h2 className="text-center text-2xl font-bold leading-tight text-[#0C2B4E] dark:text-gray-100">
                Welcome to ProveMVP
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                Please enter your email and password
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleLogin}>

                {/* Email */}
                <div>
                  <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      placeholder="Email"
                      type="email"
                      required
                      className="flex h-11 w-full rounded-md border border-gray-300 dark:border-[#4a6080] bg-white dark:bg-[#2a3a4f] px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0C2B4E] dark:focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 text-gray-900 dark:text-gray-100"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-semibold text-[#0C2B4E] dark:text-blue-400 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="flex h-11 w-full rounded-md border border-gray-300 dark:border-[#4a6080] bg-white dark:bg-[#2a3a4f] px-3 py-2 pr-10 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0C2B4E] dark:focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 text-gray-900 dark:text-gray-100"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  className="inline-flex w-full items-center justify-center rounded-md bg-[#0C2B4E] px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-[#0a243d] dark:hover:bg-[#1a4d7a] transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Get started'}
                </button>

              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  ProveMVP Team Mangement Portal
                </p>
              </div>
            </div>
          )}

        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default Login;