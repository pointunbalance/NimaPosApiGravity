import React, { useState } from "react";
import {
  Coins,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Receipt,
  Plus,
  X,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
  Tooltip as RechartsTooltipComponent,
  Legend as RechartsLegend,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ui/ConfirmModal";

export const PartnersEquity: React.FC = () => {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', percentage: 0, initialAmount: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const partners = useLiveQuery(() => db.partnerEquities.toArray(), []) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
         await db.partnerEquities.update(editingId, {
           name: formData.name,
           value: Number(formData.percentage),
           amount: Number(formData.initialAmount)
         });
         success('تم تحديث مساهمة الشريك بنجاح');
      } else {
        await (db as any).transaction('rw', db.partnerEquities, db.journalEntries, db.accounts, async () => {
          const newPartnerId = await db.partnerEquities.add({
            name: formData.name,
            value: Number(formData.percentage),
            amount: Number(formData.initialAmount),
            date: new Date().toISOString()
          });

          // Accounting Integration
          if (Number(formData.initialAmount) > 0) {
            const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
            const capitalAccount = await db.accounts.where('code').equals('3010').first(); // رأس المال
            
            if (cashAccount && capitalAccount) {
              const AccountingEngine = (await import('../../services/AccountingEngine')).AccountingEngine;
              await AccountingEngine.postEntry({
                date: new Date(),
                reference: `CAP-${newPartnerId}`,
                description: `مساهمة رأس مال من الشريك ${formData.name}`,
                lines: [
                  { accountId: cashAccount.id!, accountName: cashAccount.name, debit: Number(formData.initialAmount), credit: 0, description: `إيداع رأس مال` },
                  { accountId: capitalAccount.id!, accountName: capitalAccount.name, debit: 0, credit: Number(formData.initialAmount), description: `إثبات رأس المال للشريك ${formData.name}` }
                ]
              });
            }
          }
        });
        success('تمت إضافة مساهمة الشريك الجديد بنجاح');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', percentage: 0, initialAmount: 0 });
    } catch (error) {
      console.error("Error creating partner equity:", error);
      showError('حدث خطأ أثناء حفظ مساهمة الشريك');
    }
  };

  const handleEdit = (p: any) => {
    setFormData({
      name: p.name,
      percentage: p.value,
      initialAmount: p.amount
    });
    setEditingId(Number(p.id));
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await db.partnerEquities.delete(deleteId);
      success('تم حذف مساهمة الشريك بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حذف المساهمة');
    }
    setDeleteId(null);
  };

  const totalCapital = partners.reduce((sum, p) => sum + p.amount, 0);

  const defaultPartners = partners.length > 0 ? partners : [
    { name: "الشريك الأول (ياروسلاف)", value: 60, amount: 600000 },
    { name: "الشريك الثاني (رومان)", value: 30, amount: 300000 },
    { name: "الشريك الثالث (أندري)", value: 10, amount: 100000 },
  ];

  const recentTransactions = [
    { type: 'withdrawal', partnerName: 'الشريك الأول (ياروسلاف)', description: 'سلفة على حساب الأرباح', amount: 15000, date: '12 مايو 2024' },
    { type: 'distribution', partnerName: 'الكل', description: 'توزيع أرباح ربع سنوي', amount: 120000, date: '31 مارس 2024' },
    { type: 'withdrawal', partnerName: 'الشريك الثاني (رومان)', description: 'سحب مخصص', amount: 30000, date: '10 مارس 2024' }
  ];

  const totalDisplayCapital = defaultPartners.reduce((s, p) => s + p.amount, 0);

  const COLORS = ["#3f83f8", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-xs">
              <Coins className="w-8 h-8 text-amber-600" />
            </div>
            حسابات الشركاء وتوزيع الأرباح
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            حقوق الملكية، المسحوبات الشخصية، وتوزيع الأرباح والخسائر للشركاء
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', percentage: 0, initialAmount: 0 }); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            إضافة شريك / مساهمة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-slate-500 text-sm font-semibold mb-2">إجمالي رأس المال</h3>
          <div className="text-3xl font-black text-slate-800">{totalDisplayCapital.toLocaleString()} <span className="text-xs font-normal text-slate-500">ر.س</span></div>
          <div className="mt-2 text-xs text-slate-400 font-medium">رأس المال المدفوع بالكامل</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-slate-500 text-sm font-semibold mb-2">إجمالي المسحوبات (العام الحالي)</h3>
          <div className="text-3xl font-black text-rose-600">45,000 <span className="text-xs font-normal text-slate-500">ر.س</span></div>
          <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center">
            <ArrowDownRight className="w-4 h-4 text-rose-500 ml-1" />
            من الأرباح المبقاة للشريك
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-slate-500 text-sm font-semibold mb-2">الأرباح المبقاة (المتاحة للتوزيع)</h3>
          <div className="text-3xl font-black text-emerald-600">320,000 <span className="text-xs font-normal text-slate-500">ر.س</span></div>
          <div className="mt-2 text-xs text-emerald-500 font-semibold flex items-center">
            <Scale className="w-4 h-4 ml-1" />
            بعد استقطاع الاحتياطي النظامي
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">حصص الشركاء والمساهمات</h3>
          <div className="h-64 mb-4">
            <RechartsResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsPie
                  data={defaultPartners}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {defaultPartners.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPie>
                <RechartsTooltipComponent formatter={(val: any, name: any, props: any) => [`${props.payload.amount.toLocaleString()} ر.س`, `${val}% حصة`]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <RechartsLegend />
              </RechartsPieChart>
            </RechartsResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800">قائمة الشركاء</h3>
            <span className="text-indigo-600 text-sm font-bold">{defaultPartners.length} شركاء</span>
          </div>
          <div className="space-y-4 flex-1">
            {defaultPartners.map((p, idx) => (
              <div key={p.id ?? idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50/40 rounded-xl border border-slate-100 transition-colors">
                 <div>
                    <h4 className="font-bold text-slate-800">{p.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">حصة تعادل {p.value}% - رأس مال: {p.amount.toLocaleString()} ر.س</p>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">تعديل</button>
                    {p.id && <button onClick={() => setDeleteId(Number(p.id))} className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition">حذف</button>}
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800">سجل المعاملات الأخير</h3>
            <button className="text-indigo-600 text-sm font-bold hover:text-indigo-700">عرض الكل</button>
          </div>
          <div className="space-y-4">
            {recentTransactions.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50/40 rounded-xl border border-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  {transaction.type === 'withdrawal' ? (
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800">{transaction.partnerName}</h4>
                    <p className="text-xs text-slate-500 font-medium">{transaction.description}</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className={`font-bold font-mono ${transaction.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {transaction.amount.toLocaleString()} ر.س
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{transaction.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">{editingId ? 'تعديل مساهمة الشريك' : 'إضافة مساهمة شريك جديد'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: '', percentage: 0, initialAmount: 0 }); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 text-sm font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">اسم الشريك</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">الحصة (%)</label>
                  <input required type="number" min="0" max="100" value={formData.percentage} onChange={(e) => setFormData({...formData, percentage: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">رأس المال (ر.س)</label>
                  <input required type="number" min="0" value={formData.initialAmount} onChange={(e) => setFormData({...formData, initialAmount: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 font-bold">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-xs">{editingId ? 'حفظ التعديل' : 'إضافة الشريك'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: '', percentage: 0, initialAmount: 0 }); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          isOpen={!!deleteId}
          title="حذف مساهمة الشريك"
          message="هل أنت متأكد من رغبتك في حذف مساهمة هذا الشريك نهائياً من النظام؟"
          onConfirm={executeDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default PartnersEquity;
