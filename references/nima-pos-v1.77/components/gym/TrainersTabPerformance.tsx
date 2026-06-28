import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

interface TrainersTabPerformanceProps {
  chartPerformanceData: any[];
  trainers: any[];
}

export const TrainersTabPerformance: React.FC<TrainersTabPerformanceProps> = ({
  chartPerformanceData,
  trainers
}) => {
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  // Specialty Breakdown logic
  const specialtyData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    trainers.forEach(t => {
      const spec = t.specialization?.replace(/[\u200b-\u200d\ufeff]/g, '').trim() || 'أخرى';
      counts[spec] = (counts[spec] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [trainers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-right" dir="rtl">
      
      {/* 1. workload Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800">توزيع الحصص والطلاب المشتركين شهرياً</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">مقارنة بصرية مبسطة لعدد الحصص والطلاب المسجلين بكل كابتن.</p>
        </div>

        <div className="h-64 text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartPerformanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="classesCount" name="عدد الحصص المقررة" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="studentsCount" name="إجمالي المتدربين" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Specialties Pie Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800">التنوع التخصصي لكادر التدريب</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">توزيع التخصصات ونسبة التنوع المهني داخل الهيكل التنظيمي للنادي.</p>
        </div>

        {specialtyData.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-16">لا توجد سجلات تخصص كافية.</p>
        ) : (
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between text-xs font-sans">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={75}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {specialtyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-1.5 shrink-0 pr-4 mt-4 sm:mt-0">
              {specialtyData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 justify-end">
                  <span className="font-extrabold text-slate-700 font-mono">({item.value})</span>
                  <span className="text-slate-500 truncate">{item.name}</span>
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
