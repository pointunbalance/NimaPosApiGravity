import React, { useState } from 'react';
import { ShieldCheck, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { QualityCheck } from '../../types';
import QualityCheckModal from '../../components/manufacturing/QualityCheckModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export const TQM: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [checkToDeleteId, setCheckToDeleteId] = useState<number | null>(null);
  const [editingCheck, setEditingCheck] = useState<QualityCheck | null>(null);

  const qualityChecks = useLiveQuery(() => db.qualityChecks.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const workOrders = useLiveQuery(() => db.workOrders.toArray()) || [];
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.toArray()) || [];

  const handleSave = async (check: Partial<QualityCheck>) => {
    try {
      if (editingCheck?.id) {
        await db.qualityChecks.put({ ...check, id: editingCheck.id } as QualityCheck);
      } else {
        await db.qualityChecks.add(check as QualityCheck);
      }
      showToast('تم حفظ التقرير بنجاح', 'success');
      setIsModalOpen(false);
      setEditingCheck(null);
    } catch (error) {
      console.error('Error saving quality check:', error);
      showToast('حدث خطأ أثناء حفظ التقرير', 'error');
    }
  };

  const handleEdit = (check: QualityCheck) => {
    setEditingCheck(check);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setCheckToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (checkToDeleteId) {
      await db.qualityChecks.delete(checkToDeleteId);
      showToast('تم حذف التقرير بنجاح', 'success');
      setCheckToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const getInspectorName = (id: number) => {
    return users.find(u => u.id === id)?.name || 'غير معروف';
  };

  const getReferenceName = (type: string, id: number) => {
    if (type === 'work_order') {
      return workOrders.find(wo => wo.id === id)?.workOrderNumber || `أمر عمل #${id}`;
    } else {
      const po = purchaseOrders.find(po => po.id === id);
      return po ? `PO-${po.id} (${po.supplierName})` : `أمر شراء #${id}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1 w-fit"><CheckCircle className="w-4 h-4" /> مجتاز</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm flex items-center gap-1 w-fit"><XCircle className="w-4 h-4" /> فاشل</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1 w-fit"><Clock className="w-4 h-4" /> قيد الانتظار</span>;
    }
  };

  const filteredChecks = qualityChecks.filter(check => {
    const refName = getReferenceName(check.referenceType, check.referenceId).toLowerCase();
    const inspectorName = getInspectorName(check.inspectorId).toLowerCase();
    const search = searchTerm.toLowerCase();
    return refName.includes(search) || inspectorName.includes(search);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الجودة الشاملة (TQM)</h1>
            <p className="text-gray-500">مراقبة الجودة، التدقيق الداخلي، وحالات عدم المطابقة</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingCheck(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          <span>تقرير جودة جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="البحث برقم المرجع أو اسم المفتش..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">رقم التقرير</th>
                <th className="p-4 text-slate-600 font-semibold">المرجع</th>
                <th className="p-4 text-slate-600 font-semibold">المفتش</th>
                <th className="p-4 text-slate-600 font-semibold">التاريخ</th>
                <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold">المعايير (مجتاز/الكل)</th>
                <th className="p-4 text-slate-600 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChecks.map((check) => {
                const passedCriteria = check.criteria?.filter(c => c.passed).length || 0;
                const totalCriteria = check.criteria?.length || 0;
                
                return (
                  <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">QC-{check.id}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{getReferenceName(check.referenceType, check.referenceId)}</span>
                        <span className="text-xs text-slate-500">{check.referenceType === 'work_order' ? 'أمر عمل' : 'أمر شراء'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{getInspectorName(check.inspectorId)}</td>
                    <td className="p-4 text-slate-600">{new Date(check.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4">{getStatusBadge(check.status)}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{passedCriteria}</span>
                        <span className="text-slate-400">/</span>
                        <span>{totalCriteria}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(check)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => check.id && handleDelete(check.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredChecks.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>لا توجد تقارير جودة مطابقة للبحث</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QualityCheckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingCheck={editingCheck}
        users={users}
        workOrders={workOrders}
        purchaseOrders={purchaseOrders}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف التقرير"
        message="هل أنت متأكد من رغبتك في حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};
