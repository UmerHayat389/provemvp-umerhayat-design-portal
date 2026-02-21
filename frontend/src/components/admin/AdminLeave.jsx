// src/components/admin/AdminLeave.jsx
import React, { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import { FaCheck, FaTimes, FaClock, FaChevronDown } from "react-icons/fa";
import { leaveAPI } from "../../services/api";

const statusColors = {
  Approved: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  Rejected: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  Delayed:  "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  Pending:  "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
};

const dropdownColors = {
  Approved: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800",
  Rejected: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800",
  Delayed:  "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800",
};

const statusIcons = {
  Approved: <FaCheck className="inline mr-1.5" />,
  Rejected: <FaTimes className="inline mr-1.5" />,
  Delayed:  <FaClock className="inline mr-1.5" />,
  Pending:  null,
};

const AdminLeave = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");
      const res  = await leaveAPI.getLeaves();
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.leaves) ? res.data.leaves
        : [];

      const normalized = data.map((l) => ({
        id:           l._id,
        employeeName: l.userId?.name  || "Unknown",
        email:        l.userId?.email || "",
        startDate:    l.startDate ? new Date(l.startDate).toISOString().split("T")[0] : "—",
        endDate:      l.endDate   ? new Date(l.endDate).toISOString().split("T")[0]   : "—",
        reason:       l.leaveType || l.reason || "—",
        status:       l.status    || "Pending",
        days:         l.days      || "—",
      }));

      setLeaveRequests(normalized);
    } catch (err) {
      console.error("Fetch leaves error:", err);
      setError("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await leaveAPI.updateLeaveStatus(id, status);
      setLeaveRequests((prev) =>
        prev.map((req) => req.id === id ? { ...req, status } : req)
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems     = leaveRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(leaveRequests.length / itemsPerPage);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading leave requests...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchLeaves} className="mt-3 px-4 py-2 bg-[#0C2B4E] text-white rounded-lg text-sm hover:bg-[#0a243d] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 font-sans">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Leave Requests
      </h2>

      {leaveRequests.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg font-semibold">No leave requests yet</p>
          <p className="text-sm mt-1">Employees haven't submitted any leave requests</p>
        </div>
      )}

      {/* ── Desktop Table — w-full, no overflow-x, columns use % widths ── */}
      {leaveRequests.length > 0 && (
        <div className="hidden sm:block w-full shadow-md rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
          <table className="w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 rounded-xl">
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Employee", "Start Date", "End Date", "Reason", "Status", "Actions"].map((title) => (
                  <th key={title} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentItems.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{req.employeeName}</div>
                    {req.email && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{req.email}</div>}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{req.startDate}</td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{req.endDate}</td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 truncate">{req.reason}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center ${statusColors[req.status] || statusColors.Pending}`}>
                      {statusIcons[req.status]}{req.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Menu as="div" className="relative text-left">
                      <Menu.Button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm border border-gray-200 dark:border-gray-600 shadow-sm w-full justify-between">
                        Actions <FaChevronDown className="h-3 w-3" />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-20 animate-dropdownSlide">
                        <div className="py-1">
                          {["Approved", "Rejected", "Delayed"].map((statusOption) => (
                            <Menu.Item key={statusOption}>
                              {() => (
                                <button
                                  onClick={() => handleStatusChange(req.id, statusOption)}
                                  className={`flex items-center w-full px-3 py-2 text-sm rounded-md font-medium transition-all duration-200 ${dropdownColors[statusOption]}`}
                                >
                                  {statusIcons[statusOption]}{statusOption}
                                </button>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mobile Cards ── */}
      {leaveRequests.length > 0 && (
        <div className="sm:hidden flex flex-col gap-4">
          {currentItems.map((req) => (
            <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform">
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{req.employeeName}</h3>
                  {req.email && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{req.email}</p>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center flex-shrink-0 ${statusColors[req.status] || statusColors.Pending}`}>
                  {statusIcons[req.status]}{req.status}
                </span>
              </div>
              <div className="text-gray-700 dark:text-gray-300 text-sm mb-3 space-y-1">
                <div><span className="font-medium">Start: </span>{req.startDate}</div>
                <div><span className="font-medium">End: </span>{req.endDate}</div>
                <div><span className="font-medium">Reason: </span>{req.reason}</div>
              </div>
              <Menu as="div" className="relative text-left w-full">
                <Menu.Button className="flex justify-between items-center w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm border border-gray-200 dark:border-gray-600 shadow-sm">
                  Actions <FaChevronDown className="ml-2 h-4 w-4" />
                </Menu.Button>
                <Menu.Items className="absolute left-0 right-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-20 animate-dropdownSlide">
                  <div className="py-1">
                    {["Approved", "Rejected", "Delayed"].map((statusOption) => (
                      <Menu.Item key={statusOption}>
                        {() => (
                          <button
                            onClick={() => handleStatusChange(req.id, statusOption)}
                            className={`flex items-center w-full px-4 py-2 text-sm rounded-md font-medium transition-all duration-200 ${dropdownColors[statusOption]}`}
                          >
                            {statusIcons[statusOption]}{statusOption}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center mt-6 gap-2">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#0C2B4E] hover:text-white transition-all duration-200 transform hover:scale-105">
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button key={idx + 1} onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 rounded border transition-all duration-200 transform hover:scale-105 ${
                currentPage === idx + 1
                  ? "bg-[#0C2B4E] text-white border-[#0C2B4E] shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-[#0C2B4E] hover:text-white"
              }`}>
              {idx + 1}
            </button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#0C2B4E] hover:text-white transition-all duration-200 transform hover:scale-105">
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdownSlide { animation: dropdownSlide 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminLeave;