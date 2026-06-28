import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface AttendanceAnalyticsProps {
  stats: { total: number; present: number; late: number; excused: number; absent: number };
  department?: string;
  selectedDate: string;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e'];

export const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({ stats, department, selectedDate }) => {
  // Pie chart data
  const pieData = [
    { name: 'حاضر/ملتزم', value: stats.present },
    { name: 'متأخر', value: stats.late },
    { name: 'مجاز', value: stats.excused },
    { name: 'غائب', value: stats.absent },
  ].filter(item => item.value > 0);

  // Fetch users and attendance for the current week to show total hours bar chart
  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 0 }); // Sunday start
  const weekEnd = endOfWeek(new Date(selectedDate), { weekStartsOn: 0 });

  const activeUsers = useLiveQuery(async () => {
    let users = await db.users.where('isActive').equals(1).toArray();
    if (department) {
       users = users.filter(u => u.department === department);
    }
    return users;
  }, [department]) || [];

  const weeklyAttendance = useLiveQuery(async () => {
    const records = await db.attendance
      .where('date')
      .between(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'), true, true)
      .toArray();
    return records;
  }, [selectedDate]) || [];

  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const barData = useMemo(() => {
    if (!activeUsers.length || !weeklyAttendance.length) return [];
    
    return activeUsers.map(user => {
      const userRecords = weeklyAttendance.filter(a => a.userId === user.id && a.checkInTime && a.checkOutTime);
      let totalMinutes = 0;
      
      userRecords.forEach(record => {
         const inMin = timeToMinutes(record.checkInTime!);
         const outMin = timeToMinutes(record.checkOutTime!);
         if (outMin > inMin) {
            totalMinutes += (outMin - inMin);
         }
      });
      
      return {
        name: user.name.split(' ')[0], // First name for brevity
        hours: Number((totalMinutes / 60).toFixed(1))
      };
    }).filter(d => d.hours > 0).sort((a, b) => b.hours - a.hours).slice(0, 8); // top 8 to avoid clutter
  }, [activeUsers, weeklyAttendance]);

  // Average hours line (can be added as a reference line or displayed)
  const averageHours = barData.length ? (barData.reduce((acc, curr) => acc + curr.hours, 0) / barData.length).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 print:hidden">
      
      {/* Pie Chart: Status Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">مؤشرات الحضور اليومية</h3>
          <p className="text-sm text-slate-500">توزيع نسبة الموظفين بناءً على سجلات اليوم ({selectedDate})</p>
        </div>
        <div className="h-64">
           {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number) => [value + ' موظف', 'العدد']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400">
               لا توجد بيانات لهذا اليوم
             </div>
           )}
        </div>
      </div>

      {/* Bar Chart: Weekly Hours */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">أداء وساعات العمل</h3>
          <p className="text-sm text-slate-500">إجمالي ساعات العمل الفعلي للموظفين في الأسبوع الحالي</p>
          <div className="mt-1 text-xs font-semibold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
            متوسط الأداء: {averageHours} ساعة
          </div>
        </div>
        <div className="h-64">
           {barData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                 <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => [value + ' ساعة', 'العمل الفعلي']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="hours" position="top" fill="#64748b" fontSize={11} offset={8} />  
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              لا توجد ساعات عمل مسجلة بعد في هذا الأسبوع
            </div>
           )}
        </div>
      </div>

    </div>
  );
};
