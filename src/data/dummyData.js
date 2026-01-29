// Dummy data for the entire app. All state is managed locally in components.
export const dummyData = {
  employees: [
    { id: 1, name: 'Umer', email: 'umer@employee', role: 'Employee' },
    { id: 2, name: 'Faizan', email: 'faizan@employee', role: 'Employee' },
    { id: 3, name: 'Abdurrehman', email: 'abdurrehman@admin', role: 'Admin' },
  ],
  attendance: {
    // Monthly data for current month (e.g., October 2023). Format: { date: { employeeId: { status: 'Present'|'Absent'|'Leave', notes: '' } } }
    '2023-10': {
      '2023-10-01': { 1: { status: 'Present', notes: '' }, 2: { status: 'Absent', notes: 'Sick' } },
      '2023-10-02': { 1: { status: 'Leave', notes: 'Vacation' }, 2: { status: 'Present', notes: '' } },
      // ... Add full month data for Umer and Faizan (omitted for brevity; assume 31 days with varied statuses)
      '2023-10-31': { 1: { status: 'Present', notes: '' }, 2: { status: 'Leave', notes: 'Personal' } },
    },
    // Add previous months similarly if needed
  },
  leaveRequests: [
    { id: 1, employeeId: 1, employeeName: 'Umer', startDate: '2023-10-05', endDate: '2023-10-07', reason: 'Vacation', status: 'Pending' },
    { id: 2, employeeId: 2, employeeName: 'Faizan', startDate: '2023-10-10', endDate: '2023-10-12', reason: 'Sick Leave', status: 'Approved' },
  ],
  weeklyAttendance: [5, 6, 4, 7, 5, 6, 5], // Dummy weekly data for line chart (Mon-Sun)
  statusCounts: { Present: 10, Absent: 3, OnLeave: 2 }, // For donut chart
};