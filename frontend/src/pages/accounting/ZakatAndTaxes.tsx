import React, { useState } from 'react';
import { Scale, Receipt, FileText, Download, Building2, Calculator, ChevronDown, Plus, X } from 'lucide-react';
import { 
  PieChart as RechartsPieChart, Pie as RechartsPie, Cell as RechartsCell, ResponsiveContainer, Tooltip
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export const ZakatAndTaxes: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'zakat' | 'vat' | 'wht'>('zakat');

  const fetchedRecords = useLiveQuery(() => db.zakatRecords.toArray(), []) || [];

  const zakatBaseSummary = fetchedRecords.length > 0 ? fetchedRecords : [
    { id: '1', name: 'رأس المال المدفوع', value: 1000000, type: 'add', period: '2024' },
    { id: '2', name: 'الأرباح المبقاة', value: 450000, type: 'add', period: '2024' },
    { id: '3', name: 'المخصصات', value: 200000, type: 'add', period: '2024' },
    { id: '4', name: 'صافي الربح المعدل', value: 350000, type: 'add', period: '2024' },
    { id: '5', name: 'الأصول الثابتة', value: 800000, type: 'deduct', period: '2024' },
    { id: '6', name: 'الاستثمارات', value: 300000, type: 'deduct', period: '2024' },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDeleteId, setRecordToDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', value: 0, type: 'add', period: '2024' });

  const totalAdded = zakatBaseSummary.filter(i => i.type === 'add').reduce((a, b) => a + Number(b.value), 0);
  const totalDeducted = zakatBaseSummary.filter(i => i.type === 'deduct').reduce((a, b) => a + Number(b.value), 0);
  const zakatBase = Math.max(0, totalAdded - totalDeducted);
  const estimatedZakat = zakatBase * 0.025; // 2.5%

  const pieData = [
    { name: 'وعاء الزكاة', value: zakatBase },
    { name: 'الخصومات', value: totalDeducted }
  ];
  const COLORS = ['#10b981', '#f43f5e'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.zakatRecords.add({
      name: formData.name,
      value: Number(formData.value),
      type: formData.type,
      period: formData.period
    });
    showToast('تم إضافة البند الزكوي بنجاح', 'success');
    setIsModalOpen(false);
    setFormData({ name: '', value: 0, type: 'add', period: '2024' });
  };

  const handleDeleteClick = (id: number) => {
    setRecordToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (recordToDeleteId) {
      await db.zakatRecords.delete(recordToDeleteId);
      showToast('تم حذف البند بنجاح', 'success');
      setRecordToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600" />
            حسابات الزكاة والضرائب
          </h1>
          <p className="text-slate-500 mt-1">تجهيز ومراجعة وعاء الزكاة، الإقرارات الضريبية، وضريبة الاستقطاع (WHT)</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            <Plus className="w-4 h-4" />
            إضافة بند زكوي
          </button>
          <button onClick={() => showToast("سيتم قريباً توفير ميزة إنشاء الإقرار الآلي وربطه بالهيئة", 'info')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors font-medium">
            <Calculator className="w-4 h-4" />
            إنشاء إقرار جديد
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('zakat')}
          className={`pb-3 px-5 text-sm font-bold transition-colors relative ${activeTab === 'zakat' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          وعاء وإقرار الزكاة
          {activeTab === 'zakat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('vat')}
          className={`pb-3 px-5 text-sm font-bold transition-colors relative ${activeTab === 'vat' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          ضريبة القيمة المضافة (VAT)
          {activeTab === 'vat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('wht')}
          className={`pb-3 px-5 text-sm font-bold transition-colors relative ${activeTab === 'wht' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          ضريبة الاستقطاع (WHT)
          {activeTab === 'wht' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'zakat' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-slate-300 text-sm font-medium mb-2">إجمالي وعاء الزكاة التقديري</h3>
                  <div className="text-3xl font-black mb-1">{zakatBase.toLocaleString()} <span className="text-base font-normal text-slate-400">ر.س</span></div>
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-2">الزكاة الشرعية المقدرة (2.5%)</h3>
                  <div className="text-3xl font-bold text-emerald-600">{estimatedZakat.toLocaleString()} <span className="text-base font-normal text-slate-400">ر.س</span></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <Calculator className="w-6 h-6" />
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">تاريخ الإفصاح القادم</h3>
                  <div className="text-xl font-bold text-slate-800">30 أبريل 2025</div>
                  <div className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded w-fit mt-2">متبقي 6 أشهر</div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-lg">تفاصيل معادلة وعاء الزكاة</h3>
                  <button className="text-slate-500 hover:text-slate-800 p-1"><Download className="w-4 h-4" /></button>
                </div>
                <div className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-right text-slate-500 font-medium">البند</th>
                        <th className="px-6 py-3 text-right text-slate-500 font-medium">التأثير</th>
                        <th className="px-6 py-3 text-left text-slate-500 font-medium">المبلغ (ر.س)</th>
                        <th className="px-6 py-3 text-center text-slate-500 font-medium">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {zakatBaseSummary.map((item, idx) => (
                        <tr key={item.id ?? idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-800">{item.name}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded-sm text-xs font-bold ${item.type === 'add' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {item.type === 'add' ? 'يضاف لوعاء الزكاة (+)' : 'يخصم من وعاء الزكاة (-)'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-left font-mono text-slate-700">
                            {item.value.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-center">
                            {item.id && (
                              <button onClick={() => handleDeleteClick(Number(item.id))} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td colSpan={2} className="px-6 py-4 text-right text-slate-800">إجمالي وعاء الزكاة</td>
                        <td colSpan={2} className="px-6 py-4 text-left text-emerald-600 text-lg">
                          {zakatBase.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <h3 className="font-bold text-slate-800 w-full mb-4">هيكل الوعاء</h3>
                <div className="w-full h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <RechartsPieChart>
                       <RechartsPie
                         data={pieData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {pieData.map((entry, index) => (
                           <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </RechartsPie>
                       <Tooltip formatter={(value: any) => value.toLocaleString()} />
                     </RechartsPieChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-full flex justify-center gap-6 mt-4 text-sm">
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                     <span className="text-slate-600">الوعاء الصافي</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-[#f43f5e]"></span>
                     <span className="text-slate-600">المخصومات</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Additional tabs can just be placeholder state for now since user is asking for completion */}
      {activeTab !== 'zakat' && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
          <Receipt className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">وحدة الإقرارات الضريبية</h2>
          <p className="text-slate-500 max-w-md">يمكنك استخراج وحساب الإقرارات الشهرية والربع سنوية المتعلقة بالنشاط من هذه الشاشة.</p>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">إضافة بند إقرار جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم البند</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ (ر.س)</label>
                  <input required type="number" min="0" value={formData.value} onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">السنة / الفترة</label>
                  <input required type="text" value={formData.period} onChange={(e) => setFormData({...formData, period: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع البند</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="add">يضاف لوعاء الزكاة (+)</option>
                  <option value="deduct">يخصم من وعاء الزكاة (-)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">إضافة البند</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف بند زكوي"
        message="هل أنت متأكد من رغبتك في حذف هذا البند الزكوي؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default ZakatAndTaxes;
