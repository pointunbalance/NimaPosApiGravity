import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { PieChart as ReChartsPie, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, Sparkles, User, Utensils, MessageCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface MealReportsViewProps {
  classes: any[];
  students: any[];
}

export const MealReportsView: React.FC<MealReportsViewProps> = ({ classes, students }) => {
  const { success } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // yyyy-MM
  const [selectedClass, setSelectedClass] = useState('');

  // Fetch all student meal tracking records
  const allStudentMeals = useLiveQuery(() => db.schoolStudentMeals?.toArray()) || [];

  // Filter records by selected month and class
  const filteredMeals = allStudentMeals.filter(m => {
    const isSameMonth = m.date.startsWith(selectedMonth);
    const isSameClass = selectedClass ? m.classroomId === Number(selectedClass) : true;
    return isSameMonth && isSameClass;
  });

  // Calculate statistics
  let totalMealsRecorded = 0;
  let statusCounts = {
    'جيد': 0,
    'متوسط': 0,
    'ضعيف': 0,
    'لم يأكل': 0
  };

  // Keep track of poor eaters (studentId -> count of 'ضعيف' or 'لم يأكل')
  const poorEatersMap: Record<number, { count: number; student: any }> = {};

  filteredMeals.forEach(m => {
    if (m.meals) {
      Object.keys(m.meals).forEach(mealType => {
        const meal = m.meals[mealType];
        if (meal && meal.status) {
          totalMealsRecorded++;
          const status = meal.status as keyof typeof statusCounts;
          if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
          }

          if (status === 'ضعيف' || status === 'لم يأكل') {
            if (!poorEatersMap[m.studentId]) {
              const sObj = students.find(s => s.id === m.studentId);
              if (sObj) {
                poorEatersMap[m.studentId] = { count: 1, student: sObj };
              }
            } else {
              poorEatersMap[m.studentId].count++;
            }
          }
        }
      });
    }
  });

  // Convert poor eaters to list and sort
  const poorEatersList = Object.values(poorEatersMap)
    .sort((a, b) => b.count - a.count)
    .filter(item => item.count >= 2); // Show kids who have poor nutrition at least twice this month

  // Prepare chart data
  const chartData = [
    { name: 'ممتاز/جيد', value: statusCounts['جيد'], color: '#10b981' },
    { name: 'متوسط', value: statusCounts['متوسط'], color: '#f59e0b' },
    { name: 'ضعيف', value: statusCounts['ضعيف'], color: '#ef4444' },
    { name: 'لم يأكل', value: statusCounts['لم يأكل'], color: '#64748b' }
  ].filter(d => d.value > 0);

  const totalStatusCount = statusCounts['جيد'] + statusCounts['متوسط'] + statusCounts['ضعيف'] + statusCounts['لم يأكل'];
  const goodRatio = totalStatusCount ? Math.round((statusCounts['جيد'] / totalStatusCount) * 100) : 0;

  const handleContactParent = (studentName: string) => {
    success(`تم إرسال إشعار استشارة تغذية لولي أمر الطالب ${studentName}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">شهر التقرير</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none outline-none font-bold text-slate-700"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">الفصل</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none outline-none w-48 text-slate-700"
          >
            <option value="">جميع الفصول</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-3xl text-white shadow-md">
          <span className="text-xs font-bold opacity-80 block mb-1">إجمالي الوجبات المسجلة للشهر</span>
          <h3 className="text-3xl font-black font-mono">{totalMealsRecorded}</h3>
          <div className="flex items-center gap-1.5 mt-2 text-xs opacity-95">
            <Utensils className="w-4 h-4" />
            <span>بيانات تتبع شاملة للمنظومة</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">نسبة التغذية الممتازة والكاملة</span>
          <h3 className="text-3xl font-black text-emerald-600 font-mono">{goodRatio}%</h3>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>الطلاب الذين تناولوا وجباتهم بنجاح</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">أطفال تحت الملاحظة الغذائية</span>
          <h3 className="text-3xl font-black text-rose-500 font-mono">{poorEatersList.length}</h3>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>كرروا ضعف تناول الوجبات مرتين أو أكثر</span>
          </div>
        </div>
      </div>

      {/* Charts & Details split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eating Performance Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            توزيع تقييم التغذية الشهري
          </h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 font-bold">
              لا توجد وجبات مسجلة في هذا الشهر حتى الآن لإنتاج المخطط.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Actionable Poor Eaters list */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-black text-slate-800">حالات سوء التغذية (يحتاج متابعة)</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[280px] divide-y divide-slate-100">
            {poorEatersList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 font-bold">
                <Utensils className="w-12 h-12 text-slate-200 mb-2" />
                <p>جميع الأطفال يتغذون بشكل رائع وجيد هذا الشهر!</p>
              </div>
            ) : (
              poorEatersList.map((item: any) => {
                const cls = classes.find(c => c.id === item.student.classroomId);
                return (
                  <div key={item.student.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 font-black">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.student.name}</h4>
                        <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                          {cls?.name || 'فصل غير معروف'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                        {item.count} وجبات ضعيفة
                      </span>
                      <button
                        onClick={() => handleContactParent(item.student.name)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                        title="إرسال تقرير لولي الأمر"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>تنبيه</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
