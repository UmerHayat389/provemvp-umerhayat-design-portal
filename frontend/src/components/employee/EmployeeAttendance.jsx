// src/components/employee/EmployeeAttendance.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaClock, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import { 
  FiX, FiCheckCircle, FiXCircle, FiMinusCircle, FiClock, 
  FiLogIn, FiLogOut, FiShield, FiAlertCircle, FiAlertTriangle 
} from 'react-icons/fi';
import Calendar from '../common/Calendar';
import { useTheme } from '../../context/ThemeContext';
import { attendanceAPI } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSocket from '../../hooks/useSocket';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ── Brand ── */
const P  = "#0C2B4E";
const P2 = "#1a4d7a";
const ff = "'DM Sans', Inter, system-ui, sans-serif";

/* ── Font inject ── */
if (typeof document !== "undefined" && !document.getElementById("emp-att-fonts")) {
  const l = document.createElement("link");
  l.id  = "emp-att-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(l);
}

/* ── Status tokens ── */
const ST = {
  Present: { s: "#16a34a", ds: "#021a09", ls: "#f0fdf4", db: "#14532d", lb: "#86efac", dn: "#4ade80", ln: "#15803d" },
  Absent:  { s: "#dc2626", ds: "#1a0303", ls: "#fff5f5", db: "#7f1d1d", lb: "#fca5a5", dn: "#f87171", ln: "#b91c1c" },
  Leave:   { s: "#d97706", ds: "#1a1002", ls: "#fffbeb", db: "#78350f", lb: "#fcd34d", dn: "#fbbf24", ln: "#b45309" },
};

/* ── Helper: is a date string a weekend ── */
const isWeekend = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
};

/* ══════════════════════════════════════════════════════════════════
   PAKISTAN SHIFT LOGIC   (PKT = UTC+5)

   Day   shift : 08:00 AM – 05:00 PM  PKT   (h >= 8  && h < 17)
   Night shift : 08:00 PM – 05:00 AM  PKT   (h >= 20 || h < 5)

   shiftType comes from user.shiftType ('day' | 'night')
   and defaults to 'day' when not set.
══════════════════════════════════════════════════════════════════ */
function getPKTHour() {
  const now   = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5 * 3600000).getHours();
}

function getPKTDate() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5 * 3600000);
}

function getShiftInfo(shiftType = 'day') {
  const h = getPKTHour();

  if (shiftType === 'night') {
    const active = h >= 20 || h < 5;
    const endHour = 5;
    if (active) {
      return {
        active:    true,
        shift:     'night',
        label:     'Night Shift',
        window:    '08:00 PM – 05:00 AM PKT',
        nextLabel: 'Night Shift',
        nextTime:  '08:00 PM PKT',
        endHour,
      };
    }
    return {
      active:    false,
      shift:     null,
      label:     'Night Shift',
      window:    '08:00 PM – 05:00 AM PKT',
      nextLabel: 'Night Shift',
      nextTime:  '08:00 PM PKT',
      endHour,
    };
  }

  // Day shift (default)
  const active = h >= 8 && h < 17;
  const endHour = 17;
  if (active) {
    return {
      active:    true,
      shift:     'day',
      label:     'Day Shift',
      window:    '08:00 AM – 05:00 PM PKT',
      nextLabel: 'Day Shift',
      nextTime:  '08:00 AM PKT',
      endHour,
    };
  }
  return {
    active:    false,
    shift:     null,
    label:     'Day Shift',
    window:    '08:00 AM – 05:00 PM PKT',
    nextLabel: 'Day Shift',
    nextTime:  '08:00 AM PKT',
    endHour,
  };
}

/* ── Format ms elapsed into HH:MM:SS ── */
const padZ = (n) => String(n).padStart(2, '0');
const fmtElapsed = (ms) => {
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${padZ(m)}m`;
  return `${m}m`;
};

/* ── Format ISO timestamp to 12-hr AM/PM ── */
const fmt12 = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

/* ── Format decimal hours ── */
const fmtHrs = (h) => h ? Number(h).toFixed(2) + ' hrs' : '—';

/* ── Format date key to long readable ── */
const fmtDate = (ds) => {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

/* ── Today's date key ── */
const getTodayKey = () => {
  const d = getPKTDate();
  return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}`;
};

