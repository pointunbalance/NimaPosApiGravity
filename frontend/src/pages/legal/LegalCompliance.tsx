import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, ShieldCheck, X, Save, AlertTriangle, FileText, Activity, Printer, Info, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { ComplianceModal } from '../../components/legal/ComplianceModal';

export const LegalCompliance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'تقرير الامتثال التشريعي',
  });

  const complianceRecords = useLiveQuery(() => db.complianceRecords?.toArray() || []) || [];

  const filtered = complianceRecords.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.type === categoryFilter; // type maps to category in our case
    return matchesSearch && matchesCategory;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingItem,
      lastReviewedDate: editingItem.lastReviewedDate ? new Date(editingItem.lastReviewedDate) : new Date(),
      nextReviewDate: editingItem.nextReviewDate ? new Date(editingItem.nextReviewDate) : undefined,
    };
    
    // logic to auto switch to 'under_review' if review date passed while supposedly compliant
    if (data.status === 'compliant' && data.nextReviewDate && new Date(data.nextReviewDate) < new Date()) {
       data.status = 'under_review'; 
    }

    if (editingItem.id) {
      await db.complianceRecords?.update(editingItem.id, data);
    } else {
      await db.complianceRecords?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'labor_law': return 'متطلبات قانون العمل';
      case 'tax': return 'الضرائب والزكاة والجمارك';
      case 'data_protection': return 'حماية البيانات (PDPL/GDPR)';
      case 'safety': return 'التنظيمات الصحية (HSE / OSH)';
      case 'corporate': return 'حوكمة الشركات (CMA / MOC)';
      default: return 'أخرى';
    }
  };

  // Dashboard Stats
  const total = complianceRecords.length;
  const compliant = complianceRecords.filter(r => r.status === 'compliant').length;
  const nonCompliant = complianceRecords.filter(r => r.status === 'non_compliant').length;
  const pending = total - compliant - nonCompliant;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 p-1.5 bg-emerald-100 rounded-lg" />
            الامتثال التشريعي والتنظيمي (Compliance)
          </h2>
          <p className="text-slate-500 text-sm mt-1">تتبع التدقيق الداخلي وتقييم نسبة الامتثال لمتطلبات الجهات التنظيمية والقانونية.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handlePrint}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"
            >
                <Printer className="w-4 h-4" />
                تصدير التقرير
            </button>
            <button 
            onClick={() => {
                setEditingItem({ status: 'compliant', type: 'labor_law', lastReviewedDate: new Date().toISOString().split('T')[0] });
                setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
            >
            <Plus className="w-4 h-4" />
            إضافة سجل/قانون
            </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                 <Activity className="w-6 h-6" />
             </div>
             <div>
                 <p className="text-sm text-slate-500 font-medium">إجمالي التشريعات</p>
                 <p className="text-2xl font-bold text-slate-800">{total}</p>
             </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
                 <p className="text-sm text-slate-500 font-medium">ملتزم بالمتطلبات</p>
                 <p className="text-2xl font-bold text-slate-800">{compliant}</p>
             </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                 <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                 <p className="text-sm text-slate-500 font-medium">مخالف / غير متوافق</p>
                 <p className="text-2xl font-bold text-slate-800">{nonCompliant}</p>
             </div>
         </div>
         <div className="bg-indigo-600 p-5 rounded-2xl shadow-md text-white flex items-center justify-between">
             <div>
                 <p className="text-indigo-100 text-sm font-medium">مؤشر الامتثال الكلي</p>
                 <p className="text-3xl font-bold mt-1 dir-ltr drop-shadow-sm">{complianceRate}%</p>
             </div>
             <div className="w-14 h-14 rounded-full border-4 border-indigo-400 flex items-center justify-center relative">
                 <ShieldCheck className="w-6 h-6 text-white" />
             </div>
         </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث باسم اللائحة التشريعية أو القانون..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="all">جميع الفئات التنظيمية</option>
          <option value="labor_law">متطلبات قانون العمل</option>
          <option value="tax">الضرائب والجمارك</option>
          <option value="data_protection">حماية البيانات والخصوصية</option>
          <option value="safety">الصحة والسلامة المهنية</option>
          <option value="corporate">حوكمة الشركات</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref={printRef}>
        {filtered.map(item => {
            
          const isOverdue = item.nextReviewDate && new Date(item.nextReviewDate) < new Date();
            
          return (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${item.status === 'compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.status === 'non_compliant' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {item.status === 'compliant' ? <><ShieldCheck className="w-3.5 h-3.5" /> ملتزم تماماً</> : item.status === 'non_compliant' ? <><AlertTriangle className="w-3.5 h-3.5" /> غير ملتزم</> : <><Activity className="w-3.5 h-3.5" /> قيد المراجعة والمعالجة</>}
              </span>
              <div className="flex gap-1 print:hidden">
                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2">{item.title}</h3>
            <p className="text-slate-500 text-xs font-bold mb-4 bg-slate-100 px-2 py-1 rounded-md inline-block">{getCategoryLabel(item.type)}</p>

            <div className="space-y-3 text-sm mt-2">
                <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-slate-400"/> آخر تقييم</span>
                    <span className="font-bold">{item.lastReviewedDate ? format(new Date(item.lastReviewedDate), 'dd/MM/yyyy') : '-'}</span>
                </div>
                
                <div className={`flex justify-between items-center ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                    <span className="flex items-center gap-1"><AlertTriangle className={`w-4 h-4 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}/> المراجعة القادمة</span>
                    <span className="font-bold">{item.nextReviewDate ? format(new Date(item.nextReviewDate), 'dd/MM/yyyy') : '-'}</span>
                </div>

                {item.description && (
                   <div className="flex items-start gap-2 p-3 text-slate-700 bg-slate-50 border border-slate-100 rounded-xl mt-4">
                       <FileText className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                       <span className="text-xs leading-relaxed line-clamp-3">{item.description}</span>
                   </div>
                )}
                {item.responsibleOfficer && (
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1 mt-2">
                        <Info className="w-3.5 h-3.5" />
                        المسؤول: <span className="font-bold">{item.responsibleOfficer}</span>
                    </div>
                )}
            </div>
          </div>
        )})}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium">لا توجد سجلات امتثال مطابقة للبحث</p>
          </div>
        )}
      </div>

      <ComplianceModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف عنصر الامتثال هذا؟"
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.complianceRecords?.delete(deleteId);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
