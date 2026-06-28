import React, { useState } from 'react';
import { Gavel, Plus, Search, Scale, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import { Judgment } from '../../types';
import JudgmentFormModal from '../../components/lawfirm/JudgmentFormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { JudgmentsTable } from '../../components/legal/JudgmentsTable';

export default function Judgments() {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJudgment, setEditingJudgment] = useState<Judgment | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const cases = useLiveQuery(() => db.lawCases.toArray()) || [];
  
  const allJudgments = useLiveQuery(() => db.judgments.reverse().toArray()) || [];
  
  const judgments = allJudgments.filter(j => {
    let matchesSearch = true;
    if (search) {
      const caseName = getCaseName(j.caseId).toLowerCase();
      matchesSearch = caseName.includes(search.toLowerCase()) || 
                      j.courtName.toLowerCase().includes(search.toLowerCase()) ||
                      j.judgmentText.toLowerCase().includes(search.toLowerCase());
    }
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = j.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalJudgments = allJudgments.length;
  const pendingJudgments = allJudgments.filter(j => j.status === 'pending_execution').length;
  const executedJudgments = allJudgments.filter(j => j.status === 'executed').length;
  const appealedJudgments = allJudgments.filter(j => j.status === 'appealed').length;

  const handleSave = async (data: Judgment) => {
    try {
      if (data.id) {
        await db.judgments.update(data.id, data);
        success('تم تحديث الحكم بنجاح');
      } else {
        await db.judgments.add(data);
        success('تم إضافة الحكم بنجاح');
      }
      setIsModalOpen(false);
    } catch (e) {
      error('حدث خطأ أثناء حفظ الحكم');
    }
  };

  function getCaseName(caseId: number) {
    const c = cases.find(c => c.id === caseId);
    return c ? `${c.title} (${c.caseNumber})` : 'غير معروف';
  }

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const handleQuickStatusChange = async (j: Judgment, newStatus: Judgment['status']) => {
    try {
      await db.judgments.update(j.id!, { 
        status: newStatus,
        executionDate: newStatus === 'executed' ? new Date().toISOString() : j.executionDate
      });
      success('تم تحديث حالة الحكم بنجاح');
    } catch (err) {
      error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleEdit = (j: Judgment) => {
    setEditingJudgment(j);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Gavel className="w-8 h-8 text-indigo-600" />
            الأحكام والتنفيذ
          </h1>
          <p className="text-slate-500 mt-2">سجل الأحكام القضائية والمتابعة الدورية لتنفيذها</p>
        </div>
        <button 
          onClick={() => { setEditingJudgment(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          تسجيل حكم
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium mb-1">إجمالي الأحكام</p>
          <h3 className="text-2xl font-bold text-slate-800">{totalJudgments}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium mb-1">قيد التنفيذ</p>
          <h3 className="text-2xl font-bold text-slate-800">{pendingJudgments}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium mb-1">تم التنفيذ</p>
          <h3 className="text-2xl font-bold text-slate-800">{executedJudgments}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium mb-1">مستأنف/معترض عليه</p>
          <h3 className="text-2xl font-bold text-slate-800">{appealedJudgments}</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex w-full md:w-auto items-center gap-3 flex-1 lg:w-1/2">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث باسم القضية، المحكمة، أو نص الحكم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-600"
            >
              <option value="all">كل الحالات</option>
              <option value="pending_execution">قيد التنفيذ</option>
              <option value="executed">تم التنفيذ</option>
              <option value="appealed">مستأنف / معترض عليه</option>
            </select>
          </div>
        </div>
        
        <JudgmentsTable
          judgments={judgments}
          cases={cases}
          getCaseName={getCaseName}
          onQuickStatusChange={handleQuickStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {isModalOpen && (
        <JudgmentFormModal 
          isOpen={isModalOpen}
          initialData={editingJudgment}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          cases={cases}
        />
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف الحكم"
        message="هل أنت متأكد من حذف هذا الحكم القضائي؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            try {
              await db.judgments.delete(deleteId);
              success('تم حذف الحكم بنجاح');
            } catch (e) {
              error('حدث خطأ أثناء الحذف');
            } finally {
              setDeleteId(null);
            }
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
