import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  FaPlus,
  FaTimes,
  FaCheck,
  FaClock,
  FaCalendarAlt,
  FaFileAlt,
  FaHistory,
  FaChartLine,
  FaUser,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaPaperPlane,
  FaClipboardList,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

/* ---------------- Dummy Data ---------------- */
const generateEmployeeLeaveHistory = () => {
  const reasons = ["Medical", "Vacation", "Personal", "Family", "Sick Leave"];
  const statuses = ["Approved", "Rejected", "Pending", "Delayed"];
  const leaveHistory = [];

  for (let i = 1; i <= 15; i++) {
    const start = new Date();
    start.setDate(start.getDate() - Math.floor(Math.random() * 60));
    const end = new Date(start);
    end.setDate(start.getDate() + Math.floor(Math.random() * 5) + 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    leaveHistory.push({
      id: i,
      startDate: formatDate(start),
      endDate: formatDate(end),
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      appliedOn: formatDate(
        new Date(start.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      ),
      days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    });
  }

  return leaveHistory.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
};

/* ---------------- UI Helpers ---------------- */
const statusConfig = {
  Approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <FaCheckCircle className="w-3.5 h-3.5" />,
  },
  Rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: <FaTimesCircle className="w-3.5 h-3.5" />,
  },
  Delayed: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <FaHourglassHalf className="w-3.5 h-3.5" />,
  },
  Pending: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: <FaClock className="w-3.5 h-3.5" />,
  },
};

/* ---------------- Component ---------------- */
const EmployeeLeave = () => {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    leaveType: "Sick Leave",
    description: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setLeaveHistory(generateEmployeeLeaveHistory());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (!formData.reason) errors.reason = "Reason is required";
    if (!formData.description) errors.description = "Description is required";
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = "End date must be after start date";
      }
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newLeave = {
      id: leaveHistory.length + 1,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.leaveType,
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
      days: Math.ceil(
        (new Date(formData.endDate) - new Date(formData.startDate)) /
          (1000 * 60 * 60 * 24)
      ) + 1,
    };

    setLeaveHistory([newLeave, ...leaveHistory]);
    setIsModalOpen(false);
    
    // Reset form
    setFormData({
      startDate: "",
      endDate: "",
      reason: "",
      leaveType: "Sick Leave",
      description: "",
    });
    setFormErrors({});
  };

  const getLeaveStats = () => {
    const currentYear = new Date().getFullYear();
    const thisYearLeaves = leaveHistory.filter(
      (l) => new Date(l.startDate).getFullYear() === currentYear
    );

    return {
      total: thisYearLeaves.reduce((sum, l) => sum + l.days, 0),
      pending: leaveHistory.filter((l) => l.status === "Pending").length,
      approved: leaveHistory.filter((l) => l.status === "Approved").length,
      remaining: 20 - thisYearLeaves.reduce((sum, l) => sum + l.days, 0),
    };
  };

  const stats = getLeaveStats();

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = leaveHistory.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );
  const totalPages = Math.ceil(leaveHistory.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 truncate">
              Leave Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Track and manage your leave requests
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0C2B4E] text-white text-sm font-medium rounded-lg hover:bg-[#0a243d] transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <FaPlus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Taken */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                  Days Taken
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mt-1 sm:mt-2 truncate">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">This year</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                  Remaining
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-600 mt-1 sm:mt-2 truncate">
                  {stats.remaining}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Days left</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                  Pending
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-600 mt-1 sm:mt-2 truncate">
                  {stats.pending}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Awaiting</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Approved */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                  Approved
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-violet-600 mt-1 sm:mt-2 truncate">
                  {stats.approved}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Total</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Leave History Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Leave History</h2>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((leave) => {
                    const statusStyle = statusConfig[leave.status];
                    return (
                      <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {leave.appliedOn}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {leave.startDate} — {leave.endDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {leave.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-sm font-medium">
                            {leave.days} {leave.days === 1 ? "day" : "days"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {statusStyle.icon}
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <FaHistory className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No leave history</p>
                          <p className="text-sm text-gray-500 mt-1">
                            You haven't applied for any leave yet
                          </p>
                        </div>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#0C2B4E] text-white text-sm font-medium rounded-lg hover:bg-[#0a243d] transition-colors"
                        >
                          <FaPlus className="w-4 h-4" />
                          Apply Now
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {currentItems.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {currentItems.map((leave) => {
                  const statusStyle = statusConfig[leave.status];
                  return (
                    <div key={leave.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} flex-shrink-0`}>
                          {statusStyle.icon}
                          {leave.status}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {leave.appliedOn}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">Period</span>
                          <span className="text-xs sm:text-sm text-gray-900 font-medium text-right break-words">
                            {leave.startDate} — {leave.endDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">Type</span>
                          <span className="text-xs sm:text-sm text-gray-900 truncate">{leave.reason}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">Duration</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium flex-shrink-0">
                            {leave.days} {leave.days === 1 ? "day" : "days"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-12 sm:px-6 sm:py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaHistory className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">No leave history</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      You haven't applied for any leave yet
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#0C2B4E] text-white text-sm font-medium rounded-lg hover:bg-[#0a243d] transition-colors"
                  >
                    <FaPlus className="w-4 h-4" />
                    Apply Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Showing {indexOfLastItem - itemsPerPage + 1} to{" "}
                  {Math.min(indexOfLastItem, leaveHistory.length)} of{" "}
                  {leaveHistory.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  
                  <div className="hidden sm:flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? "bg-[#0C2B4E] text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={i} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  {/* Mobile page indicator */}
                  <div className="flex sm:hidden items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                    {currentPage} / {totalPages}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-full sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-full sm:scale-95"
              >
                <Dialog.Panel className="w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-xl bg-white shadow-xl transition-all max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <Dialog.Title className="text-base sm:text-lg font-semibold text-gray-900">
                      Apply for Leave
                    </Dialog.Title>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body - Scrollable */}
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                      {/* Leave Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave Type
                        </label>
                        <select
                          name="leaveType"
                          value={formData.leaveType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm"
                        >
                          <option>Sick Leave</option>
                          <option>Vacation</option>
                          <option>Personal</option>
                          <option>Family</option>
                          <option>Medical</option>
                        </select>
                      </div>

                      {/* Date Range */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm ${
                              formErrors.startDate ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formErrors.startDate && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
                              <span>{formErrors.startDate}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm ${
                              formErrors.endDate ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formErrors.endDate && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
                              <span>{formErrors.endDate}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason
                        </label>
                        <input
                          type="text"
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          placeholder="Brief reason for leave"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm ${
                            formErrors.reason ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {formErrors.reason && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{formErrors.reason}</span>
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Provide detailed information..."
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all resize-none text-sm ${
                            formErrors.description ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {formErrors.description && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{formErrors.description}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Sticky Footer */}
                    <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-[#0C2B4E] text-white text-sm font-medium rounded-lg hover:bg-[#0a243d] transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <FaPaperPlane className="w-3.5 h-3.5" />
                        Submit
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default EmployeeLeave;