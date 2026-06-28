import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Edit, Trash2, Users, X, Save, AlertTriangle, Building, Briefcase, FileText } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const LegalClients: React.FC = () => {
  const { error, success } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'opponents'>('clients');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const clients = useLiveQuery(() => db.customers.toArray() || []) || [];
  const opponents = useLiveQuery(() => db.legalOpponents?.toArray() || []) || [];
  const allCases = useLiveQuery(() => db.lawCases?.toArray() || []) || [];

  const displayList = activeTab === 'clients' ? clients : opponents;
  
    const filtered = displayList.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (activeTab === 'clients' ? item.taxNumber : item.idNumber)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Simple Conflict Check (shows warning if name exists in the OTHER list)
  const isConflict = (name: string) => {
      if(!name) return false;
      if (activeTab === 'clients') {
         return opponents.some(o => o.name.toLowerCase().includes(name.toLowerCase()));
      } else {
         return clients.some(c => c.name.toLowerCase().includes(name.toLowerCase()));
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...editingItem };
    
    if (activeTab === 'clients') {
        const clientData = {
           name: data.name,
           phone: data.contact || '',
           taxNumber: data.idNumber,
           notes: data.notes,
           totalSpent: 0
        };
        if (editingItem.id) {
          await db.customers.update(editingItem.id, clientData as any);
        } else {
          await db.customers.add(clientData as any);
        }
    } else {
        if (editingItem.id) {
        await db.legalOpponents?.update(editingItem.id, data);
        } else {
        await db.legalOpponents?.add(data);
        }
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    success('تم الحفظ بنجاح');
  };

  const handleDelete = async (id: number) => {
    if (activeTab === 'clients') {
      const activeCasesCount = allCases.filter(c => c.clientId === id && c.status !== 'closed').length;
      if (activeCasesCount > 0) {
        error(`لا يمكن حذف الموكل! يوجد لديه ${activeCasesCount} قضايا نشطة.`);
        return;
      }
    }
    setDeleteId(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-100 rounded-lg" />
            سجل الموكلين والخصوم
          </h2>
          <p className="text-slate-500 text-sm mt-1">تتبع الحسابات الخاصة بالموكلين، تسجيل جهات الخصوم لفحص تعارض المصالح.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem({ type: 'individual' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'clients' ? 'إضافة موكل جديد' : 'تسجيل خصم جديد'}
        </button>
      </div>

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-fit">
         <button onClick={()=>setActiveTab('clients')} className={`px-5 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'clients' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>الموكلين ({clients.length})</button>
         <button onClick={()=>setActiveTab('opponents')} className={`px-5 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'opponents' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`}>الخصوم والأطراف المضادة ({opponents.length})</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث بالاسم، رقم الهوية/السجل التجاري..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeTab === 'clients' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : item.type === 'company' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                 {activeTab === 'clients' ? 'موكل (عميل مسجل)' : item.type === 'company' ? 'شركة / كيان تجاري' : 'فرد خصم'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    {item.type === 'company' ? <Building className="w-5 h-5 text-slate-500" /> : <Users className="w-5 h-5 text-slate-500" />}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{item.name}</h3>
                    <p className="text-slate-500 text-sm">{(activeTab === 'clients' ? item.taxNumber : item.idNumber) || 'لا يوجد معرف'}</p>
                </div>
            </div>

            <div className="space-y-2 mt-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <div className="flex items-center justify-between">
                   <span className="text-slate-400">رقم التواصل:</span>
                   <span className="font-medium dir-ltr">{(activeTab === 'clients' ? item.phone : item.contact) || '-'}</span>
               </div>
               {activeTab === 'clients' && (
                 <div className="flex items-center justify-between">
                     <span className="text-slate-400">عدد القضايا:</span>
                     <span className="font-bold text-indigo-600">
                       {allCases.filter(c => c.clientId === item.id).length} قضايا
                     </span>
                 </div>
               )}
            </div>

            {isConflict(item.name) && (
                <div className="mt-3 bg-red-50 text-red-700 p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-100">
                    <AlertTriangle className="w-4 h-4" /> احذر: احتمال تعارض مصالح (يوجد تطابق اسم).
                </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem?.id ? 'تعديل السجل' : activeTab === 'clients' ? 'إضافة موكل جديد' : 'تسجيل خصم جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {isConflict(editingItem?.name || '') && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-sm font-bold flex items-start gap-2">
                       <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                       <p>تنبيه تعارض مصالح: تم العثور على نفس الاسم في قائمة {activeTab === 'clients' ? 'الخصوم' : 'الموكلين'}. يرجى التحقق قبل الحفظ.</p>
                  </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                  {activeTab !== 'clients' && (
                    <div className="col-span-2">
                       <div className="flex gap-4">
                           <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" value="individual" checked={editingItem?.type === 'individual'} onChange={(e) => setEditingItem({...editingItem, type: e.target.value})} className="w-4 h-4 accent-indigo-600" />
                               <span className="font-medium text-sm text-slate-700">فرد</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" value="company" checked={editingItem?.type === 'company'} onChange={(e) => setEditingItem({...editingItem, type: e.target.value})} className="w-4 h-4 accent-indigo-600" />
                               <span className="font-medium text-sm text-slate-700">شركة / جهة</span>
                           </label>
                       </div>
                    </div>
                  )}
                  
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم {activeTab === 'clients' ? 'الموكل' : 'الخصم'} (رباعي أو الكيان) *</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="الاسم الكامل للنظام والسجلات..."
                    value={editingItem?.name || ''} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{activeTab === 'clients' ? 'الرقم الضريبي/الهوية' : 'رقم الهوية / السجل التجاري'}</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={(activeTab === 'clients' ? editingItem?.taxNumber : editingItem?.idNumber) || ''} onChange={(e) => setEditingItem(activeTab === 'clients' ? {...editingItem, taxNumber: e.target.value} : {...editingItem, idNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">رقم التواصل الأساسي</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    value={(activeTab === 'clients' ? editingItem?.phone : editingItem?.contact) || ''} onChange={(e) => setEditingItem(activeTab === 'clients' ? {...editingItem, phone: e.target.value} : {...editingItem, contact: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">العنوان / ملاحظات عامة</label>
                  <textarea rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editingItem?.notes || ''} onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-md transition flex items-center gap-2"><Save className="w-5 h-5"/> حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title={activeTab === 'clients' ? "تأكيد حذف الموكل" : "تأكيد حذف الخصم"}
        message="هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            if (activeTab === 'clients') await db.customers.delete(deleteId);
            else await db.legalOpponents?.delete(deleteId);
            success('تم الحذف بنجاح');
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
