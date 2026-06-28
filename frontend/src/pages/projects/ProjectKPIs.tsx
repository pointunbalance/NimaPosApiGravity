import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Activity, Briefcase, TrendingUp, AlertTriangle, Users, Target, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ProjectKPIs: React.FC = () => {
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currencyCode = settings?.currencyCode || 'SAR';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const kpis = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    let totalBudget = 0;
    let totalActualCost = 0;
    let overBudgetProjects = 0;

    projects.forEach(p => {
      totalBudget += (p.budget || 0);
      totalActualCost += (p.actualCost || 0);
      if ((p.actualCost || 0) > (p.budget || 0)) {
        overBudgetProjects++;
      }
    });

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      totalBudget,
      totalActualCost,
      overBudgetProjects,
      taskCompletionRate
    };
  }, [projects, tasks]);

  const costVarianceData = useMemo(() => {
    return projects.map((p, index) => ({
      name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
      budget: p.budget || 0,
      actualCost: p.actualCost || 0,
    })).slice(0, 10);
  }, [projects]);

  const statusData = useMemo(() => {
    const counts = { planning: 0, active: 0, "on-hold": 0, completed: 0 };
    projects.forEach(p => {
      // @ts-ignore
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return [
      { name: 'مخطط لها', value: counts.planning },
      { name: 'نشطة', value: counts.active },
      { name: 'معلقة', value: counts['on-hold'] },
      { name: 'مكتملة', value: counts.completed },
    ].filter(d => d.value > 0);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-amber-100 text-amber-800';
      case 'planning': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'on-hold': return 'معلق';
      case 'planning': return 'مخطط';
      default: return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            مؤشرات الأداء للمشاريع (KPIs)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            لوحة تحكم تحليلية لمراقبة الميزانيات ونسبة الإنجاز والمهام. هذه الصفحة تكميلية للقسم الهندسي لضمان سرعة تحليل البيانات دون الضغط على العمليات التشغيلية (Separation of Concerns).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-indigo-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">المشاريع النشطة</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{kpis.activeProjects} <span className="text-sm font-medium text-slate-400">من {kpis.totalProjects}</span></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">المهام المنجزة بالكفاءة</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{kpis.taskCompletionRate}%</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-rose-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">مشاريع تتجاوز الميزانية</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{kpis.overBudgetProjects}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-amber-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">إجمالي المنصرف</h3>
          <div className="text-2xl font-black text-slate-800 mt-1">{kpis.totalActualCost.toLocaleString()} <span className="text-sm font-medium text-slate-400">{currencyCode}</span></div>
          <p className="text-xs text-slate-400 mt-1">الفرق: {(kpis.totalBudget - kpis.totalActualCost).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">تحليل الميزانية ( المخطط مقابل الفعلي )</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={costVarianceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <RTooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="budget" name="الميزانية" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="actualCost" name="التكلفة الفعلية" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">توزيع حالات المشاريع</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects Table Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <h3 className="text-lg font-bold text-slate-800">تفاصيل أداء المشاريع</h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="بحث عن مشروع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="planning">مخطط</option>
                <option value="active">نشط</option>
                <option value="on-hold">معلق</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <tr>
                        <th className="p-4 font-semibold text-right">اسم المشروع</th>
                        <th className="p-4 font-semibold text-right">الحالة</th>
                        <th className="p-4 font-semibold text-right">الميزانية</th>
                        <th className="p-4 font-semibold text-right">التكلفة الفعلية</th>
                        <th className="p-4 font-semibold text-right">الفرق</th>
                        <th className="p-4 font-semibold text-right">الموعد النهائي</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredProjects.map(project => {
                        const variance = (project.budget || 0) - (project.actualCost || 0);
                        const isOverBudget = variance < 0;
                        return (
                            <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-800 font-bold">{project.name}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(project.status)}`}>
                                        {getStatusLabel(project.status)}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600">{(project.budget || 0).toLocaleString()} {currencyCode}</td>
                                <td className="p-4 text-slate-600">
                                   <span className={isOverBudget ? 'text-rose-600 font-bold' : ''}>
                                      {(project.actualCost || 0).toLocaleString()} {currencyCode}
                                   </span>
                                </td>
                                <td className="p-4">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${isOverBudget ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                         {isOverBudget ? '-' : '+'}{Math.abs(variance).toLocaleString()}
                                     </span>
                                </td>
                                <td className="p-4 text-slate-500 text-sm">{project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : 'غير محدد'}</td>
                            </tr>
                        );
                    })}
                    {filteredProjects.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد مشاريع تطابق البحث</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectKPIs;
