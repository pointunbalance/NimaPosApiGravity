import React, { useState } from 'react';
import { db } from '../../db';
import { SalesTarget } from '../../types';
import { Target, Plus, Edit, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function SalesTargets() {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);
  const [formData, setFormData] = useState<Partial<SalesTarget>>({
    employeeId: 0,
    targetAmount: 0,
    achievedAmount: 0,
    commissionRate: 0,
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  const targets = useLiveQuery(() => db.salesTargets.toArray());
  const employees = useLiveQuery(() => db.users.where('role').notEqual('admin').toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTarget?.id) {
        await db.salesTargets.update(editingTarget.id, formData as SalesTarget);
        success('تم تحديث هدف المبيعات والعمولة بنجاح');
      } else {
        await db.salesTargets.add(formData as SalesTarget);
        success('تم إضافة هدف مبيعات جديد بنجاح');
      }
      setIsModalOpen(false);
      setEditingTarget(null);
      setFormData({ employeeId: 0, targetAmount: 0, achievedAmount: 0, commissionRate: 0, period: new Date().toISOString().slice(0, 7) });
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ المستهدف');
    }
  };

  const handleEdit = (target: SalesTarget) => {
    setEditingTarget(target);
    setFormData(target);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.salesTargets.delete(confirmConfig.id);
      success('تم حذف هدف المبيعات والعمولة بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف المستهدف');
    }
    setConfirmConfig(null);
  };

  const getEmployeeName = (id: number) => {
    return employees?.find(e => e.id === id)?.name || 'غير معروف';
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-tr from-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600 animate-pulse" />
            أهداف المبيعات والعمولات
          </h1>
          <p className="text-gray-500 mt-1">إدارة مستهدفات الموظفين وحساب العمولات والمكافآت المكتسبة</p>
        </div>
        <button
          onClick={() => {
            setEditingTarget(null);
            setFormData({ employeeId: 0, targetAmount: 0, achievedAmount: 0, commissionRate: 0, period: new Date().toISOString().slice(0, 7) });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة هدف جديد
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-indigo-100/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-indigo-100/40">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">الموظف</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الفترة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الهدف</th>
                <th className="p-4 text-sm font-semibold text-gray-600">المحقق</th>
                <th className="p-4 text-sm font-semibold text-gray-600">نسبة الإنجاز</th>
                <th className="p-4 text-sm font-semibold text-gray-600">العمولة المستحقة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {targets?.map((target) => {
                const progress = target.targetAmount > 0 ? (target.achievedAmount / target.targetAmount) * 100 : 0;
                const commission = (target.achievedAmount * target.commissionRate) / 100;
                return (
                  <tr key={target.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{getEmployeeName(target.employeeId)}</td>
                    <td className="p-4 text-gray-600 font-mono">{target.period}</td>
                    <td className="p-4 text-gray-600 font-mono">{target.targetAmount.toLocaleString()}</td>
                    <td className="p-4 text-gray-600 font-mono">{target.achievedAmount.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-mono text-gray-600">{progress.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-emerald-600 font-mono">{commission.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(target)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => target.id && confirmDelete(target.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {targets?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Target className="w-12 h-12 text-gray-300 animate-bounce" />
                      <p>لا توجد أهداف مبيعات مسجلة حتى الآن</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-indigo-100/30">
            <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-2">{editingTarget ? 'تعديل الهدف والعمولة' : 'إضافة هدف جديد للموظف'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={0}>اختر الموظف...</option>
                  {employees?.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفترة (شهر/سنة)</label>
                <input
                  type="month"
                  required
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المستهدف</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المحقق</label>
                <input
                  type="number"
                  min="0"
                  value={formData.achievedAmount}
                  onChange={(e) => setFormData({ ...formData, achievedAmount: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نسبة العمولة (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow"
                >
                  حفظ المستهدف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف هدف المبيعات"
          message="هل أنت متأكد من حذف مستهدف المبيعات هذا نهائياً؟ قد يؤدي هذا إلى إلغاء احتساب عمولة الموظف لهذه الفترة."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
}
