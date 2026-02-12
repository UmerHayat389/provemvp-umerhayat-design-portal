// src/components/common/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Calendar, UserCheck } from 'lucide-react';

const Sidebar = ({ user, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/admin/attendance', label: 'Attendance', icon: <Calendar size={20} /> },
    { to: '/admin/leave', label: 'Leave Requests', icon: <UserCheck size={20} /> },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/employee/attendance', label: 'My Attendance', icon: <Calendar size={20} /> },
    { to: '/employee/leave', label: 'My Leave', icon: <UserCheck size={20} /> },
  ];

  const links = user?.role === 'Admin' ? adminLinks : employeeLinks;

  const handleLinkClick = () => setSidebarOpen(false);

  return (
    <>
      {/* Overlay with fade animation */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 dark:bg-opacity-50 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 
          bg-white dark:bg-gray-900 
          shadow-xl dark:shadow-gray-950
          border-r border-gray-100 dark:border-gray-700
          p-4
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 group">
            {/* Logo with pulse animation on hover */}
            <div className="relative">
              <img
                src="https://cdn.freebiesupply.com/logos/large/2x/one-1-logo-svg-vector.svg"
                alt="ProveMVP Logo"
                className="h-9 w-9 object-cover rounded-full shadow-lg 
                  transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-full bg-[#0C2B4E] dark:bg-blue-500 opacity-0 
                group-hover:opacity-20 blur-md transition-opacity duration-300" />
            </div>

            {/* Logo text with gradient effect */}
            <span
              className="text-xl font-bold bg-gradient-to-r from-[#0C2B4E] to-[#1a4d7a] 
                dark:from-blue-400 dark:to-blue-300
                bg-clip-text text-transparent drop-shadow-sm
                transition-all duration-300 group-hover:tracking-wide"
              style={{ fontFamily: "'Pacifico', cursive" }}
            >
              ProveMVP
            </span>
          </div>

          {/* Close button with rotation animation */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 dark:text-gray-400 
              hover:text-[#0C2B4E] dark:hover:text-white
              transition-all duration-300 hover:rotate-90 hover:scale-110"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl 
                transition-all duration-300 text-base font-semibold
                group relative overflow-hidden
                ${
                  location.pathname === link.to
                    ? 'bg-[#0C2B4E] dark:bg-[#0C2B4E] text-white shadow-lg scale-105'
                    : 'text-[#0C2B4E] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md hover:translate-x-1'
                }`}
            >
              {/* Background slide effect on hover */}
              <div className={`absolute inset-0 transition-transform duration-300 
                ${location.pathname === link.to 
                  ? 'bg-[#0C2B4E]' 
                  : 'bg-gradient-to-r from-[#0C2B4E]/5 dark:from-[#0C2B4E]/10 to-transparent translate-x-[-100%] group-hover:translate-x-0'
                }`} 
              />
              
              {/* Icon with bounce animation */}
              <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                {link.icon}
              </span>
              
              {/* Label */}
              <span className="relative z-10">{link.label}</span>

              {/* Active indicator dot */}
              {location.pathname === link.to && (
                <span className="absolute right-4 w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Sidebar;