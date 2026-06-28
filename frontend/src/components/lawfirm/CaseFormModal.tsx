import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { LawCase, Customer, LegalOpponent } from '../../types';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LawCase) => void;
  initialData: LawCase | null;
  clients: Customer[];
  opponents: LegalOpponent[];
}

const CaseFormModal: React.FC<CaseFormModalProps> = ({ isOpen, onClose, onSave, initialData, clients, opponents }) => {
  const { error } = useToast();
  const [formData, setFormData] = useState<Partial<LawCase>>({
    caseNumber: '',
    title: '',
    clientId: undefined,
    courtName: '',
    opponentName: '',
    opponentLawyer: '',
    status: 'active',
    openedAt: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseNumber || !formData.title || !formData.clientId || !formData.courtName) return;

    // Conflict of interest check
    if (formData.opponentName && formData.opponentName.trim() !== '') {
      const isOpponentAlsoClient = clients.some(c => 
        c.name.trim().toLowerCase() === formData.opponentName?.trim().toLowerCase()
      );
      if (isOpponentAlsoClient) {
        error('تنبيه: تضارب مصالح! اسم الخصم يطابق أحد الموكلين المسجلين في النظام.');
        return;
      }
    }

    onSave(formData as LawCase);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'تعديل قضية' : 'إضافة قضية جديدة'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">موضوع الدعوى *</label>
              <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم القضية *</label>
              <input required type="text" value={formData.caseNumber || ''} onChange={e => setFormData({...formData, caseNumber: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المحكمة *</label>
              <input required type="text" value={formData.courtName || ''} onChange={e => setFormData({...formData, courtName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الموكل *</label>
              <select required value={formData.clientId || ''} onChange={e => setFormData({...formData, clientId: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">اختر الموكل...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ فتح القضية *</label>
              <input required type="date" value={formData.openedAt?.split('T')[0] || ''} onChange={e => setFormData({...formData, openedAt: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم الخصم (اختر إن وجد)</label>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="أو ادخل اسم جديد..." value={formData.opponentName || ''} onChange={e => setFormData({...formData, opponentName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                <select value={formData.opponentName || ''} onChange={e => setFormData({...formData, opponentName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-500 bg-slate-50">
                  <option value="">-- أو اختر من قائمة الخصوم المسجلين --</option>
                  {opponents.map(o => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">محامي الخصم</label>
              <input type="text" value={formData.opponentLawyer || ''} onChange={e => setFormData({...formData, opponentLawyer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as LawCase['status']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="active">نشطة</option>
                <option value="suspended">معلقة</option>
                <option value="closed">مغلقة</option>
                <option value="won">رابحة</option>
                <option value="lost">خاسرة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">إجمالي الأتعاب</label>
              <input type="number" min="0" value={formData.totalFees || ''} onChange={e => setFormData({...formData, totalFees: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ المدفوع</label>
              <input type="number" min="0" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات والتفاصيل</label>
              <textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold">
              إلغاء
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-sm">
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseFormModal;
