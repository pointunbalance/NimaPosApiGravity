import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, FileSignature, X, Save, FileText, Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const LegalMemos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const memos = useLiveQuery(() => db.legalMemos?.toArray() || []) || [];

  const filtered = memos.filter(item => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (item.title?.toLowerCase().includes(term)) || 
      (item.content?.toLowerCase().includes(term));
    const matchesCat = categoryFilter === 'all' || item.type === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingItem,
      updatedAt: new Date()
    };
    if (editingItem.id) {
      await db.legalMemos?.update(editingItem.id, data);
    } else {
      await db.legalMemos?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const copyToClipboard = (text: string, id: number) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSignature className="w-8 h-8 text-blue-600 p-1.5 bg-blue-100 rounded-lg" />
            مكتبة المذكرات والصياغات
          </h2>
          <p className="text-slate-500 text-sm mt-1">أرشفة لوائح الدعاوى، المذكرات الجوابية، ونماذج الصياغة لإعادة استخدامها في قضايا مشابهة.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem({ type: 'pleading' });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة مذكرة / مسودة
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث بعنوان المذكرة أو محتواها..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="all">جميع الأنواع</option>
          <option value="pleading">صحيفة دعوى (افتتاحية)</option>
          <option value="defense">مذكرة جوابية (دفاع)</option>
          <option value="contract_template">نموذج عقد استرشادي</option>
          <option value="consultation">صياغة رأي قانوني</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition hover:border-blue-300">
             <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                     <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{item.title}</h3>
                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 block w-fit">
                         {item.type === 'pleading' ? 'لائحة دعوى' : item.type === 'defense' ? 'مذكرة جوابية' : item.type === 'contract_template' ? 'نموذج عقد' : 'رأي قانوني'}
                     </span>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => copyToClipboard(item.content || '', item.id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="نسخ المحتوى">
                        {copiedId === item.id ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
                </div>
             </div>
             <div className="p-4 flex-1">
                 <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-hidden relative">
                     {item.content || <span className="text-slate-300 italic">محتوى المذكرة فارغ...</span>}
                     {item.content && item.content.length > 200 && (
                         <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                     )}
                 </div>
             </div>
             <div className="bg-slate-50 border-t border-slate-100 p-3 text-xs text-slate-500 font-medium">
                 آخر تحديث: {item.updatedAt ? format(new Date(item.updatedAt), 'yyyy/MM/dd HH:mm') : 'غير معروف'}
             </div>
          </div>
        ))}
        {filtered.length === 0 && (
           <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
               <FileSignature className="w-12 h-12 mb-3 text-slate-300" />
               <p className="font-medium text-lg text-slate-500">مكتبة المذكرات فارغة.</p>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem?.id ? 'تحرير المذكرة/الصياغة' : 'إضافة مسودة جديدة للمكتبة'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col h-[80vh]">
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                 <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-2">
                         <label className="block text-sm font-bold text-slate-700 mb-2">عنوان المذكرة / اللائحة *</label>
                         <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                           placeholder="مثال: مذكرة جوابية في دعوى عمالية (تعسفي)..."
                           value={editingItem?.title || ''} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} />
                     </div>
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">نوع المستند</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                           value={editingItem?.type || 'pleading'} onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}>
                             <option value="pleading">صحيفة دعوى</option>
                             <option value="defense">مذكرة جوابية</option>
                             <option value="contract_template">مسودة عقد</option>
                             <option value="consultation">رأي قانوني</option>
                         </select>
                     </div>
                 </div>
                 
                 <div className="flex-1 flex flex-col h-full mt-4 min-h-[400px]">
                     <label className="block text-sm font-bold text-slate-700 mb-2">المسودة / النص القانوني</label>
                     <textarea className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-loose"
                       placeholder="ابدأ بكتابة ديباجة المذكرة والصياغة هنا... (يمكنك الرجوع لنسخها لاحقاً ولصقها في أي برنامج)"
                       value={editingItem?.content || ''} onChange={(e) => setEditingItem({...editingItem, content: e.target.value})} />
                 </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-slate-50 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold transition">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-md transition flex items-center gap-2"><Save className="w-5 h-5"/> تخزين المسودة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف اللائحة / المذكرة"
        message="هل أنت متأكد من حذف هذه المذكرة/التبويب؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.legalMemos?.delete(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
