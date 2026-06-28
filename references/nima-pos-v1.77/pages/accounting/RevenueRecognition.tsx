import React, { useState } from 'react';
import { FileCheck, ArrowUpRight, CheckCircle2, AlertCircle, BarChart3, Plus, X } from 'lucide-react';
import { 
  BarChart as RechartsBarChart, Bar as RechartsBar, XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltipComponent, Legend as RechartsLegend, ResponsiveContainer
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const RevenueRecognition: React.FC = () => {  
  const { success, error: showError } = useToast();
  const fetchedRecognitions = useLiveQuery(() => db.revenueRecognitions.toArray(), []) || [];

  const recognitions = fetchedRecognitions.length > 0 ? fetchedRecognitions : [
    { id: '1', contractId: 'عقد صيانة سنوي - #4421', totalValue: 120000, recognizedValue: 60000, deferredValue: 60000, completionPercentage: 50, status: 'مستمر' },
    { id: '2', contractId: 'توريد وتركيب أجهزة مشتركة', totalValue: 800000, recognizedValue: 600000, deferredValue: 200000, completionPercentage: 75, status: 'مستمر' }
  ];

  const chartData = [
    { name: 'الربع الأول', recognized: 450000, deferred: 200000 },
    { name: 'الربع الثاني', recognized: 600000, deferred: 150000 },
    { name: 'الربع الثالث', recognized: 750000, deferred: 300000 },
    { name: 'الربع الرابع', recognized: 900000, deferred: 100000 },
  ];

  const totalRecognized = recognitions.reduce((acc, current) => acc + current.recognizedValue, 0);
  const totalDeferred = recognitions.reduce((acc, current) => acc + current.deferredValue, 0);
  const totalUnbilled = 120000; // Static placeholder till specific table exists

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ contractId: '', totalValue: 0, completionPercentage: 0, status: 'مستمر' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recognizedValue = Number(formData.totalValue) * (Number(formData.completionPercentage) / 100);
      const deferredValue = Number(formData.totalValue) - recognizedValue;
      
      if (editingId) {
         await db.revenueRecognitions.update(editingId, {
           contractId: formData.contractId,
           totalValue: Number(formData.totalValue),
           recognizedValue: recognizedValue,
           deferredValue: deferredValue,
           completionPercentage: Number(formData.completionPercentage),
           status: formData.status
         });
         success('تم تحديث العقد والتزام الأداء بنجاح');
      } else {
         await db.revenueRecognitions.add({
           contractId: formData.contractId,
           totalValue: Number(formData.totalValue),
           recognizedValue: recognizedValue,
           deferredValue: deferredValue,
           completionPercentage: Number(formData.completionPercentage),
           status: formData.status
         });
         success('تمت إضافة العقد الجديد والتزام الأداء بنجاح');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ contractId: '', totalValue: 0, completionPercentage: 0, status: 'مستمر' });
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      contractId: item.contractId,
      totalValue: item.totalValue,
      completionPercentage: item.completionPercentage,
      status: item.status
    });
    setEditingId(Number(item.id));
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await db.revenueRecognitions.delete(deleteId);
      success('تم حذف العقد بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حذف العقد');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-xs">
              <FileCheck className="w-8 h-8" />
            </div>
            تحقق الإيرادات (Revenue Recognition)
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">تتبع التزامات الأداء والاعتراف بالإيراد بناءً على نسب الإنجاز حسب معيار (IFRS 15)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
              <p className="text-slate-500 text-sm font-semibold mb-1">الإيرادات المحققة (YTD)</p>
              <h3 className="text-3xl font-black text-slate-800 mb-2 mt-1">{totalRecognized.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h3>
              <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 w-fit px-2.5 py-1 rounded-lg font-bold border border-indigo-100/50 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                تم نقلها لقائمة الدخل
              </div>
         </div>
         
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
              <p className="text-slate-500 text-sm font-semibold mb-1">التزامات أداء غير منفذة (Deferred)</p>
              <h3 className="text-3xl font-black text-slate-800 mb-2 mt-1">{totalDeferred.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h3>
              <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-fit font-bold border border-amber-100/50 mt-1">
                <AlertCircle className="w-3.5 h-3.5 ml-1" />
                إيرادات غير مكتسبة (خصوم)
              </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
              <p className="text-slate-500 text-sm font-semibold mb-1">إيرادات مستحقة غير مفوترة</p>
              <h3 className="text-3xl font-black text-slate-800 mb-2 mt-1">{totalUnbilled.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h3>
              <div className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit font-bold border border-emerald-100/50 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                Unbilled Receivables (أصول)
              </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="font-bold text-slate-800">العقود ونسب الإنجاز (POC)</h3>
               <button onClick={() => { setEditingId(null); setFormData({ contractId: '', totalValue: 0, completionPercentage: 0, status: 'مستمر' }); setIsModalOpen(true); }} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  إضافة عقد والتزام
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-bold">رقم العقد/المشروع</th>
                    <th className="px-5 py-4 font-bold">القيمة الإجمالية</th>
                    <th className="px-5 py-4 font-bold">نسبة الإنجاز</th>
                    <th className="px-5 py-4 font-bold">الإيراد المعترف به</th>
                    <th className="px-5 py-4 font-bold">المتبقي (التزام)</th>
                    <th className="px-5 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {recognitions.map((item, idx) => (
                     <tr key={item.id ?? idx} className="hover:bg-slate-50/40 transition-colors">
                       <td className="px-5 py-4 font-bold text-slate-800">{item.contractId}</td>
                       <td className="px-5 py-4 text-slate-600 font-mono">{item.totalValue.toLocaleString()} ر.س</td>
                       <td className="px-5 py-4">
                         <div className="flex items-center gap-2">
                           <div className="w-24 bg-slate-100 rounded-full h-2">
                             <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${item.completionPercentage}%` }}></div>
                           </div>
                           <span className="text-xs text-slate-500 font-bold font-mono">{item.completionPercentage}%</span>
                         </div>
                       </td>
                       <td className="px-5 py-4 font-bold text-emerald-600 font-mono">{item.recognizedValue.toLocaleString()} ر.س</td>
                       <td className="px-5 py-4 font-bold text-amber-600 font-mono">{item.deferredValue.toLocaleString()} ر.س</td>
                       <td className="px-5 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5">
                           <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">تعديل</button>
                           {item.id && <button onClick={() => setDeleteId(Number(item.id))} className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">حذف</button>}
                         </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              تدرج إثبات الإيراد
            </h3>
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <RechartsCartesianGrid strokeDasharray="3 3" vertical={false} />
                     <RechartsXAxis dataKey="name" fontSize={12} tick={{fill: '#64748b'}} />
                     <RechartsYAxis fontSize={12} tickFormatter={(v) => `${v/1000}k`} tick={{fill: '#64748b'}} />
                     <RechartsTooltipComponent formatter={(val) => `${val.toLocaleString()} ر.س`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <RechartsLegend wrapperStyle={{ fontSize: '12px' }} />
                     <RechartsBar dataKey="recognized" name="إيراد محقق" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                     <RechartsBar dataKey="deferred" name="إيراد مؤجل" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">{editingId ? 'تعديل المعترف به' : 'إضافة نسبة إنجاز وعقد'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ contractId: '', totalValue: 0, completionPercentage: 0, status: 'مستمر' }); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 text-sm font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">رقم/اسم العقد</label>
                <input required type="text" value={formData.contractId} onChange={(e) => setFormData({...formData, contractId: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">القيمة الإجمالية</label>
                  <input required type="number" min="0" value={formData.totalValue} onChange={(e) => setFormData({...formData, totalValue: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">نسبة الإنجاز (%)</label>
                  <input required type="number" min="0" max="100" value={formData.completionPercentage} onChange={(e) => setFormData({...formData, completionPercentage: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">الحالة</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="مستمر">مستمر</option>
                  <option value="مكتمل">مكتمل</option>
                  <option value="متوقف">متوقف</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 font-bold">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-xs">{editingId ? 'تعديل' : 'تأكيد الإضافة'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ contractId: '', totalValue: 0, completionPercentage: 0, status: 'مستمر' }); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          title="حذف عقد تحقق إيراد"
          message="هل أنت متأكد من رغبتك في حذف هذا العقد نهائياً من النظام؟"
          onConfirm={executeDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default RevenueRecognition;
