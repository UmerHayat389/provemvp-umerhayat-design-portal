import React, { useState } from 'react';
import { dummyData } from '../data/dummyData';
import { IoPersonCircle } from "react-icons/io5";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = dummyData.employees.find(
      (user) => user.email === email && user.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      setError('');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="mx-auto min-h-screen bg-[#0C2B4E] dark:bg-gray-950 flex items-center justify-center rounded-sm transition-colors duration-200">
      <section>
        <div className="flex bg-[#F5F2F2] dark:bg-gray-800 items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-8 rounded-lg transition-colors duration-200">
          <div className="xl:mx-auto xl:w-full shadow-md p-4 xl:max-w-sm 2xl:max-w-md">
            <div className="mb-2 flex justify-center" />
            <IoPersonCircle className='mx-auto w-14 h-14 mb-4 text-[#0C2B4E] dark:text-blue-400' />

            <h2 className="text-center text-2xl font-bold leading-tight text-[#0C2B4E] dark:text-gray-100">
              Welcome to ProveMVP
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Please Enter Email or Password / Admin or Employee?
            </p>

            <form className="mt-8" method="POST" onSubmit={handleLogin}>
              <div className="space-y-5">
                <div>
                  <label className="text-base font-medium text-gray-900 dark:text-gray-200">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      placeholder="Email"
                      type="email"
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-700 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
                      value={email}
                      onChange={handleEmailChange}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-900 dark:text-gray-200">
                      Password
                    </label>
                    <a
                      className="text-sm font-semibold text-black dark:text-gray-300 hover:underline"
                      title="Forgot password?"
                      href="#"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="mt-2">
                    <input
                      placeholder="Password"
                      type="password"
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-700 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
                      value={password}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 dark:text-red-400 text-center mt-2">{error}</p>
                )}

                <div>
                  <button
                    className="inline-flex w-full items-center justify-center rounded-md bg-[#0C2B4E] dark:bg-[#0C2B4E] px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-[#0a243d] dark:hover:bg-[#1a4d7a] transition-colors duration-200 shadow-lg"
                    type="submit"
                  >
                    Get started
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-3 space-y-3">
              <button
                className="relative inline-flex w-full items-center justify-center rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 font-semibold text-gray-700 dark:text-gray-200 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-black dark:hover:text-white focus:bg-gray-100 dark:focus:bg-gray-600 focus:text-black dark:focus:text-white focus:outline-none"
                type="button"
              >
                <span className="mr-2 inline-block">
                  <svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-rose-500"
                  >
                    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
                  </svg>
                </span>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;