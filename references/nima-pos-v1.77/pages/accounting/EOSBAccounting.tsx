import React, { useState } from 'react';
import { Users, Banknote, ShieldAlert, ArrowRightLeft, UserCheck, Plus, X } from 'lucide-react';
import { 
  AreaChart as RechartsAreaChart, Area as RechartsArea, XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const EOSBAccounting: React.FC = () => {
  const { success, error: showError } = useToast();
  const fetchedRecords = useLiveQuery(() => db.eosbRecords.toArray(), []) || [];

  const employeeRecords = fetchedRecords.length > 0 ? fetchedRecords : [
    { id: '1', employeeName: 'رومان كوزا', serviceYears: 8.5, eosbBalance: 85000, leaveBalanceDays: 45 },
    { id: '2', employeeName: 'ياروسلاف بوهدان', serviceYears: 12.1, eosbBalance: 142500, leaveBalanceDays: 12 },
    { id: '3', employeeName: 'سفيتلانا أولينك', serviceYears: 5.2, eosbBalance: 45000, leaveBalanceDays: 60 }
  ];

  const totalEOSB = employeeRecords.reduce((acc, curr) => acc + curr.eosbBalance, 0);
  const totalLeavesValue = employeeRecords.reduce((acc, curr) => acc + (curr.leaveBalanceDays * 200), 0); // Mock value calculation if exact rate is unknown
  const totalLeavesDays = employeeRecords.reduce((acc, curr) => acc + curr.leaveBalanceDays, 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ employeeName: '', serviceYears: 0, eosbBalance: 0, leaveBalanceDays: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const chartData = [
    { name: '2020', eosb: 250000, leaves: 80000 },
    { name: '2021', eosb: 320000, leaves: 95000 },
    { name: '2022', eosb: 410000, leaves: 110000 },
    { name: '2023', eosb: 550000, leaves: 150000 },
    { name: '2024', eosb: totalEOSB, leaves: totalLeavesValue },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.eosbRecords.update(editingId, {
          employeeName: formData.employeeName,
          serviceYears: Number(formData.serviceYears),
          eosbBalance: Number(formData.eosbBalance),
          leaveBalanceDays: Number(formData.leaveBalanceDays)
        });
        success('تم تحديث بيانات مخصصات الموظف بنجاح');
      } else {
        await db.eosbRecords.add({
          employeeName: formData.employeeName,
          serviceYears: Number(formData.serviceYears),
          eosbBalance: Number(formData.eosbBalance),
          leaveBalanceDays: Number(formData.leaveBalanceDays)
        });
        success('تمت إضافة مخصص الموظف الجديد بنجاح');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ employeeName: '', serviceYears: 0, eosbBalance: 0, leaveBalanceDays: 0 });
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleEdit = (emp: any) => {
    setFormData({
      employeeName: emp.employeeName,
      serviceYears: emp.serviceYears,
      eosbBalance: emp.eosbBalance,
      leaveBalanceDays: emp.leaveBalanceDays
    });
    setEditingId(Number(emp.id));
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await db.eosbRecords.delete(deleteId);
      success('تم حذف مخصص الموظف المختار بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حذف المخصص');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-xs">
              <Users className="w-8 h-8" />
            </div>
            مخصصات الموظفين (Accruals & EOSB)
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">إدارة مخصصات نهاية الخدمة (EOSB)، الإجازات، وتذاكر السفر وتكوينها محاسبياً بشكل دوري</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl border border-teal-100/50">
                     <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-slate-500 text-sm font-semibold">مخصص مكافأة نهاية الخدمة (EOSB)</p>
                     <h3 className="text-2xl font-black text-slate-800 mt-1">{totalEOSB.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h3>
                  </div>
              </div>
              <p className="text-xs text-teal-700 bg-teal-50/60 border border-teal-100/40 px-2.5 py-1 rounded-lg inline-block font-bold">المخصص المطابق لآخر تحديث</p>
         </div>
         
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100/50">
                     <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-slate-500 text-sm font-semibold">مخصص الإجازات المستحقة</p>
                     <h3 className="text-2xl font-black text-slate-800 mt-1">{totalLeavesValue.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h3>
                  </div>
              </div>
              <p className="text-xs text-sky-700 bg-sky-50/60 border border-sky-100/40 px-2.5 py-1 rounded-lg inline-block font-bold font-mono">ما يعادل {totalLeavesDays} يوم إجازة</p>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs border-l-4 border-l-rose-500">
              <p className="text-slate-500 text-sm font-semibold mb-1">العبء الشهري الحالي (المصروف المكون)</p>
              <h3 className="text-3xl font-black text-slate-800 mb-2">{(totalEOSB * 0.05).toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س / شهر</span></h3>
              <div className="flex items-center text-xs text-slate-500 font-semibold">
                <ArrowRightLeft className="w-3.5 h-3.5 ml-1 text-slate-400" />
                يتم تحميله على مراكز التكلفة تلقائياً
              </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
               <UserCheck className="w-5 h-5 text-indigo-500" />
               تطور أرصدة المخصصات خلال 5 سنوات
            </h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEosb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <RechartsXAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsYAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsCartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ر.س`]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <RechartsArea type="monotone" dataKey="eosb" name="نهاية الخدمة" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorEosb)" />
                    <RechartsArea type="monotone" dataKey="leaves" name="الإجازات" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorLeaves)" />
                  </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="font-bold text-slate-800">توزيع مخصصات الموظفين النشطين</h3>
               <button onClick={() => { setEditingId(null); setFormData({ employeeName: '', serviceYears: 0, eosbBalance: 0, leaveBalanceDays: 0 }); setIsModalOpen(true); }} className="flex items-center gap-2 text-sm text-indigo-600 font-bold hover:text-indigo-800">
                 <Plus className="w-4 h-4" />
                 إضافة مخصص موظف
               </button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">اسم الموظف</th>
                    <th className="px-5 py-3 font-semibold">سنوات الخدمة</th>
                    <th className="px-5 py-3 font-semibold">رصيد EOSB</th>
                    <th className="px-5 py-3 font-semibold">إجازات متراكمة</th>
                    <th className="px-5 py-3 font-semibold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {employeeRecords.map((emp, idx) => (
                     <tr key={emp.id ?? idx} className="hover:bg-slate-50/40 transition-colors">
                       <td className="px-5 py-4 font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                            {emp.employeeName.substring(0, 2)}
                          </div>
                          {emp.employeeName}
                       </td>
                       <td className="px-5 py-4 text-slate-600 font-medium">{emp.serviceYears} سنوات</td>
                       <td className="px-5 py-4 font-mono text-slate-800 font-bold">{emp.eosbBalance.toLocaleString()} ر.س</td>
                       <td className="px-5 py-4 font-mono text-slate-600 font-medium">{emp.leaveBalanceDays} يوم</td>
                       <td className="px-5 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5">
                           <button onClick={() => handleEdit(emp)} className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">تعديل</button>
                           {emp.id && <button onClick={() => setDeleteId(Number(emp.id))} className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">حذف</button>}
                         </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
         </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">{editingId ? 'تعديل بيانات الموظف' : 'إضافة مخصص موظف'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ employeeName: '', serviceYears: 0, eosbBalance: 0, leaveBalanceDays: 0 }); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 text-sm font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">اسم الموظف</label>
                <input required type="text" value={formData.employeeName} onChange={(e) => setFormData({...formData, employeeName: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">سنوات الخدمة</label>
                  <input required type="number" step="0.1" min="0" value={formData.serviceYears} onChange={(e) => setFormData({...formData, serviceYears: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">رصيد الإجازات (أيام)</label>
                  <input required type="number" min="0" value={formData.leaveBalanceDays} onChange={(e) => setFormData({...formData, leaveBalanceDays: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">رصيد مكافأة نهاية الخدمة (EOSB)</label>
                <input required type="number" min="0" value={formData.eosbBalance} onChange={(e) => setFormData({...formData, eosbBalance: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 font-bold">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-xs">{editingId ? 'تعديل' : 'إضافة المخصص'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ employeeName: '', serviceYears: 0, eosbBalance: 0, leaveBalanceDays: 0 }); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          title="حذف مخصص الموظف"
          message="هل أنت متأكد من رغبتك في حذف مخصصات هذا الموظف نهائياً من النظام؟"
          onConfirm={executeDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default EOSBAccounting;
