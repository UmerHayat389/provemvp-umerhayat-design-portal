// src/components/common/Calendar.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiCheckCircle, FiXCircle, FiMinusCircle } from 'react-icons/fi';

const Calendar = ({ month, year, onDateClick, attendanceData }) => {
  const { isDark } = useTheme();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const padZ = (n) => String(n).padStart(2, '0');

  const handleDayClick = (day) => {
    const dateKey = `${year}-${padZ(month + 1)}-${padZ(day)}`;
    if (onDateClick) {
      onDateClick(dateKey);
    }
  };

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          style={{
            minHeight: '90px',
            borderRadius: '12px',
            opacity: 0.3,
          }}
        />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${padZ(month + 1)}-${padZ(day)}`;
      const dayData = attendanceData[dateKey];
      const dayOfWeek = new Date(year, month, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === month && 
                      new Date().getFullYear() === year;

      // Status colors with better contrast
      const getStatusStyle = () => {
        if (!dayData) {
          return {
            bg: isWeekend 
              ? (isDark ? '#1a1f2e' : '#f8fafc')
              : (isDark ? '#0f1419' : '#ffffff'),
            border: isWeekend
              ? (isDark ? '#2d3748' : '#e2e8f0')
              : (isDark ? '#1e293b' : '#e5e7eb'),
            textColor: isDark ? '#64748b' : '#94a3b8',
          };
        }
        
        const styles = {
          Present: {
            bg: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
            border: isDark ? '#15803d' : '#86efac',
            textColor: isDark ? '#4ade80' : '#15803d',
            icon: <FiCheckCircle size={16} />,
          },
          Absent: {
            bg: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
            border: isDark ? '#b91c1c' : '#fca5a5',
            textColor: isDark ? '#f87171' : '#b91c1c',
            icon: <FiXCircle size={16} />,
          },
          Leave: {
            bg: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
            border: isDark ? '#b45309' : '#fcd34d',
            textColor: isDark ? '#fbbf24' : '#b45309',
            icon: <FiMinusCircle size={16} />,
          },
        };
        
        return styles[dayData.status] || styles.Absent;
      };

      const statusStyle = getStatusStyle();
      const hasData = !!dayData;

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          style={{
            padding: '14px',
            borderRadius: '12px',
            backgroundColor: statusStyle.bg,
            border: `2px solid ${isToday ? '#60a5fa' : statusStyle.border}`,
            cursor: hasData ? 'pointer' : 'default',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '90px',
            position: 'relative',
            opacity: hasData ? 1 : (isWeekend ? 0.6 : 0.8),
            boxShadow: isToday 
              ? '0 0 0 3px rgba(96, 165, 250, 0.2)' 
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (hasData) {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 8px 20px rgba(0,0,0,0.4)' 
                : '0 8px 20px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = isToday 
              ? '0 0 0 3px rgba(96, 165, 250, 0.2)' 
              : 'none';
          }}
        >
          {/* Day number */}
          <div style={{ 
            fontSize: '22px',
            fontWeight: '800',
            color: isToday 
              ? '#60a5fa' 
              : (hasData ? statusStyle.textColor : (isDark ? '#94a3b8' : '#64748b')),
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            {day}
          </div>
          
          {/* Status indicator */}
          {hasData && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
            }}>
              <div style={{
                color: statusStyle.textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {statusStyle.icon}
              </div>
              {dayData.totalHours && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: statusStyle.textColor,
                  opacity: 0.85,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {parseFloat(dayData.totalHours).toFixed(1)}h
                </div>
              )}
            </div>
          )}

          {/* Admin badge */}
          {dayData?.markedByAdmin && (
            <div style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              fontSize: '12px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}>
              🛡️
            </div>
          )}

          {/* Today indicator dot */}
          {isToday && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#60a5fa',
              boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)',
            }} />
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div style={{
      backgroundColor: isDark ? '#0f1419' : '#ffffff',
      padding: '28px',
      borderRadius: '16px',
      border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      boxShadow: isDark 
        ? '0 4px 16px rgba(0,0,0,0.4)' 
        : '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* Month/Year header */}
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: isDark ? '#e5e7eb' : '#0f172a',
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '-0.02em',
        }}>
          {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Present', color: isDark ? '#4ade80' : '#15803d', icon: <FiCheckCircle size={12} /> },
          { label: 'Absent', color: isDark ? '#f87171' : '#b91c1c', icon: <FiXCircle size={12} /> },
          { label: 'Leave', color: isDark ? '#fbbf24' : '#b45309', icon: <FiMinusCircle size={12} /> },
        ].map(({ label, color, icon }) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '600',
            color: isDark ? '#94a3b8' : '#64748b',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div style={{ color }}>{icon}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '10px',
        marginBottom: '16px',
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div key={day} style={{
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '13px',
            color: (idx === 0 || idx === 6) 
              ? (isDark ? '#64748b' : '#94a3b8')
              : (isDark ? '#94a3b8' : '#475569'),
            padding: '10px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '10px',
      }}>
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;