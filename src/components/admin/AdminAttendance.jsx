// src/components/admin/AdminAttendance.jsx
import React, { useState } from 'react';
import Calendar from '../common/Calendar';

const AdminAttendance = ({ attendance, setAttendance }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const monthData = attendance[`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`] || {};

  const handleDateClick = (date) => setSelectedDate(date);
  const selectedData = selectedDate ? monthData[`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`] || {} : {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => setCurrentMonth(currentMonth - 1)} className="bg-blue-500 text-white p-2 rounded">Prev</button>
        <h2>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setCurrentMonth(currentMonth + 1)} className="bg-blue-500 text-white p-2 rounded">Next</button>
      </div>
      <Calendar month={currentMonth} year={currentYear} onDateClick={handleDateClick} attendanceData={monthData} />
      {selectedDate && (
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Employee Name</th>
              <th className="p-2">Present</th>
              <th className="p-2">Absent</th>
              <th className="p-2">Leave</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(selectedData).map(empId => {
              const empData = selectedData[empId];
              return (
                <tr key={empId}>
                  <td className="p-2">{empId === '1' ? 'Umer' : 'Faizan'}</td> {/* Map ID to name */}
                  <td className="p-2">{empData.status === 'Present' ? '✅' : ''}</td>
                  <td className="p-2">{empData.status === 'Absent' ? '❌' : ''}</td>
                  <td className="p-2">{empData.status === 'Leave' ? '🟡' : ''}</td>
                  <td className="p-2">{empData.notes || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminAttendance;