// src/components/common/Navbar.jsx
import React, { useState } from 'react';

const Navbar = ({ user, setUser, sidebarOpen, setSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <header className="bg-white shadow-md px-4 py-2 flex justify-between items-center relative">
      
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* ☰ Sidebar button (mobile only) */}
        <button
          className="md:hidden text-gray-600 text-xl hover:text-blue-500 transition"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {/* Title */}
        <h1 className="text-base sm:text-lg font-semibold text-gray-800">
          Employee Management System
        </h1>

        {/* Search Bar */}
        <div className="hidden md:flex ml-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-40 px-3 py-1.5 rounded-full border border-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Desktop view */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">
            {user.name} ({user.role})
          </span>

          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
            {user.name?.charAt(0)}
          </div>

          <button
            onClick={() => setUser(null)}
            className="px-3 py-1 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition shadow"
          >
            Logout
          </button>
        </div>

        {/* Mobile view */}
        <div className="md:hidden relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm"
          >
            {user.name?.charAt(0)}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white shadow-lg rounded-lg border z-50 overflow-hidden">
              <div className="px-4 py-2 text-sm font-medium border-b text-gray-700">
                {user.name}
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setUser(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 transition"
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
