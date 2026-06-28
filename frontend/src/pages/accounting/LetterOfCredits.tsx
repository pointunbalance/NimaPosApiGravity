import React, { useState } from 'react';
import { FileSignature, ShieldCheck, ArrowRightLeft, Landmark, Search, Plus, X } from 'lucide-react';
import { 
  BarChart as RechartsBarChart, Bar as RechartsBar, XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltipComponent, Legend as RechartsLegend, ResponsiveContainer as RechartsResponsiveContainer
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const LetterOfCredits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lcs' | 'lgs'>('lcs');

  const fetchedLocs = useLiveQuery(() => db.letterOfCredits.toArray(), []) || [];

  const locs = fetchedLocs.length > 0 ? fetchedLocs : [
    { id: '1', type: 'lcs', reference: 'LC-2024-089', bank: 'مصرف الراجحي', beneficiary: 'شركة المورد العالمية', amount: 450000, margin: '20%', dueDate: '2024-12-31', status: 'ساري' },
    { id: '2', type: 'lcs', reference: 'LC-2024-090', bank: 'البنك الأهلي', beneficiary: 'مصنع الحديد والصلب', amount: 800000, margin: '100%', dueDate: '2024-06-15', status: 'يستحق قريباً' },
    { id: '3', type: 'lgs', reference: 'LG-2024-012', bank: 'مصرف الراجحي', beneficiary: 'وزارة الإسكان', amount: 450000, margin: '20%', dueDate: '2024-12-31', status: 'ساري' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [locToDeleteId, setLocToDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ type: 'lcs', reference: '', bank: '', beneficiary: '', amount: 0, margin: '10%', dueDate: '', status: 'ساري' });

  const chartData = [
    { name: 'الربع الأول', lcs: 450000, lgs: 200000 },
    { name: 'الربع الثاني', lcs: 600000, lgs: 250000 },
    { name: 'الربع الثالث', lcs: 300000, lgs: 400000 },
    { name: 'الربع الرابع', lcs: 800000, lgs: 350000 },
  ];

  const totalLCs = locs.filter(l => l.type === 'lcs').reduce((sum, l) => sum + l.amount, 0);
  const totalLGs = locs.filter(l => l.type === 'lgs').reduce((sum, l) => sum + l.amount, 0);

  const displayedLocs = locs.filter(l => l.type === activeTab && (l.reference.includes(searchTerm) || l.bank.includes(searchTerm)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.letterOfCredits.update(editingId, {
        type: formData.type as 'lcs'|'lgs',
        reference: formData.reference,
        bank: formData.bank,
        beneficiary: formData.beneficiary,
        amount: Number(formData.amount),
        margin: formData.margin,
        dueDate: formData.dueDate,
        status: formData.status
      });
    } else {
      await db.letterOfCredits.add({
        type: formData.type as 'lcs'|'lgs',
        reference: formData.reference,
        bank: formData.bank,
        beneficiary: formData.beneficiary,
        amount: Number(formData.amount),
        margin: formData.margin,
        dueDate: formData.dueDate,
        status: formData.status
      });
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ type: activeTab, reference: '', bank: '', beneficiary: '', amount: 0, margin: '10%', dueDate: '', status: 'ساري' });
  };

  const handleEdit = (l: any) => {
    setFormData({
      type: l.type,
      reference: l.reference,
      bank: l.bank,
      beneficiary: l.beneficiary,
      amount: l.amount,
      margin: l.margin,
      dueDate: l.dueDate,
      status: l.status
    });
    setEditingId(Number(l.id));
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setLocToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (locToDeleteId) {
      await db.letterOfCredits.delete(locToDeleteId);
      setLocToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-indigo-600" />
            الاعتمادات المستندية وخطابات الضمان
          </h1>
          <p className="text-slate-500 mt-1">إدارة خطابات الاعتماد (LC) وخطابات الضمان (LG) البنكية وتتبع الهوامش</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingId(null); setFormData(f => ({...f, type: activeTab, reference: '', bank: '', beneficiary: '', amount: 0, margin: '10%', dueDate: '', status: 'ساري'})); setIsModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            إصدار جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-500 text-sm font-medium">إجمالي الاعتمادات (LC)</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{(totalLCs / 1000000).toFixed(1)}M <span className="text-sm font-normal text-slate-500">ر.س</span></div>
          <p className="text-xs text-slate-500 mt-2">{locs.filter(l=>l.type==='lcs').length} اعتماد نشط</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-500 text-sm font-medium">إجمالي الضمانات (LG)</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{(totalLGs / 1000000).toFixed(1)}M <span className="text-sm font-normal text-slate-500">ر.س</span></div>
          <p className="text-xs text-slate-500 mt-2">{locs.filter(l=>l.type==='lgs').length} خطابات ضمان نشطة</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-500 text-sm font-medium">الهوامش المحتجزة (Cash Margin)</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">450K <span className="text-sm font-normal text-slate-500">ر.س</span></div>
          <p className="text-xs text-slate-500 mt-2">أرصدة مقيدة بالبنوك</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-500 text-sm font-medium">اعتمادات مستحقة قريباً</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <FileSignature className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{locs.filter(l => l.status === 'يستحق قريباً').length}</div>
          <p className="text-xs text-red-600 font-medium mt-2">تستحق خلال 30 يوماً</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-2 border-b border-slate-200 p-2">
            <button
              onClick={() => setActiveTab('lcs')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'lcs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              الاعتمادات المستندية (LC)
            </button>
            <button
              onClick={() => setActiveTab('lgs')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'lgs' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              خطابات الضمان (LG)
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث برقم المرجع أو البنك..." 
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">رقم المرجع</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">البنك</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">المستفيد / المورد</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">القيمة</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">الهامش</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">الاستحقاق</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">الحالة</th>
                   <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">الإجراء</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                  {displayedLocs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{l.reference}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.bank}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.beneficiary}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-800">{l.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.margin}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.dueDate}</td>
                      <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${l.status === 'ساري' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{l.status}</span></td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleEdit(l)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-2 py-1 rounded transition">تعديل</button>
                           {l.id && <button onClick={() => handleDeleteClick(Number(l.id))} className="text-red-600 hover:text-red-900 border border-red-200 px-2 py-1 rounded transition">حذف</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">النشاط خلال العام</h3>
          <div className="flex-1 min-h-[250px]">
            <RechartsResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <RechartsCartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsXAxis dataKey="name" fontSize={12} />
                  <RechartsYAxis fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                  <RechartsTooltipComponent formatter={(val: any) => `${val.toLocaleString()} ر.س`} />
                  <RechartsLegend wrapperStyle={{ fontSize: '12px' }} />
                  <RechartsBar dataKey="lcs" name="اعتمادات مستندية" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <RechartsBar dataKey="lgs" name="خطابات ضمان" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
            </RechartsResponsiveContainer>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل الاعتماد/الضمان' : 'إصدار جديد'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ type: activeTab, reference: '', bank: '', beneficiary: '', amount: 0, margin: '10%', dueDate: '', status: 'ساري' }); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="lcs">اعتماد مستندي (LC)</option>
                  <option value="lgs">خطاب ضمان (LG)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم المرجع</label>
                <input required type="text" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">البنك</label>
                    <input required type="text" value={formData.bank} onChange={(e) => setFormData({...formData, bank: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المستفيد / المورد</label>
                    <input required type="text" value={formData.beneficiary} onChange={(e) => setFormData({...formData, beneficiary: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">القيمة (ر.س)</label>
                    <input required type="number" min="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الهامش النقدي</label>
                    <input required type="text" value={formData.margin} onChange={(e) => setFormData({...formData, margin: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="10%" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الاستحقاق</label>
                <input required type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">{editingId ? 'تحديث' : 'حفظ'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ type: activeTab, reference: '', bank: '', beneficiary: '', amount: 0, margin: '10%', dueDate: '', status: 'ساري' }); }} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف خطاب ضمان/اعتماد مستندي"
        message="هل أنت متأكد من رغبتك في حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default LetterOfCredits;
