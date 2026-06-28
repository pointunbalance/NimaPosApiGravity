import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Users, UserMinus, UserPlus, TrendingDown, Target } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const EmployeeTurnover: React.FC = () => {
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  // Here we would ideally track historical exits, but for demonstration 
  // we will use the active/inactive status and creation dates.
  const metrics = useMemo(() => {
    const totalEmployees = users.length;
    const activeEmployees = users.filter(u => u.isActive === true).length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    
    // Turnover rate calculation (Inactive / Average Employees) * 100
    // Simplify as Inactive / Total * 100 for this snapshot
    const turnoverRate = totalEmployees > 0 ? ((inactiveEmployees / totalEmployees) * 100).toFixed(1) : '0';

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      turnoverRate
    };
  }, [users]);

  // Aggregate by Role to show turnover per role
  const roleData = useMemo(() => {
     const roleCounts: Record<string, { active: number, inactive: number }> = {};
     users.forEach(u => {
         const role = u.role || 'موظف';
         if (!roleCounts[role]) roleCounts[role] = { active: 0, inactive: 0 };
         if (u.isActive === true) {
             roleCounts[role].active++;
         } else {
             roleCounts[role].inactive++;
         }
     });

     return Object.keys(roleCounts).map(role => ({
         name: role === 'admin' ? 'مدير' : role === 'manager' ? 'مسؤول' : role === 'employee' ? 'موظف' : role,
         active: roleCounts[role].active,
         inactive: roleCounts[role].inactive
     })).sort((a,b) => b.inactive - a.inactive).slice(0, 5);
  }, [users]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-indigo-500" />
            لوحة تحكم معدل دوران العمالة (Employee Turnover)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            مؤشرات تحليلية لفهم استقرار القوى العاملة وتحليل تسرب الكفاءات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-indigo-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">إجمالي الموظفين (تاريخي)</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{metrics.totalEmployees}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">الموظفين النشطين</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{metrics.activeEmployees}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-rose-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <UserMinus className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">التسرب والمغادرين</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{metrics.inactiveEmployees}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-amber-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">معدل الدوران</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{metrics.turnoverRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">توزيع المغادرين حسب الدور / الوظيفة</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={roleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <RTooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="inactive" name="المغادرين (غير نشط)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="active" name="الحاليين (نشط)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">قائمة المغادرين (غير النشطين)</h3>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-right whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold">الموظف</th>
                            <th className="p-3 font-semibold">المسمى الوظيفي</th>
                            <th className="p-3 font-semibold">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.filter(u => u.isActive !== true).map(u => (
                            <tr key={u.id}>
                                <td className="p-3 font-bold text-slate-800">{u.name}</td>
                                <td className="p-3 text-slate-600">{u.jobTitle || 'موظف'}</td>
                                <td className="p-3">
                                   <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">مغادر / غير نشط</span>
                                </td>
                            </tr>
                        ))}
                        {users.filter(u => u.isActive !== true).length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-400">لا يوجد مغادرين في النظام</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTurnover;
