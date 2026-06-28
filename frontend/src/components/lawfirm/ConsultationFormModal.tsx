import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LegalConsultation, Customer } from '../../types';

interface ConsultationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LegalConsultation) => void;
  initialData: LegalConsultation | null;
  clients: Customer[];
}

const ConsultationFormModal: React.FC<ConsultationFormModalProps> = ({ isOpen, onClose, onSave, initialData, clients }) => {
  const [formData, setFormData] = useState<Partial<LegalConsultation>>({
    topic: '',
    type: 'in-person',
    consultationDate: new Date().toISOString().split('T')[0],
    fees: 0,
    status: 'scheduled',
    notes: '',
    recommendations: '',
    clientId: undefined,
    clientNameStr: ''
  });
  
  const [isRegisteredClient, setIsRegisteredClient] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        consultationDate: initialData.consultationDate.split('T')[0]
      });
      setIsRegisteredClient(!!initialData.clientId);
    } else {
      setFormData({
        topic: '',
        type: 'in-person',
        consultationDate: new Date().toISOString().split('T')[0],
        fees: 0,
        status: 'scheduled',
        notes: '',
        recommendations: '',
        clientId: undefined,
        clientNameStr: ''
      });
      setIsRegisteredClient(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic || !formData.consultationDate) return;
    
    // Clear the opposite client field depending on the toggle
    const finalData = { ...formData };
    if (isRegisteredClient) {
      finalData.clientNameStr = '';
    } else {
      finalData.clientId = undefined;
    }

    onSave(finalData as LegalConsultation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'تعديل استشارة' : 'تسجيل استشارة جديدة'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">موضوع الاستشارة الأساسي *</label>
              <input required type="text" value={formData.topic || ''} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="md:col-span-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={isRegisteredClient} onChange={() => setIsRegisteredClient(true)} className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">موكل مسجل</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isRegisteredClient} onChange={() => setIsRegisteredClient(false)} className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">عميل جديد / زائر</span>
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                  <input type="checkbox" checked={formData.isConfidential || false} onChange={e => setFormData({...formData, isConfidential: e.target.checked})} className="text-rose-600 focus:ring-rose-500 rounded" />
                  <span className="text-sm font-bold text-rose-700">استشارة سرية (محجوبة)</span>
                </label>
              </div>

              {isRegisteredClient ? (
                <select required value={formData.clientId || ''} onChange={e => setFormData({...formData, clientId: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">اختر الموكل...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input required type="text" placeholder="اسم طالب الاستشارة..." value={formData.clientNameStr || ''} onChange={e => setFormData({...formData, clientNameStr: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الاستشارة *</label>
              <input required type="date" value={formData.consultationDate || ''} onChange={e => setFormData({...formData, consultationDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع الاستشارة *</label>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as LegalConsultation['type']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="in-person">حضور شخصي للمكتب</option>
                <option value="phone">مكالمة هاتفية</option>
                <option value="online">اجتماع أونلاين</option>
                <option value="written">استشارة مكتوبة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الأتعاب (إن وجدت)</label>
              <input type="number" min="0" value={formData.fees || ''} onChange={e => setFormData({...formData, fees: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as LegalConsultation['status']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="scheduled">مجدولة / قادمة</option>
                <option value="completed">مكتملة / تمت</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل وملاحظات الاستشارة</label>
              <textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="وصف موجز لما تم مناقشته..."></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">الرأي القانوني أو التوصيات</label>
              <textarea rows={2} value={formData.recommendations || ''} onChange={e => setFormData({...formData, recommendations: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="الإجراء القانوني المنصوح به..."></textarea>
            </div>
            
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold">
              إلغاء
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-sm">
              حفظ الاستشارة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationFormModal;
