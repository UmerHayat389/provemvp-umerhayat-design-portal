import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  FaPlus, FaTimes, FaClock, FaCalendarAlt, FaHistory,
  FaChartLine, FaExclamationCircle, FaCheckCircle,
  FaTimesCircle, FaHourglassHalf, FaPaperPlane,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { leaveAPI } from "../../services/api";

const statusConfig = {
  Approved: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-700",
    icon: <FaCheckCircle className="w-3.5 h-3.5" />,
  },
  Rejected: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
    icon: <FaTimesCircle className="w-3.5 h-3.5" />,
  },
  Delayed: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
    icon: <FaHourglassHalf className="w-3.5 h-3.5" />,
  },
  Pending: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    icon: <FaClock className="w-3.5 h-3.5" />,
  },
};

const EmployeeLeave = () => {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitError, setSubmitError]   = useState("");
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    startDate: "", endDate: "", reason: "",
    leaveType: "Sick Leave", description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ── Fetch employee's own leave history on mount ──────────────────────────────
  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res  = await leaveAPI.getMyLeaves();
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.leaves) ? res.data.leaves
        : [];

      // Normalize DB records to match shape the UI expects
      const normalized = data.map((l) => ({
        id:        l._id,
        startDate: l.startDate ? new Date(l.startDate).toISOString().split("T")[0] : "",
        endDate:   l.endDate   ? new Date(l.endDate).toISOString().split("T")[0]   : "",
        reason:    l.leaveType || l.reason || "—",
        status:    l.status    || "Pending",
        appliedOn: l.createdAt ? new Date(l.createdAt).toISOString().split("T")[0] : "",
        days:      l.days      || 1,
      }));

      setLeaveHistory(normalized);
    } catch (err) {
      console.error("Fetch leaves error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.startDate)   errors.startDate   = "Start date is required";
    if (!formData.endDate)     errors.endDate     = "End date is required";
    if (!formData.reason)      errors.reason      = "Reason is required";
    if (!formData.description) errors.description = "Description is required";
    if (formData.startDate && formData.endDate &&
        new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = "End date must be after start date";
    }
    return errors;
  };

  // ── Submit leave request to API ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    try {
      setSubmitError("");
      await leaveAPI.applyLeave({
        leaveType:   formData.leaveType,
        startDate:   formData.startDate,
        endDate:     formData.endDate,
        reason:      formData.reason,
        description: formData.description,
      });

      // Refresh list from DB
      await fetchMyLeaves();
      setIsModalOpen(false);
      setFormData({ startDate: "", endDate: "", reason: "", leaveType: "Sick Leave", description: "" });
      setFormErrors({});
    } catch (err) {
      console.error("Submit leave error:", err);
      setSubmitError(err.response?.data?.message || "Failed to submit leave request. Please try again.");
    }
  };

  // ── Stats computed from real DB data ─────────────────────────────────────────
  const getLeaveStats = () => {
    const currentYear = new Date().getFullYear();
    const thisYear    = leaveHistory.filter((l) => new Date(l.startDate).getFullYear() === currentYear);
    return {
      total:     thisYear.reduce((sum, l) => sum + (l.days || 0), 0),
      pending:   leaveHistory.filter((l) => l.status === "Pending").length,
      approved:  leaveHistory.filter((l) => l.status === "Approved").length,
      remaining: Math.max(0, 20 - thisYear.reduce((sum, l) => sum + (l.days || 0), 0)),
    };
  };

  const stats            = getLeaveStats();
  const indexOfLastItem  = currentPage * itemsPerPage;
  const currentItems     = leaveHistory.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);
  const totalPages       = Math.ceil(leaveHistory.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-3 sm:p-4 md:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              Leave Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track and manage your leave requests
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0C2B4E] dark:bg-[#0C2B4E] text-white text-sm font-medium rounded-lg hover:bg-[#0a243d] dark:hover:bg-[#1a4d7a] transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <FaPlus className="w-4 h-4" /> New Request
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Days Taken",  value: stats.total,     icon: FaCalendarAlt,  color: "blue"   },
            { label: "Remaining",   value: stats.remaining, icon: FaChartLine,    color: "emerald" },
            { label: "Pending",     value: stats.pending,   icon: FaClock,        color: "amber"  },
            { label: "Approved",    value: stats.approved,  icon: FaCheckCircle,  color: "violet" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 md:p-5 transition-all duration-300"
              style={{ opacity: 0, animation: `fadeIn 0.5s ease-out ${i * 100}ms forwards` }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.15)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                    {stat.label}
                  </p>
                  <p className={`text-xl sm:text-2xl md:text-3xl font-semibold mt-1 sm:mt-2 truncate text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {loading ? "—" : stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-${stat.color}-50 dark:bg-${stat.color}-900/30 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leave History Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave History</h2>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading leave history...
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {["Applied", "Period", "Type", "Duration", "Status"].map(th => (
                        <th key={th} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {th}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.length > 0 ? currentItems.map((leave) => {
                      const statusStyle = statusConfig[leave.status] || statusConfig.Pending;
                      return (
                        <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{leave.appliedOn}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{leave.startDate} — {leave.endDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{leave.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium">
                              {leave.days} {leave.days === 1 ? "day" : "days"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {statusStyle.icon} {leave.status}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <FaHistory className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No leave history</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You haven't applied for any leave yet</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="block lg:hidden">
                {currentItems.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.map((leave) => {
                      const statusStyle = statusConfig[leave.status] || statusConfig.Pending;
                      return (
                        <div key={leave.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} flex-shrink-0`}>
                              {statusStyle.icon} {leave.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{leave.appliedOn}</span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Period</span>
                              <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium text-right">
                                {leave.startDate} — {leave.endDate}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Type</span>
                              <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">{leave.reason}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Duration</span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium">
                                {leave.days} {leave.days === 1 ? "day" : "days"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <FaHistory className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No leave history</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Showing {indexOfLastItem - itemsPerPage + 1} to {Math.min(indexOfLastItem, leaveHistory.length)} of {leaveHistory.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronLeft className="w-3 h-3" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </button>
                      <div className="flex sm:hidden items-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                        {currentPage} / {totalPages}
                      </div>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <FaChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-full sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:scale-95">
                <Dialog.Panel className="w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all max-h-[95vh] sm:max-h-[90vh] flex flex-col">

                  <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <Dialog.Title className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Apply for Leave
                    </Dialog.Title>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Type</label>
                        <select name="leaveType" value={formData.leaveType} onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                          <option>Sick Leave</option>
                          <option>Vacation</option>
                          <option>Personal</option>
                          <option>Family</option>
                          <option>Medical</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                          <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.startDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`} />
                          {formErrors.startDate && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle className="w-3 h-3" />{formErrors.startDate}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                          <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.endDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`} />
                          {formErrors.endDate && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle className="w-3 h-3" />{formErrors.endDate}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                        <input type="text" name="reason" value={formData.reason} onChange={handleInputChange} placeholder="Brief reason for leave"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${formErrors.reason ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`} />
                        {formErrors.reason && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle className="w-3 h-3" />{formErrors.reason}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Provide detailed information..."
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C2B4E] focus:border-transparent outline-none transition-all resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${formErrors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`} />
                        {formErrors.description && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaExclamationCircle className="w-3 h-3" />{formErrors.description}</p>}
                      </div>

                      {submitError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <button type="button" onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                      </button>
                      <button type="submit"
                        className="flex-1 px-4 py-2.5 bg-[#0C2B4E] text-white text-sm font-medium rounded-lg hover:bg-[#0a243d] dark:hover:bg-[#1a4d7a] transition-colors inline-flex items-center justify-center gap-2">
                        <FaPaperPlane className="w-3.5 h-3.5" /> Submit
                      </button>
                    </div>
                  </form>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeLeave;