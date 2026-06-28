import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../../db';

interface TransportSubscribersTabProps {
  subscribers: any[];
  getStudentName: (id: number) => string;
  getRouteName: (id: number) => string;
  setSubFormData: (val: any) => void;
  setSubModalOpen: (val: boolean) => void;
}

export const TransportSubscribersTab: React.FC<TransportSubscribersTabProps> = ({
  subscribers,
  getStudentName,
  getRouteName,
  setSubFormData,
  setSubModalOpen,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">الأطفال المشتركين بالباص</h2>
        <button
          onClick={() => {
            setSubFormData({ studentId: 0, routeId: 0, type: 'both', stopName: '' });
            setSubModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> إضافة اشتراك لطالب
        </button>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-xl max-w-4xl mx-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-right">
            <tr>
              <th className="p-4">اسم الطالب</th>
              <th className="p-4">الخط</th>
              <th className="p-4">نوع الاشتراك</th>
              <th className="p-4">نقطة التجمع (الركوب/النزول)</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">{getStudentName(sub.studentId)}</td>
                <td className="p-4 font-bold text-indigo-600 bg-indigo-50/30">
                  {getRouteName(sub.routeId)}
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                    {sub.type === 'both' ? 'ذهاب وعودة' : sub.type === 'morning' ? 'ذهاب فقط' : 'عودة فقط'}
                  </span>
                </td>
                <td className="p-4 text-slate-600 font-medium">{sub.stopName || '-'}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={async () => {
                      if (confirm('حذف اشتراك الطالب بالباص؟')) {
                        await db.transportSubscribers.delete(sub.id!);
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold p-1 bg-rose-50 rounded-md inline-block cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                  لا يوجد مشتركين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TransportSubscribersTab;
