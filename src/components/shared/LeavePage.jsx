// src/components/shared/LeavePage.jsx
import React, { useState } from 'react';
import { dummyData } from '../../data/dummyData';

const LeavePage = ({ user }) => {
  const employee = dummyData.employees.find(e => e.email === user.email);
  const [leaveRequests, setLeaveRequests] = useState(dummyData.leaveRequests); // Shared state for all requests
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Employee: Apply for leave
  const handleApplyLeave = () => {
    if (!startDate || !endDate || !reason) {
      alert('Please fill all fields.');
      return;
    }
    const newRequest = {
      id: leaveRequests.length + 1,
      employeeId: employee.id,
      employeeName: employee.name,
      startDate,
      endDate,
      reason,
      status: 'Pending',
    };
    setLeaveRequests([...leaveRequests, newRequest]);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  // Admin: Approve/Reject
  const handleApprove = (id) => {
    setLeaveRequests(requests =>
      requests.map(req => req.id === id ? { ...req, status: 'Approved' } : req)
    );
  };

  const handleReject = (id) => {
    setLeaveRequests(requests =>
      requests.map(req => req.id === id ? { ...req, status: 'Rejected' } : req)
    );
  };

  return (
    <div className="space-y-6">
      {user.role === 'Employee' ? (
        <>
          <h2 className="text-2xl font-bold">Apply for Leave</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Vacation"
                />
              </div>
            </div>
            <button
              onClick={handleApplyLeave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Apply Leave
            </button>
          </div>
          <h2 className="text-2xl font-bold">Your Leave Requests</h2>
          <table className="w-full bg-white rounded-lg shadow overflow-hidden">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-4 text-left">Start Date</th>
                <th className="p-4 text-left">End Date</th>
                <th className="p-4 text-left">Reason</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.filter(req => req.employeeId === employee.id).map(req => (
                <tr key={req.id} className="border-t">
                  <td className="p-4">{req.startDate}</td>
                  <td className="p-4">{req.endDate}</td>
                  <td className="p-4">{req.reason}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded ${
                      req.status === 'Approved' ? 'bg-green-200 text-green-800' :
                      req.status === 'Rejected' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Leave Requests</h2>
          <table className="w-full bg-white rounded-lg shadow overflow-hidden">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-4 text-left">Employee Name</th>
                <th className="p-4 text-left">Start Date</th>
                <th className="p-4 text-left">End Date</th>
                <th className="p-4 text-left">Reason</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(req => (
                <tr key={req.id} className="border-t">
                  <td className="p-4">{req.employeeName}</td>
                  <td className="p-4">{req.startDate}</td>
                  <td className="p-4">{req.endDate}</td>
                  <td className="p-4">{req.reason}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded ${
                      req.status === 'Approved' ? 'bg-green-200 text-green-800' :
                      req.status === 'Rejected' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 space-x-2">
                    {req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default LeavePage;