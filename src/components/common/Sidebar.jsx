// src/components/common/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, sidebarOpen }) => {  // Add sidebarOpen prop
  const location = useLocation();
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/leave', label: 'Leave' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md p-4 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none`}>  
      <h2 className="text-xl font-bold mb-4">ProveMVP</h2>
      <nav>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`block py-2 px-4 rounded mb-2 ${
              location.pathname === link.to ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;