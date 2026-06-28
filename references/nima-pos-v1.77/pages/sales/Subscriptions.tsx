import React, { useState } from 'react';
import { db } from '../../db';
import { Subscription, Customer } from '../../types';
import { Repeat, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function Subscriptions() {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);
  const [formData, setFormData] = useState<Partial<Subscription>>({
    customerId: 0,
    planName: '',
    amount: 0,
    billingCycle: 'monthly',
    nextBillingDate: new Date(),
    status: 'active'
  });

  const subscriptions = useLiveQuery(() => db.subscriptions.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub?.id) {
        await db.subscriptions.update(editingSub.id, formData as Subscription);
        success('تم تحديث الاشتراك بنجاح');
      } else {
        await db.subscriptions.add(formData as Subscription);
        success('تم إضافة الاشتراك الجديد بنجاح');
      }
      setIsModalOpen(false);
      setEditingSub(null);
      setFormData({ customerId: 0, planName: '', amount: 0, billingCycle: 'monthly', nextBillingDate: new Date(), status: 'active' });
    } catch (err) {
      console.error(err);
      showError('فشل في حفظ بيانات الاشتراك');
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData(sub);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.subscriptions.delete(confirmConfig.id);
      success('تم حذف الاشتراك بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف الاشتراك');
    }
    setConfirmConfig(null);
  };


  const getCustomerName = (id: number) => {
    return customers?.find(c => c.id === id)?.name || 'غير معروف';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" />
            الاشتراكات والعقود
          </h1>
          <p className="text-gray-500 mt-1">إدارة الخدمات المتكررة وعقود الصيانة</p>
        </div>
        <button
          onClick={() => {
            setEditingSub(null);
            setFormData({ customerId: 0, planName: '', amount: 0, billingCycle: 'monthly', nextBillingDate: new Date(), status: 'active' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          إضافة اشتراك جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">العميل</th>
                <th className="p-4 text-sm font-semibold text-gray-600">اسم الباقة / العقد</th>
                <th className="p-4 text-sm font-semibold text-gray-600">المبلغ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">دورة الفوترة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">تاريخ التجديد القادم</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions?.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{getCustomerName(sub.customerId)}</td>
                  <td className="p-4 text-gray-600">{sub.planName}</td>
                  <td className="p-4 font-bold text-gray-800">{sub.amount.toLocaleString()}</td>
                  <td className="p-4 text-gray-600">{sub.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}</td>
                  <td className="p-4 text-gray-600">{new Date(sub.nextBillingDate).toLocaleDateString('ar-SA')}</td>
                  <td className="p-4">
                    {sub.status === 'active' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> نشط</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> ملغى</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(sub)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => sub.id && confirmDelete(sub.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscriptions?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    لا توجد اشتراكات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingSub ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>اختر العميل...</option>
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الباقة / العقد</label>
                <input
                  type="text"
                  required
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: صيانة دورية سنوية"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">دورة الفوترة</label>
                <select
                  required
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التجديد القادم</label>
                <input
                  type="date"
                  required
                  value={formData.nextBillingDate ? new Date(formData.nextBillingDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: new Date(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">نشط</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف الاشتراك"
          message="هل أنت متأكد من حذف هذا الاشتراك أو العقد؟ لا يمكن استرجاع بيانات الفوترة التكرارية أو خطة الاشتراك بعد الحذف."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
}
