// src/components/common/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Calendar, UserCheck } from 'lucide-react';

// Make sure to import the font in your main index.css or tailwind config
// Example: @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

const Sidebar = ({ user, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/attendance', label: 'Attendance', icon: <Calendar size={20} /> },
    { to: '/leave', label: 'Leave', icon: <UserCheck size={20} /> },
  ];

  const handleLinkClick = () => setSidebarOpen(false);

  return (
    <>
      {/* 🔹 Overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md p-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:shadow-none`}
      >
        {/* 🔹 Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Logo + text container */}
          <div className="flex items-center gap-2">
            {/* Slightly smaller logo */}
            <img
              src="https://cdn.freebiesupply.com/logos/large/2x/one-1-logo-svg-vector.svg"
              alt="ProveMVP Logo"
              className="h-8 w-8 object-cover rounded-full shadow-md"
            />
            {/* Attractive logo text */}
            <span
              className="text-lg font-bold text-[#0C2B4E] drop-shadow-sm"
              style={{ 
                fontFamily: "'Pacifico', cursive", 
                color: '#0C2B4E' // subtle attractive accent color
              }}
            >
              ProveMVP
            </span>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-600 hover:text-black"
          >
            <X size={24} />
          </button>
        </div>

        {/* 🔹 Navigation */}
        <nav>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 py-3 px-4 mb-2 rounded-lg transition-all text-lg font-semibold
                ${
                  location.pathname === link.to
                    ? 'bg-[#0C2B4E] text-white shadow-md'
                    : 'text-[#0C2B4E] hover:bg-gray-100 hover:shadow-sm'
                }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
