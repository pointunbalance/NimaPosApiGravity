import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { CourtSession, LawCase } from '../../types';

interface SessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CourtSession) => void;
  initialData: CourtSession | null;
  cases: LawCase[];
  existingSessions: CourtSession[];
}

const SessionFormModal: React.FC<SessionFormModalProps> = ({ isOpen, onClose, onSave, initialData, cases, existingSessions }) => {
  const { error } = useToast();
  const [formData, setFormData] = useState<Partial<CourtSession>>({
    caseId: undefined,
    sessionDate: new Date().toISOString().split('T')[0],
    courtName: '',
    sessionTime: '09:00',
    decision: '',
    requirements: '',
    status: 'upcoming',
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
    if (!formData.caseId || !formData.sessionDate || !formData.courtName) return;

    // Check for scheduling conflicts
    const sessionDateStr = formData.sessionDate.split('T')[0];
    const hasConflict = existingSessions.some(s => 
      s.id !== formData.id && // exclude current session if editing
      s.sessionDate.split('T')[0] === sessionDateStr &&
      s.sessionTime === formData.sessionTime
    );

    if (hasConflict) {
      error('تنبيه: يوجد تعارض! هناك جلسة أخرى مسجلة في نفس اليوم والوقت تماماً.');
      return;
    }

    onSave(formData as CourtSession);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 gap-4">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">القضية المرتبطة *</label>
              <select required value={formData.caseId || ''} onChange={e => setFormData({...formData, caseId: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">اختر القضية...</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الجلسة *</label>
                <input required type="date" value={formData.sessionDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, sessionDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">وقت الجلسة</label>
                <input type="time" value={formData.sessionTime || ''} onChange={e => setFormData({...formData, sessionTime: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المحكمة أو الدائرة *</label>
              <input required type="text" value={formData.courtName || ''} onChange={e => setFormData({...formData, courtName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as CourtSession['status']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="upcoming">قادمة</option>
                <option value="completed">تمت</option>
                <option value="postponed">مؤجلة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">القرار (إن وُجد)</label>
              <input type="text" value={formData.decision || ''} onChange={e => setFormData({...formData, decision: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الطلبات / المتطلبات للجلسة القادمة</label>
              <textarea rows={2} value={formData.requirements || ''} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات عامة</label>
              <textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
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

export default SessionFormModal;
