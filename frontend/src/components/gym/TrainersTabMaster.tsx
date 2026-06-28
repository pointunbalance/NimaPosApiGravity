import React from 'react';
import { 
  Edit2, 
  Trash2, 
  Info 
} from 'lucide-react';
import { TrainerType } from './trainersTypes';

interface TrainersTabMasterProps {
  filteredTrainers: TrainerType[];
  currency: string;
  onEdit: (item: TrainerType) => void;
  onDelete: (id: number) => void;
}

export const TrainersTabMaster: React.FC<TrainersTabMasterProps> = ({
  filteredTrainers,
  currency,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-right" dir="rtl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-xs">
              <th className="px-6 py-4">اسم كابتن الصالة</th>
              <th className="px-6 py-4">التخصص الرئيسي</th>
              <th className="px-6 py-4">رقم الهاتف</th>
              <th className="px-6 py-4">الوردية المطبقة</th>
              <th className="px-6 py-4">الراتب الأساسي</th>
              <th className="px-6 py-4">طريقة ونظام العمولات</th>
              <th className="px-6 py-4 text-center">التقييم</th>
              <th className="px-6 py-4 text-center">تاريخ التعيين</th>
              <th className="px-6 py-4 text-center">حالة الحضور</th>
              <th className="px-6 py-4 text-center">التحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredTrainers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-slate-300" />
                    <span>لا توجد بيانات مطابقة لخيارات الفرز الحالية.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrainers.map((item: TrainerType) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-all">
                  <td className="px-6 py-4 font-black text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-indigo-600 font-bold">{item.specialization}</td>
                  <td className="px-6 py-4 font-mono text-xs">{item.phone || '-'}</td>
                  <td className="px-6 py-4 text-xs">{item.shift || '-'}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-800">
                    {(item.baseSalary || 0).toLocaleString()} {currency}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {item.commissionType === 'fixed_per_student' 
                      ? `ثابت: ${item.commissionValue} ${currency} لكل متدرب` 
                      : `نسبة: ${item.commissionValue}% من قيمة الدورة`}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-amber-600 font-mono">
                    {item.rating || '4.8'} ⭐
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-xs">
                    {item.hireDate || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                      item.status === 'متاح' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : item.status === 'في إجازة'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-1 px-2 hover:bg-indigo-50 text-indigo-600 border border-transparent hover:border-indigo-100 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1 font-bold"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>تعديل</span>
                      </button>
                      <button 
                        onClick={() => onDelete(item.id!)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="حذف المدرب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
