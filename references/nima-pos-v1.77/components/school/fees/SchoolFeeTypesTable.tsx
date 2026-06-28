import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { FeeType } from './useSchoolFees';

interface SchoolFeeTypesTableProps {
  filteredFeeTypes: FeeType[];
  openEditFeeType: (fee: FeeType) => void;
  handleDeleteFeeType: (id: number) => void;
}

export const SchoolFeeTypesTable: React.FC<SchoolFeeTypesTableProps> = ({
  filteredFeeTypes,
  openEditFeeType,
  handleDeleteFeeType,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
          <tr>
            <th className="px-6 py-4.5">اسم نوع الرسوم</th>
            <th className="px-6 py-4.5">فئة الرسوم</th>
            <th className="px-6 py-4.5">المبلغ المحدد</th>
            <th className="px-6 py-4.5">حالة الباقة</th>
            <th className="px-6 py-4.5 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {filteredFeeTypes.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold text-lg">
                لم يتم إعداد أي باقات أو هياكل رسوم حتى الآن.
              </td>
            </tr>
          ) : (
            filteredFeeTypes.map((fee) => (
              <tr key={fee.id} className="hover:bg-slate-50/50 transition duration-150">
                <td className="px-6 py-4 font-extrabold text-slate-800">
                  {fee.name}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {fee.type === 'tuition' ? 'رسوم الدراسة والتعليم' :
                    fee.type === 'transport' ? 'خدمات النقل والمواصلات' :
                      fee.type === 'books' ? 'حقيبة الكتب والقرطاسية' : 'أنشطة لا منهجية وخدمات أخرى'}
                </td>
                <td className="px-6 py-4 font-black text-slate-900 text-lg">
                  {fee.amount} ج.م
                </td>
                <td className="px-6 py-4">
                  {fee.isActive === 1 ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-xs font-bold">نشط ومتاح</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-bold">موقوف مؤقتاً</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEditFeeType(fee)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition cursor-pointer"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeeType(fee.id!)}
                      className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-lg transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
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
