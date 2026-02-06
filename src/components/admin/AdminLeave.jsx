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

    leaveRequests.push({
      id: i,
      employeeName,
      startDate: formatDate(start),
      endDate: formatDate(end),
      reason,
      status: "Pending",
    });
  }

  return leaveRequests;
};

const statusColors = {
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
  Delayed: "bg-yellow-50 text-yellow-700",
  Pending: "bg-blue-50 text-blue-700",
};

const dropdownColors = {
  Approved: "bg-green-100 text-green-800 hover:bg-green-200",
  Rejected: "bg-red-100 text-red-800 hover:bg-red-200",
  Delayed: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
};

const statusIcons = {
  Approved: <FaCheck className="inline mr-2" />,
  Rejected: <FaTimes className="inline mr-2" />,
  Delayed: <FaClock className="inline mr-2" />,
  Pending: null,
};

const AdminLeave = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLeaveRequests(generateLeaveRequests());
  }, []);

  const handleStatusChange = (id, status) => {
    setLeaveRequests((requests) =>
      requests.map((req) => (req.id === id ? { ...req, status } : req))
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaveRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaveRequests.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 font-sans">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Leave Requests
      </h2>

      {/* Table for large screens */}
      <div className="hidden sm:block overflow-x-auto w-full shadow-md rounded-xl border border-gray-200">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Employee Name",
                "Start Date",
                "End Date",
                "Reason",
                "Status",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentItems.map((req) => (
              <tr
                key={req.id}
                className="hover:bg-gray-50 transition duration-200"
              >
                <td className="px-4 py-3 text-gray-900">{req.employeeName}</td>
                <td className="px-4 py-3 text-gray-700">{req.startDate}</td>
                <td className="px-4 py-3 text-gray-700">{req.endDate}</td>
                <td className="px-4 py-3 text-gray-700">{req.reason}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center w-28 ${statusColors[req.status]}`}
                  >
                    {statusIcons[req.status]}
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Menu as="div" className="relative inline-block text-left w-full">
                    <Menu.Button className="flex justify-between items-center w-full px-3 py-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition duration-200 font-medium text-sm border border-gray-200 shadow-sm">
                      Actions <FaChevronDown className="ml-2 h-4 w-4" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        {["Approved", "Rejected", "Delayed"].map((statusOption) => (
                          <Menu.Item key={statusOption}>
                            {({ active }) => (
                              <button
                                onClick={() => handleStatusChange(req.id, statusOption)}
                                className={`flex items-center w-full px-4 py-2 text-sm rounded-md font-medium transition duration-150 ${dropdownColors[statusOption]}`}
                              >
                                {statusIcons[statusOption]}
                                {statusOption}
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

      {/* Mobile card view */}
      <div className="sm:hidden flex flex-col gap-4">
        {currentItems.map((req) => (
          <div key={req.id} className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">{req.employeeName}</h3>
              <span className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[req.status]}`}>
                {statusIcons[req.status]}
                {req.status}
              </span>
            </div>
            <div className="text-gray-700 text-sm mb-2">
              <div>
                <span className="font-medium">Start: </span>{req.startDate}
              </div>
              <div>
                <span className="font-medium">End: </span>{req.endDate}
              </div>
              <div>
                <span className="font-medium">Reason: </span>{req.reason}
              </div>
            </div>
            <Menu as="div" className="relative inline-block text-left w-full">
              <Menu.Button className="flex justify-between items-center w-full px-3 py-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition duration-200 font-medium text-sm border border-gray-200 shadow-sm">
                Actions <FaChevronDown className="ml-2 h-4 w-4" />
              </Menu.Button>
              <Menu.Items className="absolute left-0 right-0 mt-2 w-full bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {["Approved", "Rejected", "Delayed"].map((statusOption) => (
                    <Menu.Item key={statusOption}>
                      {({ active }) => (
                        <button
                          onClick={() => handleStatusChange(req.id, statusOption)}
                          className={`flex items-center w-full px-4 py-2 text-sm rounded-md font-medium transition duration-150 ${dropdownColors[statusOption]}`}
                        >
                          {statusIcons[statusOption]}
                          {statusOption}
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

      {/* Pagination */}
      <div className="flex flex-wrap justify-center mt-6 gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-blue-500 hover:text-white transition transform hover:scale-105"
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded border ${
              currentPage === idx + 1
                ? "bg-[#0C2B4E] text-white border-[#0C2B4E] scale-105"
                : "bg-white text-gray-700 border-gray-300 hover:bg-[#0C2B4E] hover:text-white hover:scale-105"
            } transition transform`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-[#0C2B4E] hover:text-white transition transform hover:scale-105"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminLeave;