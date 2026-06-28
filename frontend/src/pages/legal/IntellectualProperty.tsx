import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, Award, Calendar, Globe, AlertCircle, Printer, Image as ImageIcon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { IPModal } from '../../components/legal/IPModal';

export const IntellectualProperty: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'سجل الملكية الفكرية والتراخيص',
  });

  const ipRecords = useLiveQuery(() => db.intellectualProperties?.toArray() || []) || [];

  const filtered = ipRecords.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.issuingAuthority?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingItem,
      registrationDate: editingItem.registrationDate ? new Date(editingItem.registrationDate) : undefined,
      expiryDate: editingItem.expiryDate ? new Date(editingItem.expiryDate) : undefined,
    };
    
    // Auto status determination based on expiry if set
    if (data.expiryDate && data.status !== 'pending_renewal') {
      const daysLeft = differenceInDays(new Date(data.expiryDate), new Date());
      if (daysLeft < 0) data.status = 'expired';
      else if (daysLeft < 60) data.status = 'expiring_soon';
      else data.status = 'active';
    }

    if (editingItem.id) {
      await db.intellectualProperties?.update(editingItem.id, data);
    } else {
      await db.intellectualProperties?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'trademark': return 'علامة تجارية';
      case 'patent': return 'براءة اختراع';
      case 'copyright': return 'حقوق النشر / مؤلفات';
      case 'commercial_register': return 'سجل تجاري / ترخيص عمل';
      case 'municipal_license': return 'رخصة بلدية / تشغيل';
      case 'domain_name': return 'نطاق إنترنت (Domain)';
      default: return type;
    }
  };

  const getStatusDisplay = (item: any) => {
    if (!item.expiryDate) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-800 border-slate-200">غير محدد الانتهاء</span>;
    }
    
    if (item.status === 'pending_renewal') {
        return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-800 border-amber-200">جاري التجديد</span>;
    }

    const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
    
    if (daysLeft < 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-rose-100 text-rose-800 border-rose-200">منتهي (منذ {Math.abs(daysLeft)} يوم)</span>;
    } else if (daysLeft <= 60) {
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200">شيك الانتهاء (متبقي {daysLeft} يوم)</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-800 border-emerald-200">ساري (متبقي {daysLeft} يوم)</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-100 rounded-lg" />
            الملكية الفكرية والتراخيص
          </h2>
          <p className="text-slate-500 text-sm mt-1">تتبع العلامات التجارية، الإسنادات، براءات الاختراع، والرخص التشغيلية.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handlePrint}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"
            >
                <Printer className="w-4 h-4" />
                تصدير السجل
            </button>
            <button 
            onClick={() => {
                setEditingItem({ status: 'active', type: 'trademark' });
                setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
            >
            <Plus className="w-4 h-4" />
            إضافة وثيقة / ترخيص
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث باسم المستند، الرقم، أوجهة الإصدار..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="min-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="all">جميع الأنواع</option>
          <option value="trademark">علامات تجارية</option>
          <option value="patent">براءات الاختراع</option>
          <option value="copyright">حقوق النشر</option>
          <option value="commercial_register">سجلات تراخيص</option>
          <option value="domain_name">نطاقات انترنت</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" ref={printRef}>
        {filtered.map(item => {
            const isCritical = item.expiryDate && differenceInDays(new Date(item.expiryDate), new Date()) <= 60 && item.status !== 'pending_renewal';
            
            return (
          <div key={item.id} className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition relative overflow-hidden ${isCritical ? 'border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-slate-200'}`}>
            {isCritical && (
                <div className="absolute top-0 right-0 w-1 h-full bg-orange-400 animate-pulse"></div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              {getStatusDisplay(item)}
              <div className="flex gap-1 print:hidden">
                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 shadow-sm border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{item.title}</h3>
                    <p className="font-medium text-indigo-600 text-sm mt-0.5">{getTypeLabel(item.type)}</p>
                </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-slate-400"/> النطاق الجغرافي / جهة الإصدار</div>
                  <span className="font-bold text-slate-800">{item.issuingAuthority || 'محلي'}</span>
               </div>
               <div className="flex justify-between items-center py-1 border-t border-slate-200 border-dashed">
                  <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-slate-400"/> رقم التسجيل</div>
                  <span className="font-mono font-bold text-slate-800">{item.registrationNumber || 'غير مسجل مقننًا'}</span>
               </div>
               <div className="flex justify-between items-center py-1 border-t border-slate-200 border-dashed">
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400"/> تاريخ الانتهاء</div>
                  <span className={`font-bold ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                      {item.expiryDate ? format(new Date(item.expiryDate), 'yyyy/MM/dd') : 'دائم / لا ينتهي'}
                  </span>
               </div>
            </div>
          </div>
        )})}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
             <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-lg font-medium">لا توجد تراخيص أو سجلات مطابقة</p>
          </div>
        )}
      </div>

      <IPModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف الملكية الفكرية / السجل"
        message="هل أنت متأكد من حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.intellectualProperties?.delete(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
