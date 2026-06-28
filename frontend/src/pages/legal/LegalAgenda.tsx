import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, CalendarClock, X, Save, Clock, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const LegalAgenda: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deadlines = useLiveQuery(() => db.legalDeadlines?.toArray() || []) || [];
  const cases = useLiveQuery(() => db.lawCases?.toArray() || []) || [];

  const filtered = deadlines.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Closest first

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingItem,
      dueDate: new Date(editingItem.dueDate),
    };
    if (editingItem.id) {
      await db.legalDeadlines?.update(editingItem.id, data);
    } else {
      await db.legalDeadlines?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const getStatusColor = (dueDate: string, status: string) => {
      if (status === 'done') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      const days = differenceInDays(new Date(dueDate), new Date());
      if (days < 0) return 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'; // overdue but unresolved
      if (days <= 3) return 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.1)]'; // High danger
      if (days <= 7) return 'bg-amber-50 border-amber-200 text-amber-800';
      return 'bg-white border-slate-200 text-slate-800';
  };

  const getTypeLabel = (type: string) => {
      switch(type) {
         case 'appeal': return 'ميعاد استئناف/اعتراض';
         case 'supreme': return 'ميعاد نقض/عليا';
         case 'memo': return 'تقديم مذكرة / مستندات';
         case 'expert': return 'جلسة خبير';
         case 'heading': return 'جلسة محكمة';
         default: return 'موعد إجرائي';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarClock className="w-8 h-8 text-amber-600 p-1.5 bg-amber-100 rounded-lg" />
            الأجندة والمواعيد القانونية
          </h2>
          <p className="text-rose-600 text-sm mt-1 font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> مراقبة المواعيد الحتمية (سقوط المواعيد يؤدي لسقوط الحق).
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingItem({ status: 'pending', type: 'appeal', dueDate: new Date().toISOString().split('T')[0] });
            setIsModalOpen(true);
          }}
          className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة موعد قانوني
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
               type="text"
               placeholder="بحث بعنوان الموعد أو الإجراء..."
               className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
      </div>

      <div className="grid gap-4">
        {filtered.map(item => {
           const daysLeft = differenceInDays(new Date(item.dueDate), new Date());
           const caseObj = cases.find(c => c.id === Number(item.caseId));

           return (
             <div key={item.id} className={`flex items-center justify-between p-5 rounded-xl border transition ${getStatusColor(item.dueDate, item.status)}`}>
               <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm min-w-[70px]">
                      <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(item.dueDate), 'MMM')}</span>
                      <span className="text-2xl font-black text-slate-800 leading-none my-0.5">{format(new Date(item.dueDate), 'dd')}</span>
                      <span className="text-[10px] font-medium text-slate-400">{format(new Date(item.dueDate), 'yyyy')}</span>
                  </div>
                  <div>
                      <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-bold text-lg leading-none">{item.title}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5">{getTypeLabel(item.type)}</span>
                      </div>
                      <div className="flex gap-4 text-sm font-medium mt-2">
                           <div className="flex items-center gap-1.5">
                               <Clock className="w-4 h-4 opacity-50" />
                               <span>متبقي: {daysLeft < 0 ? 'منتهي' : `${daysLeft} يوم`}</span>
                           </div>
                           {caseObj && (
                               <div className="flex items-center gap-1.5 border-r border-black/10 pr-4">
                                   <BookOpen className="w-4 h-4 opacity-50" />
                                   <span>القضية: {caseObj.title} ({caseObj.caseNumber})</span>
                               </div>
                           )}
                      </div>
                  </div>
               </div>
               
               <div className="flex flex-col gap-2 shrink-0">
                  {item.status !== 'done' && (
                      <button onClick={async () => await db.legalDeadlines?.update(item.id, {status: 'done'})} className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                          <CheckCircle2 className="w-4 h-4" /> تم الإنجاز
                      </button>
                  )}
                  <div className="flex gap-2">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="flex-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center transition"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="flex-1 px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
             </div>
           );
        })}
        {filtered.length === 0 && (
           <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <CalendarClock className="w-12 h-12 mb-3 text-slate-300" />
               <p className="font-medium text-lg text-slate-500">لا توجد مواعيد قادمة.</p>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem?.id ? 'تعديل موعد حتمي' : 'أدرج موعد قانوني للمراقبة'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الموعد / الإجراء *</label>
                     <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                       placeholder="مثال: آخر يوم لتقديم استئناف حكم ابتدائي"
                       value={editingItem?.title || ''} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">صنف الموعد</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                           value={editingItem?.type || 'appeal'} onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}>
                             <option value="appeal">اعتراض / استئناف (أيام معدودة)</option>
                             <option value="supreme">نقض / عليا</option>
                             <option value="memo">تقديم مذكرات</option>
                             <option value="expert">موعد خبير / مناقشة</option>
                             <option value="heading">جلسة محكمة</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-rose-700 mb-2">تاريخ السقوط (اليوم الأخير) *</label>
                         <input required type="date" className="w-full p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl outline-none font-bold"
                           value={editingItem?.dueDate ? new Date(editingItem.dueDate).toISOString().split('T')[0] : ''} 
                           onChange={(e) => setEditingItem({...editingItem, dueDate: e.target.value})} />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">ربط بقضية (اختياري)</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                        value={editingItem?.caseId || ''} onChange={(e) => setEditingItem({...editingItem, caseId: e.target.value})}>
                          <option value="">-- غير مرتبط بقضية صريحة --</option>
                          {cases.map(c => (
                              <option key={c.id} value={c.id}>{c.title} - {c.caseNumber}</option>
                          ))}
                      </select>
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 text-white bg-amber-600 hover:bg-amber-700 rounded-xl font-bold shadow-md transition flex items-center gap-2"><Save className="w-5 h-5"/> حفظ في الأجندة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف الموعد القانوني"
        message="مهم جداً: هل أنت متأكد من حذف هذا الموعد النهائي بشكل دائم؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.legalDeadlines?.delete(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
