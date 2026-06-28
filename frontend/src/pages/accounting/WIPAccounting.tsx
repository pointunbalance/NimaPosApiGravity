import React, { useState } from 'react';
import { Factory, Cog, AlertCircle, Wrench, BarChart2, Plus, X } from 'lucide-react';
import { 
  BarChart as RechartsBarChart, Bar as RechartsBar, XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltipComponent, Legend as RechartsLegend, ResponsiveContainer
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const WIPAccounting: React.FC = () => {
  const { success, error: showError } = useToast();
  const fetchedOrders = useLiveQuery(() => db.wipRecords.toArray(), []) || [];

  const chartData = fetchedOrders.length > 0 ? fetchedOrders : [
    { id: '1', orderId: 'أمر #1201', productName: 'طقم كنب مكتبي فخم', materials: 4000, labor: 2400, overhead: 1200 },
    { id: '2', orderId: 'أمر #1202', productName: 'طقم كنب مكتبي فخم', materials: 3000, labor: 1398, overhead: 800 },
    { id: '3', orderId: 'أمر #1203', productName: 'طقم كنب مكتبي فخم', materials: 2000, labor: 9800, overhead: 3000 },
    { id: '4', orderId: 'أمر #1204', productName: 'طقم كنب مكتبي فخم', materials: 2780, labor: 3908, overhead: 2000 },
  ];

  const totalMaterials = chartData.reduce((acc, curr) => acc + curr.materials, 0);
  const totalLabor = chartData.reduce((acc, curr) => acc + curr.labor, 0);
  const totalOverhead = chartData.reduce((acc, curr) => acc + curr.overhead, 0);
  const totalWIP = totalMaterials + totalLabor + totalOverhead;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ orderId: '', productName: '', materials: 0, labor: 0, overhead: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.wipRecords.update(editingId, {
          orderId: formData.orderId,
          productName: formData.productName,
          materials: Number(formData.materials),
          labor: Number(formData.labor),
          overhead: Number(formData.overhead)
        });
        success('تم تحديث بيانات الإنتاج تحت التشغيل بنجاح');
      } else {
        await db.wipRecords.add({
          orderId: formData.orderId,
          productName: formData.productName,
          materials: Number(formData.materials),
          labor: Number(formData.labor),
          overhead: Number(formData.overhead)
        });
        success('تمت إضافة أمر إنتاج جديد بنجاح');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ orderId: '', productName: '', materials: 0, labor: 0, overhead: 0 });
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleEdit = (row: any) => {
    setFormData({
      orderId: row.orderId || row.name,
      productName: row.productName || 'طقم كنب مكتبي',
      materials: row.materials,
      labor: row.labor,
      overhead: row.overhead
    });
    setEditingId(Number(row.id));
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await db.wipRecords.delete(deleteId);
      success('تم حذف أمر الإنتاج تحت التشغيل بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حذف السجل');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-xs">
              <Factory className="w-8 h-8 text-orange-600" />
            </div>
            حسابات الإنتاج تحت التشغيل (WIP)
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">تتبع التكاليف المباشرة وغير المباشرة المحملة على أوامر التصنيع غير المكتملة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-slate-500 text-sm font-semibold">إجمالي التكاليف تحت التشغيل (WIP Value)</p>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-slate-800">{totalWIP.toLocaleString()} <span className="text-sm text-slate-500 font-normal">ر.س</span></h4>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-slate-500 text-sm font-semibold">مواد مباشرة (Direct Materials)</p>
          <div className="mt-4 flex items-end justify-between">
            <h4 className="text-2xl font-bold text-blue-600 font-mono">{totalMaterials.toLocaleString()} <span className="text-xs font-normal">ر.س</span></h4>
            <Cog className="w-6 h-6 text-blue-100" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-slate-500 text-sm font-semibold">أجور مباشرة (Direct Labor)</p>
          <div className="mt-4 flex items-end justify-between">
            <h4 className="text-2xl font-bold text-emerald-600 font-mono">{totalLabor.toLocaleString()} <span className="text-xs font-normal">ر.س</span></h4>
            <Wrench className="w-6 h-6 text-emerald-100" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-slate-500 text-sm font-semibold">أعباء محملة (Applied Overhead)</p>
          <div className="mt-4 flex items-end justify-between">
            <h4 className="text-2xl font-bold text-amber-600 font-mono">{totalOverhead.toLocaleString()} <span className="text-xs font-normal">ر.س</span></h4>
            <AlertCircle className="w-6 h-6 text-amber-100" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">أوامر الإنتاج المفتوحة وتوزيع التكاليف</h3>
               <button onClick={() => { setEditingId(null); setFormData({ orderId: '', productName: '', materials: 0, labor: 0, overhead: 0 }); setIsModalOpen(true); }} className="flex items-center gap-2 text-sm text-indigo-600 font-bold hover:text-indigo-800">
                 <Plus className="w-4 h-4" />
                 إضافة أمر إنتاج
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">رقم الأمر</th>
                    <th className="px-5 py-3 font-semibold">المنتج المستهدف</th>
                    <th className="px-5 py-3 font-semibold">مواد</th>
                    <th className="px-5 py-3 font-semibold">أجور</th>
                    <th className="px-5 py-3 font-semibold">أعباء غير مباشرة</th>
                    <th className="px-5 py-3 font-bold text-slate-800">إجمالي التكلفة</th>
                    <th className="px-5 py-3 text-center font-bold text-slate-800">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.map((row, idx) => (
                     <tr key={row.id ?? idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-700">{row.orderId || (row as any).name}</td>
                        <td className="px-5 py-4 text-slate-600 font-medium">{row.productName || 'طقم كنب مكتبي'}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{row.materials.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{row.labor.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{row.overhead.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono font-bold text-indigo-600 whitespace-nowrap bg-indigo-50/30">
                          {(row.materials + row.labor + row.overhead).toLocaleString()} ر.س
                        </td>
                        <td className="px-5 py-4 text-center">
                           <div className="flex items-center justify-center gap-1.5">
                             <button onClick={() => handleEdit(row)} className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">تعديل</button>
                             {row.id && <button onClick={() => setDeleteId(Number(row.id))} className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">حذف</button>}
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
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              هيكل تكاليف الأوامر التشغيلية
            </h3>
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData.map(d => ({...d, name: d.orderId || (d as any).name}))} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <RechartsCartesianGrid strokeDasharray="3 3" horizontal={false} />
                     <RechartsXAxis type="number" hide />
                     <RechartsYAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                     <RechartsTooltipComponent formatter={(value: any) => [`${value.toLocaleString()} ر.س`]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <RechartsLegend />
                     <RechartsBar dataKey="materials" name="مواد" stackId="a" fill="#3b82f6" />
                     <RechartsBar dataKey="labor" name="أجور" stackId="a" fill="#10b981" />
                     <RechartsBar dataKey="overhead" name="أعباء" stackId="a" fill="#f59e0b" />
                  </RechartsBarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">{editingId ? 'تعديل أمر الإنتاج' : 'إضافة أمر إنتاج / تحديث WIP'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ orderId: '', productName: '', materials: 0, labor: 0, overhead: 0 }); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">رقم الأمر</label>
                  <input required type="text" value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">اسم المنتج</label>
                  <input required type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">مواد مباشرة</label>
                  <input required type="number" min="0" value={formData.materials} onChange={(e) => setFormData({...formData, materials: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">أجور مباشرة</label>
                  <input required type="number" min="0" value={formData.labor} onChange={(e) => setFormData({...formData, labor: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">أعباء محملة</label>
                  <input required type="number" min="0" value={formData.overhead} onChange={(e) => setFormData({...formData, overhead: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 font-bold">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-xs">{editingId ? 'حفظ التعديل' : 'إضافة سجل الإنتاج'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ orderId: '', productName: '', materials: 0, labor: 0, overhead: 0 }); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          title="حذف سجل الإنتاج"
          message="هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً من النظام؟"
          onConfirm={executeDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default WIPAccounting;
