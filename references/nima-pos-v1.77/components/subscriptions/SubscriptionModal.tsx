import React from 'react';
import { Subscription, Customer } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSubscription: Subscription | null;
  formData: Partial<Subscription>;
  setFormData: (data: Partial<Subscription>) => void;
  customers: Customer[] | undefined;
  onSave: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  editingSubscription,
  formData,
  setFormData,
  customers,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {editingSubscription ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">العميل</label>
            <select
              value={formData.customerId || 0}
              onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>اختر العميل...</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم الخطة</label>
            <input
              type="text"
              value={formData.planName || ''}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ (ر.س)</label>
            <input
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">دورة الفوترة</label>
            <select
              value={formData.billingCycle || 'monthly'}
              onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              تاريخ التجديد القادم
            </label>
            <input
              type="date"
              value={
                formData.nextBillingDate
                  ? new Date(formData.nextBillingDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => setFormData({ ...formData, nextBillingDate: new Date(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">نشط</option>
              <option value="cancelled">ملغى</option>
              <option value="past_due">متأخر الدفع</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
