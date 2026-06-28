import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, Receipt, X, Save, DollarSign, ArrowDownToLine, ArrowUpFromLine, User } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { BillingModal } from '../../components/legal/BillingModal';

export const LegalBilling: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const billings = useLiveQuery(() => db.legalBillings?.toArray() || []) || [];
  const clients = useLiveQuery(() => db.customers.toArray() || []) || [];
  const cases = useLiveQuery(() => db.lawCases?.toArray() || []) || [];

  const filtered = billings.filter(item => {
     const clientName = clients.find(c => c.id === Number(item.clientId))?.name || '';
     const caseTitle = cases.find(c => c.id === Number(item.caseId))?.title || '';
     return clientName.toLowerCase().includes(searchTerm.toLowerCase()) || caseTitle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCollected = billings.filter(b => b.status === 'paid' && b.type !== 'expense').reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalPending = billings.filter(b => b.status === 'pending').reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalExpenses = billings.filter(b => b.type === 'expense').reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...editingItem };
    if (editingItem.id) {
      await db.legalBillings?.update(editingItem.id, data);
    } else {
      await db.legalBillings?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const getTypeLabel = (type: string) => {
      switch(type) {
         case 'retainer': return 'مقدم أتعاب';
         case 'installment': return 'دفعة / قسط';
         case 'expense': return 'مصاريف (رسوم/خبراء)';
         case 'final': return 'مؤخر أتعاب';
         default: return type;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-8 h-8 text-emerald-600 p-1.5 bg-emerald-100 rounded-lg" />
            المالية والأتعاب ومصاريف المحاكم
          </h2>
          <p className="text-slate-500 text-sm mt-1">إدارة الدفعات، مقدم الأتعاب، فوترة العملاء، وتتبع المصاريف المدفوعة نيابة عن العميل.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem({ status: 'pending', type: 'retainer', dueDate: new Date().toISOString().split('T')[0] });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          تسجيل مطالبة / مصروف
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ArrowDownToLine className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm font-medium text-slate-500">تم تحصيله (أتعاب)</p>
                  <p className="text-2xl font-bold text-slate-800 dir-ltr text-right">{totalCollected.toLocaleString()} <span className="text-sm font-normal text-slate-400">ريال</span></p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm font-medium text-slate-500">مطالبات معلقة</p>
                  <p className="text-2xl font-bold text-slate-800 dir-ltr text-right">{totalPending.toLocaleString()} <span className="text-sm font-normal text-slate-400">ريال</span></p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <ArrowUpFromLine className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm font-medium text-slate-500">مصروفات بالنيابة لتسويتها</p>
                  <p className="text-2xl font-bold text-slate-800 dir-ltr text-right">{totalExpenses.toLocaleString()} <span className="text-sm font-normal text-slate-400">ريال</span></p>
              </div>
          </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
               type="text"
               placeholder="بحث للفلترة..."
               className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                 <tr>
                     <th className="p-4">البيان / النوع</th>
                     <th className="p-4">ارتباط العميل والقضية</th>
                     <th className="p-4">المبلغ</th>
                     <th className="p-4">الاستحقاق</th>
                     <th className="p-4 text-center">الحالة</th>
                     <th className="p-4 text-left">إجراءات</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                 {filtered.map(item => {
                     const clientObj = clients.find(c => c.id === Number(item.clientId));
                     const caseObj = cases.find(c => c.id === Number(item.caseId));
                     return (
                         <tr key={item.id} className="hover:bg-slate-50/50 transition">
                             <td className="p-4">
                                 <p className="font-bold text-slate-800">{item.title || 'بدون إفادة'}</p>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 font-bold ${item.type === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                     {getTypeLabel(item.type)}
                                 </span>
                             </td>
                             <td className="p-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-slate-700 flex items-center gap-1"><User className="w-3.5 h-3.5 opacity-50"/> {clientObj?.name || 'غير مدرج'}</span>
                                    <span className="text-xs text-slate-500 line-clamp-1">{caseObj?.title || 'عام / غير مرتبط'}</span>
                                </div>
                             </td>
                             <td className="p-4">
                                 <span className="font-black text-lg dir-ltr block w-fit">{Number(item.amount || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span></span>
                             </td>
                             <td className="p-4 text-slate-600 font-medium">{item.dueDate ? format(new Date(item.dueDate), 'dd/MM/yyyy') : '-'}</td>
                             <td className="p-4 text-center">
                                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                     {item.status === 'paid' ? 'تم الدفع ✔' : 'مُعلقة / مستحقة ⏳'}
                                 </span>
                             </td>
                             <td className="p-4 border-none flex items-center gap-2 justify-end">
                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                             </td>
                         </tr>
                     );
                 })}
                 {filtered.length === 0 && (
                     <tr><td colSpan={6} className="p-8 text-center text-slate-400">لا توجد سجلات مالية</td></tr>
                 )}
             </tbody>
         </table>
      </div>

      <BillingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        clients={clients}
        cases={cases}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف المعاملة المالية"
        message="هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن تراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.legalBillings?.delete(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
