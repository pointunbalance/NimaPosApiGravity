import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Search, Plus, Edit, Trash2, ShieldAlert, X, Save, Clock, FileText, CheckCircle, Printer, Download, User } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ConfirmModal from '../../components/ui/ConfirmModal';
import InvestigationModal from '../../components/legal/InvestigationModal';

export const LaborInvestigations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'تقرير التحقيقات العمالية',
  });

  const investigations = useLiveQuery(() => db.laborInvestigations?.toArray() || []) || [];
  const users = useLiveQuery(() => db.users?.toArray() || []) || [];

  const filtered = investigations.filter(item => {
    const matchesSearch = item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.investigatorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingItem,
      incidentDate: new Date(editingItem.incidentDate),
      createdAt: editingItem.createdAt || new Date()
    };
    if (editingItem.id) {
      await db.laborInvestigations?.update(editingItem.id, data);
    } else {
      await db.laborInvestigations?.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'recommendation': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'escalated': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'قيد الانتظار';
      case 'in_progress': return 'جاري التحقيق';
      case 'recommendation': return 'مرفوع لتوصية الاعتماد';
      case 'escalated': return 'تم التصعيد للشؤون القانونية/الإدارة';
      case 'closed': return 'مغلق / تم البت';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-amber-600 p-1.5 bg-amber-100 rounded-lg" />
            الشكاوى والتحقيقات العمالية
          </h2>
          <p className="text-slate-500 text-sm mt-1">إدارة النزاعات العمالية، المخالفات، التحقيقات الإدارية، وتوثيق الجزاءات.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة / تصدير PDF
          </button>
          <button 
            onClick={() => {
              setEditingItem({ status: 'pending', incidentDate: new Date().toISOString().split('T')[0], actionTaken: 'none' });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة شكوى / تحقيق
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث باسم الموظف أو عنوان الشكوى أو المحقق..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="in_progress">جاري التحقيق</option>
          <option value="recommendation">التوصية</option>
          <option value="escalated">تم التصعيد</option>
          <option value="closed">مغلق / تم البت</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref={printRef}>
        {filtered.map(item => (
          <div key={item.id} className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition relative overflow-hidden ${item.actionTaken === 'termination' ? 'border-red-200' : 'border-slate-200'}`}>
            {item.actionTaken === 'termination' && (
                <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                {getStatusLabel(item.status)}
              </span>
              <div className="flex gap-1 print:hidden">
                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
            
            <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs text-slate-400">الموظف المعني</p>
                    <p className="font-bold text-sm text-slate-800">{item.employeeName}</p>
                </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
               <div className="flex justify-between items-center py-1 border-b border-slate-50 border-dashed">
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> تاريخ الواقعة</div>
                  <span className="font-semibold text-slate-800">{item.incidentDate ? format(new Date(item.incidentDate), 'yyyy/MM/dd') : '-'}</span>
               </div>
               <div className="flex justify-between items-center py-1 border-b border-slate-50 border-dashed">
                  <div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400"/> المحقق المسؤول</div>
                  <span className="font-semibold text-slate-800">{item.investigatorName || 'لم يتم التعيين'}</span>
               </div>
               
               {item.status === 'closed' && (
                   <div className="mt-4 pt-3 border-t border-slate-100">
                       <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-bold text-slate-500">القرار / الإجراء المتخذ:</span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                               item.actionTaken === 'warning' ? 'bg-amber-100 text-amber-800' :
                               item.actionTaken === 'deduction' ? 'bg-orange-100 text-orange-800' :
                               item.actionTaken === 'termination' ? 'bg-red-100 text-red-800' :
                               'bg-slate-100 text-slate-600'
                           }`}>
                               {item.actionTaken === 'warning' ? 'إنذار' :
                                item.actionTaken === 'deduction' ? 'خصم مالي' :
                                item.actionTaken === 'termination' ? 'فصل/إنهاء خدمة' : 'حفظ/لا يوجد إجراء'}
                           </span>
                       </div>
                       <div className="flex gap-1 text-green-800 bg-green-50 p-2.5 rounded-lg items-start border border-green-100">
                           <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                           <span className="text-xs font-medium leading-relaxed">{item.resolution || 'تم الإغلاق بدون تسجيل تفاصيل القرار'}</span>
                       </div>
                   </div>
               )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border-dashed border-2 border-slate-200">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium">لا توجد تحقيقات مطابقة للبحث</p>
            <p className="text-sm mt-1">تأكد من تعديل الفلاتر أو جرب كلمات مختلفة</p>
          </div>
        )}
      </div>

      <InvestigationModal
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
        message="هل أنت متأكد من حذف هذا السجل بشكل نهائي؟"
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.laborInvestigations?.delete(deleteId);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
