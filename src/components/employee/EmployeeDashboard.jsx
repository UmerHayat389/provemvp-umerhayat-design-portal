import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, Briefcase } from 'lucide-react';

const EmployeeDashboard = () => {
  const textColor = "#0C2B4E";
  
  // Sample data
  const projectData = [
    { name: 'Mon', completed: 4, inProgress: 2 },
    { name: 'Tue', completed: 3, inProgress: 3 },
    { name: 'Wed', completed: 5, inProgress: 1 },
    { name: 'Thu', completed: 2, inProgress: 4 },
    { name: 'Fri', completed: 6, inProgress: 2 },
  ];

  const taskDistribution = [
    { name: 'Completed', value: 45, color: '#10b981' },
    { name: 'In Progress', value: 30, color: '#f59e0b' },
    { name: 'Pending', value: 15, color: '#ef4444' },
    { name: 'Review', value: 10, color: '#8b5cf6' },
  ];

  const recentProjects = [
    { id: 1, name: 'Website Redesign', status: 'In Progress', progress: 75, deadline: '2024-02-15' },
    { id: 2, name: 'Mobile App Development', status: 'In Progress', progress: 45, deadline: '2024-02-20' },
    { id: 3, name: 'API Integration', status: 'Completed', progress: 100, deadline: '2024-02-08' },
    { id: 4, name: 'Database Migration', status: 'Pending', progress: 20, deadline: '2024-02-25' },
  ];

  const stats = [
    { icon: Briefcase, label: 'Total Projects', value: '24', color: '#3b82f6' },
    { icon: CheckCircle, label: 'Completed', value: '18', color: '#10b981' },
    { icon: Clock, label: 'In Progress', value: '4', color: '#f59e0b' },
    { icon: AlertCircle, label: 'Pending', value: '2', color: '#ef4444' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return '#10b981';
      case 'In Progress': return '#f59e0b';
      case 'Pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: textColor }}>
            Employee Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Welcome back! Here's your project overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm mb-1 truncate">{stat.label}</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: textColor }}>
                    {stat.value}
                  </h3>
                </div>
                <div 
                  className="p-2 sm:p-2.5 md:p-3 rounded-lg self-start sm:self-auto" 
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Weekly Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-6" style={{ color: textColor }}>
              Weekly Activity
            </h2>
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250} className="sm:!h-[280px] md:!h-[300px]">
                <BarChart data={projectData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke={textColor} 
                    tick={{ fontSize: 11 }}
                    className="sm:!text-xs md:!text-sm"
                  />
                  <YAxis 
                    stroke={textColor} 
                    tick={{ fontSize: 11 }}
                    className="sm:!text-xs md:!text-sm"
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px' }}
                    wrapperClassName="!text-xs sm:!text-sm"
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    iconSize={10}
                    className="sm:!text-xs md:!text-sm"
                  />
                  <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} name="Completed" />
                  <Bar dataKey="inProgress" fill="#f59e0b" radius={[8, 8, 0, 0]} name="In Progress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Distribution */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-6" style={{ color: textColor }}>
              Task Distribution
            </h2>
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={200} className="sm:!h-[240px] md:!h-[260px]">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    className="sm:!innerRadius-[50] sm:!outerRadius-[85] md:!innerRadius-[60] md:!outerRadius-[100]"
                  >
                    {taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
              {taskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <div 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm truncate" style={{ color: textColor }}>{item.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold ml-2 flex-shrink-0" style={{ color: textColor }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-6" style={{ color: textColor }}>
            Assigned Projects
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {recentProjects.map((project) => (
              <div 
                key={project.id} 
                className="border border-gray-100 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base truncate" style={{ color: textColor }}>
                      {project.name}
                    </h3>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-3 sm:gap-4 text-[11px] sm:text-xs text-gray-500">
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">Due: {project.deadline}</span>
                      </span>
                      <span 
                        className="px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium inline-flex items-center self-start xs:self-auto"
                        style={{ 
                          backgroundColor: `${getStatusColor(project.status)}15`,
                          color: getStatusColor(project.status)
                        }}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold" style={{ color: textColor }}>
                      {project.progress}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${project.progress}%`,
                      backgroundColor: getStatusColor(project.status)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;