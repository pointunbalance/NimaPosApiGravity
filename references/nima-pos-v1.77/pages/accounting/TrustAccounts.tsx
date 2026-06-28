import React, { useState, useEffect } from 'react';
import { Network, Users, ArrowUpRight, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const TrustAccounts: React.FC = () => {
  const fetchedAccounts = useLiveQuery(() => db.trustAccounts.toArray(), []) || [];

  const accounts = fetchedAccounts.length > 0 ? fetchedAccounts : [
    { id: '1', reference: 'TR-2024-001', client: 'شركة العليان التجارية', connection: 'قضية تصفية تركة #882', balance: 2500000, lastUpdate: '2024-06-12' },
    { id: '2', reference: 'TR-2024-002', client: 'مؤسسة البناء الحديث', connection: 'مشروع مجمع سكني (تحت الإنشاء)', balance: 1850000, lastUpdate: '2024-06-10' }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDeleteId, setAccountToDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ reference: '', client: '', connection: '', balance: 0 });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeCount = accounts.length;
  const filteredAccounts = accounts.filter(acc => 
    acc.client.includes(searchTerm) || acc.reference.includes(searchTerm) || acc.connection.includes(searchTerm)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.trustAccounts.update(editingId, {
        reference: formData.reference,
        client: formData.client,
        connection: formData.connection,
        balance: Number(formData.balance)
      });
    } else {
      await db.trustAccounts.add({
        reference: formData.reference,
        client: formData.client,
        connection: formData.connection,
        balance: Number(formData.balance),
        lastUpdate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ reference: '', client: '', connection: '', balance: 0 });
  };

  const handleEdit = (acc: any) => {
    setFormData({
      reference: acc.reference,
      client: acc.client,
      connection: acc.connection,
      balance: acc.balance
    });
    setEditingId(Number(acc.id));
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setAccountToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (accountToDeleteId) {
      await db.trustAccounts.delete(accountToDeleteId);
      setAccountToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Network className="w-6 h-6 text-purple-600" />
            حسابات الأمانات (Trust Accounts / Escrow)
          </h1>
          <p className="text-slate-500 mt-1">
            إدارة أموال العملاء والموكلين وحسابات الضمان (خاص بالمكاتب العقارية وشركات المحاماة والوساطة)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingId(null); setFormData({ reference: '', client: '', connection: '', balance: 0 }); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            فتح حساب أمانة جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
             <p className="text-slate-500 text-sm font-medium mb-1">إجمالي أموال الأمانات (تحت الإدارة)</p>
             <h3 className="text-3xl font-bold text-slate-800 mb-2">{totalBalance.toLocaleString()} <span className="text-sm text-slate-500 font-normal">ر.س</span></h3>
             <div className="flex items-center text-xs text-purple-600 bg-purple-50 w-fit px-2 py-1 rounded">
               <ShieldCheck className="w-3 h-3 ml-1" />
               أموال محجوزة ولا تمس القوائم المالية
             </div>
         </div>
         
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
             <p className="text-slate-500 text-sm font-medium mb-1">عدد حسابات الأمانة النشطة</p>
             <h3 className="text-3xl font-bold text-slate-800 mb-2">{activeCount}</h3>
             <p className="text-xs text-slate-500">مرتبطة بـ {Math.max(1, activeCount - 1)} عميل / موكل</p>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
             <p className="text-slate-500 text-sm font-medium mb-1">رسوم وأتعاب مستحقة السحب</p>
             <h3 className="text-3xl font-bold text-slate-800 mb-2">45,000 <span className="text-sm text-slate-500 font-normal">ر.س</span></h3>
             <div className="flex items-center text-xs text-amber-600 font-medium">
               <ArrowUpRight className="w-3 h-3 ml-1" />
               مبالغ يحق نقلها للحساب التشغيلي
             </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Users className="w-5 h-5 text-slate-500" />
               قائمة حسابات الأمانات
            </h3>
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم العميل أو رقم القضية/العقار..." 
                className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-right">
             <thead className="bg-white border-b border-slate-200 text-slate-500">
               <tr>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider">رقم الحساب / المرجع</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider">العميل / الموكل</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider">الارتباط (قضية/عقار)</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider">رصيد الأمانة</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider">تاريخ آخر حركة</th>
                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">الإجراءات</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50 align-middle">
                    <td className="px-6 py-4 font-bold text-slate-800">{acc.reference}</td>
                    <td className="px-6 py-4 text-slate-600">{acc.client}</td>
                    <td className="px-6 py-4 text-slate-600">{acc.connection}</td>
                    <td className="px-6 py-4 font-bold text-purple-600">{acc.balance.toLocaleString()} ر.س</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{acc.lastUpdate}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(acc)} className="text-purple-600 hover:bg-purple-50 px-3 py-1 rounded text-xs font-medium border border-purple-200 transition-colors">
                          تعديل
                        </button>
                        {acc.id && (
                          <button onClick={() => handleDeleteClick(Number(acc.id))} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-xs font-medium border border-red-200 transition-colors">
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
             </tbody>
           </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل حساب الأمانة' : 'فتح حساب أمانة جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المرجع</label>
                <input required type="text" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="TR-2024-XXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العميل / الموكل</label>
                <input required type="text" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الارتباط (قضية/عقار)</label>
                <input required type="text" value={formData.connection} onChange={(e) => setFormData({...formData, connection: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رصيد افتتاحي</label>
                <input required type="number" min="0" value={formData.balance} onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">{editingId ? 'تحديث' : 'حفظ وإنشاء'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ reference: '', client: '', connection: '', balance: 0 }); }} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف حساب الأمانة"
        message="هل أنت متأكد من رغبتك في حذف حساب الأمانة هذا؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default TrustAccounts;

