export const dashboardData = {
  stats: {
    employees: 4,
    present: 3,
    leaves: 1,
    salary: "$5.8M",
  },

  departments: [
    { name: "Business", value: 156 },
    { name: "Development", value: 112 },
    { name: "Testing", value: 56 },
    { name: "Design", value: 28 },
  ],

  salaryByMonth: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    received: [140, 150, 120, 110, 115, 180, 165, 200, 170],
    pending: [80, 100, 105, 108, 110, 135, 120, 150, 125],
  },

  employees: [
    {
      name: "Umer",
      projectsAssigned: 10,
      projectsCompleted: 7,
      attendance: { present: 20, leave: 2, absent: 1 },
    },
    {
      name: "Faizan",
      projectsAssigned: 8,
      projectsCompleted: 5,
      attendance: { present: 18, leave: 3, absent: 2 },
    },
    {
      name: "Ali",
      projectsAssigned: 6,
      projectsCompleted: 4,
      attendance: { present: 22, leave: 1, absent: 0 },
    },
    {
      name: "Sara",
      projectsAssigned: 9,
      projectsCompleted: 8,
      attendance: { present: 19, leave: 2, absent: 1 },
    },
  ],
};
