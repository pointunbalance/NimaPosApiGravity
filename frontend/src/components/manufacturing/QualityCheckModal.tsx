import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { QualityCheck, User, WorkOrder, PurchaseOrder } from '../../types';

interface QualityCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (check: Partial<QualityCheck>) => void;
  editingCheck?: QualityCheck | null;
  users: User[];
  workOrders: WorkOrder[];
  purchaseOrders: PurchaseOrder[];
}

const QualityCheckModal: React.FC<QualityCheckModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCheck,
  users,
  workOrders,
  purchaseOrders
}) => {
  const [formData, setFormData] = useState<Partial<QualityCheck>>({
    referenceType: 'work_order',
    referenceId: 0,
    date: new Date(),
    inspectorId: 0,
    status: 'pending',
    notes: '',
    criteria: []
  });

  useEffect(() => {
    if (editingCheck) {
      setFormData(editingCheck);
    } else {
      setFormData({
        referenceType: 'work_order',
        referenceId: workOrders.length > 0 ? workOrders[0].id : 0,
        date: new Date(),
        inspectorId: users.length > 0 ? users[0].id : 0,
        status: 'pending',
        notes: '',
        criteria: [{ name: '', passed: false, notes: '' }]
      });
    }
  }, [editingCheck, isOpen, workOrders, users]);

  if (!isOpen) return null;

  const handleAddCriteria = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [...(prev.criteria || []), { name: '', passed: false, notes: '' }]
    }));
  };

  const handleUpdateCriteria = (index: number, field: string, value: any) => {
    const newCriteria = [...(formData.criteria || [])];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, criteria: newCriteria });
  };

  const handleRemoveCriteria = (index: number) => {
    const newCriteria = [...(formData.criteria || [])];
    newCriteria.splice(index, 1);
    setFormData({ ...formData, criteria: newCriteria });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {editingCheck ? 'تعديل تقرير جودة' : 'تقرير جودة جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">نوع المرجع</label>
              <select
                value={formData.referenceType}
                onChange={(e) => setFormData({ ...formData, referenceType: e.target.value as any, referenceId: 0 })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="work_order">أمر عمل (تصنيع)</option>
                <option value="purchase_order">أمر شراء (توريد)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">المرجع</label>
              <select
                value={formData.referenceId}
                onChange={(e) => setFormData({ ...formData, referenceId: Number(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value={0}>اختر المرجع...</option>
                {formData.referenceType === 'work_order' ? (
                  workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.workOrderNumber}</option>
                  ))
                ) : (
                  purchaseOrders.map(po => (
                    <option key={po.id} value={po.id}>PO-{po.id} - {po.supplierName}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">المفتش</label>
              <select
                value={formData.inspectorId}
                onChange={(e) => setFormData({ ...formData, inspectorId: Number(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value={0}>اختر المفتش...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ الفحص</label>
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="pending">قيد الانتظار</option>
                <option value="passed">مجتاز</option>
                <option value="failed">فاشل</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات عامة</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">معايير الفحص</h3>
              <button
                type="button"
                onClick={handleAddCriteria}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <Plus className="w-4 h-4" /> إضافة معيار
              </button>
            </div>

            <div className="space-y-4">
              {formData.criteria?.map((criterion, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1 space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="اسم المعيار (مثال: الأبعاد، اللون، المتانة)"
                        value={criterion.name}
                        onChange={(e) => handleUpdateCriteria(index, 'name', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={criterion.passed}
                          onChange={(e) => handleUpdateCriteria(index, 'passed', e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-slate-700">مجتاز</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ملاحظات المعيار"
                        value={criterion.notes || ''}
                        onChange={(e) => handleUpdateCriteria(index, 'notes', e.target.value)}
                        className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriteria(index)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {(!formData.criteria || formData.criteria.length === 0) && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  لا توجد معايير مضافة. اضغط على "إضافة معيار" للبدء.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              حفظ التقرير
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QualityCheckModal;
