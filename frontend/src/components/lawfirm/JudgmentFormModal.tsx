import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Judgment, LawCase } from '../../types';

interface JudgmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Judgment) => void;
  initialData: Judgment | null;
  cases: LawCase[];
}

export default function JudgmentFormModal({ isOpen, onClose, onSave, initialData, cases }: JudgmentFormModalProps) {
  const [formData, setFormData] = useState<Partial<Judgment>>({
    caseId: undefined,
    judgmentDate: new Date().toISOString().split('T')[0],
    courtName: '',
    judgmentText: '',
    status: 'pending_execution',
    executionDate: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        judgmentDate: initialData.judgmentDate.split('T')[0],
        executionDate: initialData.executionDate ? initialData.executionDate.split('T')[0] : ''
      });
    } else {
      setFormData({
        caseId: undefined,
        judgmentDate: new Date().toISOString().split('T')[0],
        courtName: '',
        judgmentText: '',
        status: 'pending_execution',
        executionDate: '',
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId || !formData.judgmentDate || !formData.courtName) return;
    onSave(formData as Judgment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'تعديل حكم' : 'تسجيل حكم قضائي'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">القضية المرتبطة بالحكم *</label>
              <select required value={formData.caseId || ''} onChange={e => setFormData({...formData, caseId: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">اختر القضية...</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.caseNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">جهة وتاريخ الحكم *</label>
              <input required type="text" placeholder="اسم المحكمة / الدائرة" value={formData.courtName || ''} onChange={e => setFormData({...formData, courtName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-3" />
              <input required type="date" value={formData.judgmentDate || ''} onChange={e => setFormData({...formData, judgmentDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">حالة التنفيذ</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Judgment['status']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="pending_execution">قيد التنفيذ / جاري التنفيذ</option>
                  <option value="executed">تم التنفيذ</option>
                  <option value="appealed">مستأنف / معترض عليه</option>
                </select>
              </div>

              {formData.status === 'executed' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ التنفيذ الفعلي</label>
                  <input type="date" value={formData.executionDate || ''} onChange={e => setFormData({...formData, executionDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              )}
              {formData.status !== 'executed' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                    <span>تاريخ انتهاء مدة الطعن/الاستئناف</span>
                  </label>
                  <input type="date" value={formData.appealDeadline || ''} onChange={e => setFormData({...formData, appealDeadline: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">منطوق أو نص الحكم</label>
              <textarea rows={4} value={formData.judgmentText || ''} onChange={e => setFormData({...formData, judgmentText: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="اكتب نص الحكم هنا..."></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات وخطوات تالية</label>
              <textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            </div>
            
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold">
              إلغاء
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-sm">
              حفظ الحكم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
