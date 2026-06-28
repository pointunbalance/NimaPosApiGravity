import React, { useState } from 'react';
import { MessageSquare, Plus, Search, Edit, Trash2, Calendar, Phone, Users, FileText, CheckCircle2, Monitor } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LegalConsultation } from '../types';
import { useToast } from '../context/ToastContext';
import ConsultationFormModal from '../components/lawfirm/ConsultationFormModal';

import ConfirmModal from '../components/ui/ConfirmModal';

const LegalConsultations: React.FC = () => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<LegalConsultation | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Queries
  const clients = useLiveQuery(() => db.customers.toArray()) || [];
  
  const consultations = useLiveQuery(async () => {
    let all = await db.legalConsultations.reverse().toArray();
    if (search) {
      all = all.filter(c => 
        c.topic.includes(search) || 
        (c.clientNameStr && c.clientNameStr.includes(search))
      );
    }
    if (statusFilter !== 'all') {
      all = all.filter(c => c.status === statusFilter);
    }
    return all;
  }, [search, statusFilter]) || [];

  const handleSaveConsultation = async (data: LegalConsultation) => {
    try {
      if (data.id) {
        await db.legalConsultations.update(data.id, data);
        success('تم تحديث الاستشارة بنجاح');
      } else {
        await db.legalConsultations.add(data);
        success('تم تسجيل الاستشارة بنجاح');
      }
      setIsModalOpen(false);
    } catch (e) {
      error('حدث خطأ أثناء حفظ الاستشارة');
    }
  };

  const handleDeleteConsultation = async (id: number) => {
    setDeleteId(id);
  };

  const getClientNameFull = (consultation: LegalConsultation) => {
    if (consultation.clientId) {
      return clients.find(c => c.id === consultation.clientId)?.name || 'غير معروف';
    }
    return consultation.clientNameStr || 'زائر مجهول';
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'in-person': return <Users className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'online': return <Monitor className="w-4 h-4" />;
      case 'written': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'in-person': return 'حضور للمكتب';
      case 'phone': return 'هاتفية';
      case 'online': return 'أونلاين (عن بعد)';
      case 'written': return 'مكتوبة';
      default: return 'أخرى';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            الاستشارات القانونية
          </h1>
          <p className="text-slate-500 mt-2">توثيق وحفظ الاستشارات ومواعيد العملاء</p>
        </div>
        <button 
          onClick={() => { setEditingConsultation(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          تسجيل استشارة
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex w-full md:w-auto items-center gap-3 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث في موضوع أو اسم الموكل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-600"
            >
              <option value="all">كل الحالات</option>
              <option value="scheduled">مجدولة / قادمة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">الموضوع</th>
                <th className="px-6 py-4">طالب الاستشارة</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">الأتعاب</th>
                <th className="px-6 py-4 text-center">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    لا توجد استشارات مسجلة
                  </td>
                </tr>
              ) : (
                consultations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {c.isConfidential ? (
                        <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded w-max text-xs">
                          <CheckCircle2 className="w-3 h-3" /> استشارة سرية
                        </span>
                      ) : c.topic}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-bold">
                      {c.isConfidential ? 'محجوب' : (
                        <>
                          {getClientNameFull(c)}
                          {!c.clientId && <span className="mr-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">زائر</span>}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(c.consultationDate).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1 rounded-lg w-max text-sm font-medium">
                        {getTypeIcon(c.type)}
                        {getTypeLabel(c.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                      {c.fees ? c.fees.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        c.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {c.status === 'completed' ? 'مكتملة' : c.status === 'scheduled' ? 'مجدولة' : 'ملغاة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { setEditingConsultation(c); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => c.id && handleDeleteConsultation(c.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ConsultationFormModal 
          isOpen={isModalOpen}
          initialData={editingConsultation}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveConsultation}
          clients={clients}
        />
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف الاستشارة"
        message="هل أنت متأكد من حذف هذه الاستشارة القانونية؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            try {
              await db.legalConsultations.delete(deleteId);
              success('تم الحذف بنجاح');
            } catch (e) {
              error('حدث خطأ');
            } finally {
              setDeleteId(null);
            }
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default LegalConsultations;
