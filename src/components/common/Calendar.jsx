// src/components/common/Calendar.jsx
import React from 'react';

const Calendar = ({ month, year, attendanceData, onDateClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = [];
  let days = [];

  // Empty cells before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
    if (days.length === 7) {
      weeks.push(days);
      days = [];
    }
  }

  // Add remaining days to last week
  if (days.length > 0) {
    while (days.length < 7) {
      days.push(null);
    }
    weeks.push(days);
  }

  const getAttendanceStatus = (day) => {
    if (!day) return null;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceData[dateKey]?.status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      case 'Absent':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'Leave':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      {/* Calendar Header - Days of Week */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day, dayIndex) => {
              const status = getAttendanceStatus(day);
              const statusColor = getStatusColor(status);
              const today = isToday(day);

              return (
                <div
                  key={dayIndex}
                  onClick={() => day && onDateClick && onDateClick(day)}
                  className={`
                    min-h-[60px] sm:min-h-[70px] rounded-lg border-2 p-2 flex flex-col items-center justify-center
                    transition-all duration-200
                    ${day ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'cursor-default'}
                    ${today ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800' : ''}
                    ${statusColor}
                  `}
                  style={{
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (day) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (day) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {day && (
                    <>
                      <span className="text-lg font-bold mb-1">{day}</span>
                      {status && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/30 dark:bg-black/20">
                          {status === 'Present' ? '✓' : status === 'Absent' ? '✗' : '○'}
                        </span>
                      )}
                      {today && !status && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Today</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 justify-center text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 border-2 border-green-300 dark:border-green-700"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-300 dark:border-yellow-700"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">No Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;