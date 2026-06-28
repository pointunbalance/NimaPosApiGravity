import React from 'react';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useSchoolDashboard } from '../../components/school/dashboard/useSchoolDashboard';
import { StatCards } from '../../components/school/dashboard/StatCards';
import { FinancialSummary } from '../../components/school/dashboard/FinancialSummary';
import { AlertsPanel } from '../../components/school/dashboard/AlertsPanel';
import { LatestActivityTables } from '../../components/school/dashboard/LatestActivityTables';

export const SchoolDashboard = () => {
  const {
    enrolledChildren,
    presentCount,
    absentCount,
    lateCount,
    healthLogs,
    todayRevenue,
    todayExpenses,
    todayBirthdays,
    expiringSubscriptions,
    latePayments,
    absentStaff,
    latestFinancials,
    latestStudents,
    chartData,
    netToday,
    students
  } = useSchoolDashboard();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">لوحة تحكم الحضانة وروضة الأطفال</h1>
        <p className="text-slate-500 mt-1">
          نظرة عامة على حضور الأطفال، الماليات، والتنبيهات المباشرة لليوم {format(new Date(), 'dd/MM/yyyy')}
        </p>
      </div>

      <StatCards
        enrolledChildren={enrolledChildren}
        presentCount={presentCount}
        absentCount={absentCount}
        lateCount={lateCount}
        latePaymentsCount={latePayments.length}
        absentStaffCount={absentStaff.length}
      />

      <FinancialSummary
        todayRevenue={todayRevenue}
        todayExpenses={todayExpenses}
        netToday={netToday}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col" style={{ height: '400px' }}>
          <h3 className="font-black text-slate-800 mb-6">النمو المالي وحركة النقدية</h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <AlertsPanel
          healthLogs={healthLogs}
          todayBirthdays={todayBirthdays}
          expiringSubscriptions={expiringSubscriptions}
          students={students}
        />
      </div>

      <LatestActivityTables
        latestStudents={latestStudents}
        latestFinancials={latestFinancials}
      />
    </div>
  );
};

export default SchoolDashboard;
