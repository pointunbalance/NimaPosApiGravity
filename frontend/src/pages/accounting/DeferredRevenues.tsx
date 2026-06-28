import React, { useState } from 'react';
import { ArrowLeftRight, TrendingUp, CalendarDays, Receipt, Clock, FileCheck, Plus, X } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { initialDeferrals, amortizationSchedule } from './DeferredRevenuesData';

export const DeferredRevenues: React.FC = () => {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses'>('revenues');
  const fetchedDeferrals = useLiveQuery(() => db.deferredRevenues.toArray(), []) || [];
  
  const deferrals = fetchedDeferrals.length > 0 ? fetchedDeferrals : initialDeferrals;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ type: 'revenues', description: '', reference: '', totalAmount: 0, periodMonths: 1 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentRevenues = deferrals.filter(d => d.type === 'revenues').reduce((sum, d) => sum + d.remainingAmount, 0);
  const currentExpenses = deferrals.filter(d => d.type === 'expenses').reduce((sum, d) => sum + d.remainingAmount, 0);
  const displayedItems = deferrals.filter(d => d.type === activeTab);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const existing = deferrals.find(d => Number(d.id) === editingId);
        const consumedMonths = existing && existing.totalAmount !== existing.remainingAmount
          ? (existing.totalAmount - existing.remainingAmount) / (existing.totalAmount / existing.periodMonths)
          : 0;
        
        const newMonthlyAmount = Number(formData.totalAmount) / Number(formData.periodMonths);
        const newRemainingAmount = Number(formData.totalAmount) - (consumedMonths * newMonthlyAmount);

        await db.deferredRevenues.update(editingId, {
          type: formData.type as 'revenues' | 'expenses',
          description: formData.description,
          reference: formData.reference,
          totalAmount: Number(formData.totalAmount),
          remainingAmount: newRemainingAmount > 0 ? newRemainingAmount : 0,
          periodMonths: Number(formData.periodMonths),
          monthlyAmount: newMonthlyAmount
        });
        success('تم تحديث بيانات التسوية بنجاح');
      } else {
        await db.deferredRevenues.add({
          type: formData.type as 'revenues' | 'expenses',
          description: formData.description,
          reference: formData.reference,
          totalAmount: Number(formData.totalAmount),
          remainingAmount: Number(formData.totalAmount),
          periodMonths: Number(formData.periodMonths),
          monthlyAmount: Number(formData.totalAmount) / Number(formData.periodMonths),
          lastAmortization: '-'
        });
        success('تمت إضافة التسوية الجديدة بنجاح');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ type: activeTab, description: '', reference: '', totalAmount: 0, periodMonths: 1 });
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      type: item.type,
      description: item.description,
      reference: item.reference,
      totalAmount: item.totalAmount,
      periodMonths: item.periodMonths
    });
    setEditingId(Number(item.id));
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await db.deferredRevenues.delete(deleteId);
      success('تم حذف التسوية المحددة بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حذف التسوية');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-xs">
              <ArrowLeftRight className="w-8 h-8" />
            </div>
            الإيرادات والمصروفات المقدمة
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">إدارة وإطفاء الإيرادات غير المكتسبة والمصاريف المدفوعة مقدماً عبر الفترات المالية بدقة تامة</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingId(null); setFormData(f => ({...f, type: activeTab, description: '', reference: '', totalAmount: 0, periodMonths: 1})); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-xs">
            <Plus className="w-4 h-4" />
            إضافة جديد
          </button>
          <button className="flex items-center gap-2 bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-200 transition-colors font-bold shadow-xs">
            <FileCheck className="w-4 h-4" />
            تنفيذ قيود الإطفاء للشهر الحالي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 shrink-0 border border-emerald-100"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">رصيد الإيرادات المقدمة</p>
            <h4 className="text-xl font-bold text-slate-800 truncate mt-1">{currentRevenues.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">التزام (Liability)</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0 border border-blue-100"><Receipt className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">إيراد مستحق هذا الشهر</p>
            <h4 className="text-xl font-bold text-emerald-600 truncate mt-1">+ 38,500 <span className="text-xs text-emerald-600 font-normal">ر.س</span></h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">جاهز للإطفاء</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 shrink-0 border border-amber-100"><CalendarDays className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">رصيد المصاريف المقدمة</p>
            <h4 className="text-xl font-bold text-slate-800 truncate mt-1">{currentExpenses.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ر.س</span></h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">أصل متداول (Asset)</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-4">
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600 shrink-0 border border-rose-100"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-semibold">مصروف يخص هذا الشهر</p>
            <h4 className="text-xl font-bold text-rose-600 truncate mt-1">- 15,200 <span className="text-xs text-rose-600 font-normal">ر.س</span></h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">مجدول للإطفاء</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">جدول إطفاء الإيرادات والمصروفات المقدمة المستقبلي</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={amortizationSchedule} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`${value} ر.س`]} />
              <Legend iconType="circle" />
              <Area type="monotone" dataKey="revenue" name="إطفاء الإيرادات" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expense" name="إطفاء المصروفات" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="flex gap-2 border-b border-slate-100 p-2 bg-slate-50/50">
          <button onClick={() => setActiveTab('revenues')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'revenues' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>سجلات الإيرادات المقدمة</button>
          <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'expenses' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}>سجلات المصروفات المقدمة</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">الوصف / العقد</th>
                <th className="px-6 py-4 font-bold">القيمة الإجمالية</th>
                <th className="px-6 py-4 font-bold">الرصيد المتبقي</th>
                <th className="px-6 py-4 font-bold">فترة الإطفاء</th>
                <th className="px-6 py-4 font-bold">القسط الشهري</th>
                <th className="px-6 py-4 font-bold">تاريخ آخر إطفاء</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{item.description}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{item.reference}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-mono">{item.totalAmount.toLocaleString()} ر.س</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-600 font-mono">{item.remainingAmount.toLocaleString()} ر.س</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">{item.periodMonths} شهر</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 font-mono">{item.monthlyAmount.toLocaleString()} ر.س</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">{item.lastAmortization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                       <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition font-semibold text-xs">تعديل</button>
                       {item.id && <button onClick={() => setDeleteId(Number(item.id))} className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl transition font-semibold text-xs">حذف</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">{editingId ? 'تعديل بيانات التسوية' : 'إضافة تسوية جديدة'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ type: activeTab, description: '', reference: '', totalAmount: 0, periodMonths: 1 }); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 text-sm font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">النوع</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="revenues">إيراد مقدم (التزام)</option>
                  <option value="expenses">مصروف مقدم (أصل)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">الوصف / العقد</label>
                <input required type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">رقم المرجع (الفاتورة / المستند)</label>
                <input required type="text" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">القيمة الإجمالية</label>
                    <input required type="number" min="0" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">فترة الإطفاء (الأشهر)</label>
                    <input required type="number" min="1" value={formData.periodMonths} onChange={(e) => setFormData({...formData, periodMonths: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 font-bold">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-xs">حفظ</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ type: activeTab, description: '', reference: '', totalAmount: 0, periodMonths: 1 }); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          title="حذف تسوية مقدمة"
          message="هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي من النظام؟"
          onConfirm={executeDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default DeferredRevenues;
