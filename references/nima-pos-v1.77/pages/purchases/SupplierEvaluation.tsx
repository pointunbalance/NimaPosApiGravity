import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SupplierEvaluation = () => {
  const { success, error: showError } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
  "supplierId": "",
  "date": "",
  "score": "10",
  "notes": ""
});

  const records = useLiveQuery(() => db.supplierEvaluations.toArray()) || [];

  const filteredRecords = records.filter((item: any) => {
    // Basic search across all string values
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({...item});
    } else {
      setCurrentId(null);
      setFormData({"supplierId":"","date":"","score":"10","notes":""});
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.supplierEvaluations.update(currentId, formData);
        success('تم تحديث تقييم المورد بنجاح');
      } else {
        await db.supplierEvaluations.add(formData);
        success('تمت إضافة تقييم المورد بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await db.supplierEvaluations.delete(deleteId);
        success('تم حذف تقييم المورد بنجاح');
      } catch (err) {
        console.error(err);
        showError('حدث خطأ أثناء الحذف');
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">تقييم الموردين</h1>
          <p className="text-slate-500">إدارة سجلات تقييم الموردين</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          <span>إضافة جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في تقييم الموردين..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">المعرف</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">اسم المورد</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">التقييم (من 10)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">ملاحظات</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                     لا توجد سجلات. أضف سجل جديد للبدء.
                   </td>
                 </tr>
              ) : filteredRecords.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">#{item.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">{item.supplierId}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">{item.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">{item.score}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">{item.notes}</td>
                  <td className="px-6 py-4 p-0">
                    <div className="flex justify-center items-center gap-2">
                       <button onClick={() => handleOpenModal(true, item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => setDeleteId(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEdit ? 'تعديل السجل' : 'إضافة سجل جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المورد</label>
                <input 
                  type="text" 
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التقييم (من 10)</label>
                <input 
                  type="number" 
                  value={formData.score}
                  onChange={(e) => setFormData({...formData, score: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <input 
                  type="text" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف تقييم المورد"
        message="هل أنت متأكد من رغبتك في حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};