const EmployeeAttendance = ({ user }) => {
  const { isDark } = useTheme();

  /* ── Socket — real-time updates ── */
  const socket = useSocket(user?._id);

  /* ── The employee's assigned shift (from their profile) ── */
  const shiftType = user?.shiftType || 'day';

  /* ── Shift state — recomputed every 30s ── */
  const [shiftInfo, setShiftInfo] = useState(() => getShiftInfo(shiftType));
  const [currentTime, setCurrentTime] = useState(getPKTDate());

  useEffect(() => {
    setShiftInfo(getShiftInfo(shiftType));
    const id = setInterval(() => {
      setShiftInfo(getShiftInfo(shiftType));
      setCurrentTime(getPKTDate());
    }, 1000);
    return () => clearInterval(id);
  }, [shiftType]);

  /* ── Clock state ── */
  const [clockInTime,  setClockInTime]  = useState(null);
  const [elapsedTime,  setElapsedTime]  = useState(0);
  const [isClockedIn,  setIsClockedIn]  = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [totalHours,   setTotalHours]   = useState(0);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError,   setClockError]   = useState('');

  /* ── Records state ── */
  const [records,        setRecords]        = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  /* ── Calendar / chart state ── */
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear,  setCurrentYear]  = useState(new Date().getFullYear());

  /* ── Day detail modal ── */
  const [dayModal, setDayModal] = useState(null);

  /* ── Auto clock-out check ── */
  const checkAutoClockOut = useCallback(async () => {
    if (!isClockedIn || !clockInTime) return;
    
    const h = getPKTHour();
    const endHour = shiftInfo.endHour || (shiftType === 'night' ? 5 : 17);
    
    let shouldClockOut = false;
    if (shiftType === 'night') {
      shouldClockOut = h >= endHour && h < 8;
    } else {
      shouldClockOut = h >= endHour;
    }

    if (shouldClockOut) {
      console.log('Auto clock-out triggered - shift ended');
      try {
        const res = await attendanceAPI.clockOut();
        const record = res.data?.attendance || res.data;
        setClockOutTime(record.clockOut);
        setTotalHours(record.totalHours);
        setIsClockedIn(false);
        setShowModal(true);
        toast.info('You were automatically clocked out as your shift ended.', {
          position: 'top-right',
          autoClose: 5000,
        });
        await fetchRecords(true);
      } catch (err) {
        console.error('Auto clock-out failed:', err);
      }
    }
  }, [isClockedIn, clockInTime, shiftInfo.endHour, shiftType]);

  /* ── Check auto clock-out every minute ── */
  useEffect(() => {
    const id = setInterval(checkAutoClockOut, 60000);
    return () => clearInterval(id);
  }, [checkAutoClockOut]);

  /* ── Fetch records ── */
  const fetchRecords = useCallback(async (silent = false) => {
    try {
      if (!silent) setRecordsLoading(true);
      const res  = await attendanceAPI.getMyRecords();
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.records) ? res.data.records : [];
      setRecords(data);

      const today      = getTodayKey();
      const openRecord = data.find(
        (r) => {
          if (!r.clockIn || r.clockOut) return false;
          const recordDate = new Date(r.date);
          const recordKey = `${recordDate.getFullYear()}-${padZ(recordDate.getMonth() + 1)}-${padZ(recordDate.getDate())}`;
          return recordKey === today;
        }
      );
      
      if (openRecord) {
        setIsClockedIn(true);
        setClockInTime(openRecord.clockIn);
        setElapsedTime(Date.now() - new Date(openRecord.clockIn).getTime());
      } else {
        setIsClockedIn(false);
        setClockInTime(null);
        setElapsedTime(0);
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      toast.error('Failed to load attendance records', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      if (!silent) setRecordsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  /* ── One-time DB repair: fix any Absent records that have a clockIn ── */
  useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.post('/attendance/repair').catch(() => {});
    });
  }, []);

  /* ── Auto-absent: runs ONCE after records first load ── */
  const autoAbsentDone = useRef(false);
  useEffect(() => {
    if (recordsLoading) return;
    if (autoAbsentDone.current) return;
    autoAbsentDone.current = true;

    const runAutoAbsent = async () => {
      try {
        const res  = await attendanceAPI.getMyRecords();
        const data = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.records) ? res.data.records : [];

        // Build map of PKT dateKey → record (so we can check clockIn)
        const recordMap = {};
        data.forEach(r => {
          const d     = new Date(r.date);
          const pktMs = d.getTime() + d.getTimezoneOffset() * 60000 + 5 * 3600000;
          const p     = new Date(pktMs);
          const key   = `${p.getFullYear()}-${padZ(p.getMonth()+1)}-${padZ(p.getDate())}`;
          // keep most recent record per day
          if (!recordMap[key] || r.markedByAdmin) recordMap[key] = r;
        });

        const pkt       = getPKTDate();
        const y         = pkt.getFullYear();
        const mo        = pkt.getMonth();
        const todayDate = pkt.getDate();
        const todayKey  = getTodayKey();

        // Joining date — only mark absent from joining date onwards
        const joiningDate = user?.createdAt ? new Date(user.createdAt) : null;
        const joiningKey  = joiningDate
          ? (() => {
              const pktMs = joiningDate.getTime() + joiningDate.getTimezoneOffset() * 60000 + 5 * 3600000;
              const p = new Date(pktMs);
              return `${p.getFullYear()}-${padZ(p.getMonth()+1)}-${padZ(p.getDate())}`;
            })()
          : null;

        const missingKeys = [];

        for (let d = 1; d < todayDate; d++) {
          const dow = new Date(y, mo, d).getDay();
          if (dow === 0 || dow === 6) continue;
          const key = `${y}-${padZ(mo + 1)}-${padZ(d)}`;
          // Skip days before joining
          if (joiningKey && key < joiningKey) continue;
          const rec = recordMap[key];
          // Skip if record exists AND it's valid (has clockIn OR was manually marked OR admin-marked)
          if (rec && (rec.clockIn || rec.markedByAdmin)) continue;
          // If record exists but is a wrongly-saved Absent with no clockIn — it's a candidate
          if (!rec) missingKeys.push(key);
        }

        // Check today only if shift ended
        const h         = pkt.getHours();
        const isNight   = shiftType === 'night';
        const shiftOver = isNight ? (h >= 5 && h < 20) : (h >= 17);
        const todayDow  = pkt.getDay();
        if (shiftOver && todayDow !== 0 && todayDow !== 6) {
          if (joiningKey && todayKey < joiningKey) { /* skip */ }
          else {
            const rec = recordMap[todayKey];
            if (!rec || (!rec.clockIn && !rec.markedByAdmin)) missingKeys.push(todayKey);
          }
        }

        if (missingKeys.length === 0) return;

        let marked = 0;
        for (const key of missingKeys) {
          const [ky, km, kd] = key.split('-').map(Number);
          const safeUTC = new Date(Date.UTC(ky, km - 1, kd, 7, 0, 0)); // PKT noon
          try {
            await attendanceAPI.markStatus({ status: 'Absent', date: safeUTC.toISOString() });
            marked++;
          } catch (_) { /* already has valid record — skip */ }
        }

        if (marked > 0) {
          await fetchRecords(true);
          toast.warning(
            marked === 1 && missingKeys[missingKeys.length - 1] === todayKey
              ? "⚠️ You didn't clock in — marked as Absent for today."
              : `⚠️ Marked ${marked} missed weekday(s) as Absent.`,
            { position: 'top-right', autoClose: 5000 }
          );
        }
      } catch (err) {
        console.error('Auto-absent failed:', err);
      }
    };

    runAutoAbsent();
  }, [recordsLoading]);

  /* ── Real-time socket listeners ── */
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchRecords(true);
    socket.on('attendance:update', refresh);
    socket.on('leave:update',      refresh);
    return () => {
      socket.off('attendance:update', refresh);
      socket.off('leave:update',      refresh);
    };
  }, [socket, fetchRecords]);

  /* Elapsed timer */
  useEffect(() => {
    let interval;
    if (isClockedIn && clockInTime) {
      interval = setInterval(
        () => setElapsedTime(Date.now() - new Date(clockInTime).getTime()),
        1000,
      );
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  /* ── Clock In ── */
  const handleClockIn = async () => {
    const todayDow = getPKTDate().getDay();
    if (todayDow === 0 || todayDow === 6) {
      toast.warning('🗓️ Today is a weekend. Attendance is not required.', { position: 'top-right', autoClose: 4000 });
      return;
    }
    if (!shiftInfo.active) {
      const errorMsg = `Clock-in is only allowed during your ${shiftInfo.label} (${shiftInfo.window}). Next window opens at ${shiftInfo.nextTime}.`;
      setClockError(errorMsg);
      setTimeout(() => setClockError(''), 5000);
      toast.warning(errorMsg, { position: 'top-right', autoClose: 4000 });
      return;
    }
    setClockError('');
    setClockLoading(true);
    try {
      const res    = await attendanceAPI.clockIn();
      const record = res.data?.attendance || res.data;
      setClockInTime(record.clockIn);
      setIsClockedIn(true);
      setElapsedTime(0);
      toast.success('✓ Clocked in successfully!', { position: 'top-right', autoClose: 3000 });
      await fetchRecords(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Clock in failed. Please try again.';
      setClockError(errorMsg);
      setTimeout(() => setClockError(''), 5000);
      toast.error(errorMsg, { position: 'top-right', autoClose: 4000 });
    } finally {
      setClockLoading(false);
    }
  };

  /* ── Clock Out ── */
  const handleClockOut = async () => {
    setClockError('');
    setClockLoading(true);
    try {
      const res    = await attendanceAPI.clockOut();
      const record = res.data?.attendance || res.data;
      const out    = record.clockOut;
      const hours  = record.totalHours ?? ((new Date(out) - new Date(clockInTime)) / (1000 * 60 * 60));
      setClockOutTime(out);
      setTotalHours(hours);
      setIsClockedIn(false);
      setShowModal(true);
      toast.success('✓ Clocked out successfully!', { position: 'top-right', autoClose: 3000 });
      await fetchRecords(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Clock out failed. Please try again.';
      setClockError(errorMsg);
      setTimeout(() => setClockError(''), 5000);
      toast.error(errorMsg, { position: 'top-right', autoClose: 4000 });
    } finally {
      setClockLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setClockInTime(null);
    setClockOutTime(null);
    setTotalHours(0);
  };

  /* ── Mark attendance ── */
  const handleMarkAttendance = async (status) => {
    const todayDow = getPKTDate().getDay();
    if (todayDow === 0 || todayDow === 6) {
      toast.warning('🗓️ Today is a weekend. Attendance is not required.', { position: 'top-right', autoClose: 4000 });
      return;
    }
    if (!shiftInfo.active) {
      setClockError(
        `Attendance marking is only allowed during your ${shiftInfo.label} (${shiftInfo.window}).`
      );
      setTimeout(() => setClockError(''), 5000);
      toast.warning(`Attendance marking only allowed during ${shiftInfo.label}`, {
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }
    try {
      const pktMidnight = new Date(getPKTDate()); pktMidnight.setHours(0,0,0,0);
      await attendanceAPI.markStatus({ status, date: pktMidnight.toISOString() });
      toast.success(`✓ Marked as ${status} successfully!`, { position: 'top-right', autoClose: 3000 });
      await fetchRecords(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to mark attendance.';
      setClockError(errorMsg);
      setTimeout(() => setClockError(''), 4000);
      toast.error(errorMsg, { position: 'top-right', autoClose: 4000 });
    }
  };

  /* ── Attendance map — EXCLUDE WEEKENDS unless admin-marked ── */
  const employeeAttendance = records.reduce((acc, record) => {
    const d     = new Date(record.date);
    const pktMs = d.getTime() + d.getTimezoneOffset() * 60000 + 5 * 3600000;
    const pkt   = new Date(pktMs);
    const dateKey = `${pkt.getFullYear()}-${padZ(pkt.getMonth() + 1)}-${padZ(pkt.getDate())}`;
    if (!record.markedByAdmin && isWeekend(dateKey)) return acc;
    if (!acc[dateKey] || record.markedByAdmin) {
      acc[dateKey] = {
        status:          record.status || 'Present',
        clockIn:         record.clockIn,
        clockOut:        record.clockOut,
        totalHours:      record.totalHours,
        breakMinutes:    record.breakMinutes,
        lateMinutes:     record.lateMinutes,
        overtimeMinutes: record.overtimeMinutes,
        markedByAdmin:   record.markedByAdmin || false,
        isWeekend:       isWeekend(dateKey),
      };
    }
    return acc;
  }, {});

  /* ── Calendar click — open detail modal ONLY for dates with records ── */
  const handleDateClick = (dateKey) => {
    // Check if date is before joining date
    if (user?.createdAt) {
      const jd    = new Date(user.createdAt);
      const jktMs = jd.getTime() + jd.getTimezoneOffset() * 60000 + 5 * 3600000;
      const jp    = new Date(jktMs);
      const joiningKey = `${jp.getFullYear()}-${padZ(jp.getMonth()+1)}-${padZ(jp.getDate())}`;
      if (dateKey < joiningKey) {
        toast.info('📅 You had not joined the company on this date.', { position: 'top-right', autoClose: 3000 });
        return;
      }
    }
    const record = employeeAttendance[dateKey];
    if (record) {
      setDayModal({ dateKey, record });
    } else {
      toast.info('No attendance record for this date', {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  /* ── Today ── */
  const todayKey         = getTodayKey();
  const todayRecord      = employeeAttendance[todayKey];
  const adminLockedToday = todayRecord?.markedByAdmin;
  const todayIsWeekend   = isWeekend(todayKey);

  /* ── Chart — only count weekdays ── */
  const summary = { Present: 0, Absent: 0, Leave: 0 };
  Object.entries(employeeAttendance).forEach(([dk, val]) => {
    const [y, m] = dk.split('-').map(Number);
    if (y === currentYear && m === currentMonth + 1 && !isWeekend(dk)) {
      summary[val.status] = (summary[val.status] || 0) + 1;
    }
  });

  const barData = {
    labels: ['Present', 'Absent', 'Leave'],
    datasets: [{
      label:           'Days',
      data:            [summary.Present, summary.Absent, summary.Leave],
      backgroundColor: [
        isDark ? '#22c55e' : `${P}cc`,
        isDark ? '#ef4444' : '#dc2626cc',
        isDark ? '#f59e0b' : '#d97706cc',
      ],
      borderRadius:  8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend:  { labels: { color: isDark ? '#E5E7EB' : '#374151', font: { family: ff } } },
      tooltip: {
        backgroundColor: isDark ? '#08121e' : '#fff',
        titleColor:      isDark ? '#deeefa' : '#0d1f30',
        bodyColor:       isDark ? '#4a7090' : '#5a7a94',
        borderColor:     isDark ? '#152030' : '#e4eef8',
        borderWidth: 1, cornerRadius: 8, padding: 10,
      },
    },
    scales: {
      x: { ticks: { color: isDark ? '#4a7090' : '#6B7280', font: { family: ff } }, grid: { color: isDark ? '#122236' : '#e8f0f8' } },
      y: { ticks: { color: isDark ? '#4a7090' : '#6B7280', font: { family: ff } }, grid: { color: isDark ? '#122236' : '#e8f0f8' } },
    },
  };

  /* ── Modal theme tokens ── */
  const mBg  = isDark ? '#08121e' : '#ffffff';
  const mBd  = isDark ? '#152030' : '#e4eef8';
  const mTxt = isDark ? '#deeefa' : '#0d1f30';
  const mSub = isDark ? '#4a7090' : '#5a7a94';
  const mDim = isDark ? '#2a4460' : '#8aafc8';
  const mRow = isDark ? 'rgba(255,255,255,0.04)' : '#f6fafd';
  const mRBd = isDark ? '#1a2e44' : '#dde9f6';

  /* Status palette */
  const SP = {
    Present: { dot: '#22c55e', s: '#16a34a', bg: isDark ? 'rgba(34,197,94,0.1)'  : 'rgba(34,197,94,0.07)',  bd: isDark ? 'rgba(34,197,94,0.24)'  : 'rgba(34,197,94,0.18)',  txt: isDark ? '#4ade80' : '#15803d' },
    Absent:  { dot: '#ef4444', s: '#dc2626', bg: isDark ? 'rgba(239,68,68,0.1)'  : 'rgba(239,68,68,0.07)',  bd: isDark ? 'rgba(239,68,68,0.24)'  : 'rgba(239,68,68,0.18)',  txt: isDark ? '#f87171' : '#b91c1c' },
    Leave:   { dot: '#f59e0b', s: '#d97706', bg: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.07)', bd: isDark ? 'rgba(245,158,11,0.24)' : 'rgba(245,158,11,0.18)', txt: isDark ? '#fbbf24' : '#92400e' },
  };

  /* ── Shared backdrop style ── */
  const backdropStyle = {
    position:              'fixed',
    inset:                 0,
    top:                   0,
    left:                  0,
    right:                 0,
    bottom:                0,
    width:                 '100vw',
    height:                '100vh',
    minHeight:             '100vh',
    display:               'flex',
    alignItems:            'center',
    justifyContent:        'center',
    zIndex:                50,
    padding:               16,
    background:            isDark ? 'rgba(3,8,18,0.55)' : 'rgba(10,24,42,0.40)',
    backdropFilter:        'blur(14px)',
    WebkitBackdropFilter:  'blur(14px)',
    overflowY:             'auto',
  };

  return (
    <div
      className="space-y-6 p-4 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200"
      style={{ fontFamily: ff }}
    >

      {/* ══════ REAL-TIME CLOCK DISPLAY ══════ */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center border border-gray-100 dark:border-gray-700"
        style={{
          transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
          opacity: 0,
          animation: 'empFadeIn 0.5s ease-out forwards',
          background: isDark
            ? `linear-gradient(135deg, ${P}18 0%, #091422 100%)`
            : `linear-gradient(135deg, ${P}08 0%, #ffffff 100%)`,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: mSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Current Time (PKT)
          </p>
          <p style={{ fontSize: 42, fontWeight: 900, color: isDark ? '#60a5fa' : P, margin: 0, fontFamily: "'DM Sans', monospace", letterSpacing: '-.02em' }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: mDim, marginTop: 4 }}>
            {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Clock In/Out ── */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center border border-gray-100 dark:border-gray-700"
        style={{ transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)', opacity: 0, animation: 'empFadeIn 0.5s ease-out 0.1s forwards' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15),0 10px 10px -5px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)'; }}
      >
        <h3 className="text-2xl font-bold mb-4" style={{ color: isDark ? '#e2e8f0' : P }}>Clock In / Clock Out</h3>

        {/* ── Shift status banner ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 11, marginBottom: 14,
          fontSize: 13, fontWeight: 600, fontFamily: ff,
          background: shiftInfo.active
            ? (shiftType === 'night'
                ? (isDark ? 'rgba(129,140,248,0.10)' : 'rgba(99,102,241,0.06)')
                : (isDark ? `${P}18` : `${P}08`))
            : (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)'),
          border: `1.5px solid ${shiftInfo.active
            ? (shiftType === 'night'
                ? (isDark ? 'rgba(129,140,248,0.28)' : 'rgba(99,102,241,0.20)')
                : (isDark ? `${P}38` : `${P}28`))
            : (isDark ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.16)')}`,
          color: shiftInfo.active
            ? (shiftType === 'night'
                ? (isDark ? '#a5b4fc' : '#4338ca')
                : (isDark ? '#88b8e0' : P))
            : (isDark ? '#f87171' : '#b91c1c'),
        }}>
          <span style={{ fontSize: 16 }}>{shiftType === 'night' ? '🌙' : '☀️'}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            {shiftInfo.active
              ? `${shiftInfo.label} Active · ${shiftInfo.window}`
              : `Outside ${shiftInfo.label} Hours · Next: ${shiftInfo.nextTime}`}
          </span>
          {shiftInfo.active && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: 'currentColor',
              opacity: 0.8, animation: 'empPulse 1.8s ease-in-out infinite', display: 'inline-block',
            }} />
          )}
        </div>

        {clockError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10,
            background: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.24)', marginBottom: 12,
          }}>
            <FiAlertCircle size={14} color="#ef4444" />
            <p style={{ fontSize: 13, color: isDark ? '#f87171' : '#b91c1c', margin: 0, fontFamily: ff }}>
              {clockError}
            </p>
          </div>
        )}

        {!isClockedIn ? (
          <button
            onClick={handleClockIn}
            disabled={clockLoading}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: shiftInfo.active ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#9ca3af',
              color: '#fff', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              border: 'none', cursor: clockLoading ? 'not-allowed' : 'pointer',
              boxShadow: shiftInfo.active ? '0 4px 14px rgba(22,163,74,0.35)' : 'none',
              transition: 'all 200ms ease', fontFamily: ff,
              opacity: todayIsWeekend ? 0.45 : 1,
            }}
            onMouseEnter={e => { if (!clockLoading) e.target.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
          >
            <FaClock className="inline mr-2" /> {clockLoading ? 'Clocking In...' : 'Clock In'}
          </button>
        ) : (
          <div className="space-y-4">
            <div style={{
              padding: '18px 22px', borderRadius: 14,
              background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
              border: '1.5px solid rgba(34,197,94,0.2)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: mSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                Session Time
              </p>
              <p style={{
                fontSize: 38, fontWeight: 900, margin: 0, fontFamily: "'DM Sans', monospace",
                color: isDark ? '#4ade80' : '#15803d', letterSpacing: '-.02em',
              }}>
                {fmtElapsed(elapsedTime)}
              </p>
              <p style={{ fontSize: 13, color: mDim, marginTop: 6 }}>
                Started at {fmt12(clockInTime)}
              </p>
            </div>
            <button
              onClick={handleClockOut}
              disabled={clockLoading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                color: '#fff', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
                transition: 'all 200ms ease', fontFamily: ff,
              }}
              onMouseEnter={e => { if (!clockLoading) e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
            >
              <FaClock className="inline mr-2" /> {clockLoading ? 'Clocking Out...' : 'Clock Out'}
            </button>
          </div>
        )}
      </div>

      {/* ══════ CLOCK OUT SUMMARY MODAL ══════ */}
      {showModal && (
        <div style={backdropStyle} onClick={closeModal}>
          <div
            style={{
              width:        '100%',
              maxWidth:     460,
              maxHeight:    '88vh',
              borderRadius: 18,
              background:   mBg,
              border:       `1px solid ${mBd}`,
              overflow:     'hidden',
              display:      'flex',
              flexDirection:'column',
              boxShadow:    isDark
                ? '0 20px 60px rgba(0,0,0,0.70)'
                : '0 16px 48px rgba(15,40,70,0.13), 0 3px 12px rgba(15,40,70,0.07)',
              animation:    'empSlideIn .25s cubic-bezier(.25,.8,.25,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* top accent bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg,${P},${P2},#22c55e)`, flexShrink: 0 }} />

            {/* Header */}
            <div style={{
              padding: '20px 22px 16px', borderBottom: `1px solid ${mBd}`,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              flexShrink: 0,
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: mDim, margin: '0 0 5px', fontFamily: ff }}>
                  Session Complete
                </p>
                <p style={{ fontSize: 19, fontWeight: 800, color: mTxt, margin: 0, fontFamily: ff, letterSpacing: '-.02em' }}>
                  Clock Out Summary
                </p>
                <p style={{ fontSize: 12, color: mSub, margin: '5px 0 0', fontFamily: ff }}>
                  {clockOutTime ? new Date(clockOutTime).toLocaleDateString([], {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  }) : ''}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 30, height: 30, borderRadius: 9, background: mRow, border: `1px solid ${mRBd}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mSub, flexShrink: 0, transition: 'all 150ms ease',
                }}
              >
                <FiX size={13} />
              </button>
            </div>

            {/* Employee row */}
            <div style={{ padding: '14px 22px', borderBottom: `1px solid ${mBd}`, flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 11, background: mRow, border: `1px solid ${mRBd}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg,${P},${P2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: ff, flexShrink: 0,
                  boxShadow: `0 4px 12px ${P}38`,
                }}>
                  {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: mTxt, margin: 0, fontFamily: ff }}>
                    {user?.name}
                  </p>
                  <p style={{ fontSize: 12, color: mSub, margin: '3px 0 0', fontFamily: ff }}>
                    {user?.department || 'Employee'}
                    {user?.shiftType ? ` · ${user.shiftType === 'night' ? '🌙 Night Shift' : '☀️ Day Shift'}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {/* Time cards */}
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${mBd}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {[
                    { Icon: FiLogIn,  bg: P,        lbl: 'Check In',  val: fmt12(clockInTime)  },
                    { Icon: FiLogOut, bg: '#dc2626', lbl: 'Check Out', val: fmt12(clockOutTime) },
                  ].map(({ Icon, bg: ib, lbl, val }) => (
                    <div key={lbl} style={{
                      borderRadius: 11, padding: '14px 12px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#f6fafd',
                      border: `1px solid ${mRBd}`, display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, background: ib,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: `0 3px 10px ${ib}40`,
                      }}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: mTxt, margin: '0 0 3px', fontFamily: ff, letterSpacing: '-.02em', lineHeight: 1 }}>
                          {val}
                        </p>
                        <p style={{ fontSize: 10, fontWeight: 600, color: mSub, margin: 0, fontFamily: ff, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                          {lbl}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Production hours */}
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: isDark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.06)',
                  border: '1.5px solid rgba(34,197,94,0.24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', boxShadow: '0 3px 10px rgba(22,163,74,0.4)',
                    }}>
                      <FiClock size={15} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: mSub, margin: '0 0 2px', fontFamily: ff }}>
                        Production Hours
                      </p>
                      <p style={{ fontSize: 11, color: mDim, margin: 0, fontFamily: ff }}>Today's session</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 900, color: isDark ? '#4ade80' : '#15803d', margin: 0, fontFamily: ff, letterSpacing: '-.03em' }}>
                    {typeof totalHours === 'number' ? totalHours.toFixed(2) : parseFloat(totalHours || 0).toFixed(2)}h
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 22px', borderTop: `1px solid ${mBd}`, flexShrink: 0 }}>
              <button
                onClick={closeModal}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 11,
                  background: `linear-gradient(135deg, ${P}, ${P2})`,
                  color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: ff,
                  border: 'none', cursor: 'pointer',
                  boxShadow: `0 4px 14px ${P}38`,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Today's Attendance ── */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
        style={{ transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)', opacity: 0, animation: 'empFadeIn 0.5s ease-out 0.2s forwards' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15),0 10px 10px -5px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)'; }}
      >
        <h3 className="text-2xl font-bold mb-4" style={{ color: isDark ? '#e2e8f0' : P }}>Mark Today's Attendance</h3>

        {/* Weekend + admin notice */}
        {todayIsWeekend && adminLockedToday && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 11, background: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.2)', marginBottom: 14, fontFamily: ff,
          }}>
            <FaCalendarAlt style={{ color: '#818cf8', flexShrink: 0, fontSize: 14 }} />
            <p style={{ fontSize: 13, color: isDark ? '#a5b4fc' : '#4338ca', margin: 0, fontFamily: ff, fontWeight: 500 }}>
              Weekend day — attendance set by admin as <strong>{todayRecord.status}</strong>. You cannot modify it.
            </p>
          </div>
        )}

        {/* Regular admin lock */}
        {!todayIsWeekend && adminLockedToday && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 11, background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb',
            border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14, fontFamily: ff,
          }}>
            <FaShieldAlt style={{ color: '#f59e0b', flexShrink: 0, fontSize: 14 }} />
            <p style={{ fontSize: 13, color: isDark ? '#fbbf24' : '#92400e', margin: 0, fontFamily: ff, fontWeight: 500 }}>
              Today's attendance was set by admin as <strong>{todayRecord.status}</strong>. You cannot change it.
            </p>
          </div>
        )}

        {/* Outside shift notice */}
        {!adminLockedToday && !shiftInfo.active && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 11, background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.18)', marginBottom: 14, fontFamily: ff,
          }}>
            <FiAlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: isDark ? '#f87171' : '#b91c1c', margin: 0, fontFamily: ff, fontWeight: 500 }}>
              Attendance marking is only allowed during your {shiftInfo.label} ({shiftInfo.window}). Next window: {shiftInfo.nextTime}.
            </p>
          </div>
        )}

        {!adminLockedToday && (
          <div className="flex flex-wrap gap-4">
            {['Present', 'Absent', 'Leave'].map(status => {
              const sc = SP[status];
              const StatusIcon = status === 'Present' ? FiCheckCircle : status === 'Leave' ? FiMinusCircle : FiXCircle;
              return (
                <button
                  key={status}
                  onClick={() => handleMarkAttendance(status)}
                  disabled={false}
                  className="disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    padding: '12px 24px', borderRadius: 11, fontSize: 14, fontWeight: 700,
                    background: sc.bg, border: `1.5px solid ${sc.bd}`, color: sc.txt,
                    cursor: 'pointer',
                    transition: 'all 200ms ease', fontFamily: ff,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    opacity: todayIsWeekend ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                >
                  <StatusIcon size={16} />
                  {status}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Monthly View ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 justify-center items-center mb-4">
          <select
            value={currentMonth}
            onChange={e => setCurrentMonth(parseInt(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 shadow-sm focus:ring-2 bg-white dark:bg-gray-800 text-gray-200 font-medium transition-all duration-200"
            style={{
              fontFamily: ff,
              color: isDark ? '#deeefa' : P,
              borderColor: isDark ? '#152030' : '#e4eef8',
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{new Date(currentYear, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={e => setCurrentYear(parseInt(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 shadow-sm focus:ring-2 bg-white dark:bg-gray-800 text-gray-200 font-medium transition-all duration-200"
            style={{
              fontFamily: ff,
              color: isDark ? '#deeefa' : P,
              borderColor: isDark ? '#152030' : '#e4eef8',
            }}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {recordsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `4px solid ${isDark ? '#152030' : '#e4eef8'}`,
              borderTopColor: P,
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : (
          <>
            <Calendar
              month={currentMonth}
              year={currentYear}
              onDateClick={handleDateClick}
              attendanceData={employeeAttendance}
            />
            <div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300"
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15),0 10px 10px -5px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)'; }}
            >
              <Bar data={barData} options={chartOptions} />
            </div>
          </>
        )}
      </div>

      {/* ══════ DAY DETAIL MODAL ══════ */}
      {dayModal && (() => {
        const r          = dayModal.record;
        const sc         = SP[r.status] || SP.Absent;
        const StatusIcon = r.status === 'Present' ? FiCheckCircle : r.status === 'Leave' ? FiMinusCircle : FiXCircle;
        const isWknd     = isWeekend(dayModal.dateKey);

        return (
          <div style={backdropStyle} onClick={() => setDayModal(null)}>
            <div
              style={{
                width:         '100%',
                maxWidth:      520,
                maxHeight:     '82vh',
                borderRadius:  18,
                background:    mBg,
                border:        `1px solid ${mBd}`,
                overflow:      'hidden',
                display:       'flex',
                flexDirection: 'column',
                boxShadow:     isDark
                  ? '0 20px 60px rgba(0,0,0,0.70)'
                  : '0 16px 48px rgba(15,40,70,0.12)',
                animation:     'empSlideIn .25s cubic-bezier(.25,.8,.25,1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg,${P},${P2},${sc.s}55)`, flexShrink: 0 }} />

              {/* Header */}
              <div style={{
                padding: '20px 24px 16px', borderBottom: `1px solid ${mBd}`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
                flexShrink: 0,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: mDim, margin: '0 0 6px', fontFamily: ff }}>
                    Attendance Details
                  </p>
                  <p style={{ fontSize: 21, fontWeight: 800, color: mTxt, margin: 0, fontFamily: ff, letterSpacing: '-.02em', lineHeight: 1.3 }}>
                    {fmtDate(dayModal.dateKey)}
                  </p>
                </div>
                <button
                  onClick={() => setDayModal(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 9, background: mRow, border: `1px solid ${mRBd}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: mSub, flexShrink: 0, transition: 'all 150ms ease',
                  }}
                >
                  <FiX size={14} />
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

                {/* Weekend admin-marked notice */}
                {isWknd && r.markedByAdmin && (
                  <div style={{ padding: '14px 24px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                      borderRadius: 10, background: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.18)',
                    }}>
                      <FaCalendarAlt style={{ fontSize: 12, color: '#818cf8', flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: isDark ? '#a5b4fc' : '#4338ca', margin: 0, fontFamily: ff, fontWeight: 500 }}>
                        Weekend — attendance set by admin override.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status row */}
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${mBd}` }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: 12, background: mRow, border: `1px solid ${mRBd}`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: mSub, fontFamily: ff }}>Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px',
                        borderRadius: 100, background: sc.bg, border: `1.5px solid ${sc.bd}`,
                      }}>
                        <StatusIcon size={13} color={sc.s} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: sc.txt, fontFamily: ff }}>{r.status}</span>
                      </span>
                      {r.markedByAdmin && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                          borderRadius: 100, background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
                          border: '1px solid rgba(245,158,11,0.22)',
                        }}>
                          <FaShieldAlt style={{ width: 10, height: 10, color: '#f59e0b' }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#fbbf24' : '#92400e', fontFamily: ff }}>
                            Admin
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time cards */}
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${mBd}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {[
                      { Icon: FiLogIn,  bg: P,        lbl: 'Check In',  val: fmt12(r.clockIn)  },
                      { Icon: FiLogOut, bg: '#dc2626', lbl: 'Check Out', val: fmt12(r.clockOut) },
                    ].map(({ Icon, bg: ib, lbl, val }) => (
                      <div key={lbl} style={{
                        borderRadius: 12, padding: '16px 14px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#f6fafd',
                        border: `1px solid ${mRBd}`, display: 'flex', flexDirection: 'column', gap: 12,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, background: ib,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', boxShadow: `0 3px 10px ${ib}40`,
                        }}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p style={{ fontSize: 22, fontWeight: 800, color: mTxt, margin: '0 0 4px', fontFamily: ff, letterSpacing: '-.02em', lineHeight: 1 }}>
                            {val}
                          </p>
                          <p style={{ fontSize: 10, fontWeight: 600, color: mSub, margin: 0, fontFamily: ff, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                            {lbl}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hours row */}
                  <div style={{
                    padding: '16px 18px', borderRadius: 13,
                    background: isDark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.06)',
                    border: '1.5px solid rgba(34,197,94,0.24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 3px 10px rgba(22,163,74,0.4)',
                      }}>
                        <FiClock size={17} />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: mSub, margin: '0 0 2px', fontFamily: ff }}>
                          Production Hours
                        </p>
                        <p style={{ fontSize: 12, color: mDim, margin: 0, fontFamily: ff }}>Total time worked</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 900, color: isDark ? '#4ade80' : '#15803d', margin: 0, fontFamily: ff, letterSpacing: '-.03em' }}>
                      {fmtHrs(r.totalHours)}
                    </p>
                  </div>
                </div>

                {/* Session details */}
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${mBd}` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: mDim, margin: '0 0 12px', fontFamily: ff }}>
                    Session Details
                  </p>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                    padding: '14px 12px', borderRadius: 12,
                    background: mRow, border: `1px solid ${mRBd}`,
                  }}>
                    {[
                      { label: 'Break',    value: r.breakMinutes    ? `${r.breakMinutes}m`    : '—' },
                      { label: 'Late',     value: r.lateMinutes     ? `${r.lateMinutes}m`     : '—' },
                      { label: 'Overtime', value: r.overtimeMinutes ? `${r.overtimeMinutes}m` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: mDim, margin: '0 0 6px', fontFamily: ff }}>
                          {label}
                        </p>
                        <p style={{ fontSize: 17, fontWeight: 800, color: mTxt, margin: 0, fontFamily: ff }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin lock notice */}
                {r.markedByAdmin && (
                  <div style={{ padding: '14px 24px' }}>
                    <div style={{
                      display: 'flex', gap: 9, padding: '11px 14px',
                      borderRadius: 10, background: isDark ? 'rgba(245,158,11,0.07)' : '#fffbeb',
                      border: '1px solid rgba(245,158,11,0.18)', alignItems: 'flex-start',
                    }}>
                      <FiShield size={12} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: isDark ? '#fbbf24' : '#92400e', margin: 0, lineHeight: 1.5, fontFamily: ff, fontWeight: 500 }}>
                        This record was set by admin and is locked — you cannot modify it.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed footer */}
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${mBd}`, flexShrink: 0 }}>
                <button
                  onClick={() => setDayModal(null)}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: `linear-gradient(135deg, ${P}, ${P2})`,
                    color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: ff,
                    border: 'none', cursor: 'pointer',
                    boxShadow: `0 4px 14px ${P}38`,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes empFadeIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes empPulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes empSlideIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:none; } }
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme={isDark ? 'dark' : 'light'} />
    </div>
  );
};

export default EmployeeAttendance;