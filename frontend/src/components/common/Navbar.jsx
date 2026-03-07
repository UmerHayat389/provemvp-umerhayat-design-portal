// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ user, setUser, sidebarOpen, setSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // ✅ FIX: Read profilePhoto from user state (which is now kept in sync by App.jsx setUser)
  const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfKhtv5fs3PcsBLYjedkMFpH20DKNo1A4R4Q&s";
  const profileImage = user?.profilePhoto || defaultAvatar;
  const profileRoute = user?.role === 'Admin' ? '/admin/profile' : '/employee/profile';

  const handleProfileClick = () => navigate(profileRoute);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 py-3 flex justify-between items-center relative shadow-sm transition-colors duration-200">

      {/* Left side */}
      <div className="flex items-center gap-6">

        {/* ☰ Sidebar button (mobile only) */}
        <button
          className="md:hidden text-2xl transition-opacity duration-200 text-[#0C2B4E] dark:text-gray-200"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {/* Title - Mobile Only */}
        <h1 className="md:hidden text-xl font-bold text-[#1a3a52] dark:text-white tracking-tight">
          ProveMVP
        </h1>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 text-sm text-[#1a3a52] dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-gray-200 dark:focus:border-gray-600 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative w-13 h-7 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors duration-200"
          style={{ width: '52px', height: '28px' }}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow flex items-center justify-center text-xs transition-all duration-300 ease-in-out ${isDark ? 'translate-x-6 bg-gray-900 text-yellow-300' : 'translate-x-0 bg-white text-yellow-500'}`}>
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </span>
        </button>

        {/* Desktop view */}
        <div className="hidden md:flex items-center gap-3">

          {/* ✅ FIX: User info — proper spacing, no overlap, truncate long names */}
          <div className="text-right max-w-[140px]">
            <p className="text-sm font-semibold leading-tight text-[#1a3a52] dark:text-gray-100 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium truncate">
              {user?.role}
            </p>
          </div>

          {/* ✅ FIX: Profile Picture — reads from user.profilePhoto */}
          <button
            onClick={handleProfileClick}
            title="View Profile"
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-[#0C2B4E] dark:hover:ring-[#1a4d7a] transition-all duration-300 cursor-pointer flex-shrink-0 focus:outline-none"
          >
            <img
              src={profileImage}
              alt={user?.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setUser(null)}
            className="px-5 py-2 rounded-lg font-semibold text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-200 hover:shadow-md whitespace-nowrap"
          >
            Logout
          </button>
        </div>

        {/* Mobile view */}
        <div className="md:hidden relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-gray-200 transition-all duration-300 focus:outline-none"
          >
            <img
              src={profileImage}
              alt={user?.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-[#1a3a52] dark:text-gray-100 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{user?.role}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate(profileRoute); }}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-[#0C2B4E] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
              <button
                onClick={() => { setDropdownOpen(false); setUser(null); }}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-200"
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