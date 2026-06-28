import React from 'react';
import { Check, X, Edit2, Trash2 } from 'lucide-react';

interface GymStaffTableProps {
  filteredStaff: any[];
  currency: string;
  onEdit: (emp: any) => void;
  onDelete: (id: number) => void;
}

export const GymStaffTable: React.FC<GymStaffTableProps> = ({
  filteredStaff,
  currency,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto text-right font-sans" dir="rtl">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-205">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-slate-500 text-right">الرقم الوظيفي</th>
            <th className="px-6 py-4 text-xs font-black text-slate-500 text-right">الموظف</th>
            <th className="px-6 py-4 text-xs font-black text-slate-500 text-right">التخصص / المسمى</th>
            <th className="px-6 py-4 text-xs font-black text-slate-500 text-right">الحالة</th>
            <th className="px-6 py-4 text-xs font-black text-slate-500 text-right">الراتب الأساسي</th>
            <th className="px-6 py-4 text-xs font-black text-slate-500 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredStaff.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 font-bold">
                لا يوجد موظفين مسجلين مطبقين لهذا البحث أو الفلتر حالياً.
              </td>
            </tr>
          ) : (
            filteredStaff.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">
                  EMP-{(1000 + (emp.id || 0))}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-extrabold text-slate-700">{emp.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
                    {emp.phone || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">
                  {emp.role}
                </td>
                <td className="px-6 py-4 text-xs">
                  {emp.isActive ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-black">
                      <Check className="w-3 h-3" /> نشط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black">
                      <X className="w-3 h-3" /> موقوف
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600 font-mono">
                  {emp.baseSalary?.toLocaleString() || 0} {currency}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center items-center gap-2">
                    <button 
                      onClick={() => onEdit(emp)} 
                      className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      title="تعديل البيانات"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDelete(emp.id!)} 
                      className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      title="شطب الموظف"
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
  );
};

export default GymStaffTable;
