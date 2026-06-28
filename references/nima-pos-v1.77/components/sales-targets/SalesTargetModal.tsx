import React from 'react';
import { SalesTarget, User } from '../../types';

interface SalesTargetModalProps {
  editingTarget: SalesTarget | null;
  formData: Partial<SalesTarget>;
  setFormData: (data: Partial<SalesTarget>) => void;
  users: User[];
  onClose: () => void;
  onSave: () => void;
}

const SalesTargetModal: React.FC<SalesTargetModalProps> = ({
  editingTarget,
  formData,
  setFormData,
  users,
  onClose,
  onSave
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">
            {editingTarget ? 'تعديل هدف المبيعات' : 'إضافة هدف مبيعات'}
          </h2>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المندوب / الموظف</label>
            <select
              value={formData.employeeId || 0}
              onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
            >
              <option value={0}>اختر الموظف...</option>
              {users?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الهدف (ج.م)</label>
              <input
                type="number"
                value={formData.targetAmount || ''}
                onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">المحقق (ج.م)</label>
              <input
                type="number"
                value={formData.achievedAmount || ''}
                onChange={(e) => setFormData({ ...formData, achievedAmount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نسبة العمولة (%)</label>
              <input
                type="number"
                value={formData.commissionRate || ''}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الفترة</label>
              <select
                value={formData.period || 'month'}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
              >
                <option value="month">شهري</option>
                <option value="quarter">ربع سنوي</option>
                <option value="year">سنوي</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium transition-all resize-none"
              rows={3}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesTargetModal;
