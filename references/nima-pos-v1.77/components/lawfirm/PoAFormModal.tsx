import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PowerOfAttorney, Customer, LawCase } from '../../types';

interface PoAFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PowerOfAttorney) => void;
  initialData: PowerOfAttorney | null;
  clients: Customer[];
  cases: LawCase[];
}

const PoAFormModal: React.FC<PoAFormModalProps> = ({ isOpen, onClose, onSave, initialData, clients, cases }) => {
  const [formData, setFormData] = useState<Partial<PowerOfAttorney>>({
    poaNumber: '',
    clientId: undefined,
    type: 'general',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        issueDate: initialData.issueDate.split('T')[0],
        expiryDate: initialData.expiryDate ? initialData.expiryDate.split('T')[0] : ''
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poaNumber || !formData.clientId || !formData.issueDate) return;
    onSave(formData as PowerOfAttorney);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'تعديل وكالة' : 'إضافة وكالة جديدة'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رقم الوكالة *</label>
              <input required type="text" value={formData.poaNumber || ''} onChange={e => setFormData({...formData, poaNumber: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نوع الوكالة *</label>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as PowerOfAttorney['type']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="general">وكالة عامة</option>
                <option value="special">وكالة خاصة</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">الموكل (الموكل بصياغة الوكالة) *</label>
              <select required value={formData.clientId || ''} onChange={e => setFormData({...formData, clientId: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">اختر الموكل...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {formData.type === 'special' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">ربط بقضية (اختياري)</label>
                <select value={formData.caseId || ''} onChange={e => setFormData({...formData, caseId: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">بدون ربط بقضية</option>
                  {cases.filter(c => c.clientId === formData.clientId).map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.caseNumber})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">موضوع / وصف الوكالة (إن كانت خاصة)</label>
              <textarea rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الإصدار *</label>
              <input required type="date" value={formData.issueDate || ''} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانتهاء</label>
              <input type="date" value={formData.expiryDate || ''} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">حالة الوكالة</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PowerOfAttorney['status']})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="active">سارية المفعول</option>
                <option value="expired">منتهية</option>
                <option value="revoked">ملغاة (مسحوبة)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات والتفاصيل</label>
              <textarea rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            </div>
            
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold">
              إلغاء
            </button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-sm">
              حفظ الوكالة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoAFormModal;
