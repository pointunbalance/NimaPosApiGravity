import React from 'react';
import { Scissors, Users, CalendarDays as Calendar, TrendingUp } from 'lucide-react';

export const SalonDashboard = () => {
  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">لوحة تحكم الصالون التجميلي</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'المواعيد اليوم', value: '12', icon: <Calendar color="#4f46e5" size={24} />, bg: 'bg-indigo-50' },
          { title: 'العملاء الجدد', value: '5', icon: <Users color="#0ea5e9" size={24} />, bg: 'bg-sky-50' },
          { title: 'إيرادات اليوم', value: '1,450', icon: <TrendingUp color="#10b981" size={24} />, bg: 'bg-emerald-50' },
          { title: 'الخدمات النشطة', value: '8', icon: <Scissors color="#f59e0b" size={24} />, bg: 'bg-amber-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-4">المواعيد القادمة</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
               <div className="flex gap-4">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <span className="font-bold text-slate-600">س.أ</span>
                 </div>
                 <div>
                    <p className="font-bold text-slate-800">سفيتلانا أولينك</p>
                    <p className="text-sm text-slate-500">قص وتصفيف شعر</p>
                 </div>
               </div>
               <div className="text-left">
                  <p className="font-bold text-indigo-600">02:30 م</p>
                  <p className="text-sm text-slate-500">اليوم</p>
               </div>
             </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-4">أداء الموظفين اليوم</h3>
           <div className="space-y-4 text-slate-500 flex items-center justify-center h-40">
              سيتم عرض أداء الموظفين اليومي هنا
           </div>
        </div>
      </div>
    </div>
  );
};
