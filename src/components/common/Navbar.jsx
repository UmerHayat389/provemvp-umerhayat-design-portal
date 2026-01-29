// src/components/common/Navbar.jsx
import React from 'react';

const Navbar = ({ user, setUser, sidebarOpen, setSidebarOpen }) => {  // Add sidebar props
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      {/* Burger Icon for Mobile (new, simple addition) */}
      <button
        className="md:hidden text-gray-500 hover:text-gray-700 mr-4"  // Hidden on desktop, margin for spacing
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>
      <h1 className="text-lg sm:text-xl font-bold">Employee Management System</h1> 
      <div className="flex items-center space-x-4">
        <span className="text-sm sm:text-base">{user.name} ({user.role})</span>  
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">A</div> {/* Avatar placeholder */}
        <button onClick={() => setUser(null)} className="text-red-500 hover:underline text-sm sm:text-base">Logout</button>  
      </div>
    </header>
  );
};

export default Navbar;