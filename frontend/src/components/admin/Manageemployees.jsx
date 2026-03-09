// src/components/admin/ManageEmployees.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  FaPlus, FaTimes, FaEdit, FaTrash, FaSearch,
  FaUser, FaEnvelope, FaPhone, FaBriefcase, FaDollarSign, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { userAPI } from '../../services/api';

const POSITIONS = ['Admin', 'Employee'];

const DEPARTMENTS = [
  'Engineering',
  'UI/UX Design',
  'Operations',
];

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 rounded-lg border-2 text-sm ${
    hasError ? 'border-red-500' : 'border-gray-300 dark:border-[#4a6080]'
  } bg-white dark:bg-[#2a3a4f] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
   focus:outline-none focus:ring-2 focus:ring-[#0C2B4E] dark:focus:ring-blue-400 transition-all
   [&>option]:bg-white [&>option]:dark:bg-[#1e2a3a] [&>option]:text-gray-900 [&>option]:dark:text-gray-100
   [&>option:hover]:bg-[#0C2B4E]/10 [&>option:checked]:bg-[#0C2B4E]/20`;

const ManageEmployees = () => {
  const [employees, setEmployees]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(''); // ← FIX: track fetch errors
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [submitError, setSubmitError]     = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [formData, setFormData] = useState({
    name:       '',
    email:      '',
    password:   '',
    department: '',
    position:   'Employee',
    salary:     '',
    phone:      '',
    address:    '',
    hireDate:   new Date().toISOString().split('T')[0],
    shiftType:  'day',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setFetchError(''); // ← FIX: clear previous error on retry
      const response = await userAPI.getUsers();
      const data = response.data;
      let allUsers = [];
      if (Array.isArray(data))             allUsers = data;
      else if (Array.isArray(data?.users)) allUsers = data.users;
      else if (Array.isArray(data?.data))  allUsers = data.data;
      else { console.warn('Unexpected response shape:', data); allUsers = []; }
      
      // Filter to show only employees, not admins
      const employeesOnly = allUsers.filter(user => 
        user.role !== 'admin' && 
        user.position !== 'Admin' &&
        user.role !== 'Admin'
      );
      setEmployees(employeesOnly);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      // ← FIX: show meaningful error so user knows backend is down
      if (!error.response) {
        setFetchError('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else {
        setFetchError(error.response?.data?.message || 'Failed to load employees. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && value.length > 15) return;
    if (name === 'phone') {
      if (value !== '' && !/^[0-9+\-\s()]*$/.test(value)) return;
      if (value.length > 15) return;
    }
    if (name === 'address' && value.length > 100) return;
    if (name === 'salary' && value !== '' && Number(value) < 0) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError('');
  };

  const validateForm = () => {
    const errors = {};
    const name = formData.name.trim();
    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length > 15) {
      errors.name = 'Name must be 15 characters or fewer';
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    const email = formData.email.trim();
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.email = 'Enter a valid email address (e.g. john@company.com)';
    }
    if (!editingEmployee || formData.password) {
      const password = formData.password;
      if (!password) {
        errors.password = ['Password is required'];
      } else {
        const passwordErrors = [];
        if (password.length < 6)
          passwordErrors.push('At least 6 characters');
        if (!/[A-Z]/.test(password))
          passwordErrors.push('At least 1 uppercase letter');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
          passwordErrors.push('At least 1 special character');
        if (passwordErrors.length > 0) errors.password = passwordErrors;
      }
    }
    if (!formData.department)
      errors.department = 'Department is required';
    if (!formData.position)
      errors.position = 'Position is required';
    if (!formData.shiftType)
      errors.shiftType = 'Shift type is required';
    if (formData.salary !== '' && formData.salary !== undefined) {
      const sal = Number(formData.salary);
      if (isNaN(sal) || sal <= 0) {
        errors.salary = 'Salary must be a number greater than 0';
      }
    }
    if (formData.phone && formData.phone.trim() !== '') {
      const digits = formData.phone.replace(/[^0-9]/g, '');
      if (digits.length < 7) {
        errors.phone = 'Phone number must have at least 7 digits';
      } else if (digits.length > 15) {
        errors.phone = 'Phone number must have at most 15 digits';
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    try {
      const submitData = { ...formData };
      if (editingEmployee && !submitData.password) delete submitData.password;
      if (editingEmployee) await userAPI.updateUser(editingEmployee._id, submitData);
      else                 await userAPI.createUser(submitData);
      await fetchEmployees();
      closeModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      if (!error.response) {
        setSubmitError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setSubmitError(error.response?.data?.message || 'Error saving employee. Please try again.');
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name:       employee.name       || '',
      email:      employee.email      || '',
      password:   '',
      department: employee.department || '',
      position:   employee.position   || 'Employee',
      salary:     employee.salary     || '',
      phone:      employee.phone      || '',
      address:    employee.address    || '',
      hireDate:   employee.hireDate
                    ? new Date(employee.hireDate).toISOString().split('T')[0]
                    : '',
      shiftType:  employee.shiftType  || 'day',
    });
    setFormErrors({});
    setSubmitError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await userAPI.deleteUser(id);
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(error.response?.data?.message || 'Error deleting employee');
    }
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name:       '',
      email:      '',
      password:   '',
      department: '',
      position:   'Employee',
      salary:     '',
      phone:      '',
      address:    '',
      hireDate:   new Date().toISOString().split('T')[0],
      shiftType:  'day',
    });
    setFormErrors({});
    setSubmitError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormErrors({});
    setSubmitError('');
    setShowPassword(false);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-lg">Loading employees...</span>
        </div>
      </div>
    );
  }

  // ← FIX: show error screen with retry button if fetch failed
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold text-base mb-1">Failed to load employees</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{fetchError}</p>
          <button
            onClick={fetchEmployees}
            className="px-5 py-2.5 bg-[#0C2B4E] dark:bg-[#1a4d7a] text-white text-sm font-semibold rounded-lg hover:bg-[#0a243d] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Manage Employees
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {employees.length} employee{employees.length !== 1 ? 's' : ''} in your organization
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-[#0C2B4E] dark:bg-[#1a4d7a] text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-[#0a243d] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3 h-3" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#4a6080] bg-white dark:bg-[#2a3a4f] text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0C2B4E] dark:focus:ring-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Table — desktop / Card list — mobile */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Employee', 'Department', 'Position', 'Shift', 'Salary', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0C2B4E] dark:bg-[#1a4d7a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {employee.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{employee.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{employee.department || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          (employee.position === 'Admin' || employee.role === 'admin')
                            ? 'bg-[#0C2B4E]/10 dark:bg-[#1a4d7a]/40 text-[#0C2B4E] dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {(() => {
                            const pos = employee.position || employee.role || '—';
                            return pos === '—' ? pos : pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();
                          })()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          employee.shiftType === 'night'
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        }`}>
                          {employee.shiftType === 'night' ? '🌙 Night' : '☀️ Day'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${employee.salary?.toLocaleString() || '0'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(employee)} className="p-2 text-[#0C2B4E] dark:text-blue-400 hover:bg-[#0C2B4E]/10 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(employee._id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center">
                      <FaUser className="mx-auto w-8 h-8 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No employees match your search' : 'No employees found'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {searchTerm ? 'Try a different search term' : 'Click "Add Employee" to get started'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <div key={employee._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#0C2B4E] dark:bg-[#1a4d7a] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {employee.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{employee.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(employee)} className="p-2 text-[#0C2B4E] dark:text-blue-400 hover:bg-[#0C2B4E]/10 rounded-lg transition-colors">
                        <FaEdit className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(employee._id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                      {employee.department || '—'}
                    </span>
                    <span className={`px-2 py-1 rounded-md font-medium ${
                      (employee.position === 'Admin' || employee.role === 'admin')
                        ? 'bg-[#0C2B4E]/10 dark:bg-[#1a4d7a]/40 text-[#0C2B4E] dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {(() => {
                        const pos = employee.position || employee.role || '—';
                        return pos === '—' ? pos : pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();
                      })()}
                    </span>
                    <span className={`px-2 py-1 rounded-md font-medium ${
                      employee.shiftType === 'night'
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {employee.shiftType === 'night' ? '🌙 Night' : '☀️ Day'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                      ${employee.salary?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-14 text-center">
                <FaUser className="mx-auto w-8 h-8 mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No results found' : 'No employees yet'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {searchTerm ? 'Try a different term' : 'Tap "Add Employee" to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-xl bg-white dark:bg-[#1e2a3a] shadow-2xl transition-all border-0 sm:border border-gray-200 dark:border-gray-700">

                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#162030]">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden" />
                    <Dialog.Title className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-2 sm:mt-0">
                      {editingEmployee ? '✏️ Edit Employee' : '➕ Add New Employee'}
                    </Dialog.Title>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 mt-2 sm:mt-0"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6 max-h-[80vh] sm:max-h-none overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                      {/* Name */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          <FaUser className="inline mr-1.5" />Full Name *
                          <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">(max 15 chars)</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          maxLength={15}
                          className={inputClass(formErrors.name)}
                          placeholder="Enter Name"
                        />
                        <div className="flex justify-between items-center mt-0.5">
                          {formErrors.name
                            ? <p className="text-red-500 text-xs">{formErrors.name}</p>
                            : <span />
                          }
                          <p className={`text-xs ml-auto ${formData.name.length >= 13 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                            {formData.name.length}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          <FaEnvelope className="inline mr-1.5" />Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!!editingEmployee}
                          className={inputClass(formErrors.email) + (editingEmployee ? ' opacity-50 cursor-not-allowed' : '')}
                          placeholder="email@example.com"
                        />
                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                      </div>

                      {/* Password */}
                      {!editingEmployee && (
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={inputClass(formErrors.password) + ' pr-10'}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                            </button>
                          </div>
                          {formErrors.password && (
                            <div className="mt-1 space-y-0.5">
                              {Array.isArray(formErrors.password) ? (
                                formErrors.password.map((err, idx) => (
                                  <p key={idx} className="text-red-500 text-xs flex items-center gap-1">
                                    <span className="text-red-500">•</span> {err}
                                  </p>
                                ))
                              ) : (
                                <p className="text-red-500 text-xs">{formErrors.password}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Position */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          <FaBriefcase className="inline mr-1.5" />Position *
                        </label>
                        <select
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          className={inputClass(formErrors.position)}
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="" disabled>Select position...</option>
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {formErrors.position && <p className="text-red-500 text-xs mt-1">{formErrors.position}</p>}
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          Department *
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className={inputClass(formErrors.department)}
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="" disabled>Select department...</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {formErrors.department && <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>}
                      </div>

                      {/* Shift Type */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          Shift Type *
                        </label>
                        <select
                          name="shiftType"
                          value={formData.shiftType}
                          onChange={handleInputChange}
                          className={inputClass(formErrors.shiftType)}
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="day">☀️ Day Shift (08:00 AM – 05:00 PM PKT)</option>
                          <option value="night">🌙 Night Shift (08:00 PM – 05:00 AM PKT)</option>
                        </select>
                        {formErrors.shiftType && <p className="text-red-500 text-xs mt-1">{formErrors.shiftType}</p>}
                      </div>

                      {/* Salary */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          <FaDollarSign className="inline mr-1.5" />Salary
                        </label>
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          min="1"
                          className={inputClass(formErrors.salary)}
                          placeholder=""
                        />
                        {formErrors.salary && <p className="text-red-500 text-xs mt-1">{formErrors.salary}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          <FaPhone className="inline mr-1.5" />Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={inputClass(formErrors.phone)}
                          placeholder=""
                        />
                        {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                      </div>

                      {/* Hire Date */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          Hire Date
                        </label>
                        <input
                          type="date"
                          name="hireDate"
                          value={formData.hireDate}
                          onChange={handleInputChange}
                          className={inputClass(false)}
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>

                      {/* Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                          Address
                          <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">(max 100 chars)</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          maxLength={100}
                          rows="2"
                          className={inputClass(false) + ' resize-none'}
                          placeholder="Enter Address"
                        />
                        <p className={`text-xs text-right mt-0.5 ${formData.address.length >= 90 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                          {formData.address.length}/100
                        </p>
                      </div>
                    </div>

                    {/* Submit error */}
                    {submitError && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{submitError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-[#0C2B4E] dark:bg-[#1a4d7a] text-white text-sm font-semibold rounded-lg hover:bg-[#0a243d] dark:hover:bg-[#0C2B4E] transition-colors shadow-lg"
                      >
                        {editingEmployee ? 'Update Employee' : 'Create Employee'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <style>{`
        select option:hover,
        select option:focus,
        select option:active {
          background-color: #0C2B4E !important;
          color: white !important;
        }
        .dark select option:hover,
        .dark select option:focus,
        .dark select option:active {
          background-color: #1a4d7a !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default ManageEmployees;