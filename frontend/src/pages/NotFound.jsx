// src/pages/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = ({ user }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getHomeLink = () => {
    if (!user) return '/login';
    return user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="max-w-2xl w-full text-center">
        
        {/* 404 Illustration */}
        <div className="mb-8 relative" style={{
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out forwards'
        }}>
          <div 
            className="text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r leading-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #0C2B4E, #1a4d7a)'
            }}
          >
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-32 h-32 rounded-full animate-pulse"
              style={{ backgroundColor: 'rgba(12, 43, 78, 0.1)' }}
            ></div>
          </div>
        </div>

        {/* Message */}
        <div style={{
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out 0.2s forwards'
        }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#0C2B4E] dark:text-gray-100">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for seems to have wandered off. 
            Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={{
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out 0.4s forwards'
        }}>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200"
            style={{ 
              borderColor: '#0C2B4E',
              color: '#0C2B4E'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(12, 43, 78, 0.05)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Go Back
          </button>

          <Link
            to={getHomeLink()}
            className="px-6 py-3 text-white rounded-lg font-semibold shadow-lg flex items-center gap-2 transition-all duration-200"
            style={{ 
              backgroundColor: '#0C2B4E'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1a4d7a';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#0C2B4E';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Go to Home
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-sm mx-auto opacity-50" style={{
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out 0.6s forwards'
        }}>
          <div 
            className="h-2 rounded-full"
            style={{ backgroundColor: '#0C2B4E' }}
          ></div>
          <div 
            className="h-2 rounded-full"
            style={{ backgroundColor: '#1a4d7a' }}
          ></div>
          <div 
            className="h-2 rounded-full"
            style={{ backgroundColor: '#0C2B4E' }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;