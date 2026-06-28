import React, { useState } from 'react';
import { db } from '../../db';
import { QualityCheck, WorkOrder, PurchaseOrder, User } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { 
  ClipboardCheck, Plus, Search, Filter, CheckCircle, XCircle, 
  AlertCircle, Clock, User as UserIcon, X, Save
} from 'lucide-react';

export default function QualityControl() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'pending'>('all');
  
  const [newCheck, setNewCheck] = useState<Partial<QualityCheck>>({
    referenceType: 'work_order',
    status: 'pending',
    criteria: [
      { name: 'المظهر العام', passed: true },
      { name: 'المطابقة للمواصفات', passed: true },
      { name: 'التغليف', passed: true }
    ]
  });

  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());
  const qualityChecks = useLiveQuery(() => db.qualityChecks.reverse().sortBy('date'));
  const users = useLiveQuery(() => db.users.toArray());
  const workOrders = useLiveQuery(() => db.workOrders.toArray());
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.toArray());

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCheck.referenceId) return;

    try {
      await (db as any).transaction('rw', db.qualityChecks, db.workOrders, db.products, db.stockAdjustments, async () => {
        
        await db.qualityChecks.add({
          referenceId: Number(newCheck.referenceId),
          referenceType: newCheck.referenceType as 'work_order' | 'purchase_order',
          date: new Date(),
          inspectorId: currentUser.id!,
          status: newCheck.status as 'passed' | 'failed' | 'pending',
          notes: newCheck.notes,
          criteria: newCheck.criteria || []
        });

        // QC Logic: Identify failure and quarantine/scrap the products
        if (newCheck.status === 'failed') {
          if (newCheck.referenceType === 'work_order') {
            const wo = await db.workOrders.get(Number(newCheck.referenceId));
            if (wo && wo.status === 'completed') {
               const product = await db.products.get(wo.productId);
               if (product) {
                 // Deduct the actual quantity produced from stock since it failed QC
                 const qtyToDeduct = wo.actualQuantity || wo.plannedQuantity || 1;
                 
                 await db.products.update(product.id!, {
                   stock: Math.max(0, product.stock - qtyToDeduct)
                 });
                 
                 await db.stockAdjustments.add({
                    productId: product.id!,
                    productName: product.name,
                    type: 'decrease',
                    quantity: qtyToDeduct,
                    reason: 'damage',
                    notes: `تم الحجز والإتلاف لرسوب في الفحص الفني. رقم أمر التشغيل: ${wo.workOrderNumber}`,
                    date: new Date()
                 });
               }
            }
          }
        }
      });

      setIsModalOpen(false);
      setNewCheck({
        referenceType: 'work_order',
        status: 'pending',
        criteria: [
          { name: 'المظهر العام', passed: true },
          { name: 'المطابقة للمواصفات', passed: true },
          { name: 'التغليف', passed: true }
        ]
      });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الفحص');
    }
  };

  const updateCriterion = (index: number, field: string, value: any) => {
    const updatedCriteria = [...(newCheck.criteria || [])];
    updatedCriteria[index] = { ...updatedCriteria[index], [field]: value };
    setNewCheck({ ...newCheck, criteria: updatedCriteria });
  };

  const addCriterion = () => {
    setNewCheck({
      ...newCheck,
      criteria: [...(newCheck.criteria || []), { name: '', passed: true }]
    });
  };

  const removeCriterion = (index: number) => {
    const updatedCriteria = [...(newCheck.criteria || [])];
    updatedCriteria.splice(index, 1);
    setNewCheck({ ...newCheck, criteria: updatedCriteria });
  };

  const filteredChecks = qualityChecks?.filter(check => {
    const matchesStatus = statusFilter === 'all' || check.status === statusFilter;
    return matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-emerald-100 text-emerald-800 ';
      case 'failed': return 'bg-red-100 text-red-800 ';
      case 'pending': return 'bg-amber-100 text-amber-800 ';
      default: return 'bg-slate-100 text-slate-800 ';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'passed': return 'مجتاز';
      case 'failed': return 'مرفوض';
      case 'pending': return 'قيد الفحص';
      default: return status;
    }
  };

  const getReferenceName = (check: QualityCheck) => {
    if (check.referenceType === 'work_order') {
      const wo = workOrders?.find(w => w.id === check.referenceId);
      return wo ? `أمر تصنيع: ${wo.workOrderNumber}` : 'أمر تصنيع غير معروف';
    } else {
      const po = purchaseOrders?.find(p => p.id === check.referenceId);
      return po ? `أمر شراء: PO-${po.id}` : 'أمر شراء غير معروف';
    }
  };

  const getUserName = (id?: number) => users?.find(u => u.id === id)?.name || 'غير محدد';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="text-indigo-600" />
            مراقبة الجودة
          </h1>
          <p className="text-slate-500 text-sm mt-1">تسجيل وإدارة فحوصات الجودة للمنتجات والمواد</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          فحص جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="passed">مجتاز</option>
              <option value="failed">مرفوض</option>
              <option value="pending">قيد الفحص</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-medium">المرجع</th>
                <th className="p-4 font-medium">النوع</th>
                <th className="p-4 font-medium">تاريخ الفحص</th>
                <th className="p-4 font-medium">المفتش</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredChecks?.map(check => (
                <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{getReferenceName(check)}</td>
                  <td className="p-4 text-sm text-slate-600">
                    {check.referenceType === 'work_order' ? 'تصنيع داخلي' : 'استلام مورد'}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {format(new Date(check.date), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {getUserName(check.inspectorId)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                      {getStatusLabel(check.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 max-w-xs truncate">
                    {check.notes || '-'}
                  </td>
                </tr>
              ))}
              {filteredChecks?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد فحوصات جودة مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quality Check Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">تسجيل فحص جودة جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="quality-form" onSubmit={handleCreateCheck} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نوع الفحص</label>
                    <select
                      value={newCheck.referenceType}
                      onChange={e => setNewCheck({...newCheck, referenceType: e.target.value as any, referenceId: undefined})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="work_order">أمر تصنيع (إنتاج داخلي)</option>
                      <option value="purchase_order">أمر شراء (استلام مورد)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المرجع *</label>
                    <select
                      required
                      value={newCheck.referenceId || ''}
                      onChange={e => setNewCheck({...newCheck, referenceId: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- اختر --</option>
                      {newCheck.referenceType === 'work_order' 
                        ? workOrders?.map(wo => <option key={wo.id} value={wo.id}>{wo.workOrderNumber}</option>)
                        : purchaseOrders?.map(po => <option key={po.id} value={po.id}>PO-{po.id}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">النتيجة النهائية</label>
                  <select
                    value={newCheck.status}
                    onChange={e => setNewCheck({...newCheck, status: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="pending">قيد الفحص</option>
                    <option value="passed">مجتاز</option>
                    <option value="failed">مرفوض</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">معايير الفحص</label>
                    <button 
                      type="button" 
                      onClick={addCriterion}
                      className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> إضافة معيار
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newCheck.criteria?.map((criterion, index) => (
                      <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="اسم المعيار"
                            value={criterion.name}
                            onChange={e => updateCriterion(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 bg-white text-slate-800"
                          />
                          <input
                            type="text"
                            placeholder="ملاحظات (اختياري)"
                            value={criterion.notes || ''}
                            onChange={e => updateCriterion(index, 'notes', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 bg-white text-slate-800"
                          />
                        </div>
                        <div className="flex flex-col gap-2 items-center justify-center pt-1">
                          <label className="flex items-center gap-1 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={criterion.passed}
                              onChange={e => updateCriterion(index, 'passed', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className={criterion.passed ? 'text-emerald-600 font-medium' : 'text-slate-500'}>مجتاز</span>
                          </label>
                          <button 
                            type="button" 
                            onClick={() => removeCriterion(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات عامة</label>
                  <textarea
                    rows={3}
                    value={newCheck.notes || ''}
                    onChange={e => setNewCheck({...newCheck, notes: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                form="quality-form"
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                حفظ الفحص
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
