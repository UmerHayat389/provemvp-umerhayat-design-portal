import React from 'react';

const Calendar = ({ month, year, onDateClick, attendanceData }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatus = (date) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return attendanceData[key] || {};
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day} className="text-center font-bold" title={day}>
            {day}
          </div>
        ))}

        {/* Empty slots before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {/* Dates */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = i + 1;
          const status = getStatus(date);
          const color =
            status.status === 'Present'
              ? 'bg-green-200'
              : status.status === 'Absent'
              ? 'bg-red-200'
              : status.status === 'Leave'
              ? 'bg-yellow-200'
              : 'bg-gray-100';

          return (
            <div
              key={date}
              className={`h-10 flex items-center justify-center rounded cursor-pointer ${color} hover:bg-gray-300`}
              onClick={() => onDateClick(date)}
              title={`Date: ${year}-${month + 1}-${date} Status: ${status.status || 'None'}`}
            >
              {date}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;