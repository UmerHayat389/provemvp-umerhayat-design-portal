import React, { useState } from 'react';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Dummy logic: Check email suffix
    if (email.endsWith('@employee')) {
      const employee = { name: email.split('@')[0], email, role: 'Employee' };
      setUser(employee);
    } else if (email === 'abdurrehman@admin') {
      setUser({ name: 'Abdurrehman', email, role: 'Admin' });
    } else {
      setError('Invalid email. Use umer@employee, faizan@employee, or abdurrehman@admin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;