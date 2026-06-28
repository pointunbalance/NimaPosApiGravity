import React from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../../db';

interface StaffDirectoryTabProps {
  filteredStaff: any[];
  classes: any[];
  search: string;
  setSearch: (s: string) => void;
  selectedRole: string;
  setSelectedRole: (r: string) => void;
  rolesList: string[];
  handleOpenModal: (editMode: boolean, item?: any) => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

export const StaffDirectoryTab: React.FC<StaffDirectoryTabProps> = ({
  filteredStaff,
  classes,
  search,
  setSearch,
  selectedRole,
  setSelectedRole,
  rolesList,
  handleOpenModal,
  openConfirm,
  success,
  error,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]" dir="rtl">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">بيانات الموظفين، وأذونات الدخول</h2>
        <button
          onClick={() => handleOpenModal(false)}
          type="button"
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 font-bold transition"
        >
          <Plus className="w-4 h-4" /> إضافة موظف
        </button>
      </div>
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الموظف أو الهاتف..."
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none font-bold text-slate-700"
          >
            <option value="">جميع الوظائف</option>
            {rolesList.map((role, idx) => (
              <option key={idx} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200 text-right">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الموظف / الوظيفة</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الجوال والوصول</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الراتب الأساسي</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                  لا يوجد موظفين مسجلين
                </td>
              </tr>
            ) : (
              filteredStaff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-base font-black text-slate-800">{emp.name}</div>
                    <div className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded w-max mt-1">
                      {emp.role}
                    </div>
                    {emp.role === 'معلم/ة' && classes.some((c) => c.teacherId === emp.id) && (
                      <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 w-max">
                        فصل: {classes.find((c) => c.teacherId === emp.id)?.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-500 font-mono tracking-wider">
                      {emp.phone || 'لا يوجد'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      الدخول برمز: <strong className="text-slate-700">{emp.pin}</strong>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-rose-600">
                    {emp.baseSalary || 0} ج.م
                  </td>
                  <td className="px-6 py-4">
                    {emp.isActive ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md w-max">
                        نشط ويعمل
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-md w-max">
                        موقوف/مستقيل
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenModal(true, emp)}
                        type="button"
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          openConfirm(
                            'تأكيد حذف الموظف',
                            `هل أنت متأكد من رغبتك في حذف الموظف "${emp.name}" نهائياً من سجل المدرسة؟`,
                            async () => {
                              try {
                                await db.users.delete(emp.id!);
                                success('تم حذف الموظف من السجلات بنجاح');
                              } catch (err) {
                                error('حدث خطأ أثناء محاولة الحذف');
                              }
                            }
                          );
                        }}
                        type="button"
                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"
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
    </div>
  );
};
export default StaffDirectoryTab;
