// src/components/admin/AdminLeave.jsx
import React, { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import { FaCheck, FaTimes, FaClock, FaChevronDown } from "react-icons/fa";

const generateLeaveRequests = () => {
  const employees = ["Umer", "Ahmed", "Ali"];
  const reasons = ["Medical", "Vacation", "Personal", "Family", "Sick Leave"];
  const leaveRequests = [];

  for (let i = 1; i <= 30; i++) {
    const employeeName = employees[Math.floor(Math.random() * employees.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const start = new Date();
    start.setDate(start.getDate() + Math.floor(Math.random() * 30));
    const end = new Date(start);
    end.setDate(start.getDate() + Math.floor(Math.random() * 5) + 1);
    const formatDate = (date) => date.toISOString().split("T")[0];
    leaveRequests.push({ id: i, employeeName, startDate: formatDate(start), endDate: formatDate(end), reason, status: "Pending" });
  }
  return leaveRequests;
};

const statusColors = {
  Approved: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  Rejected:  "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  Delayed:   "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  Pending:   "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
};

const dropdownColors = {
  Approved: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800",
  Rejected:  "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800",
  Delayed:   "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800",
};

const statusIcons = {
  Approved: <FaCheck className="inline mr-2" />,
  Rejected:  <FaTimes className="inline mr-2" />,
  Delayed:   <FaClock className="inline mr-2" />,
  Pending:   null,
};

const AdminLeave = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { setLeaveRequests(generateLeaveRequests()); }, []);

  const handleStatusChange = (id, status) => {
    setLeaveRequests((requests) =>
      requests.map((req) => (req.id === id ? { ...req, status } : req))
    );
  };

  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems     = leaveRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(leaveRequests.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 font-sans">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Leave Requests
      </h2>

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block overflow-x-auto w-full shadow-md rounded-xl border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg">
        <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {["Employee Name","Start Date","End Date","Reason","Status","Actions"].map((title) => (
                <th key={title} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {currentItems.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{req.employeeName}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{req.startDate}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{req.endDate}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{req.reason}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center w-28 transition-all duration-200 ${statusColors[req.status]}`}>
                    {statusIcons[req.status]}{req.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Menu as="div" className="relative inline-block text-left w-full">
                    <Menu.Button className="flex justify-between items-center w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm border border-gray-200 dark:border-gray-600 shadow-sm">
                      Actions <FaChevronDown className="ml-2 h-4 w-4" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg z-10 animate-dropdownSlide">
                      <div className="py-1">
                        {["Approved","Rejected","Delayed"].map((statusOption) => (
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="sm:hidden flex flex-col gap-4">
        {currentItems.map((req) => (
          <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{req.employeeName}</h3>
              <span className={`px-2 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${statusColors[req.status]}`}>
                {statusIcons[req.status]}{req.status}
              </span>
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-sm mb-2">
              <div><span className="font-medium">Start: </span>{req.startDate}</div>
              <div><span className="font-medium">End: </span>{req.endDate}</div>
              <div><span className="font-medium">Reason: </span>{req.reason}</div>
            </div>
            <Menu as="div" className="relative inline-block text-left w-full">
              <Menu.Button className="flex justify-between items-center w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm border border-gray-200 dark:border-gray-600 shadow-sm">
                Actions <FaChevronDown className="ml-2 h-4 w-4" />
              </Menu.Button>
              <Menu.Items className="absolute left-0 right-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg z-10 animate-dropdownSlide">
                <div className="py-1">
                  {["Approved","Rejected","Delayed"].map((statusOption) => (
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

      {/* ── Pagination ── */}
      <div className="flex flex-wrap justify-center mt-6 gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white transition-all duration-200 transform hover:scale-105"
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded border transition-all duration-200 transform hover:scale-105
              ${currentPage === idx + 1
                ? "bg-[#0C2B4E] dark:bg-[#0C2B4E] text-white border-[#0C2B4E] scale-105 shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-[#0C2B4E] dark:hover:bg-[#0C2B4E] hover:text-white"
              }`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#0C2B4E] dark:hover:bg-[#0C2B4E] hover:text-white transition-all duration-200 transform hover:scale-105"
        >
          Next
        </button>
      </div>

      {/* ✅ Animation keyframes */}
      <style jsx>{`
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-dropdownSlide {
          animation: dropdownSlide 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLeave;