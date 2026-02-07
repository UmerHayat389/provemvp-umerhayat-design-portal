// src/components/common/Navbar.jsx
import React, { useState } from 'react';

const Navbar = ({ user, setUser, sidebarOpen, setSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Profile image from the provided link
  const profileImage = "data:image/jpeg;base64,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";

  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center relative shadow-sm">
      
      {/* Left side */}
      <div className="flex items-center gap-8">
        {/* ☰ Sidebar button (mobile only) */}
        <button
          className="md:hidden text-2xl transition-opacity duration-200"
          style={{ color: '#0C2B4E' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {/* Title - Mobile Only */}
        <h1 
          className="md:hidden text-xl font-bold" 
          style={{ 
            color: '#1a3a52',
            fontWeight: '700',
            letterSpacing: '-0.01em'
          }}
        >
          ProveMVP
        </h1>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex">
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
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
              className="w-80 pl-12 pr-5 py-3 rounded-xl bg-gray-50 border border-transparent text-sm font-medium focus:outline-none focus:bg-white focus:border-gray-200 transition-all duration-200"
              style={{ color: '#1a3a52' }}
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Desktop view */}
        <div className="hidden md:flex items-center gap-4">
          {/* User info */}
          <div className="text-right mr-2">
            <p 
              className="text-sm font-semibold leading-tight" 
              style={{ 
                color: '#1a3a52',
                fontWeight: '600'
              }}
            >
              {user.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {user.role}
            </p>
          </div>

          {/* Profile Picture */}
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 hover:ring-gray-200 transition-all duration-300 cursor-pointer">
            <img 
              src={profileImage} 
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setUser(null)}
            className="ml-3 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-md"
            style={{
              color: '#ef4444',
              background: '#fef2f2',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#fef2f2';
            }}
          >
            Logout
          </button>
        </div>

        {/* Mobile view */}
        <div className="md:hidden relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 hover:ring-gray-200 transition-all duration-300"
          >
            <img 
              src={profileImage} 
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p 
                  className="text-sm font-semibold" 
                  style={{ color: '#1a3a52' }}
                >
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {user.role}
                </p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setUser(null);
                }}
                className="w-full text-left px-5 py-3.5 text-sm font-semibold hover:bg-red-50 transition-colors duration-200"
                style={{ color: '#ef4444' }}
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