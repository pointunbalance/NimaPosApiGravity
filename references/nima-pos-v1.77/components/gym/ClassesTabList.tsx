import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { ClassType } from './types';

interface ClassesTabListProps {
  filteredRecords: ClassType[];
  originalClasses: ClassType[];
  currency: string;
  onEditClass: (item: ClassType) => void;
  onDeleteClass: (id: number) => void;
}

export const ClassesTabList: React.FC<ClassesTabListProps> = ({
  filteredRecords,
  originalClasses,
  currency,
  onEditClass,
  onDeleteClass,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden pb-4 text-right" dir="rtl">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-row-reverse">
        <span className="text-[10px] text-slate-400 font-bold font-mono">الإجمالي المرصود: {filteredRecords.length} سجل من {originalClasses.length}</span>
        <h3 className="text-xs font-black text-slate-500">📋 سجل الحصص والأنشطة التقني بالذاكرة</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-150 font-black text-slate-500">
              <th className="px-6 py-4">معرف</th>
              <th className="px-6 py-4">اسم الحصة/النشاط الرياضي</th>
              <th className="px-6 py-4">المسؤول (المدرب)</th>
              <th className="px-6 py-4">المواعيد وعينات الأيام</th>
              <th className="px-6 py-4">التصنيف والنوع</th>
              <th className="px-6 py-4">سجل المقاعد والحد الكلي</th>
              <th className="px-6 py-4">رسوم السداد للحضور</th>
              <th className="px-6 py-4">قاعة المران</th>
              <th className="px-6 py-4 text-center">الحالة</th>
              <th className="px-6 py-4 text-center">الإجراءات والتحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-bold">
                  لا يوجد أي حصص أو تمرينات مطابقة لخيارات التصفية والبحث حالياً.
                </td>
              </tr>
            ) : (
              filteredRecords.map((item: ClassType) => {
                const attendeesCount = Array.isArray(item.enrolledMembers) ? item.enrolledMembers.length : 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-indigo-600">{item.trainerId}</td>
                    <td className="px-6 py-4 font-bold text-slate-500 truncate max-w-xs">{item.schedule}</td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 select-none">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono ${attendeesCount >= item.capacity ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {attendeesCount} مستحوذ / {item.capacity} مقعد
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {item.price && item.price > 0 ? (
                        <span className="text-amber-600 font-bold">{item.price} {currency}</span>
                      ) : (
                        <span className="text-emerald-650 font-bold">مجاني مع الاشتراك</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{item.room || 'الصالة الرئيسية'}</td>
                    <td className="px-6 py-4 text-center select-none">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                        (item.status || 'نشطة') === 'معلقة' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status || 'نشطة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center p-0">
                      <div className="flex justify-center items-center gap-1.5">
                        <button 
                          onClick={() => onEditClass(item)} 
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDeleteClass(item.id!)} 
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
