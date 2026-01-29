// src/components/admin/AdminLeave.jsx
import React from 'react';

const AdminLeave = ({ leaveRequests, setLeaveRequests }) => {
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
    </div>
  );
};

export default AdminLeave;