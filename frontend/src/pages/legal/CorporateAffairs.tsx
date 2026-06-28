import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, Building, Calendar, Users, Printer, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { CorporateAffairsModal } from '../../components/legal/CorporateAffairsModal';

export const CorporateAffairs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'سجل اجتماعات وقرارات الشركات',
  });

  const affairsRecords = useLiveQuery(() => db.corporateAffairs?.toArray() || []) || [];

  const filtered = affairsRecords.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // clean up resolutions array
    const cleanedResolutions = (editingItem.resolutions || []).filter((r:string) => r.trim() !== '');

    const data = {
      ...editingItem,
      date: new Date(editingItem.date),
      resolutions: cleanedResolutions,
      participants: typeof editingItem.participants === 'string' ? editingItem.participants.split(',').map((p:string) => p.trim()) : editingItem.participants
    };
    if (editingItem.id) {
      await db.corporateAffairs?.update(editingItem.id, data);
    } else {
      await db.corporateAffairs?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'board_meeting': return 'اجتماع مجلس الإدارة';
      case 'general_assembly': return 'الجمعية العمومية';
      case 'management_meeting': return 'اجتماع الإدارة التنفيذية';
      case 'resolution': return 'قرار إداري / تشريعي';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-8 h-8 text-blue-600 p-1.5 bg-blue-100 rounded-lg" />
            شؤون الشركات والمجالس
          </h2>
          <p className="text-slate-500 text-sm mt-1">إدارة محاضر الاجتماعات، الجمعيات العمومية، القرارات الإدارية، وتتبع التوصيات.</p>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={handlePrint}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"
            >
                <Printer className="w-4 h-4" />
                تصدير السجل الكامل
            </button>
            <button 
            onClick={() => {
                setEditingItem({ status: 'scheduled', type: 'board_meeting', date: new Date().toISOString().split('T')[0], resolutions: [] });
                setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
            >
            <Plus className="w-4 h-4" />
            إضافة محضر / قرار
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث بعنوان الاجتماع أو القرار..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="min-w-[220px] p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="all">جميع الأنواع</option>
          <option value="board_meeting">اجتماعات مجلس الإدارة</option>
          <option value="general_assembly">الجمعيات العمومية</option>
          <option value="management_meeting">اجتماعات الإدارة التنفيذية</option>
          <option value="resolution">القرارات الإدارية العليا</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={printRef}>
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 p-5 hover:shadow-md transition flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : item.status === 'canceled' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                {item.status === 'completed' ? 'تم الانعقاد/الاعتماد' : item.status === 'canceled' ? 'ملغي' : 'مجدول للبرنامج'}
              </span>
              <div className="flex gap-1 print:hidden">
                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <h3 className="font-bold text-xl text-slate-800 mb-1">{item.title}</h3>
            <p className="font-bold text-indigo-600 text-sm mb-4 bg-indigo-50 inline-block px-2 py-0.5 rounded-lg">{getTypeLabel(item.type)}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Calendar className="w-4 h-4"/> التاريخ</div>
                  <span className="font-bold text-slate-700">{item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}</span>
               </div>
               <div className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Users className="w-4 h-4"/> الحضور</div>
                  <span className="font-bold text-slate-700 line-clamp-1">{item.participants?.length || 0} مشارك</span>
               </div>
            </div>

            {/* Resolutions Section */}
            {item.resolutions && item.resolutions.length > 0 && (
                <div className="mt-2 flex-grow">
                     <ul className="space-y-1.5">
                        {item.resolutions.map((res:string, idx:number) => (
                            <li key={idx} className="flex gap-2 items-start text-sm bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700">
                                <span className="font-bold text-indigo-400 mt-0.5">{idx + 1}.</span>
                                <span className="leading-relaxed">{res}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Settings className="w-4 h-4" />
                سجل شؤون الشركات • {item.id}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
             <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium">لا توجد سجلات شؤون شركات مطابقة</p>
          </div>
        )}
      </div>

      <CorporateAffairsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف محضر الاجتماع / القرار"
        message="هل أنت متأكد من حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.corporateAffairs?.delete(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
