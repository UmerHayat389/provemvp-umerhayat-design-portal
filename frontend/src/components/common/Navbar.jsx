// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ user, setUser, sidebarOpen, setSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const profileImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfKhtv5fs3PcsBLYjedkMFpH20DKNo1A4R4Q&s";

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-8 py-4 flex justify-between items-center relative shadow-sm transition-colors duration-200">

      {/* Left side */}
      <div className="flex items-center gap-8">

        {/* ☰ Sidebar button (mobile only) */}
        <button
          className="md:hidden text-2xl transition-opacity duration-200 text-[#0C2B4E] dark:text-gray-200"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {/* Title - Mobile Only */}
        <h1
          className="md:hidden text-xl font-bold text-[#1a3a52] dark:text-white"
          style={{ fontWeight: '700', letterSpacing: '-0.01em' }}
        >
          ProveMVP
        </h1>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 pl-12 pr-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 text-sm font-medium text-[#1a3a52] dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-gray-200 dark:focus:border-gray-600 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* ✅ Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors duration-200"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow flex items-center justify-center text-xs transition-all duration-300 ease-in-out
              ${isDark
                ? 'translate-x-7 bg-gray-900 text-yellow-300'
                : 'translate-x-0 bg-white text-yellow-500'
              }`}
          >
            {isDark ? (
              /* Moon icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              /* Sun icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </span>
        </button>

        {/* Desktop view */}
        <div className="hidden md:flex items-center gap-4">

          {/* User info */}
          <div className="text-right mr-2">
            <p className="text-sm font-semibold leading-tight text-[#1a3a52] dark:text-gray-100">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              {user.role}
            </p>
          </div>

          {/* Profile Picture */}
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-gray-200 dark:hover:ring-gray-500 transition-all duration-300 cursor-pointer">
            <img
              src={profileImage}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setUser(null)}
            className="ml-3 px-6 py-2.5 rounded-lg font-semibold text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-200 hover:shadow-md"
          >
            Logout
          </button>
        </div>

        {/* Mobile view */}
        <div className="md:hidden relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-gray-200 transition-all duration-300"
          >
            <img
              src={profileImage}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-[#1a3a52] dark:text-gray-100">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {user.role}
                </p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); setUser(null); }}
                className="w-full text-left px-5 py-3.5 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;